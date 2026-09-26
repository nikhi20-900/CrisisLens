"""Incident database model."""

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.database import Base


class Incident(Base):
    """Core incident entity storing all assessment data."""

    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Source
    source = Column(String(50), default="user_submission")

    # Evidence
    image_url = Column(String(500))
    report_text = Column(Text)

    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    location_name = Column(String(500))

    # Classification
    disaster_type = Column(String(100))

    # Severity (deterministic engine output)
    severity_score = Column(Float, default=0.0)
    severity_label = Column(String(20), default="LOW")

    # Priority (deterministic engine output)
    priority_score = Column(Float, default=0.0)
    priority_label = Column(String(20), default="LOW")

    # Confidence
    confidence_score = Column(Float, default=0.0)
    uncertainty_flag = Column(Boolean, default=False)
    uncertainty_reason = Column(Text)

    # Impact
    affected_people_estimate = Column(Integer, default=0)
    infrastructure_damage = Column(JSON, default=dict)

    # Hazards & Evidence
    hazards = Column(JSON, default=list)
    evidence = Column(JSON, default=list)

    # Recommendations
    recommendations = Column(JSON, default=list)

    # Weather
    weather_context = Column(JSON)

    # External
    external_event_id = Column(String(200))

    # AI assessment (raw structured output from multimodal AI)
    ai_assessment = Column(JSON)
    openrouter_analysis = Column(JSON)

    # Crisis Zone & Evolution Tracking
    crisis_zone_id = Column(String(100), index=True)
    crisis_zone_name = Column(String(200))
    evolution_history = Column(JSON, default=list)
    priority_change_reason = Column(Text)

    # Severity breakdown (for explainability)
    severity_breakdown = Column(JSON)
    priority_breakdown = Column(JSON)

    # Human review
    human_assessment = Column(JSON)
    human_override = Column(Boolean, default=False)
    review_status = Column(String(30), default="pending")  # pending, approved, modified, escalated
    reviewer_notes = Column(Text)
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(String(200))

    # Demo flag
    is_demo = Column(Boolean, default=False)

    def __repr__(self):
        return f"<Incident {self.id}: {self.disaster_type} @ {self.location_name}>"
