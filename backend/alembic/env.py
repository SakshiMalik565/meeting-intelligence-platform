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

from sqlalchemy import engine_from_config, pool
from alembic import context

# Import our app's Base and settings so Alembic uses the same DB config
from app.config import settings
from app.db.base import Base

# Import all models so their tables are registered on Base.metadata
# before autogenerate compares metadata to the database schema.
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

# Override the sqlalchemy.url from alembic.ini with our app's DATABASE_URL
# so we don't have to duplicate the connection string.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set up Python logging from the ini file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point autogenerate at our declarative Base's metadata
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without a live DB.

    Useful for generating migration SQL scripts for review or for databases
    you can't connect to directly.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # render_as_batch is critical for SQLite, which doesn't support
        # ALTER TABLE for most operations. Batch mode recreates the table.
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connects to the DB and applies changes."""
    # Ensure SQLite parent directory exists before connecting
    db_url = config.get_main_option("sqlalchemy.url")
    if db_url and db_url.startswith("sqlite"):
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if db_path and db_path != ":memory:":
            parent_dir = os.path.dirname(os.path.abspath(db_path))
            if parent_dir and not os.path.exists(parent_dir):
                try:
                    os.makedirs(parent_dir, exist_ok=True)
                except Exception:
                    pass

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # render_as_batch=True is essential for SQLite ALTER TABLE support
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
