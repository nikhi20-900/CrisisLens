# CrisisLens AI — Git & GitHub Collaboration Strategy

## 1. Branching Strategy

To support high-velocity, non-conflicting parallel development during the hackathon across 4 team members, CrisisLens AI adopts a structured trunk-and-feature branch model:

```
[main] ───────────────────────────────────────────────────► (Stable Demo Releases)
  ▲
  │ (Only tested, verified MVP merges)
[develop] ────────────────────────────────────────────────► (Integration Testing)
  ▲                     ▲                   ▲                    ▲
  │ PR                  │ PR                │ PR                 │ PR
[feature/ai-evidence]   │                   │                    │
  (Member 1)            │                   │                    │
            [feature/incident-intelligence] │                    │
              (Member 2)                    │                    │
                                [feature/response-intelligence]  │
                                  (Member 3)                     │
                                                    [feature/command-center]
                                                      (Member 4)
```

### Branch Roles & Responsibilities

| Branch | Audience / Owner | Description & Rules |
|---|---|---|
| `main` | Production / Demo | **Stable, demo-ready code only**. Direct pushes strictly disallowed. Only merged from `develop` after full end-to-end integration and simulation testing. |
| `develop` | All Team Members | **Integration branch**. All feature PRs merge here first. The team tests the unified system and runs `scripts/simulate_reports.py` on `develop`. |
| `feature/ai-evidence` | **Member 1** | Multimodal evidence extraction, field-level confidence ratings, deterministic fallback mocks. |
| `feature/incident-intelligence` | **Member 2** | Incident fusion, evidence linking, situation snapshots, "What Changed?" diffing, contradiction detection. |
| `feature/response-intelligence` | **Member 3** | Operational needs tracking, explainable priority scoring (0–100), resource matching, human verification state. |
| `feature/command-center` | **Member 4** | Command Center responder UI, live incident feed, situation timeline, recommendation actions, geospatial view. |

> [!IMPORTANT]
> Do NOT create generic or personal branch names like `member1`, `frontend`, `backend`, or `ai`. Always use the designated feature branch names.

---

## 2. Member Ownership Boundaries

Each member owns one complete, cohesive vertical slice of the product.

```
MEMBER 1: AI EVIDENCE EXTRACTION
  ├── OWNS: Text/image/location extraction, per-field confidence, mock AI parser, evidence unit tests.
  └── MUST NOT TOUCH: Incident fusion, priority scoring, resource matching, frontend components.

MEMBER 2: INCIDENT INTELLIGENCE
  ├── OWNS: Incident matching & fusion, evidence linking, snapshot generation ("What Changed?"), contradiction detection.
  └── MUST NOT TOUCH: AI models, emergency resource matching, frontend components.

MEMBER 3: DECISION & RESPONSE INTELLIGENCE
  ├── OWNS: Dynamic priority calculation (0-100), needs tracking, resource catalog matching, human verification state.
  └── MUST NOT TOUCH: Image/text AI extraction, incident fusion clustering, frontend UI.

MEMBER 4: COMMAND CENTER FRONTEND
  ├── OWNS: React dashboard, incident list, map view, situation timeline, "What Changed?" banner, verification controls.
  └── MUST NOT TOUCH: Backend business logic, direct AI models inside UI components.
```

---

## 3. Directory Ownership

The repository structure isolates ownership to prevent merge conflicts:

```
CrisisLens/
├── backend/
│   └── app/
│       ├── api/              ← Shared API endpoints
│       ├── core/             ← Shared configuration
│       ├── schemas/          ← Shared Domain Contracts (No single-member unilateral edits!)
│       └── services/
│           ├── evidence/     ← OWNED BY MEMBER 1 (feature/ai-evidence)
│           ├── incidents/    ← OWNED BY MEMBER 2 (feature/incident-intelligence)
│           └── response/     ← OWNED BY MEMBER 3 (feature/response-intelligence)
│
├── frontend/
│   └── src/                  ← OWNED BY MEMBER 4 (feature/command-center)
│       ├── types/            ← Shared TypeScript Contracts (mirrors backend schemas)
│       ├── services/         ← API client
│       ├── components/       ← Reusable presentation components
│       ├── features/         ← Domain UI widgets
│       └── pages/            ← Top-level dashboard screens
```

