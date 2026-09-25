"""
Phase 5: Recommendation Engine
==============================
Generates ActionPlan domain objects combining priority scoring, needs analysis,
matched resources, and grounded decision rationales.
"""

from typing import List
from app.schemas.domain import (
    Incident,
    Need,
    ActionPlan,
    VerificationStatus,
    Resource,
    utc_now,
)
from app.services.response.priority import PriorityResult
from app.services.response.matcher import ResourceMatch, MatchDecision


class RecommendationEngine:
    """
    Generates actionable ActionPlan recommendations for command center review.
    """

    def generate_action_plan(
        self,
        incident: Incident,
        needs: List[Need],
        priority_result: PriorityResult,
        matches: List[ResourceMatch],
        action_plan_counter: int = 1,
    ) -> ActionPlan:
        """
        Creates an ActionPlan with grounded rationales and PENDING verification status.
        """
        plan_id = f"ACT-{action_plan_counter:03d}"

        # Extract successfully matched resources
        matched_resources: List[Resource] = [
            m.resource for m in matches if m.decision == MatchDecision.MATCH and m.resource is not None
        ]

        # Build grounded resource rationale string
        resource_rationale_parts = []
        if matched_resources:
            res_names = ", ".join([f"{r.name} ({r.resource_id})" for r in matched_resources])
            matched_need_types = ", ".join([m.need_type.value for m in matches if m.decision == MatchDecision.MATCH])
            resource_rationale_parts.append(
                f"Matched {len(matched_resources)} resource(s) [{res_names}] to address active needs ({matched_need_types})."
            )
        else:
            resource_rationale_parts.append("No compatible available resources could be matched to active needs.")

        # Note unmatched or insufficient needs
        for m in matches:
            if m.decision == MatchDecision.INSUFFICIENT:
                resource_rationale_parts.append(
                    f"Need '{m.need_type.value}' requires capacity {m.required_capacity}, but best available resource had capacity {m.available_capacity}."
                )
            elif m.decision == MatchDecision.NO_MATCH:
                resource_rationale_parts.append(
                    f"No available compatible resource found for need '{m.need_type.value}'."
                )

        resource_rationale = " ".join(resource_rationale_parts)

        return ActionPlan(
            action_id=plan_id,
            incident_id=incident.incident_id,
            priority_level=priority_result.priority_level,
            priority_score=priority_result.score,
            priority_rationale=priority_result.reasons,
            recommended_resources=matched_resources,
            resource_rationale=resource_rationale,
            verification_status=VerificationStatus.PENDING,
            created_at=utc_now(),
        )


recommendation_engine = RecommendationEngine()
