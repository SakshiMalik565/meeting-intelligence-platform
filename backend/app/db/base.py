"""SQLAlchemy engine, session factory, and declarative base.

This module is the single source of truth for the database connection.
All models inherit from `Base` defined here.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# SQLite requires check_same_thread=False so FastAPI's threaded request
# handlers can safely share the connection. This is standard practice
# when using SQLite with any multi-threaded WSGI/ASGI server.
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
