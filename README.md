# CrisisLens AI — Disaster Situation Intelligence Platform

> **AI-powered multimodal disaster intelligence platform converting chaotic flood evidence into one evolving, explainable incident model with dynamic resource matching and human verification.**

---

## 1. Project Overview

During catastrophic weather events like flash floods, emergency command centers are inundated by hundreds of fragmented, noisy, and unstructured reports: 911 dispatch calls, citizen smartphone photos, drone footage, social media posts, and IoT hydrology gauges. Responders lose critical hours trying to correlate separate messages and decipher what has changed on the ground.

**CrisisLens AI** solves this operational bottleneck. It digests incoming multimodal flood reports, extracts confidence-scored structured evidence, fuses related reports into **ONE continuously evolving Incident object**, detects real-time situational changes ("What Changed?"), calculates explainable priority scores, matches available emergency rescue resources, and allows human incident commanders to verify, edit, or reject the recommended deployment.

---

## 2. The Problem

1. **Information Overload & Duplication**: 100 callers reporting the same flooded street create 100 duplicate incident tickets in legacy 911 dispatch systems.
2. **Missing Situational Evolution**: First responders are forced to re-read multiple log entries to understand that a stranded group of 5 has now reported a medical emergency or that the road is now impassable.
3. **Black-Box AI Distrust**: Autonomous AI dispatching without clear rationale or human oversight creates dangerous liability in life-and-death disaster scenarios.
4. **Fragmented Resources**: Available rescue boats, ambulances, and pumps are not dynamically linked to verified granular needs.

---

## 3. The Solution

CrisisLens AI introduces a structured, explainable intelligence pipeline:
- **Multimodal AI Ingestion**: Extracts disaster type, severity, trapped counts, access status, and urgency with field-level confidence ratings.
- **Incident Fusion**: Unifies spatial, temporal, and semantic signals to merge multiple reports into a single living incident.
- **Situation Evolution Engine**: Compares snapshots to generate concise, human-readable diffs (*"+5 people affected", "Access status changed to BLOCKED", "Critical medical need detected"*).
- **Explainable Dynamic Priority**: Calculates transparent priority scores (0–100) grounded in clear criteria.
- **Dynamic Resource Matching**: Matches live available rescue assets to unmet needs.
- **Human-in-the-Loop Verification**: Incident commanders retain full authority to approve, adjust, or reject deployment recommendations.

---

## 4. Core Innovation

Unlike generic LLM chat wrappers or static dashboard visualizations, CrisisLens treats the **Evolving Incident as a first-class stateful object**. Every new piece of incoming evidence triggers differential state evolution, creates an immutable audit snapshot, updates an explainable priority model, and alerts commanders strictly to the delta of what has changed.

---

## 5. MVP Scope

For this hackathon demonstration, CrisisLens AI is focused on:
- **Disaster Type**: **FLOOD** (Flash flooding, river overflow, urban water inundation).
- **Scenario**: 12 sequential reports spanning 10:02 AM to 10:45 AM depicting the Sector 4 Central Market Bridge flood crisis.
- **Execution Mode**: Deterministic and mock AI fallbacks to guarantee 100% reliable, zero-latency live judging demonstrations without reliance on unstable external networks.

---

## 6. Architecture & Data Flow

```
RAW DISASTER EVIDENCE (Images, Text, Location, Calls)
        ↓
[MEMBER 1] AI EVIDENCE ANALYSIS LAYER (Field Confidence, Entity Extraction)
        ↓
STRUCTURED EVIDENCE OBJECT
        ↓
[MEMBER 2] INCIDENT FUSION ENGINE (Spatial/Temporal/Semantic Clustering)
        ↓
ONE EVOLVING INCIDENT OBJECT
        ↓
SITUATION EVOLUTION ("What Changed?" Snapshot Diffs)
        ↓
NEEDS & IMPACT IDENTIFICATION (Rescue, Medical, Access Status)
        ↓
[MEMBER 3] DYNAMIC PRIORITY SCORING (Explainable Criteria)
        ↓
RESOURCE MATCHING & ACTION PLAN RECOMMENDATION
        ↓
[MEMBER 4] COMMAND CENTER DASHBOARD & HUMAN VERIFICATION
        ↓
DISPATCH & AUDIT TRAIL
```

---

## 7. Repository Structure

