from fastapi import APIRouter
from app.api.v1.endpoints import reports, incidents, recommendations

api_router = APIRouter()
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
