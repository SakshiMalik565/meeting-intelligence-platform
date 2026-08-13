"""User router — provides the /api/v1/me endpoint.

Since there's no real auth, this always returns the single seeded default
user. In a real app this would read from a JWT/session.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)) -> User:
    """Return the hardcoded default user (first user in the DB).

    In production this would decode a JWT and look up the authenticated user.
    Here we simply return the first (and only) seeded user.
    """
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found. Run the seed script first.")
    return user
