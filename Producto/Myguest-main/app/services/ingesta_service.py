"""
Servicio orquestador de Ingesta Inteligente.

Coordina Supabase Storage + Gemini (IA) + OCR (Tesseract fallback)
para implementar el flujo:
1. upload  -> sube archivo a Supabase
2. extract -> descarga + pasa por Gemini (o Tesseract) + retorna datos
3. preview -> genera URL firmada para frontend
4. cancel  -> elimina archivo si el usuario cancela
"""
from typing import Optional

from app.services import supabase_storage_service as storage
from app.services import ocr_service
from app.services import gemini_service
from app.config import get_settings
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from rapidfuzz import fuzz, process

from app.models.inventario_model import Producto
from app.models.facturacion_model import Factura, DetFactura
from app.models.proveedor_model import Proveedor
from app.schemas.ingesta_schema import (
    ItemHomologado, SugerenciaProducto, FacturaHomologada, FacturaCommitRequest
)

settings = get_settings()


# ============================================================
# UPLOAD
# ============================================================

def upload_archivo(
    contenido: bytes,
    nombre_original: str,
    tipo_mime: str,
) -> dict:
    """
    Sube un archivo de factura a Supabase y retorna metadata para frontend.
    """
    if not (ocr_service.es_pdf(tipo_mime) or ocr_service.es_imagen(tipo_mime)):
        raise ValueError(
            f"Tipo de archivo no soportado: {tipo_mime}. "
            "Solo se aceptan PDF, JPEG o PNG."
        )

    resultado = storage.subir_archivo(
        contenido=contenido,
        nombre_original=nombre_original,
        tipo_mime=tipo_mime,
    )

    storage_url = storage.obtener_url_firmada(
        storage_path=resultado["storage_path"],
        segundos_validos=3600,
    )

    return {
        "id_ingesta": resultado["id_ingesta"],
        "nombre_archivo": nombre_original,
        "tipo_mime": tipo_mime,
        "tamano_bytes": resultado["tamano_bytes"],
        "storage_path": resultado["storage_path"],
        "storage_url": storage_url,
        "hash_sha256": resultado["hash_sha256"],
        "estado": "subido",
    }


# ============================================================
# EXTRACT (Gemini -> fallback Tesseract)
# ============================================================

def _normalizar_rut(rut: Optional[str]) -> Optional[str]:
    """Convierte '77.242.614-3' a '77242614-3' para consistencia."""
    if not rut:
        return None
    return rut.replace(".", "").replace(" ", "").upper()


def extraer_datos(storage_path: str, tipo_mime: str) -> dict:
    """
    Descarga el archivo y lo procesa con IA (Gemini) o OCR (Tesseract) como fallback.

    Returns:
        dict compatible con OCRExtractionResponse, con items completos cuando es posible.
    """
    contenido = storage.descargar_archivo(storage_path)

    # === INTENTO 1: Gemini IA ===
    if settings.gemini_api_key:
        print("[Ingesta] Intentando con Gemini IA...")
        resultado_ia = gemini_service.analizar_factura(contenido, tipo_mime)

        if resultado_ia:
            print("[Ingesta] Gemini OK")
            items = []
            for item in resultado_ia.get("items", []) or []:
                items.append({
                    "descripcion_raw": item.get("descripcion") or "",
                    "cantidad": item.get("cantidad"),
                    "unidad": item.get("unidad"),
                    "precio_unitario": item.get("precio_unitario"),
                    "subtotal": item.get("subtotal"),
                })

            return {
                "rut_proveedor": _normalizar_rut(resultado_ia.get("proveedor_rut")),
                "proveedor_razon_social": resultado_ia.get("proveedor_razon_social"),
                "folio": resultado_ia.get("folio"),
                "fecha_emision": resultado_ia.get("fecha_emision"),
                "subtotal": resultado_ia.get("subtotal"),
                "iva": resultado_ia.get("iva"),
                "total": resultado_ia.get("total"),
                "monto_neto": resultado_ia.get("subtotal"),  # alias
                "items": items,
                "texto_crudo": "(extraido con Gemini IA)",
                "fuente": "gemini",
            }

        print("[Ingesta] Gemini fallo, usando Tesseract...")

    # === INTENTO 2 (fallback): Tesseract OCR ===
    datos_ocr = ocr_service.procesar_archivo(contenido, tipo_mime)
    return {
        "rut_proveedor": datos_ocr.get("rut_proveedor"),
        "proveedor_razon_social": None,
        "folio": datos_ocr.get("folio"),
        "fecha_emision": datos_ocr.get("fecha_emision"),
        "subtotal": datos_ocr.get("monto_neto"),
        "iva": None,
        "total": datos_ocr.get("total"),
        "monto_neto": datos_ocr.get("monto_neto"),
        "items": [],
        "texto_crudo": datos_ocr.get("texto_crudo", ""),
        "fuente": "tesseract",
    }


