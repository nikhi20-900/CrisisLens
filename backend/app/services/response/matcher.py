"""
Phase 4: Resource Matching Engine
=================================
Matches active relief needs against available emergency resources,
producing structured, explainable ResourceMatch decisions.
"""

from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

from app.schemas.domain import (
    Need,
    NeedType,
    Resource,
    ResourceType,
    ResourceAvailability,
)


class MatchDecision(str, Enum):
    MATCH = "MATCH"
    NO_MATCH = "NO_MATCH"
    INSUFFICIENT = "INSUFFICIENT"


class ResourceMatch(BaseModel):
    """Structured decision output for matching a resource against a need."""

    resource_id: Optional[str] = Field(None, description="Matched resource ID if found")
    resource: Optional[Resource] = Field(None, description="Matched resource object")
    need_type: NeedType = Field(..., description="Target need type being evaluated")
    decision: MatchDecision = Field(..., description="Decision: MATCH, NO_MATCH, or INSUFFICIENT")
    compatibility_factors: Dict[str, Any] = Field(default_factory=dict, description="Details of matching criteria evaluated")
    reasons: List[str] = Field(default_factory=list, description="Explainable reasons for the match decision")
    required_capacity: int = Field(1, ge=0)
    available_capacity: int = Field(0, ge=0)
    availability: ResourceAvailability = Field(ResourceAvailability.AVAILABLE)


class ResourceMatcher:
    """
    Deterministic matching engine between Needs and Resources.
    """

    COMPATIBILITY_MAP: Dict[NeedType, List[ResourceType]] = {
        NeedType.RESCUE: [ResourceType.RESCUE_BOAT, ResourceType.RESCUE_TEAM, ResourceType.HELICOPTER],
        NeedType.MEDICAL: [ResourceType.AMBULANCE, ResourceType.MEDICAL_TEAM],
        NeedType.TRANSPORT: [ResourceType.EVACUATION_BUS],
        NeedType.FOOD: [ResourceType.FOOD_WATER_UNIT],
        NeedType.WATER: [ResourceType.FOOD_WATER_UNIT, ResourceType.WATER_PUMP],
        NeedType.SHELTER: [ResourceType.EVACUATION_BUS, ResourceType.FOOD_WATER_UNIT],
    }

    def match_resources_for_needs(
        self, needs: List[Need], available_resources: List[Resource]
    ) -> List[ResourceMatch]:
        """
        Evaluates available resources against unmet needs and returns structured ResourceMatch results.
        """
        matches: List[ResourceMatch] = []
        assigned_resource_ids = set()

        for need in needs:
            req_cap = need.quantity if need.quantity and need.quantity > 0 else 1
            compatible_types = self.COMPATIBILITY_MAP.get(need.type, [])

            if not compatible_types:
                matches.append(
                    ResourceMatch(
                        need_type=need.type,
                        decision=MatchDecision.NO_MATCH,
                        reasons=[f"No defined compatible resource types for need {need.type.value}."],
                        required_capacity=req_cap,
                        available_capacity=0,
                        availability=ResourceAvailability.AVAILABLE,
                    )
                )
                continue

            # Candidate pool of resources matching type
            candidates = [
                r for r in available_resources
                if r.resource_type in compatible_types and r.resource_id not in assigned_resource_ids
            ]

            if not candidates:
                matches.append(
                    ResourceMatch(
                        need_type=need.type,
                        decision=MatchDecision.NO_MATCH,
                        reasons=[f"No resources of type {[t.value for t in compatible_types]} present in catalog."],
                        required_capacity=req_cap,
                        available_capacity=0,
                        availability=ResourceAvailability.AVAILABLE,
                    )
                )
                continue

            # Check availability
            avail_candidates = [
                r for r in candidates if r.availability == ResourceAvailability.AVAILABLE
            ]

            if not avail_candidates:
                # Resources exist but are unavailable
                first_unavail = candidates[0]
                matches.append(
                    ResourceMatch(
                        resource_id=first_unavail.resource_id,
                        resource=first_unavail,
                        need_type=need.type,
                        decision=MatchDecision.NO_MATCH,
                        reasons=[
                            f"Resource {first_unavail.name} ({first_unavail.resource_id}) is currently {first_unavail.availability.value}."
                        ],
                        required_capacity=req_cap,
                        available_capacity=first_unavail.capacity,
                        availability=first_unavail.availability,
                    )
                )
                continue

            # Check capacity
            sufficient_candidates = [
                r for r in avail_candidates if r.capacity >= req_cap
            ]

            if not sufficient_candidates:
                best_insufficient = max(avail_candidates, key=lambda r: r.capacity)
                matches.append(
                    ResourceMatch(
                        resource_id=best_insufficient.resource_id,
                        resource=best_insufficient,
                        need_type=need.type,
                        decision=MatchDecision.INSUFFICIENT,
                        reasons=[
                            f"Resource {best_insufficient.name} capacity ({best_insufficient.capacity}) is insufficient for required capacity ({req_cap})."
                        ],
                        required_capacity=req_cap,
                        available_capacity=best_insufficient.capacity,
                        availability=best_insufficient.availability,
                    )
                )
                continue

            # Successful Match
            best_match = sufficient_candidates[0]
            assigned_resource_ids.add(best_match.resource_id)

            factors = {
                "correct_type": True,
                "availability": best_match.availability.value,
                "capacity": best_match.capacity,
                "eta_minutes": best_match.estimated_eta_minutes,
            }
            reasons = [
                f"Correct resource type ({best_match.resource_type.value})",
                "Resource is available",
                f"Capacity ({best_match.capacity}) is sufficient for required ({req_cap})",
            ]
            if best_match.estimated_eta_minutes:
                reasons.append(f"Estimated ETA is {best_match.estimated_eta_minutes} minutes")

            matches.append(
                ResourceMatch(
                    resource_id=best_match.resource_id,
                    resource=best_match,
                    need_type=need.type,
                    decision=MatchDecision.MATCH,
                    compatibility_factors=factors,
                    reasons=reasons,
                    required_capacity=req_cap,
                    available_capacity=best_match.capacity,
                    availability=best_match.availability,
                )
            )

        return matches


resource_matcher = ResourceMatcher()
