"""SQLAlchemy engine, session factory, and declarative base.

This module is the single source of truth for the database connection.
All models inherit from `Base` defined here.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

db_url = settings.resolved_database_url

# SQLite requires check_same_thread=False so FastAPI's threaded request
# handlers can safely share the connection.
connect_args: dict = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""

    pass
