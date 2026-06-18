from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    database_url: str

    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    # Supabase Storage para Ingesta Inteligente
    supabase_service_key: Optional[str] = None
    supabase_bucket: str = "facturas"

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    app_env: str = "development"
    app_name: str = "Sistema Gastronomia"

    brevo_api_key: Optional[str] = None
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()