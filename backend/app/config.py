"""CrisisLens Backend Configuration."""

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # AI - OpenRouter (Primary Multimodal)
    openrouter_api_key: str = ""
    openrouter_model: str = "openrouter/free"

    # AI - Google Gemini (Alternative)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Maps - OpenStreetMap + Leaflet (No API key required)

    # Optional services
    nasa_firms_map_key: str = ""
    sentinel_client_id: str = ""
    sentinel_client_secret: str = ""

    # Database
    database_url: str = "sqlite+aiosqlite:///./crisislens.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Upload
    max_upload_size_mb: int = 10
    allowed_extensions: str = "png,jpg,jpeg,webp"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_ext_list(self) -> list[str]:
        return [e.strip().lower() for e in self.allowed_extensions.split(",")]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    model_config = {
        "env_file": (".env", "../.env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
