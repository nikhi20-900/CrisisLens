"""
Tests 8–20: Priority Engine Unit Tests
"""

import pytest
from app.schemas.domain import (
    Incident,
    Location,
    SeverityLevel,
    UrgencyLevel,
    Need,
    NeedType,
    NeedStatus,
    AccessStatus,
    IncidentSnapshot,
)
from app.services.response.priority import PriorityEngine, PriorityResult
from app.services.response.config import PriorityConfig


@pytest.fixture
def priority_engine():
    return PriorityEngine()


def test_8_normal_incident(priority_engine):
    """8. Normal baseline incident produces valid PriorityResult."""
    incident = Incident(
        incident_id="INC-NORM",
        title="Baseline Incident",
        location=Location(lat=12.9, lng=77.6),
    )
    res = priority_engine.calculate_priority(incident)
    assert isinstance(res, PriorityResult)
    assert 0.0 <= res.score <= 100.0


def test_9_high_severity(priority_engine):
    """9. High severity increases priority score compared to low severity."""
    inc_low = Incident(
        incident_id="INC-LOW",
        title="Low Sev",
        location=Location(lat=12.9, lng=77.6),
        severity=SeverityLevel.LOW,
    )
    inc_high = Incident(
        incident_id="INC-HIGH",
        title="High Sev",
        location=Location(lat=12.9, lng=77.6),
        severity=SeverityLevel.CRITICAL,
    )
    res_low = priority_engine.calculate_priority(inc_low)
    res_high = priority_engine.calculate_priority(inc_high)
    assert res_high.score > res_low.score


def test_10_many_affected_people(priority_engine):
    """10. Many affected people increases priority score."""
    inc_few = Incident(
        incident_id="INC-FEW",
        title="Few People",
        location=Location(lat=12.9, lng=77.6),
        people_affected=1,
    )
    inc_many = Incident(
        incident_id="INC-MANY",
        title="Many People",
        location=Location(lat=12.9, lng=77.6),
        people_affected=10,
    )
    res_few = priority_engine.calculate_priority(inc_few)
    res_many = priority_engine.calculate_priority(inc_many)
    assert res_many.score > res_few.score


def test_11_critical_medical_need(priority_engine):
    """11. Critical medical need elevates priority score."""
    inc = Incident(
        incident_id="INC-MED",
        title="Medical Critical",
        location=Location(lat=12.9, lng=77.6),
        current_needs=[
            Need(need_id="N-M", type=NeedType.MEDICAL, urgency=UrgencyLevel.CRITICAL, confidence=1.0)
        ],
    )
    res = priority_engine.calculate_priority(inc)
    assert res.score >= 40.0
    assert any("medical" in r.lower() for r in res.reasons)


def test_12_blocked_road_access(priority_engine):
    """12. Blocked road access increases priority score."""
    inc_open = Incident(
        incident_id="INC-OPEN",
        title="Open Access",
        location=Location(lat=12.9, lng=77.6),
        access_status=AccessStatus.OPEN,
    )
    inc_blocked = Incident(
        incident_id="INC-BLOCKED",
        title="Blocked Access",
        location=Location(lat=12.9, lng=77.6),
        access_status=AccessStatus.BLOCKED,
    )
    res_open = priority_engine.calculate_priority(inc_open)
    res_blocked = priority_engine.calculate_priority(inc_blocked)
    assert res_blocked.score > res_open.score
    assert any("access" in r.lower() or "road" in r.lower() for r in res_blocked.reasons)


def test_13_worsening_trend(priority_engine):
    """13. Worsening situation trend increases score and reports trend."""
    snaps = [
        IncidentSnapshot(
            snapshot_id="S-1",
            incident_id="INC-T",
            severity=SeverityLevel.LOW,
            people_affected=2,
            access_status=AccessStatus.OPEN,
            summary="Initial state",
        ),
        IncidentSnapshot(
            snapshot_id="S-2",
            incident_id="INC-T",
            severity=SeverityLevel.HIGH,
            people_affected=10,
            access_status=AccessStatus.BLOCKED,
            summary="Worsened state",
        ),
    ]
    inc = Incident(
        incident_id="INC-T",
        title="Trend Incident",
        location=Location(lat=12.9, lng=77.6),
        snapshots=snaps,
    )
    res = priority_engine.calculate_priority(inc)
    assert res.situation_trend == "WORSENING"


