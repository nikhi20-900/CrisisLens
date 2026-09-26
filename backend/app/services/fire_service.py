"""NASA FIRMS Fire Data Service.

Fetches active fire hotspot data from NASA FIRMS (Fire Information for Resource Management System).
Requires NASA_FIRMS_MAP_KEY for full access, but has limited public access.
"""

import httpx
import logging
import csv
import io
from typing import Optional

from app.config import settings
from app.schemas import FireHotspot

logger = logging.getLogger(__name__)

# NASA FIRMS API endpoints
FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov"
TIMEOUT = 20.0


async def get_fire_hotspots(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: int = 100,
    days: int = 1,
    limit: int = 200,
) -> tuple[list[FireHotspot], Optional[str]]:
    """Fetch active fire hotspot data from NASA FIRMS.

    Returns (hotspots, error_message).
    If NASA_FIRMS_MAP_KEY is not configured, returns empty with message.
    """
    if not settings.nasa_firms_map_key:
        return [], "Satellite fire layer unavailable (API key not configured)"

    try:
        # Use the MAP_KEY-based CSV endpoint for area query
        # Format: /api/area/csv/{MAP_KEY}/{source}/{area}/{days}
        source = "VIIRS_SNPP_NRT"

        if latitude is not None and longitude is not None:
            # Area query around coordinates
            # FIRMS expects: west,south,east,north bounding box
            delta = radius_km / 111.0  # rough degree conversion
            west = longitude - delta
            south = latitude - delta
            east = longitude + delta
            north = latitude + delta
            area = f"{west},{south},{east},{north}"
        else:
            # Global recent — use world extent
            area = "-180,-90,180,90"

        url = f"{FIRMS_BASE_URL}/api/area/csv/{settings.nasa_firms_map_key}/{source}/{area}/{days}"

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url)
            response.raise_for_status()

        hotspots = []
        reader = csv.DictReader(io.StringIO(response.text))

        for row in list(reader)[:limit]:
            try:
                hotspots.append(FireHotspot(
                    latitude=float(row.get("latitude", 0)),
                    longitude=float(row.get("longitude", 0)),
                    brightness=float(row.get("bright_ti4", 0)) if row.get("bright_ti4") else None,
                    confidence=row.get("confidence"),
                    acq_date=row.get("acq_date"),
                    acq_time=row.get("acq_time"),
                    satellite=row.get("satellite", "VIIRS"),
                    source="NASA FIRMS",
                ))
            except Exception as e:
                logger.warning(f"Failed to parse fire hotspot: {e}")
                continue

        logger.info(f"Fetched {len(hotspots)} fire hotspots from NASA FIRMS")
        return hotspots, None

    except httpx.TimeoutException:
        logger.warning("NASA FIRMS API timeout")
        return [], "Satellite fire layer unavailable (timeout)"
    except Exception as e:
        logger.error(f"NASA FIRMS API error: {e}")
        return [], "Satellite fire layer unavailable"