---

## 4. Shared Contracts & Governance

The 9 shared domain entities must remain strictly synchronized between Python and TypeScript:
1. `Report`
2. `Evidence`
3. `Incident`
4. `EvidenceLink`
5. `Impact`
6. `Need`
7. `Resource`
8. `ActionPlan`
9. `IncidentSnapshot`

### Governance Rule
- No single team member may unilaterally change field names or types in `backend/app/schemas/domain.py` or `frontend/src/types/domain.ts`.
- Any breaking schema modification requires a discussion and explicit approval in the team channel, followed by updating both language definitions and documentation.

---

## 5. Daily Git Workflow

Every member follows this standard 11-step cycle:

1. **Pull Latest Integration Branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Switch to Assigned Feature Branch**:
   ```bash
   git checkout feature/<your-feature-name>
   git rebase develop   # Keep branch cleanly up to date
   ```
3. **Develop Within Directory Boundaries**:
   Work only inside your assigned service or frontend folder.
4. **Run Pre-Commit Tests Locally**:
   - Backend: `.venv/bin/pytest backend/tests`
   - Frontend: `npm run build`
5. **Commit with Conventional Messages**:
   Make small, atomic commits using the conventional commit format.
6. **Push Feature Branch to Origin**:
   ```bash
   git push origin feature/<your-feature-name>
   ```
7. **Open Pull Request into `develop`**:
   Target `base: develop` ← `compare: feature/<your-feature-name>`.
8. **Fill PR Template**: Fill out all sections of `.github/pull_request_template.md`.
9. **Peer Review**: Have at least one other member review the code.
10. **Merge into `develop`**: Use squash or rebase merge.
11. **Release to `main`**: Only after end-to-end simulation passes, merge `develop` into `main`.

---

## 6. Commit Message Convention

Format: `<type>(<scope>): <subject>`

### Standard Types
- `feat`: New feature or capability.
- `fix`: Bug fix or error resolution.
- `test`: Adding or updating test cases.
- `docs`: Documentation updates.
- `refactor`: Code reorganization without functional changes.
- `chore`: Dependency updates or build tooling changes.

### Examples
- `feat(ai): add text evidence extraction with confidence scoring`
- `feat(incident): implement spatiotemporal incident fusion clustering`
- `feat(response): add explainable priority calculation engine`
- `feat(ui): add situation evolution 'What Changed?' banner`
- `fix(incident): prevent duplicate incident creation for concurrent reports`
- `test(response): add resource matching capacity tests`
- `docs(api): document incident snapshot delta format`

---

## 7. Parallel Development with Stubs & Mocks

To prevent blocking while waiting for upstream dependencies:
- **Member 2 (Incident Fusion)** can develop immediately using sample `Evidence` JSON fixtures from `data/demo/flood_scenario.json` before Member 1 finishes live model extraction.
- **Member 3 (Decision & Response)** can develop using sample `Incident` objects before Member 2 completes live clustering.
- **Member 4 (Frontend)** can mock endpoints using the typed signatures in `frontend/src/services/api.ts` before the backend endpoints are connected.

---

## 8. GitHub Issue ↔ Branch Mapping

| GitHub Issue | Target Branch | Primary Assignee |
|---|---|---|
| [#1: [AI] Build Evidence Analysis Layer](https://github.com/nikhi20-900/CrisisLens/issues/1) | `feature/ai-evidence` | Member 1 |
| [#2: [INTELLIGENCE] Build Incident Fusion and Situation Evolution Engine](https://github.com/nikhi20-900/CrisisLens/issues/2) | `feature/incident-intelligence` | Member 2 |
| [#3: [RESPONSE] Build Priority, Needs and Resource Matching Engine](https://github.com/nikhi20-900/CrisisLens/issues/3) | `feature/response-intelligence` | Member 3 |
| [#4: [FRONTEND] Build CrisisLens Command Center Dashboard](https://github.com/nikhi20-900/CrisisLens/issues/4) | `feature/command-center` | Member 4 |
| [#5: [MVP] CrisisLens End-to-End Hackathon Demo](https://github.com/nikhi20-900/CrisisLens/issues/5) | `develop` ➔ `main` | Whole Team / Lead |
