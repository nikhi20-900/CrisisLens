"""OpenRouter Multimodal AI Service for Disaster Assessment.

Communicates with OpenRouter vision-capable models using base64 image data
and citizen text reports, enforcing strict non-hallucination and evidence grounding.
Includes automatic single-retry on rate limits (HTTP 429) and structured error handling.
"""

import os
import re
import json
import base64
import asyncio
import logging
from typing import Optional
from pathlib import Path

import httpx

from app.config import settings
from app.schemas import (
    OpenRouterDisasterAnalysis,
    AIAnalysisResult,
    DamageAssessment,
    PeopleAssessment,
    WeatherContext,
)

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_OPENROUTER_MODEL = "openrouter/free"

ALLOWED_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


class OpenRouterConfigError(ValueError):
    """Raised when OpenRouter API credentials or settings are missing."""
    pass


class OpenRouterAPIError(RuntimeError):
    """Raised when OpenRouter API call fails."""
    pass


class OpenRouterRateLimitError(OpenRouterAPIError):
    """Raised when OpenRouter API returns HTTP 429 Rate Limit."""
    def __init__(self, message: str = "The AI provider is temporarily rate-limited. Please retry shortly."):
        super().__init__(message)
        self.error_type = "RATE_LIMITED"


def get_api_key() -> str:
    """Retrieve the OpenRouter API key from configuration or environment.

    Never logs, prints, or returns the key in error messages.
    """
    key = settings.openrouter_api_key or os.getenv("OPENROUTER_API_KEY", "")
    key = key.strip()
    if not key:
        raise OpenRouterConfigError(
            "OPENROUTER_API_KEY is not configured. Please set OPENROUTER_API_KEY in backend/.env"
        )
    return key


def get_model() -> str:
    """Retrieve the configured OpenRouter model."""
    model = settings.openrouter_model or os.getenv("OPENROUTER_MODEL", "")
    return model.strip() if model.strip() else DEFAULT_OPENROUTER_MODEL


SYSTEM_PROMPT = """You are CrisisLens AI, an emergency disaster intelligence system.
Your mission is to perform strict, evidence-based multimodal disaster analysis from incoming imagery and citizen reports.

CRITICAL INTEGRITY & NON-HALLUCINATION RULES:
1. EVIDENCE GROUNDING: Only report visible damage, conditions, or people that are directly observable in the image or explicitly stated in the citizen report.
2. DO NOT INVENT FACTS: Never assume, extrapolate, or fabricate casualties, road blocks, or structural collapse if not directly supported by the evidence.
3. EXPLICIT UNKNOWNS: Anything you cannot verify with high confidence MUST be explicitly listed under "unknown_information".
4. CONFIDENCE RATING: Set confidence (0.0 to 1.0) honestly based on image clarity, completeness of citizen report, and unambiguous visual markers. Do not overstate certainty.
5. ATTENTION LEVEL: Assign recommended_attention_level as LOW, MEDIUM, HIGH, or CRITICAL based on immediate life-safety and infrastructure threats.

You MUST return a single, valid JSON object matching this exact schema:
{
  "disaster_type": "string (e.g. flood, wildfire, earthquake, cyclone, storm, building_collapse, landslide, or unknown)",
  "observed_conditions": ["list of directly observed physical phenomena"],
  "visible_damage": ["list of visible structural or infrastructure damage"],
  "affected_area_description": "concise description of the physical area affected",
  "possible_people_at_risk": "concise description of people potentially at risk or 'Unknown from provided evidence'",
  "accessibility_issues": ["list of road blockages, bridge failures, or transit access issues"],
  "severity_indicators": ["list of key physical markers indicating hazard severity"],
  "supporting_evidence": ["concise observations directly supporting the assessment"],
  "unknown_information": ["critical unknowns that cannot be confirmed without field inspection"],
  "confidence": 0.85,
  "recommended_attention_level": "LOW|MEDIUM|HIGH|CRITICAL"
}

Output ONLY the raw JSON object. Do not include markdown fences, comments, or preamble."""


