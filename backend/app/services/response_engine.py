"""
Member 3: Decision & Response Intelligence Service
==================================================
Calculates dynamic explainable incident priorities, matches emergency resources,
generates actionable recommendations, and handles responder verification workflows.
"""

from typing import Protocol, List, Optional
from app.schemas.domain import (
    Incident,
    Resource,
    ResourceType,
    ResourceAvailability,
    ActionPlan,
    VerificationStatus,
    SeverityLevel,
    NeedStatus,
    NeedType,
    utc_now,
)


class ResponseEngineInterface(Protocol):
    """Interface for priority scoring, resource allocation, and recommendation verification."""

    async def calculate_priority(self, incident: Incident) -> tuple[float, SeverityLevel, List[str]]:
        """Calculates deterministic explainable score, severity level, and rationale list."""
        ...

    async def recommend_response(self, incident: Incident) -> ActionPlan:
        """Matches available resources against active unmet needs and generates an ActionPlan."""
        ...

    async def verify_recommendation(
        self,
        action_id: str,
        status: VerificationStatus,
        responder_id: str,
        notes: Optional[str] = None
    ) -> ActionPlan:
        """Processes human verification (approve/reject/edit)."""
        ...


class ResponseEngineService:
    """
    Demo/MVP implementation of Priority Calculation & Resource Matching Engine.
    """

    def __init__(self):
        # Demo resource catalog
        self._resources: dict[str, Resource] = {
            "RES-01": Resource(
                resource_id="RES-01",
                name="Water Rescue Boat Unit Alpha",
                resource_type=ResourceType.RESCUE_BOAT,
                location={"lat": 12.930, "lng": 77.620, "address": "Station 4 Dock"},
                availability=ResourceAvailability.AVAILABLE,
                capacity=6,
                estimated_eta_minutes=12,
            ),
            "RES-02": Resource(
                resource_id="RES-02",
                name="Rapid Medical Emergency Unit 03",
                resource_type=ResourceType.AMBULANCE,
                location={"lat": 12.940, "lng": 77.630, "address": "General Hospital Base"},
                availability=ResourceAvailability.AVAILABLE,
                capacity=2,
                estimated_eta_minutes=8,
            ),
            "RES-03": Resource(
                resource_id="RES-03",
                name="High-Capacity Evacuation Bus 09",
                resource_type=ResourceType.EVACUATION_BUS,
                location={"lat": 12.925, "lng": 77.615, "address": "City Transit Depot"},
                availability=ResourceAvailability.AVAILABLE,
                capacity=40,
                estimated_eta_minutes=20,
            ),
        }
        self._action_plans: dict[str, ActionPlan] = {}

    def get_resource(self, resource_id: str) -> Optional[Resource]:
        return self._resources.get(resource_id)

    def list_resources(self) -> List[Resource]:
        return list(self._resources.values())

    async def calculate_priority(self, incident: Incident) -> tuple[float, SeverityLevel, List[str]]:
        score = 30.0
        reasons = []

        if incident.people_affected > 0:
            boost = min(incident.people_affected * 8.0, 35.0)
            score += boost
            reasons.append(f"{incident.people_affected} people directly endangered")

        unmet_types = {n.type for n in incident.current_needs if n.status == NeedStatus.UNMET}
        if NeedType.MEDICAL in unmet_types:
            score += 20.0
            reasons.append("Critical medical attention required")
        if NeedType.RESCUE in unmet_types:
            score += 15.0
            reasons.append("Active water rescue needed")

        if incident.access_status.value in ["blocked", "submerged"]:
            score += 10.0
            reasons.append(f"Transportation access is {incident.access_status.value}")

        score = min(max(score, 10.0), 98.0)

        if score >= 80:
            level = SeverityLevel.CRITICAL
        elif score >= 60:
            level = SeverityLevel.HIGH
        elif score >= 40:
            level = SeverityLevel.MEDIUM
        else:
            level = SeverityLevel.LOW

        return round(score, 1), level, reasons

    async def recommend_response(self, incident: Incident) -> ActionPlan:
        score, level, reasons = await self.calculate_priority(incident)
        incident.priority_score = score
        incident.priority_level = level

        # Match resources to unmet needs
        matched_resources: List[Resource] = []
        unmet_types = {n.type for n in incident.current_needs if n.status == NeedStatus.UNMET}

        for res in self._resources.values():
            if res.availability == ResourceAvailability.AVAILABLE:
                if NeedType.RESCUE in unmet_types and res.resource_type in [ResourceType.RESCUE_BOAT, ResourceType.RESCUE_TEAM]:
                    if res not in matched_resources:
                        matched_resources.append(res)
                if NeedType.MEDICAL in unmet_types and res.resource_type in [ResourceType.AMBULANCE, ResourceType.MEDICAL_TEAM]:
                    if res not in matched_resources:
                        matched_resources.append(res)
                if NeedType.TRANSPORT in unmet_types and res.resource_type == ResourceType.EVACUATION_BUS:
                    if res not in matched_resources:
                        matched_resources.append(res)

        plan_id = f"ACT-{len(self._action_plans) + 1:03d}"
        res_names = ", ".join([r.name for r in matched_resources]) if matched_resources else "Standby staging units"
        plan = ActionPlan(
            action_id=plan_id,
            incident_id=incident.incident_id,
            priority_level=level,
            priority_score=score,
            priority_rationale=reasons,
            recommended_resources=matched_resources,
            resource_rationale=f"Matched {len(matched_resources)} units ({res_names}) based on unmet needs ({', '.join([n.value for n in unmet_types])})",
            verification_status=VerificationStatus.PENDING,
            created_at=utc_now(),
        )
        self._action_plans[plan_id] = plan
        incident.active_recommendation = plan
        return plan

    async def verify_recommendation(
        self,
        action_id: str,
        status: VerificationStatus,
        responder_id: str,
        notes: Optional[str] = None
    ) -> ActionPlan:
        plan = self._action_plans.get(action_id)
        if not plan:
            raise KeyError(f"ActionPlan {action_id} not found")

        plan.verification_status = status
        plan.verified_by = responder_id
        plan.verified_at = utc_now()
        if notes:
            plan.responder_notes = notes

        # Update resource status if approved
        if status == VerificationStatus.APPROVED:
            for r in plan.recommended_resources:
                if r.resource_id in self._resources:
                    self._resources[r.resource_id].availability = ResourceAvailability.ASSIGNED
                    self._resources[r.resource_id].current_assignment = plan.incident_id

        return plan


response_engine_service = ResponseEngineService()
