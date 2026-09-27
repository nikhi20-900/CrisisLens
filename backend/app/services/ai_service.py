"""Google Gemini Multimodal AI Service for Disaster Assessment.

Delegates multimodal evidence analysis to gemini_service and returns
validated AIAnalysisResult structures for deterministic engine execution.
"""

import logging
from typing import Optional

from app.schemas import AIAnalysisResult, WeatherContext
from app.services import gemini_service

logger = logging.getLogger(__name__)


async def analyze_disaster(
    image_path: Optional[str],
    report_text: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
    additional_context: Optional[str] = None,
) -> AIAnalysisResult:
    """Perform multimodal disaster analysis using Google's official Gemini API.

    Sends image + citizen report + context and returns a validated AIAnalysisResult.
    """
    combined_report = (report_text or "").strip()
    if additional_context:
        combined_report = f"{combined_report}\n\nAdditional Context:\n{additional_context}".strip()

    analysis = await gemini_service.analyze_with_gemini(
        image_path_or_bytes=image_path,
        citizen_report=combined_report,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        weather=weather,
    )

    return gemini_service.convert_gemini_to_ai_result(
        analysis, citizen_report=combined_report
    )


async def analyze_disaster_safe(
    image_path: Optional[str],
    report_text: Optional[str] = None,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    weather: Optional[WeatherContext] = None,
    additional_context: Optional[str] = None,
) -> tuple[Optional[AIAnalysisResult], Optional[str]]:
    """Safe wrapper returning (result, error_message) without raising exceptions."""
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
        logger.error(f"Gemini AI analysis failed safely: {e}")
        return None, "AI analysis unavailable. Manual assessment required."
