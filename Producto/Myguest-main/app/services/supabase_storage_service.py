"""
Servicio para gestionar archivos en Supabase Storage.
"""
import hashlib
import uuid
from datetime import datetime
from typing import Optional
import re
import unicodedata

from supabase import create_client, Client

from app.config import get_settings

settings = get_settings()


_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            raise RuntimeError(
                "Supabase no esta configurado. "
                "Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en .env"
            )
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_key,
        )
    return _client


def calcular_hash(contenido: bytes) -> str:
    return hashlib.sha256(contenido).hexdigest()


def generar_storage_path(nombre_original: str, id_ingesta: str) -> str:
    ahora = datetime.now()
    # Normalizar unicode (convierte ° é ñ etc a equivalentes ASCII)
    nombre_normalizado = unicodedata.normalize("NFKD", nombre_original)
    nombre_ascii = nombre_normalizado.encode("ascii", "ignore").decode("ascii")
    # Reemplazar cualquier caracter no alfanumérico (salvo . - _) por _
    nombre_limpio = re.sub(r"[^\w.\-]", "_", nombre_ascii)
    return f"{ahora.year}/{ahora.month:02d}/{id_ingesta}_{nombre_limpio}"

def subir_archivo(contenido: bytes, nombre_original: str, tipo_mime: str) -> dict:
    client = get_client()
    id_ingesta = str(uuid.uuid4())
    storage_path = generar_storage_path(nombre_original, id_ingesta)
    hash_archivo = calcular_hash(contenido)

    client.storage.from_(settings.supabase_bucket).upload(
        path=storage_path,
        file=contenido,
        file_options={
            "content-type": tipo_mime,
            "x-upsert": "false",
        },
    )

    return {
        "id_ingesta": id_ingesta,
        "storage_path": storage_path,
        "hash_sha256": hash_archivo,
        "tamano_bytes": len(contenido),
    }


def obtener_url_firmada(storage_path: str, segundos_validos: int = 3600) -> str:
    client = get_client()
    response = client.storage.from_(settings.supabase_bucket).create_signed_url(
        path=storage_path,
        expires_in=segundos_validos,
    )
    return response.get("signedURL", response.get("signedUrl", ""))


def descargar_archivo(storage_path: str) -> bytes:
    client = get_client()
    return client.storage.from_(settings.supabase_bucket).download(storage_path)


def eliminar_archivo(storage_path: str) -> None:
    client = get_client()
    client.storage.from_(settings.supabase_bucket).remove([storage_path])


if __name__ == "__main__":
    print("=" * 60)
    print("TEST Supabase Storage")
    print("=" * 60)

    try:
        client = get_client()
        print(f"OK  Cliente creado contra {settings.supabase_url}")
    except Exception as e:
        print(f"FAIL al crear cliente: {e}")
        exit(1)

    try:
        contenido_test = b"Esto es una factura de prueba para validar el bucket"
        resultado = subir_archivo(
            contenido=contenido_test,
            nombre_original="test_factura.txt",
            tipo_mime="text/plain",
        )
        print("OK  Archivo subido")
        print(f"    id_ingesta:   {resultado['id_ingesta']}")
        print(f"    storage_path: {resultado['storage_path']}")
        print(f"    hash_sha256:  {resultado['hash_sha256'][:16]}...")
    except Exception as e:
        print(f"FAIL al subir archivo: {e}")
        exit(1)

    try:
        url = obtener_url_firmada(resultado['storage_path'])
        print("OK  URL firmada generada (1h validez)")
        print(f"    {url[:80]}...")
    except Exception as e:
        print(f"FAIL al generar URL firmada: {e}")

    try:
        eliminar_archivo(resultado['storage_path'])
        print("OK  Archivo de prueba eliminado")
    except Exception as e:
        print(f"FAIL al eliminar: {e}")

    print("=" * 60)
    print("Si ves todos los OK, Supabase Storage funciona perfecto.")
    print("=" * 60)
