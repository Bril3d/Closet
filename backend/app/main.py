from contextlib import asynccontextmanager
import threading
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import auth, items, outfits, analytics, suggestions

logger = logging.getLogger(__name__)


def _preload_ai_model():
    """Download and cache the AI model in a background thread."""
    try:
        from app.services.ai_service import _load_model
        _load_model()
        logger.info("✅ AI model preloaded successfully")
    except Exception as e:
        logger.warning(f"⚠️ AI model preload failed (will retry on first request): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload AI model in background thread
    thread = threading.Thread(target=_preload_ai_model, daemon=True)
    thread.start()
    logger.info("🚀 AI model preloading in background...")
    yield
    # Shutdown
    logger.info("👋 Shutting down Closet API")


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(items.router, prefix="/api/v1/items", tags=["items"])
app.include_router(outfits.router, prefix="/api/v1/outfits", tags=["outfits"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(suggestions.router, prefix="/api/v1/suggestions", tags=["suggestions"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

