"""Google Gemini Multimodal AI Service.

Sends image + text + context to Gemini and returns validated structured analysis.
"""

import json
import base64
import logging
from typing import Optional
from pathlib import Path

from google import genai
from google.genai import types

from app.config import settings
from app.schemas import AIAnalysisResult, WeatherContext

logger = logging.getLogger(__name__)

# Initialize client lazily
_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


SYSTEM_PROMPT = """You are CrisisLens, an AI disaster assessment system. You analyze disaster evidence and produce structured situation assessments.

You will receive:
1. A disaster photograph/image
2. A citizen/field report (text)
3. Location information
4. Weather context
5. Optional additional disaster context

Your task is to analyze ALL evidence together and produce a STRICT JSON assessment.

CRITICAL RULES:
- Analyze the image AND the text report together. Do NOT analyze them in isolation.
- Be specific about what you can actually see vs. what you infer.
- Rate your confidence honestly (0.0-1.0). If the image is blurry or ambiguous, say so.
- List uncertainty factors explicitly.
- Do not claim certainty about things you cannot determine from the evidence.
- For damage levels, use: "none", "minor", "moderate", "severe", "destroyed", or "unknown"
- For severity, use 1-5 scale: 1=minimal, 2=minor, 3=moderate, 4=high, 5=critical

You MUST return ONLY valid JSON matching this exact schema (no markdown, no explanation outside JSON):

{
  "disaster_type": "string (flood, earthquake, wildfire, cyclone, landslide, storm, building_collapse, etc.)",
  "summary": "string (brief situation summary combining all evidence)",
  "damage": {
    "buildings": "string (none/minor/moderate/severe/destroyed/unknown)",
    "roads": "string (none/minor/moderate/severe/destroyed/blocked/unknown)",
    "utilities": "string (none/minor/moderate/severe/destroyed/disrupted/unknown)",
    "bridges": "string (none/minor/moderate/severe/destroyed/unknown)",
    "vehicles": "string (none/minor/moderate/severe/destroyed/unknown)"
  },
  "people": {
    "visible_people": "integer (number of people visible in image)",
    "estimated_affected": "integer (estimated total affected based on all evidence)",
    "possible_stranded_people": "boolean",
    "possible_injuries": "boolean",
    "possible_casualties": "boolean"
  },
  "hazards": ["string (list of immediate hazards)"],
  "severity": "integer 1-5",
  "severity_label": "string (LOW/MEDIUM/HIGH/CRITICAL)",
  "confidence": "float 0.0-1.0",
  "evidence": ["string (list of evidence observations supporting your assessment)"],
  "recommended_actions": ["string (list of recommended response actions)"],
  "accessibility_issues": ["string (issues that would make response difficult)"],
  "environmental_risks": ["string (ongoing environmental risks)"],
  "uncertainty_factors": ["string (what you are uncertain about and why)"]
}"""


def _build_prompt(
    report_text: Optional[str],
    location_name: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
    weather: Optional[WeatherContext],
    additional_context: Optional[str] = None,
) -> str:
    """Build the text portion of the multimodal prompt."""
    parts = ["DISASTER EVIDENCE ANALYSIS REQUEST", "=" * 40]

    if report_text:
        parts.append(f"\nCITIZEN/FIELD REPORT:\n{report_text}")

    if location_name or (latitude and longitude):
        parts.append(f"\nLOCATION:")
        if location_name:
            parts.append(f"  Name: {location_name}")
        if latitude and longitude:
            parts.append(f"  Coordinates: {latitude}, {longitude}")

    if weather and weather.available:
        parts.append(f"\nWEATHER CONTEXT (source: {weather.source}):")
        if weather.temperature_c is not None:
            parts.append(f"  Temperature: {weather.temperature_c}°C")
        if weather.precipitation_mm is not None:
            parts.append(f"  Precipitation: {weather.precipitation_mm}mm")
        if weather.precipitation_probability is not None:
            parts.append(f"  Precipitation probability: {weather.precipitation_probability}%")
        if weather.wind_speed_kmh is not None:
            parts.append(f"  Wind speed: {weather.wind_speed_kmh} km/h")
        if weather.weather_description:
            parts.append(f"  Conditions: {weather.weather_description}")
        if weather.is_severe:
            parts.append(f"  ⚠ SEVERE WEATHER CONDITIONS")
    else:
        parts.append("\nWEATHER CONTEXT: Unavailable")

    if additional_context:
        parts.append(f"\nADDITIONAL CONTEXT:\n{additional_context}")

    parts.append("\n" + "=" * 40)
    parts.append("Analyze ALL evidence above together with the uploaded image.")
    parts.append("Return ONLY the JSON assessment. No markdown formatting.")

    return "\n".join(parts)


async def analyze_disaster(
    image_path: Optional[str],
    report_text: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
    additional_context: Optional[str] = None,
) -> AIAnalysisResult:
    """Perform multimodal disaster analysis using Gemini.

    Sends image + text + context and returns a validated AIAnalysisResult.
    """
    client = _get_client()

    prompt_text = _build_prompt(report_text, location_name, latitude, longitude, weather, additional_context)

    # Build content parts
    contents = []

    # Add image if available
    if image_path and Path(image_path).exists():
        image_data = Path(image_path).read_bytes()
        # Determine mime type
        suffix = Path(image_path).suffix.lower()
        mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
        mime_type = mime_map.get(suffix, "image/jpeg")

        contents.append(types.Part.from_bytes(data=image_data, mime_type=mime_type))

    # Add text prompt
    contents.append(types.Part.from_text(text=prompt_text))

    logger.info(f"Sending analysis request to Gemini ({settings.gemini_model})")

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,  # Low temperature for consistent structured output
                max_output_tokens=4096,
            ),
        )

        response_text = response.text.strip()

        # Clean response — remove markdown code fences if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last lines (```json and ```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            response_text = "\n".join(lines)

        logger.info(f"Gemini response received ({len(response_text)} chars)")

        # Parse and validate
        try:
            raw_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON: {e}\nRaw: {response_text[:500]}")
            # Return a minimal valid result with uncertainty
            return AIAnalysisResult(
                disaster_type="unknown",
                summary="AI analysis produced unparseable output. Manual review required.",
                severity=2,
                severity_label="MEDIUM",
                confidence=0.2,
                uncertainty_factors=["AI response could not be parsed as JSON"],
                evidence=["AI analysis was attempted but output was malformed"],
            )

        # Validate with Pydantic
        result = AIAnalysisResult.model_validate(raw_data)
        logger.info(f"Analysis validated: {result.disaster_type}, severity={result.severity}, confidence={result.confidence}")
        return result

    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        raise


async def analyze_disaster_safe(
    image_path: Optional[str],
    report_text: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
    additional_context: Optional[str] = None,
) -> tuple[Optional[AIAnalysisResult], Optional[str]]:
    """Safe wrapper that returns (result, error_message) instead of raising."""
    try:
        result = await analyze_disaster(
            image_path=image_path,
            report_text=report_text,
            location_name=location_name,
            latitude=latitude,
            longitude=longitude,
            weather=weather,
            additional_context=additional_context,
        )
        return result, None
    except Exception as e:
        logger.error(f"AI analysis failed safely: {e}")
        return None, f"AI analysis unavailable: {str(e)}"
