"""Google Gemini Multimodal AI Service for Disaster Assessment.

Communicates with Google's official Gemini API using the official Google Gen AI Python SDK (google-genai).
Fuses disaster photographs and citizen text reports into structured, evidence-grounded intelligence
with strict non-hallucination enforcement, structured output validation, and comprehensive error handling.
"""

import os
import re
import json
import asyncio
import logging
from typing import Optional
from pathlib import Path

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from app.config import settings
from app.schemas import (
    GeminiDisasterAnalysis,
    AIAnalysisResult,
    DamageAssessment,
    PeopleAssessment,
    WeatherContext,
)

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODEL = "gemini-3.6-flash"

ALLOWED_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


# ─── Custom Domain Exceptions ────────────────────────────────────────

class GeminiConfigError(ValueError):
    """Raised when GEMINI_API_KEY or required configuration is missing."""
    pass


class GeminiAPIError(RuntimeError):
    """Base exception for Gemini API runtime failures."""
    pass


class GeminiAuthError(GeminiAPIError):
    """Raised when GEMINI_API_KEY is invalid, unauthorized, or revoked."""
    pass


class GeminiModelNotFoundError(GeminiAPIError):
    """Raised when the specified GEMINI_MODEL is not available or does not exist."""
    pass


class GeminiRateLimitError(GeminiAPIError):
    """Raised when Gemini returns HTTP 429 / RESOURCE_EXHAUSTED."""
    pass


class GeminiTimeoutError(GeminiAPIError):
    """Raised when Gemini API request exceeds configured timeout threshold."""
    pass


class GeminiImageError(ValueError):
    """Raised when the provided image is missing, corrupt, or has an unsupported format."""
    pass


class GeminiResponseError(GeminiAPIError):
    """Raised when Gemini returns an empty, malformed, or unparseable response."""
    pass


# ─── Key & Model Resolution ──────────────────────────────────────────

def get_api_key() -> str:
    """Retrieve the Gemini API key from configuration or environment.

    Never logs, prints, or exposes the key.
    """
    key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    key = key.strip()
    if not key:
        raise GeminiConfigError(
            "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in backend/.env"
        )
    return key


def get_model() -> str:
    """Retrieve the configured Gemini model name."""
    model = settings.gemini_model or os.getenv("GEMINI_MODEL", "")
    return model.strip() if model.strip() else DEFAULT_GEMINI_MODEL


def _get_client(api_key: Optional[str] = None) -> genai.Client:
    """Instantiate a Google GenAI Client with the verified API key."""
    resolved_key = api_key or get_api_key()
    return genai.Client(api_key=resolved_key)


# ─── System Prompt ───────────────────────────────────────────────────

SYSTEM_PROMPT = """You are CrisisLens AI, an emergency disaster intelligence decision-support system.
Your mission is to perform strict, evidence-based multimodal disaster analysis from incoming imagery and citizen reports.

You will evaluate disaster evidence to assist first responders and incident commanders.
You are a decision support tool, NOT the final emergency authority.

CRITICAL EVIDENCE-BASED REASONING RULES:
1. MULTIMODAL SYNTHESIS: You must analyze BOTH the disaster photograph AND the citizen report together.
2. DISTINGUISH EVIDENCE CATEGORIES:
   - OBSERVED: What can actually and directly be seen in the photograph.
   - REPORTED: What the citizen narrative states.
   - INFERRED: Reasonable situational assessment derived directly from the supplied evidence.
   - UNKNOWN: Missing information that CANNOT be established from the supplied evidence.
3. NEVER INVENT FACTS:
   - Do NOT invent or guess the number of victims or casualties.
   - Do NOT invent an exact number of affected people if not stated or visible.
   - Do NOT invent an exact flood water depth (e.g. do not guess '3.4 meters' unless visible against a marked scale).
   - Do NOT invent infrastructure damage that cannot be observed.
   - Do NOT fabricate evacuation routes that were not verified.
4. EXPLICIT UNKNOWNS: Anything that requires on-the-ground field confirmation MUST be listed in "unknown_information".
5. CONFIDENCE RATING: Assign a realistic confidence score (0.0 to 1.0) based on visual clarity, evidence consistency, and ambiguity. Do NOT artificially inflate confidence.
6. RECOMMENDED ATTENTION LEVEL: Assign one of "LOW", "MEDIUM", "HIGH", "CRITICAL" based on immediate life safety threats and infrastructure disruption.

You must return structured data adhering to the specified schema:
- disaster_type: detected disaster category (e.g., flood, wildfire, earthquake, cyclone, storm, building_collapse, landslide, or unknown)
- observed_conditions: list of physical phenomena directly observable in the image
- visible_damage: list of structural or infrastructure damage visible in the image
- affected_area_description: concise physical description of the affected area
- possible_people_at_risk: concise assessment of individuals potentially exposed or at risk
- accessibility_issues: list of road blockages, bridge failures, or transit access issues
- severity_indicators: list of physical markers indicating hazard severity
- supporting_evidence: specific observations directly supporting the assessment
- unknown_information: critical unknowns that require field inspection or human confirmation
- confidence: float between 0.0 and 1.0
- recommended_attention_level: one of "LOW", "MEDIUM", "HIGH", "CRITICAL"
"""


