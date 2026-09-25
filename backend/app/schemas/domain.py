"""
CrisisLens AI - Shared Domain Contracts (Python / Pydantic)
===========================================================
Shared domain schemas strictly observed by all four subteams:
- Member 1: AI / Multimodal Evidence Analysis
- Member 2: Incident Intelligence
- Member 3: Decision & Response Intelligence
- Member 4: Frontend / Command Center
"""

from __future__ import annotations
from enum import Enum
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================================
# Core Enums
# ============================================================================

class DisasterType(str, Enum):
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    FIRE = "fire"
    LANDSLIDE = "landslide"
    OTHER = "other"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AccessStatus(str, Enum):
    OPEN = "open"
    PARTIALLY_BLOCKED = "partially_blocked"
    BLOCKED = "blocked"
    SUBMERGED = "submerged"
    UNKNOWN = "unknown"


class NeedType(str, Enum):
    RESCUE = "rescue"
    MEDICAL = "medical"
    FOOD = "food"
    WATER = "water"
    SHELTER = "shelter"
    TRANSPORT = "transport"
    OTHER = "other"


class NeedStatus(str, Enum):
    UNMET = "unmet"
    IN_PROGRESS = "in_progress"
    MET = "met"
    CANCELLED = "cancelled"


class ResourceType(str, Enum):
    RESCUE_BOAT = "rescue_boat"
    RESCUE_TEAM = "rescue_team"
    AMBULANCE = "ambulance"
    MEDICAL_TEAM = "medical_team"
    EVACUATION_BUS = "evacuation_bus"
    FOOD_WATER_UNIT = "food_water_unit"
    WATER_PUMP = "water_pump"
    HELICOPTER = "helicopter"


