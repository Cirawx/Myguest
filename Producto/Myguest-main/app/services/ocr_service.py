"""
Servicio de OCR para extraer texto e información de facturas.

Pipeline:
1. Detectar si el archivo es PDF o imagen.
2. Si es PDF, convertirlo a imagen (primera página).
3. Preprocesar la imagen con OpenCV (gris, denoise, threshold).
4. Pasar por Tesseract en español.
5. Parsear el texto con regex para extraer campos clave.

Nota: este servicio NO depende de la BD. Recibe bytes y devuelve datos.
"""
import io
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import cv2
import numpy as np
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes


# ============================================================
# DETECCIÓN Y CONVERSIÓN DE ARCHIVOS
# ============================================================

def es_pdf(tipo_mime: str) -> bool:
    """Indica si el archivo subido es un PDF."""
    return tipo_mime.lower() == "application/pdf"


def es_imagen(tipo_mime: str) -> bool:
    """Indica si el archivo subido es una imagen soportada."""
    return tipo_mime.lower() in ("image/jpeg", "image/png", "image/jpg")


def pdf_a_imagen(contenido_pdf: bytes, dpi: int = 300) -> Image.Image:
    """
    Convierte un PDF a imagen PIL. Solo se procesa la primera página
    (las facturas suelen caber en una sola página).
    """
    paginas = convert_from_bytes(contenido_pdf, dpi=dpi, first_page=1, last_page=1)
    if not paginas:
        raise ValueError("No se pudo convertir el PDF a imagen")
    return paginas[0]


def bytes_a_imagen(contenido: bytes) -> Image.Image:
    """Convierte bytes de imagen (JPG/PNG) a un objeto PIL Image."""
    return Image.open(io.BytesIO(contenido))


# ============================================================
# PREPROCESAMIENTO CON OPENCV
# ============================================================

def preprocesar_imagen(imagen_pil: Image.Image) -> Image.Image:
    """
    Mejora la imagen antes del OCR.

    Pasos aplicados:
    1. Convertir a escala de grises.
    2. Aplicar filtro de denoise para limpiar ruido.
    3. Aplicar threshold adaptativo (binariza la imagen).

    Esto mejora notablemente la precisión del OCR sobre fotos de facturas.
    """
    # PIL -> OpenCV (numpy array)
    img_cv = np.array(imagen_pil.convert("RGB"))
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)

    # 1. Escala de grises
    gris = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    # 2. Denoise (suaviza ruido manteniendo bordes)
    denoised = cv2.fastNlMeansDenoising(gris, h=10)

    # 3. Threshold adaptativo (binariza imagen, mejor para texto)
    binaria = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2,
    )

    # OpenCV -> PIL de vuelta
    return Image.fromarray(binaria)


# ============================================================
# OCR CON TESSERACT
# ============================================================

def extraer_texto(imagen_pil: Image.Image, idioma: str = "spa") -> str:
    """
    Aplica Tesseract sobre la imagen y devuelve el texto detectado.
    Configurado para español por defecto.
    """
    # PSM 6: asume un bloque uniforme de texto (bueno para facturas)
    config = "--psm 6"
    texto = pytesseract.image_to_string(imagen_pil, lang=idioma, config=config)
    return texto


# ============================================================
# PARSER DE CAMPOS CON REGEX (versión mejorada para DTE chilenos)
# ============================================================

# RUT chileno — REQUIERE guion para evitar capturar telefonos
# Formato: XX.XXX.XXX-X
REGEX_RUT = re.compile(
    r"\b(\d{1,2}[.\sIi]?\d{3}[.\sIi]?\d{3}[\s]?-[\s]?[\dkKIi])\b"
)

# RUT cerca de "RUT", "RIUITI", "R.U.T", "RIT", etc.
# Tolera basura OCR entre las letras y entre los digitos
# REQUIERE guion para no confundir con telefonos
REGEX_RUT_CON_LABEL = re.compile(
    r"R[.\s]?[IiU1][.\s]?[ITuU1][.\s]?[ITi1][.\s:]*?([\dIi]{1,2}[.\sIi]?[\dIi]{3}[.\sIi]?[\dIi]{3}\s?-\s?[\dkKIi])",
    re.IGNORECASE,
)

# Folio — tolera "Nº", "N°", "N2e" (errores OCR), "N "
# Capturamos un numero de 4-10 digitos cerca de algun indicador
REGEX_FOLIO = re.compile(
    r"N[°ºo2eE]+\s*[:.]?\s*(\d{4,10})",
    re.IGNORECASE,
)

# Folio alternativo si tiene la palabra "Folio"
REGEX_FOLIO_ALT = re.compile(
    r"fol[ilyo1]o\s*[:.]?\s*(\d{4,10})",
    re.IGNORECASE,
)

# Fechas en formato numérico DD/MM/AAAA o DD-MM-AAAA
REGEX_FECHA_NUM = re.compile(
    r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b"
)