# ─── Helper Functions ────────────────────────────────────────────────

def _prepare_image_part(
    image_path_or_bytes: str | bytes,
    filename_or_ext: Optional[str] = None,
) -> types.Part:
    """Validate image format and build a google.genai types.Part object."""
    if isinstance(image_path_or_bytes, bytes):
        raw_bytes = image_path_or_bytes
        ext = (filename_or_ext or "").lower()
        if not ext.startswith(".") and ext:
            ext = f".{ext}"
        if ext and ext not in ALLOWED_MIME_TYPES:
            raise GeminiImageError(
                f"Unsupported image format '{ext}'. Allowed formats: {', '.join(ALLOWED_MIME_TYPES.keys())}"
            )
        # Default to image/jpeg if extension not determinable from bytes
        mime_type = ALLOWED_MIME_TYPES.get(ext, "image/jpeg")
    else:
        path = Path(image_path_or_bytes)
        if not path.exists():
            raise GeminiImageError(f"Disaster image file not found at: {image_path_or_bytes}")
        ext = path.suffix.lower()
        if ext not in ALLOWED_MIME_TYPES:
            raise GeminiImageError(
                f"Unsupported image format '{ext}'. Allowed formats: {', '.join(ALLOWED_MIME_TYPES.keys())}"
            )
        raw_bytes = path.read_bytes()
        mime_type = ALLOWED_MIME_TYPES[ext]

    if not raw_bytes or len(raw_bytes) < 100:
        raise GeminiImageError("Uploaded image file is empty or corrupted.")

    return types.Part.from_bytes(data=raw_bytes, mime_type=mime_type)


def _build_user_prompt(
    citizen_report: str,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
) -> str:
    """Build the text prompt section accompanying the disaster photograph."""
    sections = [
        "CRISISLENS MULTIMODAL DISASTER EVIDENCE INTAKE",
        "=" * 48,
        f"\nCITIZEN / FIELD REPORT:\n{citizen_report.strip()}",
    ]

    if location_name or (latitude is not None and longitude is not None):
        sections.append("\nLOCATION CONTEXT:")
        if location_name:
            sections.append(f"  Area Name: {location_name}")
        if latitude is not None and longitude is not None:
            sections.append(f"  Coordinates: {latitude}, {longitude}")

    if weather and weather.available:
        sections.append(f"\nWEATHER TELEMETRY (source: {weather.source}):")
        if weather.temperature_c is not None:
            sections.append(f"  Temperature: {weather.temperature_c}°C")
        if weather.precipitation_mm is not None:
            sections.append(f"  Precipitation: {weather.precipitation_mm}mm")
        if weather.wind_speed_kmh is not None:
            sections.append(f"  Wind Speed: {weather.wind_speed_kmh} km/h")
        if weather.weather_description:
            sections.append(f"  Conditions: {weather.weather_description}")
        if weather.is_severe:
            sections.append("  ⚠ SEVERE WEATHER WARNING ACTIVE")

    sections.append("\n" + "=" * 48)
    sections.append(
        "Analyze BOTH the uploaded photograph AND citizen report together. "
        "Distinguish OBSERVED physical features in the image from REPORTED citizen statements. "
        "Do NOT invent unobserved numbers, depths, or routes. "
        "Provide explicit unknowns and recommended attention level."
    )

    return "\n".join(sections)