class ResourceAvailability(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DEPLETED = "depleted"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EDITED = "edited"


class IncidentStatus(str, Enum):
    ACTIVE = "active"
    CONTAINED = "contained"
    RESOLVED = "resolved"


# ============================================================================
# Geographic Primitives
# ============================================================================

class Location(BaseModel):
    lat: float = Field(..., description="Latitude in decimal degrees")
    lng: float = Field(..., description="Longitude in decimal degrees")
    address: Optional[str] = Field(None, description="Human readable address or landmark")
    radius_meters: Optional[float] = Field(None, description="Estimated bounding or impact radius")


class MediaItem(BaseModel):
    media_id: str
    media_type: str = Field(..., description="image/jpeg, video/mp4, audio/wav, etc.")
    url: str
    caption: Optional[str] = None


# ============================================================================
# 1. REPORT (Raw Incoming Data)
# ============================================================================

class Report(BaseModel):
    report_id: str = Field(..., description="Unique report identifier, e.g. 'R-001'")
    text: str = Field(..., description="Raw text of the disaster report")
    media: List[MediaItem] = Field(default_factory=list, description="Associated image/video/audio")
    location: Optional[Location] = Field(None, description="Reported or extracted coordinate location")
    source: str = Field("citizen", description="citizen, emergency_call, social_media, drone, field_agent")
    reporter_id: Optional[str] = Field(None, description="Identifier of the source reporter if available")
    timestamp: datetime = Field(default_factory=utc_now, description="Time report was submitted/received")


# ============================================================================
# 2. EVIDENCE (Structured AI-Extracted Knowledge)
# ============================================================================

class EvidenceConfidence(BaseModel):
    disaster_type: float = Field(1.0, ge=0.0, le=1.0)
    severity: float = Field(1.0, ge=0.0, le=1.0)
    people_affected: float = Field(1.0, ge=0.0, le=1.0)
    needs: float = Field(1.0, ge=0.0, le=1.0)
    access_status: float = Field(1.0, ge=0.0, le=1.0)
    location: float = Field(1.0, ge=0.0, le=1.0)
    urgency: float = Field(1.0, ge=0.0, le=1.0)


class Evidence(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence ID, e.g. 'EV-001'")
    report_id: str = Field(..., description="Foreign key back to original raw Report")
    disaster_type: DisasterType = Field(DisasterType.FLOOD)
    severity: SeverityLevel = Field(SeverityLevel.MEDIUM)
    people_affected: Optional[int] = Field(None, ge=0, description="Estimated count of people in danger/affected")
    needs: List[NeedType] = Field(default_factory=list, description="Extracted critical relief needs")
    access_status: AccessStatus = Field(AccessStatus.UNKNOWN)
    location: Optional[Location] = Field(None, description="Standardized geographic coordinates")
    urgency: UrgencyLevel = Field(UrgencyLevel.MEDIUM)
    extracted_entities: Dict[str, Any] = Field(default_factory=dict, description="Custom tokens, e.g. 'water_depth'")
    confidence: EvidenceConfidence = Field(default_factory=EvidenceConfidence)
    raw_report: Optional[Report] = Field(None, description="Preserved reference of original report")
    extracted_at: datetime = Field(default_factory=utc_now)


# ============================================================================
# 3. EVIDENCE LINK (Relationship between Evidence and Incident)
# ============================================================================

class EvidenceLink(BaseModel):
    link_id: str = Field(..., description="Unique link ID, e.g. 'EL-001'")
    incident_id: str = Field(..., description="Foreign key to linked Incident")
    evidence_id: str = Field(..., description="Foreign key to Evidence")
    linked_at: datetime = Field(default_factory=utc_now)
    similarity_score: float = Field(1.0, ge=0.0, le=1.0, description="Match confidence / similarity metric")
    link_rationale: str = Field(..., description="Explainable reason for linking (spatial/temporal/semantic)")


# ============================================================================
# 4. IMPACT
# ============================================================================

class Impact(BaseModel):
    impact_id: str = Field(..., description="Unique impact record ID")
    casualty_count: int = Field(0, ge=0)
    displaced_count: int = Field(0, ge=0)
    trapped_count: int = Field(0, ge=0)
    infrastructure_damage: Dict[str, str] = Field(
        default_factory=dict, 
        description="e.g. {'bridge': 'submerged', 'power_grid': 'down'}"
    )
    hazard_radius_meters: float = Field(100.0, ge=0.0)
    environmental_hazards: List[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=utc_now)


# ============================================================================
# 5. NEED
# ============================================================================

class Need(BaseModel):
    need_id: str = Field(..., description="Unique need ID, e.g. 'ND-001'")
    type: NeedType
    urgency: UrgencyLevel
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    status: NeedStatus = Field(NeedStatus.UNMET)
    quantity: Optional[int] = Field(None, description="Quantity needed (e.g. 5 for 5 people needing boat rescue)")
    description: Optional[str] = None
    identified_at: datetime = Field(default_factory=utc_now)


# ============================================================================
# 6. RESOURCE
# ============================================================================

class Resource(BaseModel):
    resource_id: str = Field(..., description="Unique resource ID, e.g. 'RES-01'")
    name: str = Field(..., description="Display name, e.g. 'Rapid Water Rescue Team 01'")
    resource_type: ResourceType
    location: Location
    availability: ResourceAvailability = Field(ResourceAvailability.AVAILABLE)
    capacity: int = Field(1, ge=1, description="Capacity count (e.g. seats in boat, patients in ambulance)")
    current_assignment: Optional[str] = Field(None, description="Incident ID currently assigned to")
    estimated_eta_minutes: Optional[int] = None


# ============================================================================
# 7. ACTION PLAN / RECOMMENDATION
# ============================================================================

class ActionPlan(BaseModel):
    action_id: str = Field(..., description="Unique recommendation ID, e.g. 'ACT-001'")
    incident_id: str = Field(..., description="Target Incident ID")
    priority_level: SeverityLevel = Field(SeverityLevel.HIGH)
    priority_score: float = Field(..., ge=0.0, le=100.0, description="Explainable computed priority (0-100)")
    priority_rationale: List[str] = Field(
        default_factory=list, 
        description="Explainable reasons: e.g. ['5 people trapped', 'Medical emergency', 'Road submerged']"
    )
    recommended_resources: List[Resource] = Field(default_factory=list)
    resource_rationale: str = Field(..., description="Explainable matching logic between needs and resource assets")
    verification_status: VerificationStatus = Field(VerificationStatus.PENDING)
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    responder_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


# ============================================================================
# 8. INCIDENT SNAPSHOT ("What Changed?" Engine)
# ============================================================================

class IncidentSnapshot(BaseModel):
    snapshot_id: str = Field(..., description="Unique snapshot ID, e.g. 'SNAP-001'")
    incident_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    severity: SeverityLevel
    people_affected: int = Field(0, ge=0)
    access_status: AccessStatus
    active_needs: List[NeedType] = Field(default_factory=list)
    priority_score: float = Field(0.0, ge=0.0, le=100.0)
    summary: str = Field(..., description="Concise human-readable state summary")
    delta_summary: List[str] = Field(
        default_factory=list, 
        description="Structured diff against previous snapshot, e.g. ['+5 people affected', '+Rescue need detected']"
    )


# ============================================================================
# 9. CONTRADICTION FLAG
# ============================================================================

class Contradiction(BaseModel):
    contradiction_id: str = Field(..., description="Unique ID for flagged conflict")
    field_name: str = Field(..., description="e.g. 'access_status'")
    claim_a: Dict[str, Any] = Field(..., description="e.g. {'evidence_id': 'EV-01', 'value': 'open'}")
    claim_b: Dict[str, Any] = Field(..., description="e.g. {'evidence_id': 'EV-03', 'value': 'blocked'}")
    requires_human_resolution: bool = True
    resolved: bool = False
    resolution_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


# ============================================================================
# 10. MATCH RESULT & PROVENANCE (Member 2 Incident Intelligence)
# ============================================================================

class MatchDecision(str, Enum):
    MATCH = "MATCH"
    NO_MATCH = "NO_MATCH"
    UNCERTAIN = "UNCERTAIN"


class MatchSubScores(BaseModel):
    spatial_score: float = Field(..., ge=0.0, le=1.0, description="Spatial proximity score [0-1]")
    temporal_score: float = Field(..., ge=0.0, le=1.0, description="Temporal proximity score [0-1]")
    semantic_score: float = Field(..., ge=0.0, le=1.0, description="Disaster type and hazard score [0-1]")
    context_score: float = Field(..., ge=0.0, le=1.0, description="Entity/landmark/needs overlap score [0-1]")
    total_score: float = Field(..., ge=0.0, le=1.0, description="Weighted composite score [0-1]")


class MatchResult(BaseModel):
    decision: MatchDecision
    incident_id: Optional[str] = None
    overall_score: float = Field(..., ge=0.0, le=1.0)
    sub_scores: MatchSubScores
    reasons: List[str] = Field(default_factory=list)
    matched_at: datetime = Field(default_factory=utc_now)


class FieldProvenance(BaseModel):
    field_name: str
    source_evidence_id: str
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    value: Any = None
    previous_value: Optional[Any] = None
    updated_at: datetime = Field(default_factory=utc_now)
    rationale: Optional[str] = None


class FieldDiff(BaseModel):
    field_name: str
    before: Any = None
    after: Any = None
    source_evidence_id: Optional[str] = None
    description: str


class SituationDelta(BaseModel):
    incident_id: str
    from_snapshot_id: Optional[str] = None
    to_snapshot_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    delta_summary: List[str] = Field(default_factory=list)
    field_diffs: List[FieldDiff] = Field(default_factory=list)


# ============================================================================
# 11. INCIDENT (The Core Evolving Object)
# ============================================================================

class Incident(BaseModel):
    incident_id: str = Field(..., description="Unique incident ID, e.g. 'INC-001'")
    title: str = Field(..., description="Evolving title, e.g. 'Flash Flood - Central Market & Bridge'")
    disaster_type: DisasterType = Field(DisasterType.FLOOD)
    status: IncidentStatus = Field(IncidentStatus.ACTIVE)
    severity: SeverityLevel = Field(SeverityLevel.MEDIUM)
    priority_level: SeverityLevel = Field(SeverityLevel.MEDIUM)
    priority_score: float = Field(50.0, ge=0.0, le=100.0)
    location: Location
    people_affected: int = Field(0, ge=0)
    access_status: AccessStatus = Field(AccessStatus.UNKNOWN)
    evidence_links: List[EvidenceLink] = Field(default_factory=list)
    current_impact: Optional[Impact] = None
    current_needs: List[Need] = Field(default_factory=list)
    active_recommendation: Optional[ActionPlan] = None
    snapshots: List[IncidentSnapshot] = Field(default_factory=list)
    contradictions: List[Contradiction] = Field(default_factory=list)
    field_provenance: Dict[str, FieldProvenance] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