# Fechas en formato texto "02 de Marzo del 2026" o "02 de marzo de 2026"
REGEX_FECHA_TEXTO = re.compile(
    r"(\d{1,2})\s+de\s+([a-zA-Záéíóú]+)\s+(?:de[l]?\s+)?(\d{4})",
    re.IGNORECASE,
)

MESES_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}

# Total — tolera basura OCR entre la palabra y el monto: VOWL| $ 255.829
# El [^\d]{0,15} acepta hasta 15 caracteres no-dígitos entre keyword y monto
REGEX_TOTAL = re.compile(
    r"(?:t[o0]t[al1]|monto\s*total|vowl|son)[^\d]{0,15}([\d]{1,3}(?:[.,]\d{3})+|\d{4,})",
    re.IGNORECASE,
)

# Monto neto (lo usaremos como respaldo o referencia)
REGEX_NETO = re.compile(
    r"(?:neto|monto\s*neto)\s*[:.]?\s*\$?\s*([\d.,]+)",
    re.IGNORECASE,
)


def limpiar_rut(rut_raw: str) -> str:
    """
    Normaliza un RUT chileno.
    
    Maneja errores OCR comunes:
    - Letras I confundidas con dígitos 1 O con separadores . (depende del contexto)
    - Letras O confundidas con dígitos 0
    - Espacios alrededor del guion
    
    Estrategia:
    1. Quita puntos y espacios
    2. Separa cuerpo y dígito verificador
    3. Si el cuerpo tiene 10+ caracteres (demasiado largo), interpreta I como separador y la elimina
    4. Si el cuerpo tiene 7-9 caracteres, interpreta I como dígito 1 y la convierte
    """
    limpio = rut_raw.replace(".", "").replace(" ", "").upper()
    
    # Separar dígito verificador
    if "-" in limpio:
        cuerpo, dv = limpio.rsplit("-", 1)
    else:
        cuerpo, dv = limpio[:-1], limpio[-1]
    
    # Limpiar dígito verificador (K es válido)
    if dv != "K":
        dv = dv.replace("I", "1").replace("O", "0")
    
    # CUERPO: decidir si I/O son dígitos o separadores
    cantidad_letras = cuerpo.count("I") + cuerpo.count("O")
    cantidad_digitos = sum(c.isdigit() for c in cuerpo)
    
    if cantidad_digitos + cantidad_letras > 9:
        # Demasiado largo -> las I/O son separadores OCR, eliminarlas
        cuerpo = cuerpo.replace("I", "").replace("O", "")
    else:
        # Tamaño normal -> las I/O son dígitos confundidos por OCR
        cuerpo = cuerpo.replace("I", "1").replace("O", "0")
    
    return f"{cuerpo}-{dv}"


def parsear_fecha_numerica(dia: str, mes: str, anio: str) -> Optional[date]:
    """Convierte partes de fecha numérica a un objeto date válido."""
    try:
        d, m, a = int(dia), int(mes), int(anio)
        if a < 100:
            a += 2000
        if a < 2020 or a > 2030:
            return None
        if m < 1 or m > 12:
            return None
        if d < 1 or d > 31:
            return None
        return date(a, m, d)
    except (ValueError, TypeError):
        return None


def parsear_fecha_texto(dia: str, mes_str: str, anio: str) -> Optional[date]:
    """Convierte 'XX de Mes del AAAA' a date."""
    try:
        d = int(dia)
        a = int(anio)
        mes_normalizado = mes_str.lower().strip()
        # Quitar acentos básicos
        mes_normalizado = (
            mes_normalizado
            .replace("á", "a").replace("é", "e").replace("í", "i")
            .replace("ó", "o").replace("ú", "u")
        )
        m = MESES_ES.get(mes_normalizado)
        if m is None:
            return None
        if a < 2020 or a > 2030:
            return None
        if d < 1 or d > 31:
            return None
        return date(a, m, d)
    except (ValueError, TypeError):
        return None


def parsear_decimal(valor_raw: str) -> Optional[Decimal]:
    """Convierte un valor monetario en texto a Decimal."""
    try:
        # Quitar puntos de miles, dejar solo dígitos
        limpio = valor_raw.replace(".", "").replace(",", ".").strip()
        if not limpio:
            return None
        return Decimal(limpio)
    except (ValueError, TypeError):
        return None


