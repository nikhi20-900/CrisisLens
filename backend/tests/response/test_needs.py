"""
Tests 1–7: Response Needs Engine Unit Tests
"""

import pytest
from app.schemas.domain import (
    Incident,
    Location,
    Need,
    NeedType,
    NeedStatus,
    UrgencyLevel,
    AccessStatus,
    Impact,
    Evidence,
    EvidenceLink,
    EvidenceConfidence,
)
from app.services.response.needs import NeedsEngine


@pytest.fixture
def needs_engine():
    return NeedsEngine()


def test_1_rescue_detection(needs_engine):
    """1. Rescue detection: trapped people or submerged access triggers RESCUE need."""
    incident = Incident(
        incident_id="INC-R1",
        title="Flood Trapped",
        location=Location(lat=12.9, lng=77.6),
        people_affected=5,
        access_status=AccessStatus.SUBMERGED,
        current_impact=Impact(impact_id="IMP-1", trapped_count=3),
    )
    needs = needs_engine.extract_needs(incident)
    rescue_needs = [n for n in needs if n.type == NeedType.RESCUE]
    assert len(rescue_needs) == 1
    assert rescue_needs[0].urgency in (UrgencyLevel.CRITICAL, UrgencyLevel.HIGH)
    assert rescue_needs[0].status == NeedStatus.UNMET


def test_2_medical_detection(needs_engine):
    """2. Medical detection: casualties or medical evidence triggers MEDICAL need."""
    incident = Incident(
        incident_id="INC-M1",
        title="Building Collapse",
        location=Location(lat=12.9, lng=77.6),
        people_affected=10,
        current_impact=Impact(impact_id="IMP-2", casualty_count=2),
    )
    needs = needs_engine.extract_needs(incident)
    med_needs = [n for n in needs if n.type == NeedType.MEDICAL]
    assert len(med_needs) == 1
    assert med_needs[0].urgency == UrgencyLevel.CRITICAL


def test_3_multiple_simultaneous_needs(needs_engine):
    """3. Multiple simultaneous needs extracted correctly."""
    incident = Incident(
        incident_id="INC-MULTI",
        title="Major Disaster",
        location=Location(lat=12.9, lng=77.6),
        people_affected=20,
        access_status=AccessStatus.BLOCKED,
        current_impact=Impact(impact_id="IMP-3", casualty_count=1, displaced_count=15, trapped_count=4),
        current_needs=[
            Need(need_id="N-FOOD", type=NeedType.FOOD, urgency=UrgencyLevel.MEDIUM, confidence=0.8),
            Need(need_id="N-WATER", type=NeedType.WATER, urgency=UrgencyLevel.MEDIUM, confidence=0.8),
        ],
    )
    needs = needs_engine.extract_needs(incident)
    types_found = {n.type for n in needs}
    assert NeedType.RESCUE in types_found
    assert NeedType.MEDICAL in types_found
    assert NeedType.FOOD in types_found
    assert NeedType.WATER in types_found
    assert NeedType.SHELTER in types_found
    assert NeedType.TRANSPORT in types_found


def test_4_missing_information(needs_engine):
    """4. Missing optional information handled safely without crashes."""
    incident = Incident(
        incident_id="INC-MINIMAL",
        title="Minimal Data",
        location=Location(lat=12.9, lng=77.6),
    )
    needs = needs_engine.extract_needs(incident)
    assert isinstance(needs, list)


def test_5_confidence_propagation(needs_engine):
    """5. Confidence propagation from linked evidence to needs."""
    ev = Evidence(
        evidence_id="EV-1",
        report_id="R-1",
        needs=[NeedType.MEDICAL],
        confidence=EvidenceConfidence(needs=0.75),
    )
    link = EvidenceLink(
        link_id="EL-1",
        incident_id="INC-CONF",
        evidence_id="EV-1",
        link_rationale="High similarity",
    )
    object.__setattr__(link, "evidence", ev)

    incident = Incident(
        incident_id="INC-CONF",
        title="Confidence Test",
        location=Location(lat=12.9, lng=77.6),
        evidence_links=[link],
    )
    needs = needs_engine.extract_needs(incident)
    med_need = next(n for n in needs if n.type == NeedType.MEDICAL)
    assert med_need.confidence == 0.75


def test_6_need_status_unmet(needs_engine):
    """6. Newly generated needs default to NeedStatus.UNMET."""
    incident = Incident(
        incident_id="INC-STATUS",
        title="Status Test",
        location=Location(lat=12.9, lng=77.6),
        people_affected=3,
        access_status=AccessStatus.BLOCKED,
    )
    needs = needs_engine.extract_needs(incident)
    for n in needs:
        assert n.status == NeedStatus.UNMET


def test_7_no_unsupported_needs(needs_engine):
    """7. Does not invent unsupported/hallucinated need types."""
    incident = Incident(
        incident_id="INC-UNSUP",
        title="Clean Needs",
        location=Location(lat=12.9, lng=77.6),
        people_affected=2,
    )
    needs = needs_engine.extract_needs(incident)
    for n in needs:
        assert n.type in NeedsEngine.SUPPORTED_NEEDS
