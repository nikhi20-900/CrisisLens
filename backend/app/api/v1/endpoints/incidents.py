"""
Incident Intelligence API Endpoints
====================================
Exposes incident management, deterministic fusion matching, situation timeline,
structured diff ("What Changed?"), contradiction management, and field provenance.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.schemas.domain import (
    Incident,
    IncidentSnapshot,
    EvidenceLink,
    Evidence,
    MatchResult,
    Contradiction,
    SituationDelta,
    FieldProvenance,
)
from app.services.incidents import (
    incident_fusion_service,
)

router = APIRouter()


class ResolveContradictionRequest(BaseModel):
    chosen_value: Any = Field(None, description="The accepted factual value (e.g. 'open' or 'blocked')")
    resolution_notes: str = Field(..., description="Operator rationale explaining the resolution")
    resolver_id: Optional[str] = Field("operator_hq", description="Identifier of the human operator")


class MatchEvaluationResponse(BaseModel):
    matched_incident_id: Optional[str] = None
    match_result: MatchResult


class IngestEvidenceResponse(BaseModel):
    incident: Incident
    evidence_link: EvidenceLink
    match_result: MatchResult
    snapshot: IncidentSnapshot


@router.get("/", response_model=List[Incident])
async def list_incidents():
    """Lists all active and evolving incidents for the Command Center dashboard."""
    return incident_fusion_service.list_incidents()


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    """Retrieves full detail of a specific incident including impact, needs, contradictions, and provenance."""
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
    return incident_fusion_service.get_timeline(incident_id)


@router.get("/{incident_id}/evidence", response_model=List[EvidenceLink])
async def get_incident_evidence(incident_id: str):
    """Retrieves all linked evidence items that contributed to the incident."""
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident.evidence_links


@router.post("/match", response_model=MatchEvaluationResponse)
async def evaluate_evidence_match(evidence: Evidence):
    """
    Dry-run candidate match evaluation.
    Determines if incoming evidence matches an existing incident without modifying state.
    Returns explainable sub-scores (spatial, temporal, semantic, context) and decision.
    """
    matched_inc, match_res = await incident_fusion_service.evaluate_match(evidence)
    return MatchEvaluationResponse(
        matched_incident_id=matched_inc.incident_id if matched_inc else None,
        match_result=match_res,
    )


@router.post("/ingest", response_model=IngestEvidenceResponse)
async def ingest_evidence(evidence: Evidence):
    """
    Ingests structured evidence, matches or creates an incident, tracks provenance,
    generates append-only snapshots, and flags contradictions.
    """
    incident, link, match_result, snapshot = await incident_fusion_service.ingest_evidence(evidence)
    return IngestEvidenceResponse(
        incident=incident,
        evidence_link=link,
        match_result=match_result,
        snapshot=snapshot,
    )


@router.get("/{incident_id}/diff", response_model=SituationDelta)
async def get_situation_diff(
    incident_id: str,
    from_snapshot: Optional[str] = Query(None, description="Starting snapshot ID (e.g. SNAP-001)"),
    to_snapshot: Optional[str] = Query(None, description="Ending snapshot ID (e.g. SNAP-002)"),
):
    """
    Structured Situation Diff ('What Changed?').
    Returns clean field-level deltas between snapshots with zero noisy unchanged fields.
    """
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    diff = incident_fusion_service.diff_snapshots(
        incident_id=incident_id,
        from_snapshot_id=from_snapshot,
        to_snapshot_id=to_snapshot,
    )
    if not diff:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to compute diff for incident {incident_id} with given snapshots",
        )
    return diff


@router.get("/{incident_id}/contradictions", response_model=List[Contradiction])
async def get_incident_contradictions(
    incident_id: str,
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
):
    """Retrieves flagged contradictions/conflicts for human operator review."""
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    if resolved is None:
        return incident.contradictions
    return [c for c in incident.contradictions if c.resolved == resolved]


@router.post("/{incident_id}/contradictions/{contradiction_id}/resolve", response_model=Contradiction)
async def resolve_contradiction(
    incident_id: str,
    contradiction_id: str,
    request: ResolveContradictionRequest,
):
    """
    Human operator resolves a flagged contradiction, recording rationale and optionally updating state.
    """
    resolved = incident_fusion_service.resolve_contradiction(
        incident_id=incident_id,
        contradiction_id=contradiction_id,
        chosen_value=request.chosen_value,
        resolution_notes=request.resolution_notes,
        resolver_id=request.resolver_id,
    )
    if not resolved:
        raise HTTPException(
            status_code=404,
            detail=f"Contradiction {contradiction_id} on incident {incident_id} not found",
        )
    return resolved


@router.get("/{incident_id}/provenance", response_model=Dict[str, FieldProvenance])
async def get_incident_provenance(incident_id: str):
    """Retrieves field-level evidence provenance and confidence metrics."""
    incident = incident_fusion_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident.field_provenance
