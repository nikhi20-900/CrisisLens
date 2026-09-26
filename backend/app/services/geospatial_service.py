"""Geospatial utilities and context service using OpenStreetMap / Nominatim."""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

TIMEOUT = 10.0
USER_AGENT = "CrisisLens/1.0 (Emergency Response Living Crisis Map; contact@crisislens.local)"


async def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
    """Reverse geocode coordinates to a human-readable location name using OpenStreetMap Nominatim."""
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": latitude,
            "lon": longitude,
            "zoom": 16,
            "addressdetails": 1,
        }
        headers = {"User-Agent": USER_AGENT}

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                return None
            data = response.json()

        display_name = data.get("display_name")
        if display_name:
            # Shorten if very long, taking first 3-4 segments
            parts = [p.strip() for p in display_name.split(",")]
            if len(parts) > 3:
                return ", ".join(parts[:3]) + f", {parts[-1]}"
            return display_name
        return None

    except Exception as e:
        logger.warning(f"OSM reverse geocode failed: {e}")
        return None


async def forward_geocode(query: str) -> Optional[dict]:
    """Forward geocode a text query to coordinates using OpenStreetMap Nominatim."""
    if not query or len(query.strip()) < 2:
        return {"results": []}

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "format": "json",
            "q": query.strip(),
            "limit": 5,
            "addressdetails": 1,
        }
        headers = {"User-Agent": USER_AGENT}

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                return {"results": []}
            data = response.json()

        results = []
        for item in data:
            lat = float(item["lat"]) if "lat" in item else None
            lon = float(item["lon"]) if "lon" in item else None
            results.append({
                "place_name": item.get("display_name", ""),
                "longitude": lon,
                "latitude": lat,
                "type": [item.get("type", "place")],
            })

        return {"results": results}

    except Exception as e:
        logger.warning(f"OSM forward geocode failed: {e}")
        return {"results": []}


async def get_map_context(latitude: float, longitude: float) -> dict:
    """Get geographic context for a location (nearby POIs like hospitals, shelters, fire stations) using OpenStreetMap."""
    context = {
        "location": {"latitude": latitude, "longitude": longitude},
        "nearby": [],
        "available": True,
    }

    try:
        # Query nearby emergency amenities via OpenStreetMap Nominatim search
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "format": "json",
            "q": f"hospital near {latitude},{longitude}",
            "limit": 3,
        }
        headers = {"User-Agent": USER_AGENT}

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                for item in data:
                    lat = float(item["lat"]) if "lat" in item else None
                    lon = float(item["lon"]) if "lon" in item else None
                    context["nearby"].append({
                        "name": item.get("name") or item.get("display_name", "").split(",")[0],
                        "full_name": item.get("display_name", ""),
                        "type": "hospital",
                        "longitude": lon,
                        "latitude": lat,
                    })

        return context

    except Exception as e:
        logger.warning(f"OSM map context fetch failed: {e}")
        return context
