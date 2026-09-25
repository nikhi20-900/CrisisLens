"""
Tests 30–37: Recommendation Engine Unit Tests
"""

import pytest
from app.schemas.domain import (
    Incident,
    Location,
    Need,
    NeedType,
    UrgencyLevel,
    VerificationStatus,
    Resource,
    ResourceType,
    ResourceAvailability,
)
from app.services.response.priority import PriorityResult, SeverityLevel
from app.services.response.matcher import ResourceMatch, MatchDecision
from app.services.response.recommendations import RecommendationEngine


@pytest.fixture
def rec_engine():
    return RecommendationEngine()


@pytest.fixture
def sample_incident():
    return Incident(
        incident_id="INC-REC-1",
        title="Recommendation Incident",
        location=Location(lat=12.9, lng=77.6),
        people_affected=5,
    )


@pytest.fixture
def sample_priority():
    return PriorityResult(
        score=85.0,
        priority_level=SeverityLevel.CRITICAL,
        factors={"severity": 1.0},
        reasons=["5 people trapped in floodwaters.", "Medical attention required."],
        confidence=0.9,
    )


def test_30_rescue_recommendation(rec_engine, sample_incident, sample_priority):
    """30. ActionPlan generated for rescue need with rescue resource."""
    boat_res = Resource(
        resource_id="RES-01",
        name="Rescue Boat Alpha",
        resource_type=ResourceType.RESCUE_BOAT,
        location=Location(lat=12.9, lng=77.6),
        availability=ResourceAvailability.AVAILABLE,
        capacity=6,
    )
    matches = [
        ResourceMatch(
            resource_id="RES-01",
            resource=boat_res,
            need_type=NeedType.RESCUE,
            decision=MatchDecision.MATCH,
            reasons=["Available boat"],
        )
    ]
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH)],
        priority_result=sample_priority,
        matches=matches,
    )
    assert plan.incident_id == sample_incident.incident_id
    assert len(plan.recommended_resources) == 1
    assert plan.recommended_resources[0].resource_id == "RES-01"


def test_31_medical_recommendation(rec_engine, sample_incident, sample_priority):
    """31. ActionPlan generated for medical need with ambulance resource."""
    med_res = Resource(
        resource_id="RES-02",
        name="Ambulance 03",
        resource_type=ResourceType.AMBULANCE,
        location=Location(lat=12.9, lng=77.6),
        availability=ResourceAvailability.AVAILABLE,
        capacity=2,
    )
    matches = [
        ResourceMatch(
            resource_id="RES-02",
            resource=med_res,
            need_type=NeedType.MEDICAL,
            decision=MatchDecision.MATCH,
            reasons=["Available ambulance"],
        )
    ]
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[Need(need_id="N-1", type=NeedType.MEDICAL, urgency=UrgencyLevel.CRITICAL)],
        priority_result=sample_priority,
        matches=matches,
    )
    assert len(plan.recommended_resources) == 1
    assert plan.recommended_resources[0].resource_type == ResourceType.AMBULANCE


def test_32_multiple_recommendations_and_resources(rec_engine, sample_incident, sample_priority):
    """32. ActionPlan includes multiple matched resources for distinct needs."""
    boat_res = Resource(
        resource_id="RES-01",
        name="Rescue Boat Alpha",
        resource_type=ResourceType.RESCUE_BOAT,
        location=Location(lat=12.9, lng=77.6),
        capacity=6,
    )
    med_res = Resource(
        resource_id="RES-02",
        name="Ambulance 03",
        resource_type=ResourceType.AMBULANCE,
        location=Location(lat=12.9, lng=77.6),
        capacity=2,
    )
    matches = [
        ResourceMatch(resource_id="RES-01", resource=boat_res, need_type=NeedType.RESCUE, decision=MatchDecision.MATCH),
        ResourceMatch(resource_id="RES-02", resource=med_res, need_type=NeedType.MEDICAL, decision=MatchDecision.MATCH),
    ]
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[],
        priority_result=sample_priority,
        matches=matches,
    )
    assert len(plan.recommended_resources) == 2


def test_33_no_matching_resource(rec_engine, sample_incident, sample_priority):
    """33. ActionPlan handles no matching resource with explicit rationale."""
    matches = [
        ResourceMatch(
            need_type=NeedType.WATER,
            decision=MatchDecision.NO_MATCH,
            reasons=["No water units available"],
        )
    ]
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[Need(need_id="N-1", type=NeedType.WATER, urgency=UrgencyLevel.MEDIUM)],
        priority_result=sample_priority,
        matches=matches,
    )
    assert len(plan.recommended_resources) == 0
    assert "no available compatible resource" in plan.resource_rationale.lower()


def test_34_insufficient_resource(rec_engine, sample_incident, sample_priority):
    """34. ActionPlan reflects insufficient capacity in resource rationale."""
    matches = [
        ResourceMatch(
            need_type=NeedType.RESCUE,
            decision=MatchDecision.INSUFFICIENT,
            required_capacity=50,
            available_capacity=6,
            reasons=["Capacity insufficient"],
        )
    ]
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[],
        priority_result=sample_priority,
        matches=matches,
    )
    assert "requires capacity 50" in plan.resource_rationale


def test_35_rationale_contains_actual_facts(rec_engine, sample_incident, sample_priority):
    """35. Rationale contains grounded factual data from priority reasons and resource names."""
    boat_res = Resource(
        resource_id="RES-01",
        name="Rescue Boat Alpha",
        resource_type=ResourceType.RESCUE_BOAT,
        location=Location(lat=12.9, lng=77.6),
        capacity=6,
    )
    matches = [
        ResourceMatch(resource_id="RES-01", resource=boat_res, need_type=NeedType.RESCUE, decision=MatchDecision.MATCH)
    ]
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[],
        priority_result=sample_priority,
        matches=matches,
    )
    assert "Rescue Boat Alpha" in plan.resource_rationale
    assert "5 people trapped" in plan.priority_rationale[0]


def test_36_correct_incident_association(rec_engine, sample_incident, sample_priority):
    """36. ActionPlan correctly associated with target incident ID."""
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[],
        priority_result=sample_priority,
        matches=[],
    )
    assert plan.incident_id == "INC-REC-1"


def test_37_initial_state_is_pending(rec_engine, sample_incident, sample_priority):
    """37. Newly generated ActionPlan has verification_status == PENDING."""
    plan = rec_engine.generate_action_plan(
        incident=sample_incident,
        needs=[],
        priority_result=sample_priority,
        matches=[],
    )
    assert plan.verification_status == VerificationStatus.PENDING