def parse_and_validate_gemini_response(raw_text: str) -> GeminiDisasterAnalysis:
    """Sanitize and parse JSON response from Gemini into GeminiDisasterAnalysis.

    Handles code fences and raw string sanitation without fabricating facts.
    """
    clean_text = raw_text.strip()

    # Strip markdown code fences if present
    if clean_text.startswith("```"):
        lines = clean_text.splitlines()
        filtered = [l for l in lines if not l.strip().startswith("```")]
        clean_text = "\n".join(filtered).strip()

    try:
        data = json.loads(clean_text)
    except json.JSONDecodeError:
        # Regex search for embedded JSON structure
        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError as err:
                logger.error(f"Failed regex JSON fallback parsing: {err}")
                data = None
        else:
            data = None

    if not isinstance(data, dict):
        logger.error(f"Gemini output could not be parsed as a JSON object: {clean_text[:300]}")
        raise GeminiResponseError("Gemini response did not contain a valid JSON object.")

    # Validate against schema
    try:
        return GeminiDisasterAnalysis.model_validate(data)
    except Exception as exc:
        logger.error(f"Gemini response failed Pydantic schema validation: {exc}")
        raise GeminiResponseError(f"Gemini response failed schema validation: {exc}") from exc


# ─── Core Multimodal Analysis Execution ──────────────────────────────

async def analyze_with_gemini(
    image_path_or_bytes: str | bytes,
    citizen_report: str,
    filename_or_ext: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
    custom_model: Optional[str] = None,
    timeout_seconds: float = 45.0,
) -> GeminiDisasterAnalysis:
    """Execute multimodal analysis using Google's official Gemini API.

    CRITICAL RULES ENFORCED:
    1. BOTH disaster image AND citizen report text must be provided.
    2. Uses official google-genai Client and types.GenerateContentConfig.
    3. Prefers response_schema structured output for guaranteed schema compliance.
    4. Handles authentication errors, rate limits (HTTP 429), timeouts, model availability,
       and malformed responses with controlled domain exceptions.
    5. Never logs or leaks the API key or raw image bytes.
    """
    # 1. Enforce Multimodal requirement (Both image AND report required)
    if not image_path_or_bytes:
        raise GeminiImageError(
            "Both a disaster photograph and citizen report text are required for multimodal analysis."
        )
    if not citizen_report or not citizen_report.strip():
        raise ValueError(
            "Both a disaster photograph and citizen report text are required for multimodal analysis."
        )

    # 2. Resolve credentials and model
    api_key = get_api_key()
    selected_model = custom_model or get_model()
    client = _get_client(api_key=api_key)

    # 3. Prepare multimodal input parts
    image_part = _prepare_image_part(image_path_or_bytes, filename_or_ext)
    prompt_text = _build_user_prompt(
        citizen_report=citizen_report,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        weather=weather,
    )
    text_part = types.Part.from_text(text=prompt_text)

    # Gemini receives BOTH image part and text part in the same request
    contents = [image_part, text_part]

    logger.info(
        f"Initiating Google Gemini multimodal analysis with model='{selected_model}', "
        f"image_present=True, citizen_report_len={len(citizen_report.strip())}"
    )

    # 4. Multimodal Generation with retry for transient 503 / 429 errors
    models_to_try = [selected_model]
    # If primary model is 3.6-flash and experiences a Google server 503 demand spike, try 2.5-flash as resilient backup
    if selected_model == "gemini-3.6-flash":
        models_to_try.append("gemini-2.5-flash")

    last_error: Optional[Exception] = None

    for current_model in models_to_try:
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                config = types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=GeminiDisasterAnalysis,
                )

                async def _call_gemini(m=current_model, cfg=config):
                    return await client.aio.models.generate_content(
                        model=m,
                        contents=contents,
                        config=cfg,
                    )

                response = await asyncio.wait_for(_call_gemini(), timeout=timeout_seconds)

                if not response or not response.text:
                    raise GeminiResponseError("Gemini API returned an empty content response.")

                logger.info(
                    f"Gemini structured response successfully received from model '{current_model}' "
                    f"({len(response.text)} chars)."
                )
                return parse_and_validate_gemini_response(response.text)

            except asyncio.TimeoutError as exc:
                logger.error(f"Gemini API request timed out after {timeout_seconds}s on attempt {attempt + 1}.")
                last_error = GeminiTimeoutError(f"Gemini API timed out after {timeout_seconds} seconds.")
                if attempt < max_retries:
                    await asyncio.sleep(1.0)
                    continue
                break

            except genai_errors.APIError as exc:
                code = getattr(exc, "code", None)
                message = str(exc)
                logger.warning(
                    f"Gemini API error (HTTP {code}) on model '{current_model}' "
                    f"(attempt {attempt + 1}/{max_retries + 1}): {message[:200]}"
                )

                if code in (401, 403) or (code == 400 and ("api key" in message.lower() or "invalid_argument" in message.lower())):
                    raise GeminiAuthError(f"Gemini authentication failed: {message}") from exc
                if code == 404:
                    last_error = GeminiModelNotFoundError(f"Gemini model '{current_model}' not found: {message}")
                    break  # Try next model if available

                if code in (429, 503) or "resource_exhausted" in message.lower() or "temporar" in message.lower() or "demand" in message.lower():
                    if code == 429 or "resource_exhausted" in message.lower():
                        last_error = GeminiRateLimitError("Gemini API rate limit exceeded. Please retry shortly.")
                    else:
                        last_error = GeminiAPIError(f"Gemini service temporarily unavailable (503): {message}")
                    if attempt < max_retries:
                        await asyncio.sleep(1.5 * (attempt + 1))
                        continue
                    break

                last_error = GeminiAPIError(f"Gemini API error (code {code}): {message}")
                break

            except (GeminiConfigError, GeminiImageError, GeminiAuthError):
                raise

            except Exception as exc:
                logger.warning(f"Structured schema call raised: {exc}. Attempting explicit JSON fallback request...")
                try:
                    fallback_config = types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT + "\n\nCRITICAL: You MUST respond ONLY with a raw, valid JSON object.",
                        temperature=0.1,
                        response_mime_type="application/json",
                    )
                    fallback_resp = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=current_model,
                            contents=contents,
                            config=fallback_config,
                        ),
                        timeout=timeout_seconds,
                    )
                    if fallback_resp and fallback_resp.text:
                        return parse_and_validate_gemini_response(fallback_resp.text)
                except Exception as fallback_exc:
                    last_error = GeminiAPIError(f"Gemini multimodal analysis failed: {fallback_exc}")
                break

    if last_error:
        raise last_error

    raise GeminiAPIError("Gemini analysis failed to produce a valid assessment.")


