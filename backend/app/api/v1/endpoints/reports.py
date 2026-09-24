from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.domain import Report, Evidence
from app.services.evidence_analysis import evidence_analyzer
from app.services.incident_fusion import incident_fusion_service
from app.services.response_engine import response_engine_service

router = APIRouter()


@router.post("/", response_model=Dict[str, Any])
async def submit_report(report: Report):
    """
    Submits a raw disaster report.
    Flow: Report -> AI Evidence Analysis -> Incident Fusion -> Response Recommendation
    """
    # 1. AI Evidence Analysis (Member 1)
    evidence = await evidence_analyzer.analyze_report(report)

    # 2. Incident Fusion & Evolution (Member 2)
    incident, link = await incident_fusion_service.match_or_create_incident(evidence)

    # 3. Decision & Resource Matching (Member 3)
    action_plan = await response_engine_service.recommend_response(incident)

    return {
        "status": "success",
        "report_id": report.report_id,
        "evidence": evidence,
        "evidence_link": link,
        "incident_id": incident.incident_id,
        "active_recommendation": action_plan,
    }
