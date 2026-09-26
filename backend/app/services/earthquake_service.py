"""USGS Earthquake Data Service.

Fetches real-time earthquake data from USGS GeoJSON feeds.
No API key required.
"""

import httpx
import logging
from typing import Optional
from datetime import datetime, timezone

from app.schemas import EarthquakeEvent

logger = logging.getLogger(__name__)

# USGS GeoJSON feeds
FEEDS = {
    "hour_significant": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson",
    "hour_4.5": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_hour.geojson",
    "day_significant": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson",
    "day_4.5": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
    "day_2.5": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
    "day_all": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
    "week_4.5": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson",
    "week_2.5": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
    "week_significant": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
    "month_significant": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
    "month_4.5": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson",
}

TIMEOUT = 15.0


async def get_earthquakes(
    feed: str = "week_4.5",
    limit: int = 100,
) -> tuple[list[EarthquakeEvent], Optional[str]]:
    """Fetch earthquake events from USGS.

    Args:
        feed: Feed name (e.g., 'week_4.5', 'day_2.5', 'month_significant')
        limit: Maximum events to return

    Returns (events, error_message).
    """
    feed_url = FEEDS.get(feed)
    if not feed_url:
        feed_url = FEEDS["week_4.5"]
        logger.warning(f"Unknown feed '{feed}', falling back to week_4.5")

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(feed_url)
            response.raise_for_status()
            data = response.json()

        events = []
        features = data.get("features", [])[:limit]

        for feature in features:
            try:
                props = feature.get("properties", {})
                geometry = feature.get("geometry", {})
                coords = geometry.get("coordinates", [0, 0, 0])

                # USGS uses [longitude, latitude, depth]
                lon, lat = coords[0], coords[1]
                depth = coords[2] if len(coords) > 2 else 0

                # Timestamp
                time_ms = props.get("time", 0)
                timestamp = datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc).isoformat()

                events.append(EarthquakeEvent(
                    event_id=feature.get("id", f"usgs-{hash(str(props))}"),
                    magnitude=props.get("mag", 0),
                    location=props.get("place", "Unknown location"),
                    latitude=lat,
                    longitude=lon,
                    depth_km=depth,
                    timestamp=timestamp,
                    url=props.get("url"),
                    felt_reports=props.get("felt"),
                    tsunami_alert=bool(props.get("tsunami", 0)),
                    source="USGS",
                ))
            except Exception as e:
                logger.warning(f"Failed to parse earthquake feature: {e}")
                continue

        logger.info(f"Fetched {len(events)} earthquakes from USGS ({feed})")
        return events, None

    except httpx.TimeoutException:
        logger.warning("USGS API timeout")
        return [], "Earthquake data unavailable (timeout)"
    except Exception as e:
        logger.error(f"USGS API error: {e}")
        return [], "Earthquake data unavailable"
