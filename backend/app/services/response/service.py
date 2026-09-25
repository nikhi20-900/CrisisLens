"""
Phase 6 & 7: Response Service Orchestration & Human Verification
================================================================
Orchestrates Needs, Priority, Resource Matcher, and Recommendation engines,
and manages human verification workflows for ActionPlans.
"""

from typing import List, Dict, Optional
from app.schemas.domain import (
    Incident,
    ActionPlan,
    Resource,
    VerificationStatus,
    ResourceAvailability,
    utc_now,
)
from app.services.response.needs import NeedsEngine, needs_engine
from app.services.response.priority import PriorityEngine, priority_engine, PriorityResult
from app.services.response.resources import ResourceCatalog, default_resource_catalog
from app.services.response.matcher import ResourceMatcher, resource_matcher, ResourceMatch
from app.services.response.recommendations import RecommendationEngine, recommendation_engine


class ResponseService:
    """
    Primary orchestrator for the Decision & Response Intelligence layer.
    """

    def __init__(
        self,
        needs_eng: Optional[NeedsEngine] = None,
        priority_eng: Optional[PriorityEngine] = None,
        catalog: Optional[ResourceCatalog] = None,
        matcher: Optional[ResourceMatcher] = None,
        rec_engine: Optional[RecommendationEngine] = None,
    ):
        self.needs_engine = needs_eng or needs_engine
        self.priority_engine = priority_eng or priority_engine
        self.resource_catalog = catalog or default_resource_catalog
        self.resource_matcher = matcher or resource_matcher
        self.recommendation_engine = rec_engine or recommendation_engine
        self._action_plans: Dict[str, ActionPlan] = {}

    def process_incident(self, incident: Incident) -> ActionPlan:
        """
        Runs the full response pipeline:
        Needs -> Priority -> Resource Matching -> Recommendation ActionPlan.
        """
        # 1. Generate / resolve active needs
        needs = self.needs_engine.extract_needs(incident)
        incident.current_needs = needs

        # 2. Calculate priority result
        priority_res: PriorityResult = self.priority_engine.calculate_priority(incident)
        incident.priority_score = priority_res.score
        incident.priority_level = priority_res.priority_level

        # 3. Load catalog resources
        resources = self.resource_catalog.list_resources()

        # 4. Match resources against needs
        matches: List[ResourceMatch] = self.resource_matcher.match_resources_for_needs(
            needs, resources
        )

        # 5. Generate ActionPlan
        counter = len(self._action_plans) + 1
        plan = self.recommendation_engine.generate_action_plan(
            incident, needs, priority_res, matches, action_plan_counter=counter
        )

        # 6. Store and associate with incident
        self._action_plans[plan.action_id] = plan
        incident.active_recommendation = plan

        return plan

    def verify_recommendation(
        self,
        action_id: str,
        status: VerificationStatus,
        responder_id: str,
        notes: Optional[str] = None,
    ) -> ActionPlan:
        """
        Processes human verification status transitions:
        Allowed transitions: PENDING -> APPROVED, PENDING -> REJECTED, PENDING -> EDITED.
        Note: APPROVED signifies human responder recommendation approval, NOT physical dispatch.
        """
        plan = self._action_plans.get(action_id)
        if not plan:
            raise KeyError(f"ActionPlan '{action_id}' not found")

        if plan.verification_status != VerificationStatus.PENDING:
            raise ValueError(
                f"Invalid transition: ActionPlan '{action_id}' is already in status '{plan.verification_status.value}'."
            )

        if status not in (
            VerificationStatus.APPROVED,
            VerificationStatus.REJECTED,
            VerificationStatus.EDITED,
        ):
            raise ValueError(f"Invalid target verification status '{status}' from PENDING.")

        plan.verification_status = status
        plan.verified_by = responder_id
        plan.verified_at = utc_now()
        if notes:
            plan.responder_notes = notes

        # Update resource assignment status in catalog if APPROVED
        if status == VerificationStatus.APPROVED:
            for r in plan.recommended_resources:
                self.resource_catalog.update_availability(
                    r.resource_id,
                    status=ResourceAvailability.ASSIGNED,
                    assignment=plan.incident_id,
                )

        return plan

    def get_action_plan(self, action_id: str) -> Optional[ActionPlan]:
        """Retrieves an ActionPlan by ID."""
        return self._action_plans.get(action_id)

    def list_action_plans(self) -> List[ActionPlan]:
        """Lists all generated ActionPlans."""
        return list(self._action_plans.values())

    def get_resource(self, resource_id: str) -> Optional[Resource]:
        """Delegates to catalog."""
        return self.resource_catalog.get_resource(resource_id)

    def list_resources(self) -> List[Resource]:
        """Delegates to catalog."""
        return self.resource_catalog.list_resources()

    def reset(self) -> None:
        """Resets service state and resource catalog for test isolation."""
        self._action_plans.clear()
        self.resource_catalog.reset_to_default()


response_service = ResponseService()
