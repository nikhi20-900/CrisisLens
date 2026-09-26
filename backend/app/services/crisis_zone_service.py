"""Crisis Zone Ingestion & Evolution Service.

Manages Living Crisis Map zones. Prevents duplicate incident records
by correlating incoming multimodal evidence with existing nearby crisis zones,
recording priority evolution over time with full explainability.
"""

import math
import uuid
import logging
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.incident import Incident
from app.schemas import (
    OpenRouterDisasterAnalysis,
    SeverityBreakdown,
    PriorityBreakdown,
    WeatherContext,
)

logger = logging.getLogger(__name__)

# Default radius in kilometers to correlate reports into the same Crisis Zone
MAX_CRISIS_ZONE_RADIUS_KM = 2.0


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two geographic coordinates in kilometers."""
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return radius_km * c


async def find_matching_crisis_zone(
    db: AsyncSession,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_name: Optional[str] = None,
    disaster_type: Optional[str] = None,
    crisis_zone_id: Optional[str] = None,
    max_radius_km: float = MAX_CRISIS_ZONE_RADIUS_KM,
) -> Optional[Incident]:
    """Find an existing Incident / Crisis Zone that matches the location or zone ID.

    Returns the matching Incident if found, or None if a new zone should be created.
    """
    # 1. Direct match by zone ID
    if crisis_zone_id:
        result = await db.execute(
            select(Incident).where(Incident.crisis_zone_id == crisis_zone_id).order_by(desc(Incident.id))
        )
        zone = result.scalars().first()
        if zone:
            logger.info(f"Matched Crisis Zone by ID: {crisis_zone_id}")
            return zone

    # 2. Geospatial proximity match
    if latitude is not None and longitude is not None:
        query = select(Incident).where(
            Incident.latitude.isnot(None),
            Incident.longitude.isnot(None),
        ).order_by(desc(Incident.id))
        result = await db.execute(query)
        candidates = result.scalars().all()

        closest_zone = None
        closest_distance = max_radius_km

        for cand in candidates:
            if cand.latitude is None or cand.longitude is None:
                continue
            dist = haversine_distance_km(latitude, longitude, cand.latitude, cand.longitude)
            if dist <= closest_distance:
                # Type compatibility: same type, or one is 'unknown'
                cand_type = (cand.disaster_type or "").lower().strip()
                incoming_type = (disaster_type or "").lower().strip()
                type_match = (
                    not cand_type
                    or not incoming_type
                    or cand_type == incoming_type
                    or cand_type == "unknown"
                    or incoming_type == "unknown"
                )
                if type_match:
                    closest_distance = dist
                    closest_zone = cand

        if closest_zone:
            logger.info(
                f"Matched existing Crisis Zone '{closest_zone.crisis_zone_id or closest_zone.id}' "
                f"at {closest_distance:.2f} km distance (threshold: {max_radius_km} km)."
            )
            return closest_zone

    # 3. Location name match fallback (ONLY when coordinates are not provided)
    if (latitude is None or longitude is None) and location_name and location_name.strip():
        norm_name = location_name.lower().strip()
        stop_words = {
            "test", "zone", "area", "sector", "road", "street", "city",
            "north", "south", "east", "west", "district", "near", "front", "main",
        }
        words = [w for w in norm_name.split() if len(w) > 3 and w not in stop_words]
        if words:
            query = select(Incident).where(Incident.location_name.isnot(None)).order_by(desc(Incident.id)).limit(30)
            result = await db.execute(query)
            for cand in result.scalars().all():
                cand_name = (cand.location_name or "").lower()
                if any(w in cand_name for w in words):
                    logger.info(f"Matched Crisis Zone by location name similarity: '{cand_name}'")
                    return cand

    return None


def record_crisis_zone_evolution(
    incident: Incident,
    analysis: OpenRouterDisasterAnalysis,
    severity: SeverityBreakdown,
    priority: PriorityBreakdown,
    new_image_url: Optional[str] = None,
    new_report_text: Optional[str] = None,
) -> tuple[Incident, dict]:
    """Update an existing Crisis Zone with new multimodal evidence.

    Records the evolution event in evolution_history and explains why
    the priority score and attention level changed over time.
    """
    old_score = float(incident.priority_score or 0.0)
    old_label = str(incident.priority_label or "LOW")
    new_score = float(priority.normalized_score)
    new_label = str(priority.label)
    delta = round(new_score - old_score, 1)

    # Formulate explainable change reason
    key_conditions = analysis.observed_conditions[:2] or analysis.visible_damage[:2] or []
    conditions_str = "; ".join(key_conditions) if key_conditions else "new field telemetry"

    if delta > 3.0:
        change_reason = (
            f"Priority escalated by +{delta:.0f} pts ({old_label} {old_score:.0f} → {new_label} {new_score:.0f}): "
            f"Escalation driven by: {conditions_str}."
        )
    elif delta < -3.0:
        change_reason = (
            f"Priority adjusted by {delta:.0f} pts ({old_label} {old_score:.0f} → {new_label} {new_score:.0f}): "
            f"Telemetry indicates stabilization: {conditions_str}."
        )
    else:
        change_reason = (
            f"Priority sustained at {new_label} ({new_score:.0f}/100): "
            f"Ongoing physical conditions confirmed: {conditions_str}."
        )

    # Primary observation title for timeline
    observation = (
        analysis.observed_conditions[0]
        if analysis.observed_conditions
        else (new_report_text[:100] if new_report_text else f"Follow-up {analysis.disaster_type} evidence")
    )

    evolution_step = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "observation": observation,
        "disaster_type": analysis.disaster_type,
        "visible_damage": analysis.visible_damage,
        "possible_people_at_risk": analysis.possible_people_at_risk,
        "accessibility_issues": analysis.accessibility_issues,
        "priority_score": new_score,
        "priority_label": new_label,
        "severity_score": severity.normalized_score,
        "severity_label": severity.label,
        "change_reason": change_reason,
        "confidence": analysis.confidence,
    }

    # Append to evolution history
    history = list(incident.evolution_history or [])
    history.append(evolution_step)
    incident.evolution_history = history
    incident.priority_change_reason = change_reason

    # Merge evidence statements (preserving order and uniqueness)
    existing_evidence = list(incident.evidence or [])
    for ev in analysis.supporting_evidence:
        if ev not in existing_evidence:
            existing_evidence.append(ev)
    incident.evidence = existing_evidence

    # Merge hazards
    existing_hazards = list(incident.hazards or [])
    for hz in (analysis.severity_indicators or analysis.observed_conditions):
        if hz not in existing_hazards:
            existing_hazards.append(hz)
    incident.hazards = existing_hazards

    # Update latest assessments
    incident.severity_score = severity.normalized_score
    incident.severity_label = severity.label
    incident.priority_score = new_score
    incident.priority_label = new_label
    incident.confidence_score = analysis.confidence
    incident.severity_breakdown = severity.model_dump()
    incident.priority_breakdown = priority.model_dump()
    incident.openrouter_analysis = analysis.model_dump()

    # Update disaster type if previously unknown
    if (not incident.disaster_type or incident.disaster_type == "unknown") and analysis.disaster_type != "unknown":
        incident.disaster_type = analysis.disaster_type

    # Update image if new one provided
    if new_image_url:
        incident.image_url = new_image_url

    # Append report text
    if new_report_text:
        timestamp_str = datetime.now(timezone.utc).strftime("%H:%M UTC")
        if incident.report_text:
            incident.report_text = f"{incident.report_text}\n---\n[{timestamp_str} Update]: {new_report_text.strip()}"
        else:
            incident.report_text = new_report_text.strip()

    # Ensure zone_id and zone_name are assigned if previously null
    if not incident.crisis_zone_id:
        date_code = datetime.now(timezone.utc).strftime("%Y%m%d")
        incident.crisis_zone_id = f"ZONE-{date_code}-{uuid.uuid4().hex[:6].upper()}"
    if not incident.crisis_zone_name:
        loc = incident.location_name or "Area"
        incident.crisis_zone_name = f"{loc} {incident.disaster_type.title()} Crisis Zone"

    incident.updated_at = datetime.now(timezone.utc)
    return incident, evolution_step


def initialize_new_crisis_zone(
    incident: Incident,
    analysis: OpenRouterDisasterAnalysis,
    severity: SeverityBreakdown,
    priority: PriorityBreakdown,
    report_text: Optional[str] = None,
) -> Incident:
    """Initialize a brand-new Crisis Zone entity with initial evolution baseline."""
    # Generate clean human-readable Crisis Zone identifier
    zone_code = uuid.uuid4().hex[:6].upper()
    date_code = datetime.now(timezone.utc).strftime("%Y%m%d")
    zone_id = f"ZONE-{date_code}-{zone_code}"

    location_prefix = incident.location_name or "Area"
    zone_name = f"{location_prefix} {analysis.disaster_type.title()} Crisis Zone"

    observation = (
        analysis.observed_conditions[0]
        if analysis.observed_conditions
        else (report_text[:100] if report_text else f"Initial {analysis.disaster_type} report")
    )

    initial_step = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "observation": observation,
        "disaster_type": analysis.disaster_type,
        "visible_damage": analysis.visible_damage,
        "possible_people_at_risk": analysis.possible_people_at_risk,
        "accessibility_issues": analysis.accessibility_issues,
        "priority_score": priority.normalized_score,
        "priority_label": priority.label,
        "severity_score": severity.normalized_score,
        "severity_label": severity.label,
        "change_reason": (
            f"Baseline crisis zone established at {priority.label} ({priority.normalized_score:.0f}/100) "
            f"from first-response field evidence."
        ),
        "confidence": analysis.confidence,
    }

    incident.crisis_zone_id = zone_id
    incident.crisis_zone_name = zone_name
    incident.evolution_history = [initial_step]
    incident.priority_change_reason = initial_step["change_reason"]
    return incident
