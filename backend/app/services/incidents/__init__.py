"""
Member 2: Incident Intelligence Package
=======================================
Modular incident intelligence system comprising:
- matcher.py: Spatial, temporal, semantic, and context/entity deterministic matching
- snapshots.py: Append-only snapshot generator
- changes.py: Structured delta change detection ("What Changed?")
- contradictions.py: Contradiction detection and conflict preservation
- service.py: End-to-end incident fusion & situation evolution orchestrator
"""

from app.services.incidents.matcher import (
    IncidentMatcher,
    incident_matcher,
    MatcherConfig,
    haversine_distance_meters,
)
from app.services.incidents.snapshots import (
    SnapshotEngine,
    snapshot_engine,
)
from app.services.incidents.changes import (
    ChangeDetectionEngine,
    change_detection_engine,
)
from app.services.incidents.contradictions import (
    ContradictionEngine,
    contradiction_engine,
)
from app.services.incidents.service import (
    IncidentFusionInterface,
    IncidentService,
    IncidentFusionService,
    incident_fusion_service,
)

__all__ = [
    "IncidentMatcher",
    "incident_matcher",
    "MatcherConfig",
    "haversine_distance_meters",
    "SnapshotEngine",
    "snapshot_engine",
    "ChangeDetectionEngine",
    "change_detection_engine",
    "ContradictionEngine",
    "contradiction_engine",
    "IncidentFusionInterface",
    "IncidentService",
    "IncidentFusionService",
    "incident_fusion_service",
]

