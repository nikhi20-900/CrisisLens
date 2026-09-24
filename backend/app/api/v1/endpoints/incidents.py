from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.domain import Incident, IncidentSnapshot, EvidenceLink
from app.services.incident_fusion import incident_fusion_service

router = APIRouter()


@router.get("/", response_model=List[Incident])
async def list_incidents():
    """Lists all active and evolving incidents for the Command Center dashboard."""
    return incident_fusion_service.list_incidents()


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    """Retrieves full detail of a specific incident including impact, needs, and contradictions."""
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident


@router.get("/{incident_id}/timeline", response_model=List[IncidentSnapshot])
async def get_incident_timeline(incident_id: str):
    """Retrieves chronological situation snapshots showing situation evolution and 'What changed?'."""
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident.snapshots


@router.get("/{incident_id}/evidence", response_model=List[EvidenceLink])
async def get_incident_evidence(incident_id: str):
    """Retrieves all linked evidence items that contributed to the incident."""
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident.evidence_links