def _encode_image_to_data_url(image_path_or_bytes: str | bytes, filename_or_ext: Optional[str] = None) -> str:
    """Read and encode an image file or bytes into a base64 data URL."""
    if isinstance(image_path_or_bytes, bytes):
        raw_bytes = image_path_or_bytes
        ext = (filename_or_ext or "").lower()
        if not ext.startswith(".") and ext:
            ext = f".{ext}"
        mime_type = ALLOWED_MIME_TYPES.get(ext, "image/jpeg")
    else:
        path = Path(image_path_or_bytes)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path_or_bytes}")
        ext = path.suffix.lower()
        if ext not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported image format '{ext}'. Allowed: {', '.join(ALLOWED_MIME_TYPES.keys())}")
        raw_bytes = path.read_bytes()
        mime_type = ALLOWED_MIME_TYPES[ext]

    b64_str = base64.b64encode(raw_bytes).decode("ascii")
    return f"data:{mime_type};base64,{b64_str}"


def _build_user_text_prompt(
    citizen_report: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
) -> str:
    """Build user prompt text combining report and telemetry context."""
    sections = ["MULTIMODAL DISASTER INTELLIGENCE INTAKE", "=" * 40]

    if citizen_report:
        sections.append(f"\nCITIZEN / FIELD REPORT:\n{citizen_report.strip()}")
    else:
        sections.append("\nCITIZEN / FIELD REPORT: None provided (visual evidence only)")

    if location_name or (latitude is not None and longitude is not None):
        sections.append("\nLOCATION CONTEXT:")
        if location_name:
            sections.append(f"  Name: {location_name}")
        if latitude is not None and longitude is not None:
            sections.append(f"  Coordinates: {latitude}, {longitude}")

    if weather and weather.available:
        sections.append(f"\nWEATHER CONTEXT ({weather.source}):")
        if weather.temperature_c is not None:
            sections.append(f"  Temperature: {weather.temperature_c}°C")
        if weather.precipitation_mm is not None:
            sections.append(f"  Precipitation: {weather.precipitation_mm}mm")
        if weather.wind_speed_kmh is not None:
            sections.append(f"  Wind speed: {weather.wind_speed_kmh} km/h")
        if weather.weather_description:
            sections.append(f"  Conditions: {weather.weather_description}")
        if weather.is_severe:
            sections.append("  ⚠ SEVERE WEATHER ALERT ACTIVE")

    sections.append("\n" + "=" * 40)
    sections.append(
        "Analyze ALL provided evidence together. Do NOT invent facts. "
        "Return the structured JSON situation assessment following the schema."
    )

    return "\n".join(sections)


def parse_and_validate_openrouter_response(raw_text: str) -> OpenRouterDisasterAnalysis:
    """Sanitize and parse JSON response from OpenRouter into validated schema.

    Handles markdown fences and malformed outputs gracefully without inventing demo facts.
    """
    clean_text = raw_text.strip()

    # Strip markdown code fences if model enclosed JSON
    if clean_text.startswith("```"):
        lines = clean_text.splitlines()
        filtered = [l for l in lines if not l.strip().startswith("```")]
        clean_text = "\n".join(filtered).strip()

    try:
        data = json.loads(clean_text)
    except json.JSONDecodeError:
        # Attempt regex search for embedded JSON object
        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError:
                data = None
        else:
            data = None

    if not isinstance(data, dict):
        logger.warning("Failed to parse OpenRouter response as JSON. Degrading gracefully to unparsed model fallback.")
        return OpenRouterDisasterAnalysis(
            disaster_type="unknown",
            observed_conditions=[],
            visible_damage=[],
            affected_area_description="Could not parse AI response into structured schema.",
            possible_people_at_risk="unknown",
            accessibility_issues=[],
            severity_indicators=[],
            supporting_evidence=[],
            unknown_information=["Model output was not valid JSON; raw text preserved: " + clean_text[:200]],
            confidence=0.10,
            recommended_attention_level="LOW",
        )

    # Allow accessibility_or_road_issues key if model returned that alias
    if "accessibility_or_road_issues" in data and "accessibility_issues" not in data:
        data["accessibility_issues"] = data["accessibility_or_road_issues"]

    logger.info("OpenRouter response parsing successfully validated schema.")
    return OpenRouterDisasterAnalysis.model_validate(data)


