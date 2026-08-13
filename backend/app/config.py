"""Application configuration loaded from environment variables.

Uses pydantic-settings to read from .env file or OS environment.
Defaults are tuned for local development with SQLite.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central app settings — maps to environment variables."""

    # SQLite for local dev; swap to postgres:// for production
    DATABASE_URL: str = "sqlite:///./fireflies.db"

    # Optional LLM key for real summary generation.
    # Empty string triggers the deterministic mock fallback.
    LLM_API_KEY: str = ""

    # Comma-separated allowed CORS origins
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        """Split the comma-separated CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


# Singleton used across the app via `from app.config import settings`
settings = Settings()