def test_14_improving_trend(priority_engine):
    """14. Improving situation trend decreases score and reports trend."""
    snaps = [
        IncidentSnapshot(
            snapshot_id="S-1",
            incident_id="INC-IMP",
            severity=SeverityLevel.CRITICAL,
            people_affected=20,
            access_status=AccessStatus.SUBMERGED,
            summary="Severe state",
        ),
        IncidentSnapshot(
            snapshot_id="S-2",
            incident_id="INC-IMP",
            severity=SeverityLevel.LOW,
            people_affected=2,
            access_status=AccessStatus.OPEN,
            summary="Recovered state",
        ),
    ]
    inc = Incident(
        incident_id="INC-IMP",
        title="Improving Incident",
        location=Location(lat=12.9, lng=77.6),
        snapshots=snaps,
    )
    res = priority_engine.calculate_priority(inc)
    assert res.situation_trend == "IMPROVING"


def test_15_low_confidence(priority_engine):
    """15. Low confidence is reflected in PriorityResult.confidence."""
    inc = Incident(
        incident_id="INC-CONF",
        title="Low Conf",
        location=Location(lat=12.9, lng=77.6),
        current_needs=[
            Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, confidence=0.4)
        ],
    )
    res = priority_engine.calculate_priority(inc)
    assert res.confidence == 0.4


def test_16_score_lower_boundary(priority_engine):
    """16. Score lower boundary strictly capped at 0.0."""
    custom_cfg = PriorityConfig(score_min_bound=0.0)
    engine = PriorityEngine(config=custom_cfg)
    inc = Incident(
        incident_id="INC-MIN",
        title="Zero Incident",
        location=Location(lat=12.9, lng=77.6),
        severity=SeverityLevel.LOW,
        access_status=AccessStatus.OPEN,
    )
    res = engine.calculate_priority(inc)
    assert res.score >= 0.0


def test_17_score_upper_boundary(priority_engine):
    """17. Score upper boundary strictly capped at 100.0."""
    inc = Incident(
        incident_id="INC-MAX",
        title="Max Incident",
        location=Location(lat=12.9, lng=77.6),
        severity=SeverityLevel.CRITICAL,
        people_affected=500,
        access_status=AccessStatus.SUBMERGED,
        current_needs=[
            Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.CRITICAL, confidence=1.0),
            Need(need_id="N-2", type=NeedType.MEDICAL, urgency=UrgencyLevel.CRITICAL, confidence=1.0),
        ],
    )
    res = priority_engine.calculate_priority(inc)
    assert res.score <= 100.0


def test_18_deterministic_output(priority_engine):
    """18. Same incident input produces identical score and reasons."""
    inc = Incident(
        incident_id="INC-DET",
        title="Deterministic",
        location=Location(lat=12.9, lng=77.6),
        people_affected=5,
        access_status=AccessStatus.BLOCKED,
    )
    res1 = priority_engine.calculate_priority(inc)
    res2 = priority_engine.calculate_priority(inc)
    assert res1.score == res2.score
    assert res1.reasons == res2.reasons


def test_19_reasons_grounded_in_actual_data(priority_engine):
    """19. Priority reasons correspond to actual incident inputs."""
    inc = Incident(
        incident_id="INC-GROUNDED",
        title="Grounded Data",
        location=Location(lat=12.9, lng=77.6),
        people_affected=5,
        access_status=AccessStatus.BLOCKED,
    )
    res = priority_engine.calculate_priority(inc)
    assert any("5 people" in r for r in res.reasons)
    assert any("blocked" in r for r in res.reasons)


def test_20_configuration_version_included(priority_engine):
    """20. PriorityResult contains configuration_version string."""
    inc = Incident(
        incident_id="INC-VER",
        title="Version Test",
        location=Location(lat=12.9, lng=77.6),
    )
    res = priority_engine.calculate_priority(inc)
    assert res.configuration_version == priority_engine.config.configuration_version
