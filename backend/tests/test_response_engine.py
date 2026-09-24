import pytest
from app.schemas.domain import (
    Incident,
    Location,
    SeverityLevel,
    AccessStatus,
    Need,
    NeedType,
    NeedStatus,
    UrgencyLevel,
    VerificationStatus,
    ResourceAvailability,
)
from app.services.response import ResponseEngineService


@pytest.mark.asyncio
async def test_priority_calculation_and_recommendation():
    engine = ResponseEngineService()
    incident = Incident(
        incident_id="INC-001",
        title="Flood Incident",
        location=Location(lat=12.935, lng=77.624),
        people_affected=5,
        access_status=AccessStatus.BLOCKED,
        current_needs=[
            Need(
                need_id="N-1",
                type=NeedType.RESCUE,
                urgency=UrgencyLevel.HIGH,
                confidence=0.9,
                status=NeedStatus.UNMET,
            ),
            Need(
                need_id="N-2",
                type=NeedType.MEDICAL,
                urgency=UrgencyLevel.CRITICAL,
                confidence=0.95,
                status=NeedStatus.UNMET,
            ),
        ],
    )

    score, level, reasons = await engine.calculate_priority(incident)
    assert score >= 70.0
    assert any("medical" in r.lower() for r in reasons)
    assert any("rescue" in r.lower() for r in reasons)

    recommendation = await engine.recommend_response(incident)
    assert recommendation.priority_score == score
    assert len(recommendation.recommended_resources) >= 2
    assert recommendation.verification_status == VerificationStatus.PENDING


@pytest.mark.asyncio
async def test_human_verification_workflow():
    engine = ResponseEngineService()
    incident = Incident(
        incident_id="INC-001",
        title="Flood Incident",
        location=Location(lat=12.935, lng=77.624),
        people_affected=2,
        access_status=AccessStatus.OPEN,
        current_needs=[
            Need(
                need_id="N-1",
                type=NeedType.RESCUE,
                urgency=UrgencyLevel.MEDIUM,
                confidence=0.85,
                status=NeedStatus.UNMET,
            )
        ],
    )
    rec = await engine.recommend_response(incident)

    # Human responder approves recommendation
    verified_plan = await engine.verify_recommendation(
        action_id=rec.action_id,
        status=VerificationStatus.APPROVED,
        responder_id="CHIEF-COMMANDER-42",
        notes="Rescue Alpha deployed via north perimeter route.",
    )
    assert verified_plan.verification_status == VerificationStatus.APPROVED
    assert verified_plan.verified_by == "CHIEF-COMMANDER-42"

    # Verify resource status shifted to ASSIGNED
    boat_resource = engine.get_resource("RES-01")
    assert boat_resource.availability == ResourceAvailability.ASSIGNED
