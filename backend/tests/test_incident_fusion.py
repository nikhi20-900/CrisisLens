"""
CrisisLens AI - Incident Intelligence Test Suite
=================================================
Covers the 9 mandatory scenarios for Member 2 Incident Fusion & Evolution:
1. Creation: Founding evidence instantiates incident, snapshot, link, provenance
2. Duplicates: Duplicate/near-duplicate evidence links to existing incident
3. Fusion: Multiple distinct reports fuse into the same evolving incident
4. Separation: Spatially distant or distinct disaster types create separate incidents
5. Updates: Field-level updates track provenance and confidence
6. Snapshots: Append-only snapshots maintain point-in-time immutability
7. Diffs: Structured change detection ("What Changed?") with no noisy unchanged fields
8. Contradictions: Conflicting claims preserved for human review without destructive overwrite
9. History Ordering: Timeline snapshots in strictly ascending chronological order
10. API Endpoints: End-to-end FastAPI integration testing for Member 2 endpoints
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.domain import (
    Evidence,
    Location,
    NeedType,
    AccessStatus,
    SeverityLevel,
    DisasterType,
    EvidenceConfidence,
    MatchDecision,
    utc_now,
)
from app.services.incidents import (
    IncidentFusionService,
    IncidentService,
    IncidentMatcher,
    MatcherConfig,
    haversine_distance_meters,
)


@pytest.mark.asyncio
async def test_new_incident_creation_and_fusion():
    """Baseline test: initial incident creation."""
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
    """Baseline test: related evidence fusion and snapshot delta."""
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
    """Baseline test: contradiction detection on road access."""
    service = IncidentFusionService()
    ev1 = Evidence(
        evidence_id="EV-001",
        report_id="R-001",
        access_status=AccessStatus.OPEN,
    )
    incident, _ = await service.match_or_create_incident(ev1)

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


# ============================================================================
# 9 MANDATORY TEST SCENARIOS
# ============================================================================

@pytest.mark.asyncio
async def test_scenario_1_incident_creation():
    """Scenario 1: First report creates a new Incident with link, snapshot, and provenance."""
    service = IncidentService()
    service.reset()

    ev = Evidence(
        evidence_id="EV-101",
        report_id="R-101",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.HIGH,
        location=Location(lat=13.0827, lng=80.2707, address="Central Station"),
        people_affected=12,
        needs=[NeedType.RESCUE, NeedType.FOOD],
        access_status=AccessStatus.BLOCKED,
        confidence=EvidenceConfidence(severity=0.9, people_affected=0.85),
    )

    incident, link, match_res, snapshot = await service.ingest_evidence(ev)

    # 1. Incident created with proper identifiers and fields
    assert incident.incident_id == "INC-001"
    assert incident.disaster_type == DisasterType.FLOOD
    assert incident.severity == SeverityLevel.HIGH
    assert incident.people_affected == 12
    assert incident.access_status == AccessStatus.BLOCKED
    assert len(incident.current_needs) == 2

    # 2. Founding evidence linked
    assert len(incident.evidence_links) == 1
    assert link.evidence_id == "EV-101"
    assert link.similarity_score == 1.0

    # 3. Initial append-only snapshot created
    assert len(incident.snapshots) == 1
    assert snapshot.snapshot_id == "SNAP-001"
    assert snapshot.people_affected == 12

    # 4. Field-level provenance established
    assert "people_affected" in incident.field_provenance
    assert incident.field_provenance["people_affected"].source_evidence_id == "EV-101"
    assert incident.field_provenance["people_affected"].confidence == 0.85


@pytest.mark.asyncio
async def test_scenario_2_duplicate_and_near_duplicate_matching():
    """Scenario 2: Duplicate or near-duplicate report matches existing incident with high score."""
    service = IncidentService()
    service.reset()

    ev1 = Evidence(
        evidence_id="EV-201",
        report_id="R-201",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=12.9716, lng=77.5946, address="MG Road Metro"),
        people_affected=4,
    )
    incident, _, _, _ = await service.ingest_evidence(ev1)

    # Duplicate / near-duplicate evidence submitted shortly after
    ev_duplicate = Evidence(
        evidence_id="EV-202",
        report_id="R-202",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=12.9718, lng=77.5948, address="MG Road Metro Station"),
        people_affected=4,
    )

    matched_inc, match_res = await service.evaluate_match(ev_duplicate)
    assert matched_inc is not None
    assert matched_inc.incident_id == incident.incident_id
    assert match_res.decision == MatchDecision.MATCH
    assert match_res.overall_score >= 0.85
    assert match_res.sub_scores.spatial_score >= 0.95
    assert match_res.sub_scores.semantic_score == 1.0

    # Ingest duplicate
    inc_after, link, _, snapshot = await service.ingest_evidence(ev_duplicate)
    assert inc_after.incident_id == incident.incident_id
    assert len(inc_after.evidence_links) == 2
    assert link.evidence_id == "EV-202"


@pytest.mark.asyncio
async def test_scenario_3_multi_report_fusion():
    """Scenario 3: Multiple distinct reports fuse into the same evolving incident."""
    service = IncidentService()
    service.reset()

    # Report A: Initial flood detection
    ev_a = Evidence(
        evidence_id="EV-301",
        report_id="R-301",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=12.935, lng=77.624, address="Sector 4 Canal"),
        people_affected=2,
        needs=[NeedType.WATER],
    )
    incident, _, _, _ = await service.ingest_evidence(ev_a)

    # Report B: 300m away, mentions trapped people
    ev_b = Evidence(
        evidence_id="EV-302",
        report_id="R-302",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.HIGH,
        location=Location(lat=12.937, lng=77.626, address="Sector 4 East Bank"),
        people_affected=8,
        needs=[NeedType.RESCUE],
    )
    incident, _, match_b, snap_b = await service.ingest_evidence(ev_b)
    assert match_b.decision == MatchDecision.MATCH
    assert incident.people_affected == 8
    assert len(incident.evidence_links) == 2

    # Report C: Another citizen report in same zone reporting road submerged
    ev_c = Evidence(
        evidence_id="EV-303",
        report_id="R-303",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.HIGH,
        location=Location(lat=12.936, lng=77.625, address="Sector 4 Canal Main Bridge"),
        access_status=AccessStatus.SUBMERGED,
        needs=[NeedType.MEDICAL],
    )
    incident, _, match_c, snap_c = await service.ingest_evidence(ev_c)
    assert match_c.decision == MatchDecision.MATCH
    assert incident.access_status == AccessStatus.SUBMERGED
    assert len(incident.evidence_links) == 3
    assert len(incident.snapshots) == 3
    assert any(n.type == NeedType.MEDICAL for n in incident.current_needs)


@pytest.mark.asyncio
async def test_scenario_4_separation_disaster_type_and_spatial():
    """Scenario 4: Disparate disaster types or distant locations form SEPARATE incidents."""
    service = IncidentService()
    service.reset()

    # Incident 1: Flood in City South
    ev_flood = Evidence(
        evidence_id="EV-401",
        report_id="R-401",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.HIGH,
        location=Location(lat=12.935, lng=77.624, address="South Lake Basin"),
    )
    inc_1, _, _, _ = await service.ingest_evidence(ev_flood)
    assert inc_1.incident_id == "INC-001"

    # Evidence with DIFFERENT disaster type (FIRE) at nearby location
    ev_fire = Evidence(
        evidence_id="EV-402",
        report_id="R-402",
        disaster_type=DisasterType.FIRE,
        severity=SeverityLevel.HIGH,
        location=Location(lat=12.936, lng=77.625, address="South Lake Factory"),
    )
    inc_2, _, match_fire, _ = await service.ingest_evidence(ev_fire)
    assert match_fire.decision == MatchDecision.NO_MATCH
    assert inc_2.incident_id != inc_1.incident_id
    assert inc_2.incident_id == "INC-002"
    assert inc_2.disaster_type == DisasterType.FIRE

    # Evidence with SAME disaster type (FLOOD) but 25 kilometers away
    ev_distant = Evidence(
        evidence_id="EV-403",
        report_id="R-403",
        disaster_type=DisasterType.FLOOD,
        severity=SeverityLevel.MEDIUM,
        location=Location(lat=13.150, lng=77.750, address="North Airport Reservoir"),
    )
    inc_3, _, match_dist, _ = await service.ingest_evidence(ev_distant)
    assert match_dist.decision == MatchDecision.NO_MATCH
    assert inc_3.incident_id == "INC-003"
    assert len(service.list_incidents()) == 3


@pytest.mark.asyncio
async def test_scenario_5_state_updates_with_confidence_and_provenance():
    """Scenario 5: Updates track field-level confidence and link back to source evidence."""
    service = IncidentService()
    service.reset()

    ev1 = Evidence(
        evidence_id="EV-501",
        report_id="R-501",
        severity=SeverityLevel.LOW,
        people_affected=3,
        confidence=EvidenceConfidence(severity=0.6, people_affected=0.7),
        location=Location(lat=12.900, lng=77.600),
    )
    incident, _, _, _ = await service.ingest_evidence(ev1)
    assert incident.field_provenance["people_affected"].confidence == 0.7
    assert incident.field_provenance["people_affected"].value == 3

    # Evidence 2 provides updated count with higher confidence
    ev2 = Evidence(
        evidence_id="EV-502",
        report_id="R-502",
        severity=SeverityLevel.CRITICAL,
        people_affected=15,
        confidence=EvidenceConfidence(severity=0.95, people_affected=0.92),
        location=Location(lat=12.901, lng=77.601),
    )
    incident, _, _, _ = await service.ingest_evidence(ev2)

    prov_people = incident.field_provenance["people_affected"]
    assert prov_people.source_evidence_id == "EV-502"
    assert prov_people.confidence == 0.92
    assert prov_people.value == 15
    assert prov_people.previous_value == 3

    prov_sev = incident.field_provenance["severity"]
    assert prov_sev.source_evidence_id == "EV-502"
    assert prov_sev.confidence == 0.95
    assert prov_sev.value == SeverityLevel.CRITICAL.value
    assert prov_sev.previous_value == SeverityLevel.LOW.value


@pytest.mark.asyncio
async def test_scenario_6_append_only_snapshots_immutability():
    """Scenario 6: Snapshots are append-only; historical snapshots remain immutable."""
    service = IncidentService()
    service.reset()

    ev1 = Evidence(
        evidence_id="EV-601",
        report_id="R-601",
        severity=SeverityLevel.LOW,
        people_affected=2,
        location=Location(lat=12.930, lng=77.620),
    )
    incident, _, _, snap1 = await service.ingest_evidence(ev1)
    snap1_people = snap1.people_affected
    snap1_sev = snap1.severity

    # State update
    ev2 = Evidence(
        evidence_id="EV-602",
        report_id="R-602",
        severity=SeverityLevel.HIGH,
        people_affected=20,
        location=Location(lat=12.931, lng=77.621),
    )
    incident, _, _, snap2 = await service.ingest_evidence(ev2)

    # Verify snap1 has NOT mutated
    assert incident.snapshots[0].people_affected == snap1_people == 2
    assert incident.snapshots[0].severity == snap1_sev == SeverityLevel.LOW

    # Verify snap2 reflects new point-in-time state
    assert incident.snapshots[1].people_affected == 20
    assert incident.snapshots[1].severity == SeverityLevel.HIGH
    assert len(incident.snapshots) == 2


@pytest.mark.asyncio
async def test_scenario_7_structured_diff_what_changed():
    """Scenario 7: Structured diff engine returns clean delta summary with zero noisy unchanged fields."""
    service = IncidentService()
    service.reset()

    ev1 = Evidence(
        evidence_id="EV-701",
        report_id="R-701",
        severity=SeverityLevel.MEDIUM,
        people_affected=5,
        access_status=AccessStatus.PARTIALLY_BLOCKED,
        location=Location(lat=12.935, lng=77.624),
    )
    incident, _, _, snap1 = await service.ingest_evidence(ev1)

    # Ingest ev2 modifying people_affected and adding a need, keeping severity identical
    ev2 = Evidence(
        evidence_id="EV-702",
        report_id="R-702",
        severity=SeverityLevel.MEDIUM,  # Unchanged
        people_affected=15,             # Changed (+10)
        needs=[NeedType.RESCUE],         # Added need
        location=Location(lat=12.935, lng=77.624),
    )
    incident, _, _, snap2 = await service.ingest_evidence(ev2)

    diff = service.diff_snapshots(
        incident_id=incident.incident_id,
        from_snapshot_id=snap1.snapshot_id,
        to_snapshot_id=snap2.snapshot_id,
    )
    assert diff is not None
    assert diff.from_snapshot_id == "SNAP-001"
    assert diff.to_snapshot_id == "SNAP-002"

    # People affected should appear in diff
    diff_field_names = [f.field_name for f in diff.field_diffs]
    assert "people_affected" in diff_field_names
    assert "active_needs" in diff_field_names
    # Severity did not change, so it MUST NOT be in field_diffs
    assert "severity" not in diff_field_names

    # Check human readable delta summary
    assert any("+10" in s for s in diff.delta_summary)


@pytest.mark.asyncio
async def test_scenario_8_contradiction_detection_and_resolution():
    """Scenario 8: Contradictory claims are preserved for human review without destructive overwrite, and resolvable."""
    service = IncidentService()
    service.reset()

    ev1 = Evidence(
        evidence_id="EV-801",
        report_id="R-801",
        access_status=AccessStatus.OPEN,
        location=Location(lat=12.935, lng=77.624),
    )
    incident, _, _, _ = await service.ingest_evidence(ev1)
    assert incident.access_status == AccessStatus.OPEN

    # Conflicting report claims road is BLOCKED
    ev2 = Evidence(
        evidence_id="EV-802",
        report_id="R-802",
        access_status=AccessStatus.BLOCKED,
        location=Location(lat=12.935, lng=77.624),
    )
    incident, _, _, _ = await service.ingest_evidence(ev2)

    # 1. Contradiction flagged
    assert len(incident.contradictions) == 1
    contr = incident.contradictions[0]
    assert contr.field_name == "access_status"
    assert contr.requires_human_resolution is True
    assert contr.resolved is False
    assert contr.claim_a["value"] == "open"
    assert contr.claim_b["value"] == "blocked"

    # 2. Non-destructive preservation: incident did not overwrite into invalid state
    assert incident.access_status == AccessStatus.OPEN

    # 3. Human Operator Resolves Contradiction
    resolved_contr = service.resolve_contradiction(
        incident_id=incident.incident_id,
        contradiction_id=contr.contradiction_id,
        chosen_value="blocked",
        resolution_notes="Drone aerial footage confirmed road blocked by fallen electrical pole",
        resolver_id="operator_sarah",
    )
    assert resolved_contr is not None
    assert resolved_contr.resolved is True
    assert resolved_contr.resolved_by == "operator_sarah"
    assert incident.access_status == AccessStatus.BLOCKED


@pytest.mark.asyncio
async def test_scenario_9_chronological_history_ordering():
    """Scenario 9: Multiple sequential snapshots maintain strictly ascending chronological ordering."""
    service = IncidentService()
    service.reset()

    base_time = datetime(2026, 9, 25, 10, 0, 0, tzinfo=timezone.utc)
    ev1 = Evidence(
        evidence_id="EV-901",
        report_id="R-901",
        people_affected=1,
        location=Location(lat=12.935, lng=77.624),
        extracted_at=base_time,
    )
    incident, _, _, _ = await service.ingest_evidence(ev1)

    ev2 = Evidence(
        evidence_id="EV-902",
        report_id="R-902",
        people_affected=5,
        location=Location(lat=12.935, lng=77.624),
        extracted_at=base_time + timedelta(minutes=15),
    )
    await service.ingest_evidence(ev2)

    ev3 = Evidence(
        evidence_id="EV-903",
        report_id="R-903",
        people_affected=10,
        location=Location(lat=12.935, lng=77.624),
        extracted_at=base_time + timedelta(minutes=30),
    )
    await service.ingest_evidence(ev3)

    timeline = service.get_timeline(incident.incident_id)
    assert len(timeline) == 3
    # Check monotonic timestamps and IDs
    for i in range(len(timeline) - 1):
        assert timeline[i].timestamp <= timeline[i + 1].timestamp
    assert timeline[0].snapshot_id == "SNAP-001"
    assert timeline[1].snapshot_id == "SNAP-002"
    assert timeline[2].snapshot_id == "SNAP-003"


def test_api_endpoints_integration():
    """Integration test: FastAPI routes exposed under /api/v1/incidents."""
    client = TestClient(app)

    # 1. Ingest evidence via POST /api/v1/incidents/ingest
    payload = {
        "evidence_id": "EV-API-01",
        "report_id": "R-API-01",
        "disaster_type": "flood",
        "severity": "high",
        "people_affected": 8,
        "access_status": "open",
        "needs": ["rescue", "water"],
        "location": {"lat": 12.935, "lng": 77.624, "address": "Market Crossroad"},
    }
    resp = client.post("/api/v1/incidents/ingest", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    inc_id = data["incident"]["incident_id"]
    assert "evidence_link" in data
    assert "snapshot" in data

    # 2. Dry-run match evaluation via POST /api/v1/incidents/match
    candidate_payload = {
        "evidence_id": "EV-API-02",
        "report_id": "R-API-02",
        "disaster_type": "flood",
        "severity": "high",
        "location": {"lat": 12.936, "lng": 77.625},
    }
    match_resp = client.post("/api/v1/incidents/match", json=candidate_payload)
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["matched_incident_id"] == inc_id
    assert match_data["match_result"]["decision"] == "MATCH"

    # 3. Retrieve incident detail via GET /api/v1/incidents/{incident_id}
    detail_resp = client.get(f"/api/v1/incidents/{inc_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["incident_id"] == inc_id

    # 4. Retrieve timeline via GET /api/v1/incidents/{incident_id}/timeline
    timeline_resp = client.get(f"/api/v1/incidents/{inc_id}/timeline")
    assert timeline_resp.status_code == 200
    assert len(timeline_resp.json()) >= 1

    # 5. Retrieve provenance via GET /api/v1/incidents/{incident_id}/provenance
    prov_resp = client.get(f"/api/v1/incidents/{inc_id}/provenance")
    assert prov_resp.status_code == 200
    assert "people_affected" in prov_resp.json()

    # 6. Retrieve situation diff via GET /api/v1/incidents/{incident_id}/diff
    diff_resp = client.get(f"/api/v1/incidents/{inc_id}/diff")
    assert diff_resp.status_code == 200
    assert "delta_summary" in diff_resp.json()