async def analyze_with_openrouter(
    image_path_or_bytes: Optional[str | bytes] = None,
    filename_or_ext: Optional[str] = None,
    citizen_report: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
    custom_model: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
) -> OpenRouterDisasterAnalysis:
    """Execute multimodal analysis using OpenRouter's vision chat completions API.

    Accepts disaster image and/or citizen report, verifies API credentials, builds
    the multimodal payload, and executes the request with single-retry rate-limit handling.
    """
    if not image_path_or_bytes and not citizen_report:
        raise ValueError("At least an image or a citizen report is required for analysis.")

    api_key = get_api_key()
    primary_model = custom_model or get_model()

    # Build multimodal content parts
    content_parts: list[dict] = []

    user_text = _build_user_text_prompt(
        citizen_report=citizen_report,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        weather=weather,
    )
    content_parts.append({"type": "text", "text": user_text})

    if image_path_or_bytes:
        data_url = _encode_image_to_data_url(image_path_or_bytes, filename_or_ext)
        content_parts.append({
            "type": "image_url",
            "image_url": {
                "url": data_url,
            },
        })

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": content_parts},
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://crisislens.local",
        "X-Title": "CrisisLens Disaster Response",
        "Content-Type": "application/json",
    }

    should_close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=45.0)
        should_close_client = True

    current_model = primary_model
    max_retries = 1
    attempt = 0

    try:
        while True:
            attempt += 1
            logger.info(
                f"Initiating OpenRouter multimodal analysis (attempt {attempt}/{max_retries + 1}): "
                f"selected model={current_model}, image_present={bool(image_path_or_bytes)}, "
                f"report_present={bool(citizen_report)}"
            )

            payload = {
                "model": current_model,
                "messages": messages,
                "temperature": 0.1,
                "max_tokens": 2048,
            }

            try:
                response = await client.post(OPENROUTER_API_URL, json=payload, headers=headers)
                logger.info(f"OpenRouter response HTTP status: {response.status_code} for model: {current_model}")

                # Rate Limit detection (HTTP 429)
                is_rate_limited = (
                    response.status_code == 429
                    or "rate-limited" in response.text.lower()
                    or "rate limit" in response.text.lower()
                )

                if is_rate_limited:
                    error_detail = response.text[:250]
                    logger.warning(
                        f"OpenRouter rate limit hit (HTTP 429) on model '{current_model}': {error_detail}"
                    )

                    if attempt <= max_retries:
                        logger.info("Retrying once after 2.0s delay with OpenRouter free router...")
                        await asyncio.sleep(2.0)
                        # Switch to openrouter/free router to let OpenRouter pick an un-throttled provider
                        current_model = "openrouter/free"
                        continue
                    else:
                        raise OpenRouterRateLimitError(
                            "The AI provider is temporarily rate-limited. Please retry shortly."
                        )

                # Check for 404 or missing endpoint
                if response.status_code == 404 and attempt <= max_retries and current_model != "openrouter/free":
                    logger.warning(f"Model '{current_model}' unavailable (HTTP 404). Falling back to 'openrouter/free'...")
                    current_model = "openrouter/free"
                    await asyncio.sleep(1.0)
                    continue

                if response.status_code != 200:
                    error_detail = response.text[:300]
                    logger.error(f"OpenRouter API returned HTTP {response.status_code}: {error_detail}")
                    raise OpenRouterAPIError(
                        f"OpenRouter API call failed (HTTP {response.status_code}): {error_detail}"
                    )

                resp_json = response.json()
                choices = resp_json.get("choices", [])
                if not choices:
                    raise OpenRouterAPIError("OpenRouter returned empty choices list.")

                message_obj = choices[0].get("message", {})
                content = message_obj.get("content", "")
                if isinstance(content, list):
                    content = " ".join([p.get("text", "") for p in content if isinstance(p, dict)])

                resolved_model = resp_json.get("model", current_model)
                logger.info(f"OpenRouter successfully returned response from model: {resolved_model}")

                return parse_and_validate_openrouter_response(str(content))

            except httpx.RequestError as exc:
                logger.error(f"Network error communicating with OpenRouter: {exc}")
                raise OpenRouterAPIError(f"Failed to connect to OpenRouter service: {exc}") from exc

    finally:
        if should_close_client:
            await client.aclose()


