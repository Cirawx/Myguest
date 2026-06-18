"""
Servicio orquestador de Ingesta Inteligente.

Coordina Supabase Storage + OCR Service para implementar el flujo:
1. upload  -> sube archivo a Supabase
2. extract -> descarga + pasa por OCR + retorna datos
3. preview -> genera URL firmada para frontend
4. cancel  -> elimina archivo si el usuario cancela
"""
from typing import Optional

from app.services import supabase_storage_service as storage
from app.services import ocr_service


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
    
    Args:
        contenido: bytes del PDF o imagen
        nombre_original: ej "factura_proveedor.pdf"
        tipo_mime: ej "application/pdf"
    
    Returns:
        dict con id_ingesta, storage_path, hash_sha256, tamano_bytes, storage_url
    """
    # Validacion de tipo
    if not (ocr_service.es_pdf(tipo_mime) or ocr_service.es_imagen(tipo_mime)):
        raise ValueError(
            f"Tipo de archivo no soportado: {tipo_mime}. "
            "Solo se aceptan PDF, JPEG o PNG."
        )
    
    # Subir a Supabase Storage
    resultado = storage.subir_archivo(
        contenido=contenido,
        nombre_original=nombre_original,
        tipo_mime=tipo_mime,
    )
    
    # Generar URL firmada para preview en el frontend
    storage_url = storage.obtener_url_firmada(
        storage_path=resultado["storage_path"],
        segundos_validos=3600,  # 1 hora
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
# EXTRACT (OCR)
# ============================================================

def extraer_datos(storage_path: str, tipo_mime: str) -> dict:
    """
    Descarga el archivo desde Supabase y lo procesa con OCR.
    
    Args:
        storage_path: ruta en Supabase (la guardo en metadata o BD)
        tipo_mime: ej "application/pdf"
    
    Returns:
        dict con rut_proveedor, folio, fecha_emision, total, monto_neto, texto_crudo
    """
    contenido = storage.descargar_archivo(storage_path)
    return ocr_service.procesar_archivo(contenido, tipo_mime)


# ============================================================
# PREVIEW (URL firmada)
# ============================================================

def obtener_preview_url(storage_path: str, segundos_validos: int = 3600) -> str:
    """Genera una URL temporal para mostrar el archivo en el frontend."""
    return storage.obtener_url_firmada(storage_path, segundos_validos)


# ============================================================
# CANCEL
# ============================================================

def cancelar_ingesta(storage_path: str) -> None:
    """Elimina un archivo subido cuando el usuario cancela la ingesta."""
    storage.eliminar_archivo(storage_path)