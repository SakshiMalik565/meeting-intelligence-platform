import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.base import Base, engine

# Import models so Base.metadata registers all tables before create_all
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
from app.routers import action_items, meetings, search, users

# Set up logging for error tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    """Create database tables on startup if they don't exist yet.

    In production you'd rely solely on Alembic migrations, but this fallback
    makes local development smoother — just run uvicorn and tables appear.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Meeting Intelligence Platform",
    description="A Fireflies.ai clone — meeting transcripts, AI summaries, and action items.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Exception Handler ───────────────────────────────────────────


@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log server-side traceback and return a clean, un-leaked 500 JSON response."""
    logger.error("Unhandled exception occurred: %s", str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please check logs for details."},
    )


# ── Routers ────────────────────────────────────────────────────────────
# All endpoints live under /api/v1 for clean versioning
app.include_router(users.router, prefix="/api/v1")
app.include_router(meetings.router, prefix="/api/v1")
app.include_router(action_items.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")


@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    """Simple health check — useful for deployment readiness probes."""
    return {"status": "ok", "service": "meeting-intelligence-platform"}
