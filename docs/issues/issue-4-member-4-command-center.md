# [FRONTEND] Build CrisisLens Command Center Dashboard

**Assignee**: Member 4 (Frontend / Command Center)  
**Labels**: `component:frontend`, `member:4`, `p0`

## Objective
Build the responder-facing command center that visualizes the CrisisLens intelligence pipeline.
The dashboard must make the **evolving incident** the primary UI object.

## Core Screens & Components
1. **Live Incident Dashboard**: Incident list, priority badges, disaster type, location, status, severity.
2. **Geospatial Map**: Incident coordinates, impact radius, affected area.
3. **Incident Detail Panel**: Severity, people affected, current needs, accessibility status, confidence metrics, priority score.
4. **Evidence Panel**: Linked reports, raw text, and media contributing to the incident.
5. **Situation Timeline**: Chronological snapshots.
6. **"What Changed?" Section**: Differential changes highlighted across snapshots.
7. **Resource Recommendation Panel**: Matched resources, ETAs, matching rationale, verification state.
8. **Human Verification Controls**: Verify, Edit, Reject buttons triggering API verification state updates.

## Requirements
- Use shared API contracts (`frontend/src/types/domain.ts` and `frontend/src/services/api.ts`).
- Do not hardcode business logic into UI components.
- Keep API calls inside service modules.
- Use reusable components (`frontend/src/components`).
- Make loading/error/empty states explicit.
- Start with demo data if backend endpoints are not yet available; replace with real API calls.
- Do not implement AI logic inside the frontend.

## Definition of Done
A responder can:
1. Open the dashboard.
2. Select an incident.
3. View its contributing evidence.
4. View its timeline.
5. See what changed.
6. See needs and priority.
7. See resource recommendations.
8. Verify/reject a recommendation.
9. See the updated state in the UI.
