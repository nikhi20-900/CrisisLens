"""CrisisLens FastAPI Application Entrypoint.

AI for Disaster Response - Multimodal Rapid Assessment Decision Support Tool.
"""

import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.api import incidents_router, analyze_router, external_router, demo_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("crisislens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown events."""
    logger.info("Initializing CrisisLens database and tables...")
    await init_db()
    logger.info("CrisisLens database initialized successfully.")
    
    # Ensure uploads directory exists
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    yield
    
    logger.info("Shutting down CrisisLens backend.")


app = FastAPI(
    title="CrisisLens API",
    description="Multimodal AI Disaster Response Intelligence Platform & Decision Support System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for serving uploaded incident photos
uploads_path = Path("uploads")
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Include Routers
app.include_router(analyze_router)
app.include_router(incidents_router)
app.include_router(external_router)
app.include_router(demo_router)


@app.get("/")
async def root():
    return {
        "app": "CrisisLens",
        "tagline": "AI for Disaster Response - Rapid Multimodal Assessment",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
