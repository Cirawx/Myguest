"""
Servicio de IA con Gemini API para interpretar facturas chilenas.

A diferencia del OCR Service que solo extrae texto, este servicio:
- Recibe el PDF/imagen directamente (multimodal)
- Devuelve un JSON estructurado con campos verificados
- Es muy preciso con items individuales y unidades de medida

Fallback: si Gemini falla por cualquier razón, retornamos None
y el caller usa los datos del OCR Service.
"""
import base64
import json
from datetime import date
from decimal import Decimal
from typing import Optional

import google.generativeai as genai

from app.config import get_settings

settings = get_settings()

# ============================================================
# CONFIGURACION DEL CLIENTE
# ============================================================

_configurado = False


def configurar():
    """Configura el cliente Gemini con la API key."""
    global _configurado
    if not _configurado:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "Gemini no esta configurado. Falta GEMINI_API_KEY en .env"
            )
        genai.configure(api_key=settings.gemini_api_key)
        _configurado = True


# Modelo: gemini-1.5-flash es el mas rapido y barato. Tiene 15 RPM gratis.
# Acepta input multimodal (PDF, imagenes) y devuelve JSON estructurado.
MODELO = "gemini-2.5-flash"


# ============================================================
# PROMPT PARA EXTRACCION DE FACTURAS CHILENAS
# ============================================================

PROMPT_FACTURA = """Eres un experto en facturas electronicas chilenas (DTE del SII).
Analiza este documento y extrae los datos en formato JSON.

Devuelve EXCLUSIVAMENTE un JSON valido con esta estructura exacta, sin texto adicional, sin markdown, sin explicaciones:

{
  "proveedor_rut": "12345678-9",
  "proveedor_razon_social": "EJEMPLO SPA",
  "folio": "12345",
  "fecha_emision": "2026-03-02",
  "subtotal": 100000,
  "iva": 19000,
  "total": 119000,
  "items": [
    {
      "descripcion": "DESPACHO DE FRUTAS Y VERDURAS",
      "cantidad": 1,
      "unidad": "KGS",
      "precio_unitario": 214982,
      "subtotal": 214982
    }
  ]
}

REGLAS:
1. fecha_emision SIEMPRE en formato YYYY-MM-DD
2. proveedor_rut con formato XXXXXXXX-X (sin puntos, con guion)
3. Montos como numeros sin separadores de miles ni decimales (en pesos chilenos enteros)
4. unidad puede ser: KGS, UN, LTS, MTS, CAJA, etc. (segun aparezca en la factura)
5. Si algun dato no aparece o no es claro, usa null
6. NO inventes datos. Si no estas seguro, pon null.
7. items debe contener TODAS las lineas de productos/servicios, una por una
8. proveedor_rut es del EMISOR de la factura, NO del cliente/receptor

Si el documento NO parece una factura, devuelve: {"error": "no_es_factura"}
"""


# ============================================================
# FUNCION PRINCIPAL
# ============================================================

def analizar_factura(
    contenido_archivo: bytes,
    tipo_mime: str,
) -> Optional[dict]:
    """
    Envia el archivo a Gemini y obtiene los datos estructurados.

    Args:
        contenido_archivo: bytes del PDF/imagen
        tipo_mime: "application/pdf", "image/jpeg", "image/png"

    Returns:
        dict con los datos extraidos, o None si fallo
    """
    try:
        configurar()
        model = genai.GenerativeModel(MODELO)

        # Gemini acepta el archivo directamente como Part
        archivo_part = {
            "mime_type": tipo_mime,
            "data": contenido_archivo,
        }

        response = model.generate_content(
            [PROMPT_FACTURA, archivo_part],
            generation_config={
                "temperature": 0.1,  # Baja para mayor precision
                "max_output_tokens": 2048,
            },
        )

        texto = response.text.strip()

        # Limpiar markdown si Gemini lo agrega a pesar de las instrucciones
        if texto.startswith("```json"):
            texto = texto[7:]
        if texto.startswith("```"):
            texto = texto[3:]
        if texto.endswith("```"):
            texto = texto[:-3]
        texto = texto.strip()

        # Parsear JSON
        datos = json.loads(texto)

        # Si Gemini detecto que no es una factura
        if "error" in datos:
            return None

        return datos

    except json.JSONDecodeError as e:
        print(f"[Gemini] JSON invalido: {e}")
        print(f"[Gemini] Respuesta cruda: {response.text[:500]}")
        return None
    except Exception as e:
        print(f"[Gemini] Error general: {e}")
        return None


# ============================================================
# TEST RAPIDO
# ============================================================
# python -m app.services.gemini_service

if __name__ == "__main__":
    import sys
    from pathlib import Path

    print("=" * 60)
    print("TEST Gemini Service")
    print("=" * 60)

    # Verificar config
    if not settings.gemini_api_key:
        print("FAIL: GEMINI_API_KEY no esta en .env")
        sys.exit(1)
    print(f"OK  API key configurada: {settings.gemini_api_key[:15]}...")

    # Buscar una factura local para probar
    ruta_factura = Path("DTE_77242614-3_33_63903.pdf")
    if not ruta_factura.exists():
        print(f"FAIL: No se encuentra {ruta_factura}")
        print("    Pon una factura PDF en la raiz del backend para probar")
        sys.exit(1)

    print(f"OK  Procesando: {ruta_factura.name}")
    print()
    print("Enviando a Gemini... (puede tardar 3-10 segundos)")
    print()

    contenido = ruta_factura.read_bytes()
    resultado = analizar_factura(contenido, "application/pdf")

    if resultado is None:
        print("FAIL: Gemini no pudo procesar")
        sys.exit(1)

    print("OK  Datos extraidos:")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))