def parsear_factura(texto: str) -> dict:
    """
    Extrae campos clave de una factura a partir del texto OCR crudo.

    Estrategia:
    - Para RUT: primero busca cerca de "RUT", si no encuentra toma el primero del texto
    - Para Folio: tolera "Nº", "N°", "N2e" y la palabra "Folio"
    - Para Fecha: intenta formato numérico, luego formato texto
    - Para Total: busca cerca de "Total", "Monto", "VOWL" (típica corrupción OCR)
    """
    resultado = {
        "rut_proveedor": None,
        "folio": None,
        "fecha_emision": None,
        "total": None,
        "monto_neto": None,
        "texto_crudo": texto,
    }

    # === RUT ===
    # 1° intento: RUT cerca de la palabra "RUT" o variantes OCR
    match_rut_label = REGEX_RUT_CON_LABEL.search(texto)
    if match_rut_label:
        resultado["rut_proveedor"] = limpiar_rut(match_rut_label.group(1))
    else:
        # 2° intento: primer RUT del texto (generalmente es el del emisor)
        match_rut = REGEX_RUT.search(texto)
        if match_rut:
            resultado["rut_proveedor"] = limpiar_rut(match_rut.group(1))

    # === FOLIO ===
    match_folio = REGEX_FOLIO.search(texto)
    if match_folio:
        resultado["folio"] = match_folio.group(1)
    else:
        match_folio_alt = REGEX_FOLIO_ALT.search(texto)
        if match_folio_alt:
            resultado["folio"] = match_folio_alt.group(1)

    # === FECHA ===
    # 1° intento: fecha en formato texto (típica en DTE: "02 de Marzo del 2026")
    match_fecha_texto = REGEX_FECHA_TEXTO.search(texto)
    if match_fecha_texto:
        fecha = parsear_fecha_texto(*match_fecha_texto.groups())
        if fecha:
            resultado["fecha_emision"] = fecha
    
    # 2° intento si la primera falló: formato numérico
    if not resultado["fecha_emision"]:
        match_fecha = REGEX_FECHA_NUM.search(texto)
        if match_fecha:
            fecha = parsear_fecha_numerica(*match_fecha.groups())
            if fecha:
                resultado["fecha_emision"] = fecha

    # === TOTAL ===
    matches_total = list(REGEX_TOTAL.finditer(texto))
    if matches_total:
        # Toma el último match (suele ser el total final del documento)
        ultimo = matches_total[-1]
        resultado["total"] = parsear_decimal(ultimo.group(1))

    # === NETO (referencia) ===
    match_neto = REGEX_NETO.search(texto)
    if match_neto:
        resultado["monto_neto"] = parsear_decimal(match_neto.group(1))

    return resultado


# ============================================================
# FUNCIÓN PRINCIPAL: PIPELINE COMPLETO
# ============================================================

def procesar_archivo(contenido: bytes, tipo_mime: str) -> dict:
    """
    Pipeline completo: recibe bytes + mime, devuelve los datos extraídos.

    Args:
        contenido: bytes del PDF o imagen
        tipo_mime: ej 'application/pdf', 'image/jpeg'

    Returns:
        dict con rut_proveedor, folio, fecha_emision, total, texto_crudo

    Raises:
        ValueError si el tipo de archivo no es soportado
    """
    # 1. Convertir a imagen PIL
    if es_pdf(tipo_mime):
        imagen = pdf_a_imagen(contenido)
    elif es_imagen(tipo_mime):
        imagen = bytes_a_imagen(contenido)
    else:
        raise ValueError(
            f"Tipo de archivo no soportado: {tipo_mime}. "
            "Solo se aceptan PDF, JPEG o PNG."
        )

    # 2. Preprocesar
    imagen_lista = preprocesar_imagen(imagen)

    # 3. OCR
    texto = extraer_texto(imagen_lista)

    # 4. Parsear campos
    return parsear_factura(texto)


# ============================================================
# TEST RAPIDO
# ============================================================
# python -m app.services.ocr_service

if __name__ == "__main__":
    import sys
    from PIL import ImageDraw, ImageFont

    print("=" * 60)
    print("TEST OCR Service")
    print("=" * 60)

    # Generar una factura sintética para probar
    img = Image.new("RGB", (800, 600), color="white")
    draw = ImageDraw.Draw(img)

    # Texto simulando una factura chilena
    contenido = [
        "DISTRIBUIDORA EJEMPLO LTDA.",
        "RUT: 76.123.456-7",
        "",
        "FACTURA ELECTRONICA",
        "Folio N 12345",
        "Fecha: 15/06/2026",
        "",
        "Producto              Cant.    Precio    Subtotal",
        "Aceite Oliva 1L         10     5000      50000",
        "Azucar 1kg              20     1200      24000",
        "",
        "Subtotal:  74000",
        "IVA 19%:   14060",
        "Total:     88060",
    ]
    y = 30
    for linea in contenido:
        draw.text((30, y), linea, fill="black")
        y += 30

    # Guardar la imagen para verla
    img.save("test_factura_demo.png")
    print("Imagen demo guardada: test_factura_demo.png")

    # Convertir a bytes
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    contenido_bytes = buffer.getvalue()

    # Procesar
    try:
        resultado = procesar_archivo(contenido_bytes, "image/png")
        print()
        print("OK  Pipeline completo ejecutado")
        print(f"    rut_proveedor: {resultado['rut_proveedor']}")
        print(f"    folio:         {resultado['folio']}")
        print(f"    fecha_emision: {resultado['fecha_emision']}")
        print(f"    total:         {resultado['total']}")
        print()
        print("Texto crudo detectado:")
        print("-" * 60)
        print(resultado['texto_crudo'])
        print("-" * 60)
    except Exception as e:
        print(f"FAIL: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print("=" * 60)
    print("Si ves los campos extraidos, el OCR funciona correctamente.")
    print("=" * 60)