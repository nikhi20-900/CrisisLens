"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ─── AI Analysis Output Schema ──────────────────────────────────────

class DamageAssessment(BaseModel):
    """Structured damage assessment from AI."""
    buildings: str = Field(default="unknown", description="Building damage level")
    roads: str = Field(default="unknown", description="Road damage level")
    utilities: str = Field(default="unknown", description="Utility damage level")
    bridges: str = Field(default="unknown", description="Bridge damage level")
    vehicles: str = Field(default="unknown", description="Vehicle damage level")


class PeopleAssessment(BaseModel):
    """Assessment of people affected."""
    visible_people: int = Field(default=0, ge=0)
    estimated_affected: int = Field(default=0, ge=0)
    possible_stranded_people: bool = False
    possible_injuries: bool = False
    possible_casualties: bool = False


class AIAnalysisResult(BaseModel):
    """Validated structured output from Gemini multimodal analysis.

    The AI MUST return this structure. If a field cannot be determined,
    the AI should use defaults rather than omitting fields.
    """
    disaster_type: str = Field(description="Type of disaster detected")
    summary: str = Field(description="Brief situation summary")
    damage: DamageAssessment = Field(default_factory=DamageAssessment)
    people: PeopleAssessment = Field(default_factory=PeopleAssessment)
    hazards: list[str] = Field(default_factory=list, description="Immediate hazards identified")
    severity: int = Field(default=1, ge=1, le=5, description="Severity 1-5")
    severity_label: str = Field(default="LOW")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0, description="AI confidence 0-1")
    evidence: list[str] = Field(default_factory=list, description="Evidence supporting assessment")
    recommended_actions: list[str] = Field(default_factory=list)
    accessibility_issues: list[str] = Field(default_factory=list)
    environmental_risks: list[str] = Field(default_factory=list)
    uncertainty_factors: list[str] = Field(default_factory=list, description="What the AI is uncertain about")

    @field_validator("severity_label", mode="before")
    @classmethod
    def normalize_severity_label(cls, v):
        return str(v).upper() if v else "LOW"

    @field_validator("disaster_type", mode="before")
    @classmethod
    def normalize_disaster_type(cls, v):
        return str(v).lower().strip() if v else "unknown"


# ─── OpenRouter Multimodal AI Schemas ────────────────────────────────

class OpenRouterDisasterAnalysis(BaseModel):
    """Validated structured intelligence from OpenRouter Multimodal AI.

    Adheres to strict non-hallucination rules: facts must be supported by
    evidence, and unconfirmed details are classified in unknown_information.
    """
    disaster_type: str = Field(default="unknown", description="Detected disaster classification")
    observed_conditions: list[str] = Field(default_factory=list, description="Directly observable physical phenomena")
    visible_damage: list[str] = Field(default_factory=list, description="Visible structural and infrastructure damage")
    affected_area_description: str = Field(default="Unknown", description="Geographic/physical description of affected area")
    possible_people_at_risk: str = Field(default="Unknown", description="Assessment of individuals potentially exposed")
    accessibility_issues: list[str] = Field(default_factory=list, description="Road blockages, bridge failures, transit issues")
    severity_indicators: list[str] = Field(default_factory=list, description="Physical markers indicating urgency")
    supporting_evidence: list[str] = Field(default_factory=list, description="Specific visual and textual evidence points")
    unknown_information: list[str] = Field(default_factory=list, description="Explicit unknowns that require field inspection")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0, description="Model certainty score")
    recommended_attention_level: str = Field(default="MEDIUM", description="Suggested urgency: LOW, MEDIUM, HIGH, CRITICAL")

    @field_validator("recommended_attention_level", mode="before")
    @classmethod
    def normalize_attention_level(cls, v):
        if not v:
            return "MEDIUM"
        val = str(v).upper().strip()
        return val if val in ("LOW", "MEDIUM", "HIGH", "CRITICAL") else "MEDIUM"

    @field_validator("disaster_type", mode="before")
    @classmethod
    def normalize_openrouter_disaster_type(cls, v):
        return str(v).lower().strip() if v else "unknown"

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v):
        try:
            val = float(v)
            return max(0.0, min(1.0, val))
        except (ValueError, TypeError):
            return 0.5


# ─── Severity / Priority Breakdown ──────────────────────────────────

class SeverityFactor(BaseModel):
    """Individual factor contributing to severity score."""
    factor: str
    score: float
    max_score: float
    description: str


class SeverityBreakdown(BaseModel):
    """Full severity calculation breakdown for explainability."""
    factors: list[SeverityFactor]
    raw_total: float
    normalized_score: float  # 0-100
    label: str


