"""Alembic environment configuration.

This file is run by Alembic whenever migrations are generated or applied.
It connects to the database using the same settings as the FastAPI app
and registers all SQLAlchemy models for autogenerate support.
"""

import sys
import os
from logging.config import fileConfig

# Ensure app package is in Python search path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine, pool
from alembic import context

# Import our app's Base and settings so Alembic uses the same DB config
from app.config import settings
from app.db.base import Base

# Import all models so their tables are registered on Base.metadata
from app.models import (  # noqa: F401
    User,
    Meeting,
    Participant,
    TranscriptSegment,
    Summary,
    KeyTopic,
    ActionItem,
    Tag,
)

# Alembic Config object — provides access to values in alembic.ini
config = context.config

# Force Alembic to use settings.resolved_database_url
db_url = settings.resolved_database_url
config.set_main_option("sqlalchemy.url", db_url)

# Set up Python logging from the ini file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point autogenerate at our declarative Base's metadata
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without a live DB."""
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connects to DB directly using settings."""
    connectable = create_engine(
        db_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