# ============================================================
# PREVIEW
# ============================================================

def obtener_preview_url(storage_path: str, segundos_validos: int = 3600) -> str:
    return storage.obtener_url_firmada(storage_path, segundos_validos)


# ============================================================
# CANCEL
# ============================================================

def cancelar_ingesta(storage_path: str) -> None:
    storage.eliminar_archivo(storage_path)
    
# ============================================================
# HOMOLOGACION
# ============================================================

async def homologar_items(
    db: AsyncSession,
    id_ingesta: str,
    proveedor_rut: str | None,
    proveedor_razon_social: str | None,
    folio: str | None,
    fecha_emision,
    subtotal,
    iva,
    total,
    items_raw: list[dict],
) -> dict:
    """
    Cruza cada item OCR contra el catálogo de productos usando fuzzy matching.
    Score >= 80 -> homologado automáticamente (requiere_revision=False)
    Score <  80 -> requiere selección manual del usuario
    """
    # Traer todos los productos del catálogo
    result = await db.execute(
        select(Producto).options(selectinload(Producto.unidad_medida))
    )
    productos = result.scalars().all()

    # Mapa nombre -> producto para búsqueda rápida
    nombres = {p.nom_producto: p for p in productos}

    items_homologados = []

    for item in items_raw:
        descripcion = item.get("descripcion_raw") or item.get("descripcion") or ""

        # Fuzzy match contra todos los nombres
        matches = process.extract(
            descripcion,
            nombres.keys(),
            scorer=fuzz.token_sort_ratio,
            limit=3,
        )

        sugerencias = []
        id_seleccionado = None
        requiere_revision = True

        for nombre_match, score, _ in matches:
            prod = nombres[nombre_match]
            sugerencias.append(SugerenciaProducto(
                id_producto=prod.id_producto,
                nom_producto=prod.nom_producto,
                cod_unidad_medida=prod.cod_unidad_medida,
                nom_unidad_medida=prod.unidad_medida.nom_unidad_medida_abrev if prod.unidad_medida else None,
                score_similitud=round(score, 2),
            ))
            # Auto-homologar si la primera sugerencia supera el umbral
            if score >= 80 and id_seleccionado is None:
                id_seleccionado = prod.id_producto
                requiere_revision = False

        items_homologados.append(ItemHomologado(
            descripcion_raw=descripcion,
            cantidad=item.get("cantidad"),
            unidad=item.get("unidad"),
            precio_unitario=item.get("precio_unitario"),
            subtotal=item.get("subtotal"),
            sugerencias=sugerencias,
            id_producto_seleccionado=id_seleccionado,
            requiere_revision=requiere_revision,
        ))

    return FacturaHomologada(
        id_ingesta=id_ingesta,
        proveedor_rut=proveedor_rut,
        proveedor_razon_social=proveedor_razon_social,
        folio=folio,
        fecha_emision=fecha_emision,
        subtotal=subtotal,
        iva=iva,
        total=total,
        items=items_homologados,
    )


# ============================================================
# COMMIT
# ============================================================

async def commit_factura(
    db: AsyncSession,
    datos: FacturaCommitRequest,
    id_usuario: int,
) -> Factura:
    """
    Persiste la factura confirmada por el usuario en BD.
    Los triggers trg_stock_entrada se disparan automáticamente.
    """
    # Verificar que el proveedor existe
    result = await db.execute(
        select(Proveedor).where(Proveedor.id_proveedor == datos.id_proveedor)
    )
    proveedor = result.scalars().first()
    if not proveedor:
        raise ValueError(f"Proveedor {datos.id_proveedor} no encontrado")

    # Crear factura
    factura = Factura(
        num_documento=datos.folio,
        fecha_emision=datos.fecha_emision,
        fecha_ingreso=datetime.now(timezone.utc),
        id_proveedor=datos.id_proveedor,
        id_orden_compra=None,  # regla del proyecto: vacío en facturas de ingesta
        id_usuario=id_usuario,
        estado_conciliacion="pendiente",
        obs=f"Ingesta OCR · id={datos.id_ingesta}",
    )
    db.add(factura)
    await db.flush()  # obtener id_factura sin cerrar transacción

    # Crear detalles
    for item in datos.items:
        detalle = DetFactura(
            id_factura=factura.id_factura,
            id_producto=item.id_producto,
            cantidad=item.cantidad,
            precio_unitario=int(item.precio_unitario),
            fecha_vencimiento=None,
        )
        db.add(detalle)

    await db.commit()
    await db.refresh(factura)

    # Retornar con detalles cargados
    result = await db.execute(
        select(Factura)
        .options(selectinload(Factura.detalles))
        .where(Factura.id_factura == factura.id_factura)
    )
    return result.scalars().first()