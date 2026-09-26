from app.api.incidents import router as incidents_router, analyze_router
from app.api.external import router as external_router
from app.api.demo import router as demo_router

__all__ = ["incidents_router", "analyze_router", "external_router", "demo_router"]
