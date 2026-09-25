"""
Tests 44–50: End-to-End Disaster Response Scenarios
"""

import pytest
from app.schemas.domain import (
    Incident,
    Location,
    DisasterType,
    SeverityLevel,
    UrgencyLevel,
    AccessStatus,
    Need,
    NeedType,
    NeedStatus,
    Impact,
    IncidentSnapshot,
    VerificationStatus,
    ResourceAvailability,
)
from app.services.response.service import ResponseService


@pytest.fixture
def response_service():
    srv = ResponseService()
    srv.reset()
    return srv


def test_44_normal_flood_incident(response_service):
    """44. Normal flood incident end-to-end processing."""
    incident = Incident(
        incident_id="INC-E2E-44",
        title="Standard Flood Scenario",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=12.935, lng=77.624),
        people_affected=3,
        access_status=AccessStatus.PARTIALLY_BLOCKED,
    )
    plan = response_service.process_incident(incident)

    assert plan.incident_id == "INC-E2E-44"
    assert plan.priority_score >= 40.0
    assert plan.verification_status == VerificationStatus.PENDING
    assert len(incident.current_needs) > 0


def test_45_flood_with_trapped_people(response_service):
    """45. Flood with trapped people elevates priority and matches rescue boat."""
    incident = Incident(
        incident_id="INC-E2E-45",
        title="Flood Trapped People",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.HIGH,
        location=Location(lat=12.935, lng=77.624),
        people_affected=5,
        access_status=AccessStatus.SUBMERGED,
        current_impact=Impact(impact_id="IMP-45", trapped_count=5),
    )
    plan = response_service.process_incident(incident)

    assert plan.priority_level in (SeverityLevel.HIGH, SeverityLevel.CRITICAL)
    assert plan.priority_score >= 75.0

    # Ensure RESCUE boat matched
    res_types = [r.resource_type.value for r in plan.recommended_resources]
    assert "rescue_boat" in res_types or "rescue_team" in res_types


def test_46_flood_and_medical_emergency(response_service):
    """46. Flood + medical emergency matches both rescue and ambulance assets."""
    incident = Incident(
        incident_id="INC-E2E-46",
        title="Flood and Medical Crisis",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.CRITICAL,
        location=Location(lat=12.935, lng=77.624),
        people_affected=5,
        access_status=AccessStatus.BLOCKED,
        current_impact=Impact(impact_id="IMP-46", casualty_count=2, trapped_count=3),
    )
    plan = response_service.process_incident(incident)

    res_ids = [r.resource_id for r in plan.recommended_resources]
    assert "RES-01" in res_ids  # Water Rescue Boat Unit Alpha
    assert "RES-02" in res_ids  # Rapid Medical Emergency Unit 03


def test_47_unavailable_rescue_resource(response_service):
    """47. Unavailable rescue resource handled gracefully without crashing."""
    # Mark RES-01 assigned
    response_service.resource_catalog.update_availability(
        "RES-01", status=ResourceAvailability.ASSIGNED, assignment="OTHER-INC"
    )

    incident = Incident(
        incident_id="INC-E2E-47",
        title="Rescue Needed but Boat Unavailable",
        location=Location(lat=12.935, lng=77.624),
        people_affected=5,
        access_status=AccessStatus.SUBMERGED,
        current_impact=Impact(impact_id="IMP-47", trapped_count=3),
    )
    plan = response_service.process_incident(incident)

    # Should match RES-05 (Rescue Team Bravo) as available alternative
    res_ids = [r.resource_id for r in plan.recommended_resources]
    assert "RES-01" not in res_ids
    assert "RES-05" in res_ids


def test_48_insufficient_capacity_scenario(response_service):
    """48. Insufficient capacity scenario documents gap in rationale."""
    incident = Incident(
        incident_id="INC-E2E-48",
        title="Mass Evacuation",
        location=Location(lat=12.935, lng=77.624),
        people_affected=500,
        current_needs=[
            Need(need_id="N-MASS", type=NeedType.TRANSPORT, urgency=UrgencyLevel.CRITICAL, quantity=500)
        ],
    )
    plan = response_service.process_incident(incident)

    # RES-03 capacity is 40, required is 500 -> INSUFFICIENT decision
    assert "requires capacity 500" in plan.resource_rationale.lower()


def test_49_worsening_situation_scenario(response_service):
    """49. Worsening situation increases priority score across snapshots."""
    snaps = [
        IncidentSnapshot(
            snapshot_id="S-1",
            incident_id="INC-E2E-49",
            severity=SeverityLevel.LOW,
            people_affected=1,
            access_status=AccessStatus.OPEN,
            summary="Small issue",
        ),
        IncidentSnapshot(
            snapshot_id="S-2",
            incident_id="INC-E2E-49",
            severity=SeverityLevel.HIGH,
            people_affected=10,
            access_status=AccessStatus.BLOCKED,
            summary="Escalated flood",
        ),
    ]
    incident = Incident(
        incident_id="INC-E2E-49",
        title="Escalating Flood",
        location=Location(lat=12.935, lng=77.624),
        people_affected=10,
        access_status=AccessStatus.BLOCKED,
        snapshots=snaps,
    )
    plan = response_service.process_incident(incident)
    assert any("worsening" in r.lower() for r in plan.priority_rationale)


def test_50_improving_situation_scenario(response_service):
    """50. Improving situation scenario adjusts priority accordingly."""
    snaps = [
        IncidentSnapshot(
            snapshot_id="S-1",
            incident_id="INC-E2E-50",
            severity=SeverityLevel.CRITICAL,
            people_affected=20,
            access_status=AccessStatus.SUBMERGED,
            summary="Peak flood",
        ),
        IncidentSnapshot(
            snapshot_id="S-2",
            incident_id="INC-E2E-50",
            severity=SeverityLevel.LOW,
            people_affected=1,
            access_status=AccessStatus.OPEN,
            summary="Water receded",
        ),
    ]
    incident = Incident(
        incident_id="INC-E2E-50",
        title="Subsiding Flood",
        location=Location(lat=12.935, lng=77.624),
        people_affected=1,
        access_status=AccessStatus.OPEN,
        snapshots=snaps,
    )
    plan = response_service.process_incident(incident)
    assert any("improving" in r.lower() for r in plan.priority_rationale)
