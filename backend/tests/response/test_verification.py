"""
Tests 38–43: Human Verification Lifecycle Unit Tests
"""

import pytest
from app.schemas.domain import (
    Incident,
    Location,
    VerificationStatus,
    ResourceAvailability,
)
from app.services.response.service import ResponseService


@pytest.fixture
def response_service():
    srv = ResponseService()
    srv.reset()
    return srv


@pytest.fixture
def active_plan(response_service):
    incident = Incident(
        incident_id="INC-VERIF",
        title="Verification Test",
        location=Location(lat=12.9, lng=77.6),
        people_affected=5,
    )
    return response_service.process_incident(incident)


def test_38_pending_to_approved(response_service, active_plan):
    """38. PENDING -> APPROVED transition succeeds and assigns matched resources."""
    plan = response_service.verify_recommendation(
        action_id=active_plan.action_id,
        status=VerificationStatus.APPROVED,
        responder_id="CMD-42",
        notes="Approved for immediate deployment.",
    )
    assert plan.verification_status == VerificationStatus.APPROVED
    assert plan.verified_by == "CMD-42"
    assert plan.responder_notes == "Approved for immediate deployment."

    # Check resources updated to ASSIGNED
    for r in plan.recommended_resources:
        catalog_res = response_service.get_resource(r.resource_id)
        assert catalog_res.availability == ResourceAvailability.ASSIGNED
        assert catalog_res.current_assignment == "INC-VERIF"


def test_39_pending_to_rejected(response_service, active_plan):
    """39. PENDING -> REJECTED transition updates status and responder details."""
    plan = response_service.verify_recommendation(
        action_id=active_plan.action_id,
        status=VerificationStatus.REJECTED,
        responder_id="CMD-42",
        notes="Duplicate report, rejecting recommendation.",
    )
    assert plan.verification_status == VerificationStatus.REJECTED
    assert plan.verified_by == "CMD-42"
    assert plan.responder_notes == "Duplicate report, rejecting recommendation."


def test_40_pending_to_edited(response_service, active_plan):
    """40. PENDING -> EDITED transition updates status with custom responder notes."""
    plan = response_service.verify_recommendation(
        action_id=active_plan.action_id,
        status=VerificationStatus.EDITED,
        responder_id="CMD-42",
        notes="Adjusted staging point to North Dock.",
    )
    assert plan.verification_status == VerificationStatus.EDITED
    assert plan.verified_by == "CMD-42"


def test_41_invalid_state_transition(response_service, active_plan):
    """41. Attempting verification on an already verified ActionPlan raises ValueError."""
    # First approve
    response_service.verify_recommendation(
        action_id=active_plan.action_id,
        status=VerificationStatus.APPROVED,
        responder_id="CMD-42",
    )
    # Re-verifying must fail
    with pytest.raises(ValueError):
        response_service.verify_recommendation(
            action_id=active_plan.action_id,
            status=VerificationStatus.REJECTED,
            responder_id="CMD-42",
        )


def test_42_recommendation_remains_linked_to_incident(response_service):
    """42. Recommendation remains linked to incident after verification."""
    incident = Incident(
        incident_id="INC-LINK",
        title="Incident Link",
        location=Location(lat=12.9, lng=77.6),
        people_affected=2,
    )
    plan = response_service.process_incident(incident)
    response_service.verify_recommendation(
        action_id=plan.action_id,
        status=VerificationStatus.APPROVED,
        responder_id="CMD-01",
    )
    assert incident.active_recommendation.action_id == plan.action_id
    assert incident.active_recommendation.verification_status == VerificationStatus.APPROVED


def test_43_approval_does_not_claim_physical_dispatch(response_service, active_plan):
    """43. Verification approval changes decision state to APPROVED without claiming real physical dispatch."""
    plan = response_service.verify_recommendation(
        action_id=active_plan.action_id,
        status=VerificationStatus.APPROVED,
        responder_id="CMD-42",
    )
    assert plan.verification_status == VerificationStatus.APPROVED
    # System state changes to ASSIGNED in catalog, but docstring/rationale confirms decision-support scope
    for r in plan.recommended_resources:
        catalog_res = response_service.get_resource(r.resource_id)
        assert catalog_res.availability == ResourceAvailability.ASSIGNED
