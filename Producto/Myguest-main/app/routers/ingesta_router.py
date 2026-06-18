"""
Router HTTP para el módulo de Ingesta Inteligente de facturas.

Endpoints:
    POST   /ingesta/upload           Sube un archivo (PDF/imagen)
    POST   /ingesta/extract          Procesa OCR sobre un archivo ya subido
    GET    /ingesta/preview          Genera URL firmada para preview
    POST   /ingesta/cancelar         Cancela una ingesta y borra el archivo

Nota: por ahora estos endpoints son stateless. La metadata (storage_path,
hash, etc.) viaja en cada request. En la Etapa D persistiremos en BD.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

from app.services import ingesta_service
from app.schemas.ingesta_schema import (
    IngestaUploadResponse,
    OCRExtractionResponse,
    ItemExtraido,
)

router = APIRouter(
    prefix="/ingesta",
    tags=["Ingesta Inteligente"],
)


# ============================================================
# REQUEST BODIES
# ============================================================

class ExtractRequest(BaseModel):
    """Body para solicitar OCR sobre un archivo ya subido."""
    storage_path: str
    tipo_mime: str


class CancelarRequest(BaseModel):
    """Body para cancelar una ingesta."""
    storage_path: str


# ============================================================
# ENDPOINTS
# ============================================================

@router.post(
    "/upload",
    response_model=IngestaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subir archivo de factura",
    description="Sube un PDF o imagen al storage. Retorna metadata para los siguientes pasos.",
)
async def upload_factura(archivo: UploadFile = File(...)):
    """Sube un archivo de factura al storage cloud."""
    # Leer bytes del archivo
    contenido = await archivo.read()
    
    if not contenido:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo esta vacio",
        )
    
    # Limite de tamano (10 MB)
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo supera los 10 MB",
        )
    
    try:
        resultado = ingesta_service.upload_archivo(
            contenido=contenido,
            nombre_original=archivo.filename or "factura_sin_nombre",
            tipo_mime=archivo.content_type or "application/octet-stream",
        )
        return resultado
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir el archivo: {str(e)}",
        )


@router.post(
    "/extract",
    response_model=OCRExtractionResponse,
    summary="Procesar OCR sobre un archivo subido",
    description="Descarga el archivo desde storage y lo pasa por Gemini IA (o Tesseract fallback) + parser.",
)
async def extract_factura(body: ExtractRequest):
    """Procesa el archivo previamente subido con IA o OCR."""
    try:
        datos = ingesta_service.extraer_datos(
            storage_path=body.storage_path,
            tipo_mime=body.tipo_mime,
        )

        # Mapear items del resultado al schema ItemExtraido
        items_mapeados = []
        for item in datos.get("items", []):
            items_mapeados.append(ItemExtraido(
                descripcion_raw=item.get("descripcion_raw", ""),
                cantidad=item.get("cantidad"),
                unidad=item.get("unidad"),
                precio_unitario=item.get("precio_unitario"),
                subtotal=item.get("subtotal"),
            ))

        # Calcular confianza segun la fuente
        fuente = datos.get("fuente", "tesseract")
        confianza = 0.95 if fuente == "gemini" else 0.6

        return OCRExtractionResponse(
            id_ingesta=body.storage_path.split("/")[-1].split("_")[0],
            proveedor_rut=datos.get("rut_proveedor"),
            proveedor_razon_social=datos.get("proveedor_razon_social"),
            folio=datos.get("folio"),
            fecha_emision=datos.get("fecha_emision"),
            subtotal=datos.get("subtotal"),
            iva=datos.get("iva"),
            total=datos.get("total"),
            items=items_mapeados,
            texto_crudo=datos.get("texto_crudo", ""),
            confianza_global=confianza,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar OCR: {str(e)}",
        )
@router.get(
    "/preview",
    summary="Obtener URL firmada para preview",
    description="Genera una URL temporal (1h) para mostrar el archivo en el frontend.",
)
async def preview_factura(storage_path: str):
    """Retorna una URL firmada temporal para visualizar el archivo."""
    try:
        url = ingesta_service.obtener_preview_url(storage_path)
        return {"storage_url": url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar URL: {str(e)}",
        )


@router.post(
    "/cancelar",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar ingesta y eliminar archivo",
)
async def cancelar_factura(body: CancelarRequest):
    """Elimina un archivo de storage cuando el usuario cancela."""
    try:
        ingesta_service.cancelar_ingesta(body.storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cancelar: {str(e)}",
        )