```
CrisisLens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── reports.py         # Ingestion endpoint
│   │   │       │   ├── incidents.py       # Incident & snapshot queries
│   │   │       │   └── recommendations.py # Decision & verification endpoints
│   │   │       └── router.py
│   │   ├── core/
│   │   │   └── config.py                  # Environment & settings
│   │   ├── models/                        # Persistence models (if DB added)
│   │   ├── schemas/
│   │   │   ├── domain.py                  # Shared Pydantic contracts
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── evidence_analysis.py       # Member 1 ownership
│   │   │   ├── incident_fusion.py         # Member 2 ownership
│   │   │   └── response_engine.py         # Member 3 ownership
│   │   └── main.py                        # FastAPI entrypoint
│   ├── tests/
│   │   ├── test_evidence_analysis.py      # Member 1 unit tests
│   │   ├── test_incident_fusion.py        # Member 2 unit tests
│   │   └── test_response_engine.py        # Member 3 unit tests
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/                    # Reusable UI widgets
│   │   ├── features/                      # Domain feature modules
│   │   ├── pages/                         # Command Center views
│   │   ├── services/
│   │   │   └── api.ts                     # Typed API client
│   │   ├── types/
│   │   │   ├── domain.ts                  # Shared TypeScript contracts
│   │   │   └── index.ts
│   │   ├── lib/                           # Utility functions
│   │   ├── App.tsx                        # Main Command Center UI shell
│   │   ├── index.css                      # Design tokens & theme
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
├── data/
│   ├── demo/
│   │   ├── flood_scenario.json            # 12 sequential flood reports
│   │   └── resources.json                 # Pre-configured rescue units
│   └── README.md
│
├── docs/
│   ├── architecture/
│   │   ├── domain_contracts.md            # Canonical domain models
│   │   └── integration.md                 # Inter-module integration contract
│   ├── api/
│   │   └── contracts.md                   # OpenAPI reference
│   ├── demo/
│   │   └── demo-scenario.md               # Presentation guide for judges
│   └── issues/                            # GitHub issues & ownership specs
│
├── scripts/
│   ├── setup_dev.sh                       # Local development setup script
│   └── simulate_reports.py                # Live report feeder for demo
│
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml
```

---

## 8. Team Responsibilities & Ownership

| Member | Domain Area | Key Responsibilities | Primary Code Boundaries |
|---|---|---|---|
| **Member 1** | **AI & Multimodal Evidence Analysis** | Text, image, and location extraction; field-level confidence scoring; fallback mock parser; handling incomplete reports. | `backend/app/services/evidence_analysis.py`<br>`backend/tests/test_evidence_analysis.py` |
| **Member 2** | **Incident Intelligence & Evolution** | Incident creation and matching; evidence linking; situation snapshots; generating "What Changed?" diffs; contradiction detection. | `backend/app/services/incident_fusion.py`<br>`backend/tests/test_incident_fusion.py` |
| **Member 3** | **Decision & Response Intelligence** | Needs extraction; explainable dynamic priority calculation (0-100); resource catalog matching; action plan recommendations; human verification state machine. | `backend/app/services/response_engine.py`<br>`backend/tests/test_response_engine.py` |
| **Member 4** | **Frontend & Command Center** | Live incident dashboard; geospatial map component; timeline with "What Changed?"; resource recommendation cards; human verification workflow (approve/reject/edit). | `frontend/src/`<br>`frontend/src/services/api.ts` |

---

## 9. Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### Option A: Automated Setup
```bash
./scripts/setup_dev.sh
```

### Option B: Manual Setup

1. **Clone & Configure Environment**:
   ```bash
   cp .env.example .env
   ```

2. **Backend**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Docker Compose**:
   ```bash
   docker-compose up --build
   ```

---

## 10. Live Demo Flow

To run the live 12-report flood simulation:

1. Start backend (`http://localhost:8000`) and frontend (`http://localhost:5173`).
2. Run the simulation feeder:
   ```bash
   python scripts/simulate_reports.py 2.5
   ```
3. Watch the Command Center dashboard:
   - Report 1 initializes `INC-001`.
   - Reports 2 & 3 fuse into the same incident; stranded count increases to 5.
   - Report 5 blocks road access.
   - Report 7 injects a critical medical emergency; priority jumps to 88.5; rescue boat and ambulance are recommended.
   - Incident Commander verifies recommendation with one click.
   - Reports 10–12 show evacuation completion and water level recession.

Refer to [`docs/demo/demo-scenario.md`](file:///Users/nikhilchhetri/Crisis%20Lens/CrisisLens/docs/demo/demo-scenario.md) for full presentation talk track.

---

## 11. API Contracts

- Ingestion: `POST /api/v1/reports/`
- Incident List: `GET /api/v1/incidents/`
- Incident Detail: `GET /api/v1/incidents/{incident_id}`
- Situation Timeline: `GET /api/v1/incidents/{incident_id}/timeline`
- Contributing Evidence: `GET /api/v1/incidents/{incident_id}/evidence`
- Recommendation: `GET /api/v1/recommendations/{incident_id}`
- Verify Recommendation: `POST /api/v1/recommendations/{action_id}/verify`

Full schema definitions are in [`docs/architecture/domain_contracts.md`](file:///Users/nikhilchhetri/Crisis%20Lens/CrisisLens/docs/architecture/domain_contracts.md).

---

## 12. Current Implementation Status

- [x] Repository scaffolding completed (Frontend, Backend, Demo Data, Docs, Scripts).
- [x] Shared domain contracts implemented in Python (Pydantic) and TypeScript.
- [x] Integration contract and OpenAPI specs established.
- [x] 12-report flood scenario data created.
- [x] Initial service interfaces, deterministic mocks, and test suites created.
- [x] 4 member GitHub issues and 1 parent MVP tracking issue created.
- [ ] Member 1: Multimodal model integration (Gemini Vision / local fallback).
- [ ] Member 2: Advanced spatiotemporal incident clustering algorithms.
- [ ] Member 3: Complex multi-resource capacity optimization.
- [ ] Member 4: Leaflet / MapLibre interactive map integration.