class PriorityBreakdown(BaseModel):
    """Priority calculation breakdown."""
    severity_component: float
    exposure_component: float
    urgency_component: float
    accessibility_component: float
    raw_score: float
    normalized_score: float  # 0-100
    label: str
    reasons: list[str]


# ─── Weather ────────────────────────────────────────────────────────

class WeatherContext(BaseModel):
    """Weather data from Open-Meteo."""
    temperature_c: Optional[float] = None
    precipitation_mm: Optional[float] = None
    precipitation_probability: Optional[int] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction: Optional[int] = None
    weather_code: Optional[int] = None
    weather_description: Optional[str] = None
    is_severe: bool = False
    source: str = "Open-Meteo"
    retrieved_at: Optional[str] = None
    available: bool = True


# ─── Incident Schemas ───────────────────────────────────────────────

class IncidentCreate(BaseModel):
    """Schema for creating a new incident (via form + file upload)."""
    report_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None


class HumanReview(BaseModel):
    """Schema for human review/override of an incident."""
    severity_label: Optional[str] = None
    severity_score: Optional[float] = None
    priority_label: Optional[str] = None
    priority_score: Optional[float] = None
    disaster_type: Optional[str] = None
    recommendations: Optional[list[str]] = None
    reviewer_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_status: str = Field(default="approved", pattern="^(approved|modified|escalated)$")


class IncidentResponse(BaseModel):
    """Full incident response."""
    id: int
    created_at: Optional[datetime] = None
    source: Optional[str] = None

    image_url: Optional[str] = None
    report_text: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None

    disaster_type: Optional[str] = None

    severity_score: Optional[float] = None
    severity_label: Optional[str] = None

    priority_score: Optional[float] = None
    priority_label: Optional[str] = None

    confidence_score: Optional[float] = None
    uncertainty_flag: Optional[bool] = None
    uncertainty_reason: Optional[str] = None

    affected_people_estimate: Optional[int] = None
    infrastructure_damage: Optional[dict] = None

    hazards: Optional[list] = None
    evidence: Optional[list] = None
    recommendations: Optional[list] = None

    weather_context: Optional[dict] = None

    external_event_id: Optional[str] = None

    ai_assessment: Optional[dict] = None
    severity_breakdown: Optional[dict] = None
    priority_breakdown: Optional[dict] = None

    human_assessment: Optional[dict] = None
    human_override: Optional[bool] = None
    review_status: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

    is_demo: Optional[bool] = None

    # OpenRouter & Crisis Zone
    openrouter_analysis: Optional[dict] = None
    crisis_zone_id: Optional[str] = None
    crisis_zone_name: Optional[str] = None
    evolution_history: Optional[list[dict]] = None
    priority_change_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    """Paginated incident list."""
    incidents: list[IncidentResponse]
    total: int


class AnalysisResponse(BaseModel):
    """Response from the /analyze endpoint."""
    incident: IncidentResponse
    analysis_time_ms: float
    warnings: list[str] = Field(default_factory=list)


class CrisisZoneInfo(BaseModel):
    """Crisis Zone details and evolution status."""
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    is_update: bool = False
    evolution_history: list[dict] = Field(default_factory=list)
    priority_change_reason: Optional[str] = None


class AnalyzeDisasterResponse(BaseModel):
    """Structured response from POST /api/analyze-disaster."""
    analysis: OpenRouterDisasterAnalysis
    crisis_zone: CrisisZoneInfo
    incident: IncidentResponse
    analysis_time_ms: float
    warnings: list[str] = Field(default_factory=list)


# ─── External Data ──────────────────────────────────────────────────

class DisasterEvent(BaseModel):
    """External disaster event (GDACS)."""
    event_id: str
    event_type: str
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    severity: Optional[str] = None
    alert_level: Optional[str] = None
    country: Optional[str] = None
    source: str = "GDACS"
    url: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None


class EarthquakeEvent(BaseModel):
    """USGS earthquake event."""
    event_id: str
    magnitude: float
    location: str
    latitude: float
    longitude: float
    depth_km: float
    timestamp: str
    url: Optional[str] = None
    felt_reports: Optional[int] = None
    tsunami_alert: bool = False
    source: str = "USGS"


class FireHotspot(BaseModel):
    """NASA FIRMS fire detection."""
    latitude: float
    longitude: float
    brightness: Optional[float] = None
    confidence: Optional[str] = None
    acq_date: Optional[str] = None
    acq_time: Optional[str] = None
    satellite: Optional[str] = None
    source: str = "NASA FIRMS"


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
    services: dict = Field(default_factory=dict)
