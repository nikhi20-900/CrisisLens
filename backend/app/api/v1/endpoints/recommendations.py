from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.schemas.domain import ActionPlan, VerificationStatus
from app.services.response_engine import response_engine_service

router = APIRouter()


class VerificationRequest(BaseModel):
    responder_id: str
    status: VerificationStatus
    notes: Optional[str] = None


@router.get("/{incident_id}", response_model=Optional[ActionPlan])
async def get_incident_recommendation(incident_id: str):
    """Retrieves the active response recommendation for an incident."""
    for plan in response_engine_service._action_plans.values():
        if plan.incident_id == incident_id:
            return plan
    raise HTTPException(status_code=404, detail="No active recommendation found for incident")


@router.post("/{action_id}/verify", response_model=ActionPlan)
async def verify_recommendation(action_id: str, payload: VerificationRequest):
    """Responder verifies, approves, edits, or rejects an AI recommendation."""
    try:
        updated_plan = await response_engine_service.verify_recommendation(
            action_id=action_id,
            status=payload.status,
            responder_id=payload.responder_id,
            notes=payload.notes,
        )
        return updated_plan
    except KeyError:
        raise HTTPException(status_code=404, detail=f"ActionPlan {action_id} not found")
