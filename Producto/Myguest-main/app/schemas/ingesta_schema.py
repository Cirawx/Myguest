"""
Schemas Pydantic para el flujo de Ingesta Inteligente de facturas.

Flujo cubierto:
1. Upload de PDF/imagen      -> IngestaUploadResponse
2. Extraccion OCR            -> OCRExtractionResponse
3. Cruce con catalogo        -> ItemHomologado, FacturaHomologada
4. Confirmacion final        -> FacturaCommitRequest, FacturaCommitResponse
"""
from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ============================================================
# A) UPLOAD INICIAL
# ============================================================

class IngestaUploadResponse(BaseModel):
    """Respuesta al subir un archivo de factura al sistema."""
    id_ingesta: str = Field(..., description="UUID unico de esta ingesta")
    nombre_archivo: str
    tipo_mime: str
    tamano_bytes: int
    storage_path: str = Field(..., description="Ruta del archivo en Supabase Storage")
    storage_url: str = Field(..., description="URL firmada temporal para preview")
    hash_sha256: str = Field(..., description="Hash del archivo para trazabilidad")
    estado: str = Field("subido", description="subido | procesando | listo | error")


# ============================================================
# B) EXTRACCION OCR
# ============================================================

class ItemExtraido(BaseModel):
    """Un item leido por OCR desde la factura. Sin homologar todavia."""
    descripcion_raw: str = Field(..., description="Texto crudo del item segun OCR")
    cantidad: Optional[Decimal] = None
    unidad: Optional[str] = None
    precio_unitario: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None


class OCRExtractionResponse(BaseModel):
    """Resultado de pasar OCR sobre el archivo subido."""
    id_ingesta: str
    proveedor_rut: Optional[str] = None
    proveedor_razon_social: Optional[str] = None
    folio: Optional[str] = None
    fecha_emision: Optional[date] = None
    subtotal: Optional[Decimal] = None
    iva: Optional[Decimal] = None
    total: Optional[Decimal] = None
    items: list[ItemExtraido] = []
    texto_crudo: str = Field("", description="Todo el texto crudo del OCR para debug")
    confianza_global: float = Field(0.0, description="0-1, que tan confiable es la extraccion")


# ============================================================
# C) HOMOLOGACION CON CATALOGO INTERNO
# ============================================================

class SugerenciaProducto(BaseModel):
    """Una posible coincidencia entre un item OCR y un producto del catalogo."""
    id_producto: int
    nom_producto: str
    cod_unidad_medida: Optional[int] = None
    nom_unidad_medida: Optional[str] = None
    score_similitud: float = Field(..., description="0-100, que tan parecido es")


class ItemHomologado(BaseModel):
    """Un item OCR con sus sugerencias del catalogo."""
    descripcion_raw: str
    cantidad: Optional[Decimal] = None
    unidad: Optional[str] = None
    precio_unitario: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    sugerencias: list[SugerenciaProducto] = []
    id_producto_seleccionado: Optional[int] = None
    requiere_revision: bool = Field(True, description="True si el match no es de alta confianza")


class FacturaHomologada(BaseModel):
    """Resultado completo: OCR + homologacion contra catalogo."""
    id_ingesta: str
    proveedor_rut: Optional[str] = None
    proveedor_razon_social: Optional[str] = None
    folio: Optional[str] = None
    fecha_emision: Optional[date] = None
    subtotal: Optional[Decimal] = None
    iva: Optional[Decimal] = None
    total: Optional[Decimal] = None
    items: list[ItemHomologado] = []


# ============================================================
# D) COMMIT FINAL (confirmacion del usuario)
# ============================================================

class ItemConfirmado(BaseModel):
    """Un item que el usuario ya valido y mapeo a un producto."""
    id_producto: int
    cantidad: Decimal
    precio_unitario: Decimal


class FacturaCommitRequest(BaseModel):
    """El usuario confirma y manda la factura final a guardar."""
    id_ingesta: str
    id_proveedor: int = Field(..., description="Proveedor seleccionado o creado")
    folio: str
    fecha_emision: date
    subtotal: Decimal
    iva: Decimal
    total: Decimal
    items: list[ItemConfirmado]


class FacturaCommitResponse(BaseModel):
    """Confirmacion de que la factura quedo guardada y el stock se actualizo."""
    model_config = ConfigDict(from_attributes=True)

    id_factura: int
    folio: str
    total: Decimal
    items_creados: int
    stock_actualizado: bool = True
    mensaje: str = "Factura registrada correctamente"
