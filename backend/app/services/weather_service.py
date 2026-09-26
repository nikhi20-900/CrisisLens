"""Open-Meteo Weather Service.

Retrieves weather context for incident locations.
No API key required.
"""

import httpx
import logging
from typing import Optional
from datetime import datetime, timezone

from app.schemas import WeatherContext

logger = logging.getLogger(__name__)

BASE_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = 10.0

# WMO Weather codes → descriptions
WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Light freezing rain", 67: "Heavy freezing rain",
    71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

SEVERE_CODES = {65, 67, 75, 82, 86, 95, 96, 99}


async def get_weather(latitude: float, longitude: float) -> WeatherContext:
    """Get current weather for given coordinates.

    Returns WeatherContext with available=True on success,
    or available=False with graceful fallback on failure.
    """
    try:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
            "hourly": "precipitation_probability",
            "forecast_days": 1,
            "timezone": "auto",
        }

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

        current = data.get("current", {})
        hourly = data.get("hourly", {})

        weather_code = current.get("weather_code")
        weather_desc = WMO_CODES.get(weather_code, "Unknown") if weather_code is not None else None
        is_severe = weather_code in SEVERE_CODES if weather_code is not None else False

        # Get current hour's precipitation probability
        precip_prob = None
        if hourly.get("precipitation_probability"):
            now_hour = datetime.now(timezone.utc).hour
            probs = hourly["precipitation_probability"]
            if now_hour < len(probs):
                precip_prob = probs[now_hour]

        return WeatherContext(
            temperature_c=current.get("temperature_2m"),
            precipitation_mm=current.get("precipitation"),
            precipitation_probability=precip_prob,
            wind_speed_kmh=current.get("wind_speed_10m"),
            wind_direction=current.get("wind_direction_10m"),
            weather_code=weather_code,
            weather_description=weather_desc,
            is_severe=is_severe,
            source="Open-Meteo",
            retrieved_at=datetime.now(timezone.utc).isoformat(),
            available=True,
        )

    except httpx.TimeoutException:
        logger.warning(f"Weather API timeout for ({latitude}, {longitude})")
        return WeatherContext(available=False, weather_description="Weather context unavailable (timeout)")
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return WeatherContext(available=False, weather_description=f"Weather context unavailable")
