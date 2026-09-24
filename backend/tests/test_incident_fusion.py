import pytest
from datetime import datetime
from app.schemas.domain import Evidence, Location, NeedType, AccessStatus, SeverityLevel, EvidenceConfidence
from app.services.incidents import IncidentFusionService


@pytest.mark.asyncio
async def test_new_incident_creation_and_fusion():
    service = IncidentFusionService()
    ev1 = Evidence(
        evidence_id="EV-001",
        report_id="R-001",
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=12.935, lng=77.624, address="Market Bridge"),
        access_status=AccessStatus.PARTIALLY_BLOCKED,
        needs=[],
        confidence=EvidenceConfidence(),
    )
    incident, link = await service.match_or_create_incident(ev1)
    assert incident.incident_id == "INC-001"
    assert len(incident.evidence_links) == 1
    assert link.evidence_id == "EV-001"
    assert len(incident.snapshots) == 1


@pytest.mark.asyncio
async def test_related_report_fusion_and_change_detection():
    service = IncidentFusionService()
    ev1 = Evidence(
        evidence_id="EV-001",
        report_id="R-001",
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=12.935, lng=77.624),
        access_status=AccessStatus.PARTIALLY_BLOCKED,
        needs=[],
    )
    incident, _ = await service.match_or_create_incident(ev1)

    ev2 = Evidence(
        evidence_id="EV-002",
        report_id="R-002",
        severity=SeverityLevel.HIGH,
        location=Location(lat=12.936, lng=77.625),
        people_affected=5,
        needs=[NeedType.RESCUE],
        access_status=AccessStatus.BLOCKED,
    )
    incident, link2 = await service.match_or_create_incident(ev2)

    assert len(incident.evidence_links) == 2
    assert incident.people_affected == 5
    assert incident.access_status == AccessStatus.BLOCKED
    assert any(n.type == NeedType.RESCUE for n in incident.current_needs)

    latest_snapshot = incident.snapshots[-1]
    assert any("+5 people affected" in delta for delta in latest_snapshot.delta_summary)
    assert any("Rescue" in delta for delta in latest_snapshot.delta_summary)


@pytest.mark.asyncio
async def test_contradiction_detection():
    service = IncidentFusionService()
    # Ev1 establishes OPEN road
    ev1 = Evidence(
        evidence_id="EV-001",
        report_id="R-001",
        access_status=AccessStatus.OPEN,
    )
    incident, _ = await service.match_or_create_incident(ev1)

    # Ev2 says road is BLOCKED
    ev2 = Evidence(
        evidence_id="EV-002",
        report_id="R-002",
        access_status=AccessStatus.BLOCKED,
    )
    incident, _ = await service.match_or_create_incident(ev2)

    assert len(incident.contradictions) > 0
    conflict = incident.contradictions[0]
    assert conflict.field_name == "access_status"
    assert conflict.requires_human_resolution is True
