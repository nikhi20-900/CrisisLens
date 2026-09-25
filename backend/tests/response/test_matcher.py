"""
Tests 21–29: Resource Matcher Unit Tests
"""

import pytest
from app.schemas.domain import (
    Need,
    NeedType,
    UrgencyLevel,
    Resource,
    ResourceType,
    ResourceAvailability,
    Location,
)
from app.services.response.matcher import ResourceMatcher, MatchDecision


@pytest.fixture
def matcher():
    return ResourceMatcher()


@pytest.fixture
def sample_resources():
    return [
        Resource(
            resource_id="RES-01",
            name="Boat Alpha",
            resource_type=ResourceType.RESCUE_BOAT,
            location=Location(lat=12.9, lng=77.6),
            availability=ResourceAvailability.AVAILABLE,
            capacity=6,
        ),
        Resource(
            resource_id="RES-02",
            name="Ambulance 03",
            resource_type=ResourceType.AMBULANCE,
            location=Location(lat=12.9, lng=77.6),
            availability=ResourceAvailability.AVAILABLE,
            capacity=2,
        ),
        Resource(
            resource_id="RES-UNAVAIL",
            name="Boat Beta",
            resource_type=ResourceType.RESCUE_BOAT,
            location=Location(lat=12.9, lng=77.6),
            availability=ResourceAvailability.ASSIGNED,
            capacity=5,
        ),
    ]


def test_21_compatible_available_resource(matcher, sample_resources):
    """21. Compatible available resource matched successfully (MATCH)."""
    needs = [Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=4)]
    matches = matcher.match_resources_for_needs(needs, sample_resources)
    assert len(matches) == 1
    assert matches[0].decision == MatchDecision.MATCH
    assert matches[0].resource_id == "RES-01"


def test_22_wrong_resource_type(matcher, sample_resources):
    """22. Needs without compatible resource types return NO_MATCH."""
    needs = [Need(need_id="N-1", type=NeedType.WATER, urgency=UrgencyLevel.MEDIUM, quantity=10)]
    # Filter catalog to exclude food/water units
    rescue_only = [r for r in sample_resources if r.resource_type == ResourceType.RESCUE_BOAT]
    matches = matcher.match_resources_for_needs(needs, rescue_only)
    assert matches[0].decision == MatchDecision.NO_MATCH


def test_23_unavailable_resource(matcher):
    """23. Unavailable resource returns NO_MATCH with status explanation."""
    unavail_res = Resource(
        resource_id="RES-BUSY",
        name="Busy Ambulance",
        resource_type=ResourceType.AMBULANCE,
        location=Location(lat=12.9, lng=77.6),
        availability=ResourceAvailability.ASSIGNED,
        capacity=2,
    )
    needs = [Need(need_id="N-1", type=NeedType.MEDICAL, urgency=UrgencyLevel.HIGH, quantity=1)]
    matches = matcher.match_resources_for_needs(needs, [unavail_res])
    assert matches[0].decision == MatchDecision.NO_MATCH
    assert "assigned" in matches[0].reasons[0].lower()


def test_24_insufficient_capacity(matcher):
    """24. Resource with lower capacity than required returns INSUFFICIENT."""
    small_boat = Resource(
        resource_id="RES-SMALL",
        name="Dinghy",
        resource_type=ResourceType.RESCUE_BOAT,
        location=Location(lat=12.9, lng=77.6),
        availability=ResourceAvailability.AVAILABLE,
        capacity=2,
    )
    needs = [Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=10)]
    matches = matcher.match_resources_for_needs(needs, [small_boat])
    assert matches[0].decision == MatchDecision.INSUFFICIENT
    assert matches[0].required_capacity == 10
    assert matches[0].available_capacity == 2


def test_25_available_alternative_resource(matcher):
    """25. Matches alternative compatible resource type (e.g. RESCUE_TEAM when RESCUE_BOAT not present)."""
    team_res = Resource(
        resource_id="RES-TEAM",
        name="Rescue Team Ground",
        resource_type=ResourceType.RESCUE_TEAM,
        location=Location(lat=12.9, lng=77.6),
        availability=ResourceAvailability.AVAILABLE,
        capacity=5,
    )
    needs = [Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=3)]
    matches = matcher.match_resources_for_needs(needs, [team_res])
    assert matches[0].decision == MatchDecision.MATCH
    assert matches[0].resource_id == "RES-TEAM"


def test_26_multiple_matching_resources(matcher, sample_resources):
    """26. Multiple needs matched to distinct resources."""
    needs = [
        Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=4),
        Need(need_id="N-2", type=NeedType.MEDICAL, urgency=UrgencyLevel.HIGH, quantity=1),
    ]
    matches = matcher.match_resources_for_needs(needs, sample_resources)
    matched_ids = [m.resource_id for m in matches if m.decision == MatchDecision.MATCH]
    assert len(matched_ids) == 2
    assert "RES-01" in matched_ids
    assert "RES-02" in matched_ids


def test_27_empty_resource_pool(matcher):
    """27. Empty resource pool handled safely returning NO_MATCH."""
    needs = [Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=2)]
    matches = matcher.match_resources_for_needs(needs, [])
    assert matches[0].decision == MatchDecision.NO_MATCH


def test_28_structured_resource_match_output(matcher, sample_resources):
    """28. Match returns fully populated structured ResourceMatch object."""
    needs = [Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=2)]
    matches = matcher.match_resources_for_needs(needs, sample_resources)
    m = matches[0]
    assert m.need_type == NeedType.RESCUE
    assert m.decision == MatchDecision.MATCH
    assert m.required_capacity == 2
    assert m.available_capacity == 6
    assert isinstance(m.reasons, list)
    assert len(m.reasons) > 0


def test_29_match_reasons_explainable(matcher, sample_resources):
    """29. Match reasons are explainable and grounded."""
    needs = [Need(need_id="N-1", type=NeedType.RESCUE, urgency=UrgencyLevel.HIGH, quantity=2)]
    matches = matcher.match_resources_for_needs(needs, sample_resources)
    reasons_text = " ".join(matches[0].reasons)
    assert "rescue_boat" in reasons_text.lower()
    assert "available" in reasons_text.lower()
    assert "capacity" in reasons_text.lower()
