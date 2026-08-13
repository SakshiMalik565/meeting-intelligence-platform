"""SQLAlchemy engine, session factory, and declarative base.

This module is the single source of truth for the database connection.
All models inherit from `Base` defined here.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# If using SQLite, ensure the parent directory exists dynamically
if settings.DATABASE_URL.startswith("sqlite"):
    db_file_path = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
    if db_file_path and db_file_path != ":memory:":
        parent_dir = os.path.dirname(os.path.abspath(db_file_path))
        if parent_dir and not os.path.exists(parent_dir):
            try:
                os.makedirs(parent_dir, exist_ok=True)
            except Exception:
                pass

# SQLite requires check_same_thread=False so FastAPI's threaded request
connect_args: dict = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,  # Flip to True to log all SQL for debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""

    pass
