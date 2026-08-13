"""Application configuration loaded from environment variables.

Uses pydantic-settings to read from .env file or OS environment.
Defaults are tuned for local development with SQLite.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central app settings — maps to environment variables."""

    # SQLite for local dev or production container
    DATABASE_URL: str = "sqlite:///./fireflies.db"

    # Optional LLM key for real summary generation.
    # Empty string triggers the deterministic mock fallback.
    LLM_API_KEY: str = ""

    # Comma-separated allowed CORS origins
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def resolved_database_url(self) -> str:
        """Resolve SQLite path to an absolute path and ensure directory exists."""
        url = self.DATABASE_URL
        if url.startswith("sqlite"):
            if url.startswith("sqlite:////"):
                path = url[10:]
            elif url.startswith("sqlite:///"):
                path = url[9:]
            else:
                path = "fireflies.db"

            if path and path != ":memory:":
                abs_path = os.path.abspath(path)
                parent_dir = os.path.dirname(abs_path)
                if parent_dir:
                    os.makedirs(parent_dir, exist_ok=True)
                return f"sqlite:///{abs_path}"
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        """Split the comma-separated CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


# Singleton used across the app via `from app.config import settings`
settings = Settings()