def convert_openrouter_to_ai_result(
    analysis: OpenRouterDisasterAnalysis,
    citizen_report: Optional[str] = None,
) -> AIAnalysisResult:
    """Map OpenRouterDisasterAnalysis into CrisisLens internal AIAnalysisResult.

    Extracts damage, people assessments, and hazard markers so that the existing
    deterministic severity and priority engines can calculate mathematical scores.
    """
    # Damage extraction
    damage_dict = {"buildings": "unknown", "roads": "unknown", "utilities": "unknown", "bridges": "unknown", "vehicles": "unknown"}
    all_damage_text = " ".join(analysis.visible_damage + analysis.observed_conditions).lower()
    all_access_text = " ".join(analysis.accessibility_issues).lower()

    for asset in ["buildings", "roads", "utilities", "bridges", "vehicles"]:
        asset_singular = asset.rstrip("s")
        if asset in all_damage_text or asset_singular in all_damage_text:
            if any(kw in all_damage_text for kw in ["destroy", "collapsed", "flattened"]):
                damage_dict[asset] = "destroyed"
            elif any(kw in all_damage_text for kw in ["severe", "heavy", "extensive", "submerged"]):
                damage_dict[asset] = "severe"
            elif any(kw in all_damage_text for kw in ["moderate", "partial", "waterlogged"]):
                damage_dict[asset] = "moderate"
            elif any(kw in all_damage_text for kw in ["minor", "light"]):
                damage_dict[asset] = "minor"

    # Roads & Bridges accessibility checks
    if any(kw in all_access_text for kw in ["blocked", "impassable", "submerged", "cut off", "underwater"]):
        damage_dict["roads"] = "blocked"
    if "bridge" in all_access_text and any(kw in all_access_text for kw in ["blocked", "collapsed", "submerged"]):
        damage_dict["bridges"] = "blocked"

    # People extraction
    people_text = (analysis.possible_people_at_risk + " " + (citizen_report or "")).lower()
    visible_people = 0
    estimated_affected = 0
    num_matches = re.findall(r"\b(\d+)\s*(?:people|residents|individuals|citizens|families)\b", people_text)
    if num_matches:
        try:
            estimated_affected = max(int(m) for m in num_matches)
        except ValueError:
            estimated_affected = 0

    has_stranded = any(kw in people_text for kw in ["stranded", "trapped", "marooned", "isolated", "rooftop"])
    has_injuries = any(kw in people_text for kw in ["injur", "hurt", "bleeding", "wound"])
    has_casualties = any(kw in people_text for kw in ["dead", "casualt", "fatal", "drown", "corpse"])

    # Hazards list
    hazards = list(analysis.severity_indicators)
    for cond in analysis.observed_conditions:
        if any(h in cond.lower() for h in ["flood", "fire", "smoke", "power", "wire", "gas", "collapse", "debris"]):
            if cond not in hazards:
                hazards.append(cond)

    # Recommendations from attention level and findings
    recommendations: list[str] = []
    if has_stranded:
        recommendations.append("Prioritize watercraft/aerial rescue for stranded individuals")
    if damage_dict.get("roads") == "blocked":
        recommendations.append("Establish alternate emergency transit access routes")
    if analysis.recommended_attention_level in ["CRITICAL", "HIGH"]:
        recommendations.append("Deploy rapid field reconnaissance team immediately")

    summary = (
        analysis.affected_area_description
        or "; ".join(analysis.observed_conditions[:2])
        or "Multimodal disaster assessment completed."
    )

    return AIAnalysisResult(
        disaster_type=analysis.disaster_type,
        summary=summary,
        damage=DamageAssessment(**damage_dict),
        people=PeopleAssessment(
            visible_people=visible_people,
            estimated_affected=estimated_affected,
            possible_stranded_people=has_stranded,
            possible_injuries=has_injuries,
            possible_casualties=has_casualties,
        ),
        hazards=hazards,
        severity=5 if analysis.recommended_attention_level == "CRITICAL" else (4 if analysis.recommended_attention_level == "HIGH" else (3 if analysis.recommended_attention_level == "MEDIUM" else 1)),
        severity_label=analysis.recommended_attention_level,
        confidence=analysis.confidence,
        evidence=analysis.supporting_evidence,
        recommended_actions=recommendations,
        accessibility_issues=analysis.accessibility_issues,
        environmental_risks=[],
        uncertainty_factors=analysis.unknown_information,
    )
