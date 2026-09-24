# CrisisLens AI — Module Integration Contract

This document defines the strict communication and data exchange interfaces between the 4 subteam modules.

```
[MEMBER 1: AI Evidence Extraction]
               │  Evidence (Pydantic / JSON)
               ▼
[MEMBER 2: Incident Fusion & Situation Evolution]
               │  Incident + Snapshots ("What Changed?") + Needs Context
               ▼
[MEMBER 3: Priority Scoring & Resource Matching]
               │  Action Plan + Explainable Rationale + Verification State
               ▼
[MEMBER 4: Command Center Frontend Dashboard]
```

---

## 1. Member 1 → Member 2: Evidence Output Contract

- **Sender**: `backend/app/services/evidence_analysis.py` (Member 1)
- **Receiver**: `backend/app/services/incident_fusion.py` (Member 2)
- **Interface**:
  ```python
  async def analyze_report(report: Report) -> Evidence
  ```
- **Contract Guarantees**:
  - `report_id` strictly preserved.
  - Every extracted property (`disaster_type`, `severity`, `people_affected`, `needs`, `access_status`, `location`, `urgency`) is confidence-scored (0.0 to 1.0) under `confidence`.
  - Incomplete reports do not crash; missing fields are explicitly set to `None` or `UNKNOWN` with low confidence.
  - Raw report is preserved under `raw_report`.

---

## 2. Member 2 → Member 3: Incident & Needs Evolution Contract

- **Sender**: `backend/app/services/incident_fusion.py` (Member 2)
- **Receiver**: `backend/app/services/response_engine.py` (Member 3)
- **Interface**:
  ```python
  async def recommend_response(incident: Incident) -> ActionPlan
  ```
- **Contract Guarantees**:
  - `incident.current_needs` contains deduplicated list of active `Need` objects with their status (`UNMET`, `IN_PROGRESS`, `MET`).
  - `incident.snapshots` contains the complete chronological sequence of `IncidentSnapshot` objects, each with a calculated `delta_summary` ("What changed?").
  - `incident.contradictions` contains any flagged conflicting reports requiring human attention.

---

## 3. Member 2 / 3 → Member 4: Command Center API Contract

RESTful JSON API exposed by FastAPI under prefix `/api/v1`.

### Endpoints Specification

| Method | Endpoint | Description | Consumed By Member 4 Component |
|---|---|---|---|
| `POST` | `/api/v1/reports/` | Ingests new raw report, triggers analysis, fusion, and response update | Live Simulation Bar / Reporter Modal |
| `GET` | `/api/v1/incidents/` | Lists all active and evolving incidents | Live Incident Sidebar / Incident List |
| `GET` | `/api/v1/incidents/{incident_id}` | Detailed incident state, current impact, needs | Incident Detail Panel |
| `GET` | `/api/v1/incidents/{incident_id}/timeline` | Chronological snapshots with "What Changed?" diffs | Situation Timeline & Delta Banner |
| `GET` | `/api/v1/incidents/{incident_id}/evidence` | List of linked evidence items supporting the incident | Evidence Traceability Panel |
| `GET` | `/api/v1/recommendations/{incident_id}` | Active AI recommendation with explainable reasons | Decision Support Card |
| `POST` | `/api/v1/recommendations/{action_id}/verify` | Responder approves, edits, or verifies recommendation | Verification Action Buttons |
| `POST` | `/api/v1/recommendations/{action_id}/reject` | Responder rejects recommendation with feedback notes | Rejection / Override Dialog |

### Request / Response Payloads

#### `POST /api/v1/reports/`
**Request**:
```json
{
  "report_id": "R-003",
  "text": "Five people are trapped near the bridge. Water level rising fast.",
  "media": [],
  "location": { "lat": 12.9351, "lng": 77.6243, "address": "Bakery at Central Bridge" },
  "source": "emergency_call"
}
```
**Response**:
```json
{
  "status": "success",
  "report_id": "R-003",
  "evidence": { "evidence_id": "EV-003", "people_affected": 5, "needs": ["rescue"] },
  "incident_id": "INC-001",
  "active_recommendation": { "action_id": "ACT-001", "priority_score": 85.0 }
}
```

#### `POST /api/v1/recommendations/{action_id}/verify`
**Request**:
```json
{
  "responder_id": "COMMANDER-01",
  "status": "approved",
  "notes": "Units deployed via north ramp"
}
```
**Response**:
```json
{
  "action_id": "ACT-001",
  "verification_status": "approved",
  "verified_by": "COMMANDER-01",
  "verified_at": "2026-09-25T10:28:00Z"
}
```