# ─── Translation to CrisisLens Internal AIAnalysisResult ─────────────

def convert_gemini_to_ai_result(
    analysis: GeminiDisasterAnalysis,
    citizen_report: Optional[str] = None,
) -> AIAnalysisResult:
    """Map GeminiDisasterAnalysis into internal AIAnalysisResult for deterministic engines.

    Extracts damage levels, people estimates, and hazard markers so that the existing
    mathematical severity, priority, and recommendation engines calculate objective scores.
    """
    damage_dict = {
        "buildings": "unknown",
        "roads": "unknown",
        "utilities": "unknown",
        "bridges": "unknown",
        "vehicles": "unknown",
    }
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

    # Road & bridge accessibility
    if any(kw in all_access_text for kw in ["blocked", "impassable", "submerged", "cut off", "underwater", "flooded"]):
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

    has_stranded = any(kw in people_text for kw in ["stranded", "trapped", "marooned", "isolated", "rooftop", "roof"])
    has_injuries = any(kw in people_text for kw in ["injur", "hurt", "bleeding", "wound"])
    has_casualties = any(kw in people_text for kw in ["dead", "casualt", "fatal", "drown", "corpse"])

    # Hazards list
    hazards = list(analysis.severity_indicators)
    for cond in analysis.observed_conditions:
        if any(h in cond.lower() for h in ["flood", "fire", "smoke", "power", "wire", "gas", "collapse", "debris"]):
            if cond not in hazards:
                hazards.append(cond)

    # Response recommendations
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

    severity_num = 5 if analysis.recommended_attention_level == "CRITICAL" else (
        4 if analysis.recommended_attention_level == "HIGH" else (
            3 if analysis.recommended_attention_level == "MEDIUM" else 1
        )
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
        severity=severity_num,
        severity_label=analysis.recommended_attention_level,
        confidence=analysis.confidence,
        evidence=analysis.supporting_evidence,
        recommended_actions=recommendations,
        accessibility_issues=analysis.accessibility_issues,
        environmental_risks=[],
        uncertainty_factors=analysis.unknown_information,
    )
