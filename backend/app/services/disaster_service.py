"""GDACS Disaster Data Service.

Fetches current global disaster events from GDACS (Global Disaster Alerting Coordination System).
No API key required.
"""

import httpx
import logging
import xml.etree.ElementTree as ET
from typing import Optional
from datetime import datetime, timezone

from app.schemas import DisasterEvent

logger = logging.getLogger(__name__)

GDACS_RSS_URL = "https://www.gdacs.org/xml/rss.xml"
TIMEOUT = 15.0

# GDACS event type mapping
EVENT_TYPES = {
    "EQ": "earthquake",
    "TC": "tropical_cyclone",
    "FL": "flood",
    "VO": "volcano",
    "WF": "wildfire",
    "DR": "drought",
    "TS": "tsunami",
}


async def get_disaster_events(limit: int = 50) -> tuple[list[DisasterEvent], Optional[str]]:
    """Fetch current disaster events from GDACS RSS feed.

    Returns (events, error_message). If GDACS fails, returns empty list with error.
    """
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(GDACS_RSS_URL)
            response.raise_for_status()

        root = ET.fromstring(response.content)
        events = []

        # GDACS namespace
        ns = {
            "gdacs": "http://www.gdacs.org",
            "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
        }

        for item in root.findall(".//item")[:limit]:
            try:
                title = item.findtext("title", "")
                description = item.findtext("description", "")
                link = item.findtext("link", "")

                # Extract coordinates
                lat_el = item.find("geo:lat", ns)
                lon_el = item.find("geo:long", ns)
                if lat_el is None or lon_el is None:
                    # Try gdacs namespace
                    lat_el = item.find("gdacs:lat", ns)
                    lon_el = item.find("gdacs:long", ns)

                if lat_el is None or lon_el is None:
                    continue

                lat = float(lat_el.text)
                lon = float(lon_el.text)

                # Event type
                event_type_el = item.find("gdacs:eventtype", ns)
                event_type_code = event_type_el.text if event_type_el is not None else "UN"
                event_type = EVENT_TYPES.get(event_type_code, event_type_code.lower())

                # Alert level
                alert_el = item.find("gdacs:alertlevel", ns)
                alert_level = alert_el.text if alert_el is not None else None

                # Event ID
                event_id_el = item.find("gdacs:eventid", ns)
                event_id = event_id_el.text if event_id_el is not None else f"gdacs-{hash(title)}"

                # Country
                country_el = item.find("gdacs:country", ns)
                country = country_el.text if country_el is not None else None

                # Dates
                from_date_el = item.find("gdacs:fromdate", ns)
                to_date_el = item.find("gdacs:todate", ns)
                from_date = from_date_el.text if from_date_el is not None else None
                to_date = to_date_el.text if to_date_el is not None else None

                # Severity
                severity_el = item.find("gdacs:severity", ns)
                severity = severity_el.text if severity_el is not None else None

                events.append(DisasterEvent(
                    event_id=str(event_id),
                    event_type=event_type,
                    title=title,
                    description=description[:500] if description else None,
                    latitude=lat,
                    longitude=lon,
                    severity=severity,
                    alert_level=alert_level,
                    country=country,
                    source="GDACS",
                    url=link,
                    from_date=from_date,
                    to_date=to_date,
                ))
            except Exception as e:
                logger.warning(f"Failed to parse GDACS item: {e}")
                continue

        logger.info(f"Fetched {len(events)} disaster events from GDACS")
        return events, None

    except httpx.TimeoutException:
        logger.warning("GDACS API timeout")
        return [], "Live disaster feed unavailable (timeout)"
    except Exception as e:
        logger.error(f"GDACS API error: {e}")
        return [], f"Live disaster feed unavailable"
