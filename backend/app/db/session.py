"""FastAPI dependency for database session injection.

Usage in route handlers:
    @router.get("/example")
    def example(db: Session = Depends(get_db)):
        ...
"""

from collections.abc import Generator

from sqlalchemy.orm import Session

from app.db.base import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a scoped DB session, guaranteed to close after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
