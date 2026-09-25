"""
Member 3: Decision & Response Intelligence Engine (Backward Compatibility Wrapper)
================================================================================
Wraps modular response sub-components (Needs, Priority, Resources, Matcher, Recommendations, Service)
to preserve existing public contracts.
"""

from typing import Protocol, List, Optional
from app.schemas.domain import (
    Incident,
    Resource,
    ActionPlan,
    VerificationStatus,
    SeverityLevel,
)
from app.services.response.service import ResponseService, response_service


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
        notes: Optional[str] = None,
    ) -> ActionPlan:
        """Processes human verification (approve/reject/edit)."""
        ...


class ResponseEngineService:
    """
    Backward-compatible facade wrapping ResponseService.
    """

    def __init__(self, service: Optional[ResponseService] = None):
        self._service = service or response_service

    @property
    def _resources(self) -> dict[str, Resource]:
        """Provides direct dictionary access for backward compatibility."""
        return self._service.resource_catalog._resources

    @property
    def _action_plans(self) -> dict[str, ActionPlan]:
        """Provides direct dictionary access for backward compatibility."""
        return self._service._action_plans

    def get_resource(self, resource_id: str) -> Optional[Resource]:
        return self._service.get_resource(resource_id)

    def list_resources(self) -> List[Resource]:
        return self._service.list_resources()

    async def calculate_priority(self, incident: Incident) -> tuple[float, SeverityLevel, List[str]]:
        result = self._service.priority_engine.calculate_priority(incident)
        return result.score, result.priority_level, result.reasons

    async def recommend_response(self, incident: Incident) -> ActionPlan:
        return self._service.process_incident(incident)

    async def verify_recommendation(
        self,
        action_id: str,
        status: VerificationStatus,
        responder_id: str,
        notes: Optional[str] = None,
    ) -> ActionPlan:
        return self._service.verify_recommendation(
            action_id=action_id, status=status, responder_id=responder_id, notes=notes
        )


response_engine_service = ResponseEngineService()
