"""External Data and Utility Endpoints.

Provides endpoints for:
- /api/weather: Current weather context via Open-Meteo
- /api/disasters: Current global disaster events via GDACS
- /api/earthquakes: Real-time earthquake data via USGS
- /api/fires: Active thermal anomalies via NASA FIRMS
- /api/map/context: Nearby geographic POI context via OpenStreetMap
- /api/health: Service health status and integrations check
"""

import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.schemas import (
    WeatherContext,
    DisasterEvent,
    EarthquakeEvent,
    FireHotspot,
    HealthResponse,
)
from app.config import settings
from app.services import (
    weather_service,
    disaster_service,
    earthquake_service,
    fire_service,
    geospatial_service,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["external"])


@router.get("/weather", response_model=WeatherContext)
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Retrieve contextual weather data for coordinates via Open-Meteo."""
    return await weather_service.get_weather(lat, lon)


@router.get("/disasters", response_model=list[DisasterEvent])
async def get_disasters(
    limit: int = Query(50, ge=1, le=100, description="Max events to return"),
):
    """Retrieve current global disaster alerts from GDACS feed."""
    events, error = await disaster_service.get_disaster_events(limit=limit)
    if error and not events:
        logger.warning(f"GDACS issue: {error}")
    return events


@router.get("/earthquakes", response_model=list[EarthquakeEvent])
async def get_earthquakes(
    feed: str = Query("week_4.5", description="USGS feed name e.g. week_4.5, day_2.5, month_significant"),
    limit: int = Query(100, ge=1, le=200, description="Max earthquakes to return"),
):
    """Retrieve real-time seismic events from USGS GeoJSON feeds."""
    events, error = await earthquake_service.get_earthquakes(feed=feed, limit=limit)
    if error and not events:
        logger.warning(f"USGS issue: {error}")
    return events


@router.get("/fires", response_model=list[FireHotspot])
async def get_fires(
    lat: Optional[float] = Query(None, description="Optional center latitude"),
    lon: Optional[float] = Query(None, description="Optional center longitude"),
    radius_km: int = Query(150, ge=10, le=500, description="Search radius in kilometers"),
    days: int = Query(1, ge=1, le=7, description="Number of days back"),
    limit: int = Query(200, ge=1, le=500, description="Max hotspots to return"),
):
    """Retrieve active fire thermal anomalies from NASA FIRMS."""
    hotspots, error = await fire_service.get_fire_hotspots(
        latitude=lat,
        longitude=lon,
        radius_km=radius_km,
        days=days,
        limit=limit,
    )
    return hotspots


@router.get("/map/context")
async def get_map_context(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Retrieve nearby geographic context (hospitals, fire stations, emergency facilities)."""
    return await geospatial_service.get_map_context(lat, lon)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Service health check returning availability of backend components and configured integrations."""
    services = {
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
        "openrouter_configured": bool(settings.openrouter_api_key),
        "openrouter_model": settings.openrouter_model,
        "openstreetmap_tiles": "active (no key required)",
        "nasa_firms_configured": bool(settings.nasa_firms_map_key),
        "open_meteo": "active (no key required)",
        "usgs_earthquakes": "active (no key required)",
        "gdacs_disasters": "active (no key required)",
        "database": settings.database_url.split("///")[-1] if "///" in settings.database_url else "configured",
    }
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services=services,
    )
