"""Incident API endpoints."""

import os
import uuid
import time
import logging
from typing import Optional
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.config import settings
from app.models.incident import Incident
from app.schemas import (
    IncidentResponse, IncidentListResponse, AnalysisResponse,
    HumanReview, AIAnalysisResult, WeatherContext,
    OpenRouterDisasterAnalysis, CrisisZoneInfo, AnalyzeDisasterResponse,
)
from app.services import (
    ai_service,
    weather_service,
    geospatial_service,
    openrouter_service,
    crisis_zone_service,
)
from app.engines.severity_engine import calculate_severity
from app.engines.priority_engine import calculate_priority
from app.engines.recommendation_engine import generate_recommendations

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/incidents", tags=["incidents"])
analyze_router = APIRouter(prefix="/api", tags=["multimodal-analysis"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def _validate_file(file: UploadFile) -> None:
    """Validate uploaded file type and size."""
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in settings.allowed_ext_list:
            raise HTTPException(400, f"File type .{ext} not allowed. Allowed: {settings.allowed_extensions}")


async def _save_upload(file: UploadFile) -> str:
    """Save uploaded file and return relative URL path."""
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = UPLOAD_DIR / filename

    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(400, f"File too large. Maximum: {settings.max_upload_size_mb}MB")

    with open(filepath, "wb") as f:
        f.write(content)

    return f"/uploads/{filename}"


async def execute_disaster_analysis(
    image: Optional[UploadFile] = None,
    citizen_report: Optional[str] = None,
    report_text: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_name: Optional[str] = None,
    crisis_zone_id: Optional[str] = None,
    db: AsyncSession = None,
) -> AnalyzeDisasterResponse:
    """Core disaster analysis logic combining OpenRouter AI and Crisis Zone evolution."""
    start_time = time.time()
    warnings: list[str] = []

    text_content = citizen_report or report_text
    if not image and not text_content:
        raise HTTPException(
            status_code=400,
            detail="At least a disaster photograph or a citizen report is required for analysis.",
        )

    # 1. Process and save uploaded image if present
    image_url = None
    image_path = None
    if image:
        _validate_file(image)
        image_url = await _save_upload(image)
        image_path = str(UPLOAD_DIR / image_url.split("/")[-1])

    # 2. Reverse geocode if coordinates provided without location name
    if latitude is not None and longitude is not None and not location_name:
        location_name = await geospatial_service.reverse_geocode(latitude, longitude)

    # 3. Weather telemetry context
    weather = None
    if latitude is not None and longitude is not None:
        weather = await weather_service.get_weather(latitude, longitude)
        if not weather.available:
            warnings.append("Weather telemetry unavailable for target coordinates.")
    else:
        weather = WeatherContext(available=False, weather_description="No coordinates provided")
        warnings.append("Weather context unavailable — no coordinates provided.")

    # 4. OpenRouter Multimodal AI Analysis
    try:
        analysis = await openrouter_service.analyze_with_openrouter(
            image_path_or_bytes=image_path,
            citizen_report=text_content,
            location_name=location_name,
            latitude=latitude,
            longitude=longitude,
            weather=weather,
        )
    except openrouter_service.OpenRouterConfigError as e:
        logger.error(f"OpenRouter configuration error: {e}")
        raise HTTPException(
            status_code=503,
            detail="OpenRouter AI service is not configured. Please set OPENROUTER_API_KEY in backend/.env.",
        )
    except openrouter_service.OpenRouterAPIError as e:
        logger.error(f"OpenRouter API error: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter multimodal analysis failed: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected error during OpenRouter analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete multimodal analysis: {str(e)}",
        )

    # 5. Deterministic Severity & Priority Engines (Human decision-support)
    ai_result = openrouter_service.convert_openrouter_to_ai_result(analysis, citizen_report=text_content)
    severity = calculate_severity(ai_result)
    priority = calculate_priority(ai_result, severity, weather)
    recommendations = generate_recommendations(ai_result, severity, priority)

    # 6. Uncertainty evaluation
    uncertainty_flag = analysis.confidence < 0.50
    uncertainty_reason = None
    if uncertainty_flag:
        factors = analysis.unknown_information or ["Low model confidence in disaster telemetry"]
        uncertainty_reason = "Human Review Required: " + "; ".join(factors)

    # 7. Crisis Zone Correlation & Evolution Tracking
    existing_zone = await crisis_zone_service.find_matching_crisis_zone(
        db=db,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        disaster_type=analysis.disaster_type,
        crisis_zone_id=crisis_zone_id,
    )

    is_update = False
    if existing_zone:
        is_update = True
        incident, evolution_step = crisis_zone_service.record_crisis_zone_evolution(
            incident=existing_zone,
            analysis=analysis,
            severity=severity,
            priority=priority,
            new_image_url=image_url,
            new_report_text=text_content,
        )
        incident.recommendations = [r for r in recommendations]
        if uncertainty_flag:
            incident.uncertainty_flag = True
            incident.uncertainty_reason = uncertainty_reason
    else:
        incident = Incident(
            source="citizen_multimodal_intake",
            image_url=image_url,
            report_text=text_content,
            latitude=latitude,
            longitude=longitude,
            location_name=location_name,
            disaster_type=analysis.disaster_type,
            severity_score=severity.normalized_score,
            severity_label=severity.label,
            priority_score=priority.normalized_score,
            priority_label=priority.label,
            confidence_score=analysis.confidence,
            uncertainty_flag=uncertainty_flag,
            uncertainty_reason=uncertainty_reason,
            affected_people_estimate=max(ai_result.people.visible_people, ai_result.people.estimated_affected),
            infrastructure_damage=ai_result.damage.model_dump(),
            hazards=analysis.severity_indicators or analysis.observed_conditions,
            evidence=analysis.supporting_evidence,
            recommendations=[r for r in recommendations],
            weather_context=weather.model_dump() if weather else None,
            ai_assessment=analysis.model_dump(),
            openrouter_analysis=analysis.model_dump(),
            severity_breakdown=severity.model_dump(),
            priority_breakdown=priority.model_dump(),
            review_status="pending",
        )
        crisis_zone_service.initialize_new_crisis_zone(
            incident=incident,
            analysis=analysis,
            severity=severity,
            priority=priority,
            report_text=text_content,
        )
        db.add(incident)

    await db.flush()
    await db.refresh(incident)

    elapsed = (time.time() - start_time) * 1000

    crisis_zone_info = CrisisZoneInfo(
        zone_id=incident.crisis_zone_id,
        zone_name=incident.crisis_zone_name,
        is_update=is_update,
        evolution_history=incident.evolution_history or [],
        priority_change_reason=incident.priority_change_reason,
    )

    return AnalyzeDisasterResponse(
        analysis=analysis,
        crisis_zone=crisis_zone_info,
        incident=IncidentResponse.model_validate(incident),
        analysis_time_ms=round(elapsed, 1),
        warnings=warnings,
    )


@analyze_router.post("/analyze-disaster", response_model=AnalyzeDisasterResponse)
@router.post("/analyze-disaster", response_model=AnalyzeDisasterResponse)
async def analyze_disaster(
    image: Optional[UploadFile] = File(None),
    citizen_report: Optional[str] = Form(None),
    report_text: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    crisis_zone_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a disaster report with OpenRouter Multimodal AI and update/create a Crisis Zone."""
    return await execute_disaster_analysis(
        image=image,
        citizen_report=citizen_report,
        report_text=report_text,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        crisis_zone_id=crisis_zone_id,
        db=db,
    )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_incident(
    image: Optional[UploadFile] = File(None),
    report_text: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a disaster incident with multimodal AI.

    Accepts image + report + location, retrieves weather context,
    runs Gemini analysis, then deterministic severity/priority engines.
    """
    start_time = time.time()
    warnings = []

    if not image and not report_text:
        raise HTTPException(400, "At least an image or report text is required")

    # 1. Save image
    image_url = None
    image_path = None
    if image:
        _validate_file(image)
        image_url = await _save_upload(image)
        image_path = str(UPLOAD_DIR / image_url.split("/")[-1])

    # 2. Reverse geocode if needed
    if latitude and longitude and not location_name:
        location_name = await geospatial_service.reverse_geocode(latitude, longitude)

    # 3. Get weather context
    weather = None
    if latitude and longitude:
        weather = await weather_service.get_weather(latitude, longitude)
        if not weather.available:
            warnings.append("Weather context unavailable")
    else:
        weather = WeatherContext(available=False, weather_description="No coordinates provided")
        warnings.append("Weather context unavailable — no coordinates provided")

    # 4. AI Analysis
    ai_result, ai_error = await ai_service.analyze_disaster_safe(
        image_path=image_path,
        report_text=report_text,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        weather=weather,
    )

    if ai_error:
        warnings.append(ai_error)
        text_lower = (report_text or "").lower()

        # Heuristic inference from citizen report when external AI is rate-limited
        inferred_type = "general_emergency"
        for candidate in ["flood", "earthquake", "fire", "landslide", "cyclone", "building_collapse", "storm"]:
            if candidate in text_lower or (candidate == "flood" and any(k in text_lower for k in ["water", "inundat", "submerg"])):
                inferred_type = candidate
                break

        has_stranded = any(w in text_lower for w in ["stranded", "trapped", "marooned", "rooftop", "pillar"])
        has_blocked = any(w in text_lower for w in ["blocked", "impassable", "collapsed", "cut off"])

        summary = f"Field intake: {inferred_type.replace('_', ' ').title()} reported. AI reasoning queued; human review active."

        ai_result = AIAnalysisResult(
            disaster_type=inferred_type,
            summary=summary,
            severity=4 if has_stranded else 3,
            severity_label="HIGH" if has_stranded else "MEDIUM",
            confidence=0.35,
            evidence=[report_text[:120]] if report_text else [],
            hazards=["access_disruption"] if has_blocked else [],
            uncertainty_factors=[ai_error or "AI analysis was unavailable"],
        )

    # 5. Deterministic Severity Engine
    severity = calculate_severity(ai_result)

    # 6. Deterministic Priority Engine
    priority = calculate_priority(ai_result, severity, weather)

    # 7. Recommendation Engine
    recommendations = generate_recommendations(ai_result, severity, priority)

    # 8. Uncertainty assessment
    uncertainty_flag = ai_result.confidence < 0.50
    uncertainty_reason = None
    if uncertainty_flag:
        reasons = ai_result.uncertainty_factors or ["Low confidence in AI assessment"]
        uncertainty_reason = "Human Review Required: " + "; ".join(reasons)

    # 9. Create incident
    incident = Incident(
        source="user_submission",
        image_url=image_url,
        report_text=report_text,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        disaster_type=ai_result.disaster_type,
        severity_score=severity.normalized_score,
        severity_label=severity.label,
        priority_score=priority.normalized_score,
        priority_label=priority.label,
        confidence_score=ai_result.confidence,
        uncertainty_flag=uncertainty_flag,
        uncertainty_reason=uncertainty_reason,
        affected_people_estimate=max(ai_result.people.visible_people, ai_result.people.estimated_affected),
        infrastructure_damage=ai_result.damage.model_dump(),
        hazards=ai_result.hazards,
        evidence=ai_result.evidence,
        recommendations=[r for r in recommendations],
        weather_context=weather.model_dump() if weather else None,
        ai_assessment=ai_result.model_dump(),
        severity_breakdown=severity.model_dump(),
        priority_breakdown=priority.model_dump(),
        review_status="pending",
    )

    db.add(incident)
    await db.flush()
    await db.refresh(incident)

    elapsed = (time.time() - start_time) * 1000

    return AnalysisResponse(
        incident=IncidentResponse.model_validate(incident),
        analysis_time_ms=round(elapsed, 1),
        warnings=warnings,
    )


@router.get("", response_model=IncidentListResponse)
async def list_incidents(
    skip: int = 0,
    limit: int = 50,
    severity: Optional[str] = None,
    review_status: Optional[str] = None,
    is_demo: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """List incidents, optionally filtered."""
    query = select(Incident).order_by(desc(Incident.priority_score), desc(Incident.created_at))

    if severity:
        query = query.where(Incident.severity_label == severity.upper())
    if review_status:
        query = query.where(Incident.review_status == review_status)
    if is_demo is not None:
        query = query.where(Incident.is_demo == is_demo)

    # Count
    from sqlalchemy import func
    count_query = select(func.count()).select_from(Incident)
    if severity:
        count_query = count_query.where(Incident.severity_label == severity.upper())
    if review_status:
        count_query = count_query.where(Incident.review_status == review_status)
    if is_demo is not None:
        count_query = count_query.where(Incident.is_demo == is_demo)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query.offset(skip).limit(limit))
    incidents = result.scalars().all()

    return IncidentListResponse(
        incidents=[IncidentResponse.model_validate(inc) for inc in incidents],
        total=total,
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int, db: AsyncSession = Depends(get_db)):
    """Get incident details by ID."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(404, "Incident not found")
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}/review", response_model=IncidentResponse)
async def review_incident(
    incident_id: int,
    review: HumanReview,
    db: AsyncSession = Depends(get_db),
):
    """Human reviewer updates/overrides an incident assessment."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(404, "Incident not found")

    # Store human assessment
    human_data = review.model_dump(exclude_none=True)

    # Apply overrides
    if review.severity_label:
        incident.severity_label = review.severity_label.upper()
    if review.severity_score is not None:
        incident.severity_score = review.severity_score
    if review.priority_label:
        incident.priority_label = review.priority_label.upper()
    if review.priority_score is not None:
        incident.priority_score = review.priority_score
    if review.disaster_type:
        incident.disaster_type = review.disaster_type
    if review.recommendations:
        incident.recommendations = [{"action": r, "reason": "Human override", "priority": "HIGH", "category": "override"} for r in review.recommendations]

    incident.human_assessment = human_data
    incident.human_override = True
    incident.review_status = review.review_status
    incident.reviewer_notes = review.reviewer_notes
    incident.reviewed_by = review.reviewed_by
    incident.reviewed_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(incident)

    return IncidentResponse.model_validate(incident)
