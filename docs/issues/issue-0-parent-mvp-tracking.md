# [MVP] CrisisLens End-to-End Hackathon Demo

**Labels**: `epic`, `hackathon:mvp`, `tracking`

## Overview
This is the master tracking issue for the CrisisLens AI Hackathon MVP. CrisisLens AI is an AI-powered disaster situational intelligence platform demonstrating flood crisis management with multi-source report ingestion, incident fusion, situation evolution tracking ("What changed?"), explainable priority scoring, automated resource matching, and human-in-the-loop verification.

## Child Member Issues & Ownership
- [ ] **Member 1 (AI / Evidence)**: #1 — *[AI] Build Evidence Analysis Layer*
- [ ] **Member 2 (Intelligence / Fusion)**: #2 — *[INTELLIGENCE] Build Incident Fusion and Situation Evolution Engine*
- [ ] **Member 3 (Decision / Response)**: #3 — *[RESPONSE] Build Priority, Needs and Resource Matching Engine*
- [ ] **Member 4 (Frontend / Command Center)**: #4 — *[FRONTEND] Build CrisisLens Command Center Dashboard*

---

## Complete End-to-End Acceptance Flow
The demo is verified when the full pipeline executes seamlessly:

- [ ] **1. Report submission**: Raw flood reports (text, media, location) arrive from citizen, 911 calls, and sensors.
- [ ] **2. Evidence extraction**: Member 1 extracts structured fields with confidence scores; raw report is preserved.
- [ ] **3. Incident fusion**: Member 2 clusters related reports into **ONE** single evolving `Incident` object via `EvidenceLink`.
- [ ] **4. Incident evolution**: New reports update the single incident state without spawning redundant tickets.
- [ ] **5. "What changed?"**: Differential state changes (`delta_summary`) are computed and presented across snapshots.
- [ ] **6. Needs identification**: Critical relief needs (rescue, medical, shelter, access) are identified and tracked.
- [ ] **7. Dynamic priority calculation**: Transparent, explainable priority score (0–100) is recomputed with explicit reasons.
- [ ] **8. Resource matching**: Available emergency resources (rescue boats, ambulances) are matched to unmet needs.
- [ ] **9. Response recommendation**: Action plan is formulated with clear rationale in pending status.
- [ ] **10. Human verification**: Incident commander verifies/approves/edits/rejects recommendation through the UI/API.
- [ ] **11. Dashboard update**: UI immediately updates incident status, resource assignment, and audit log.

---

## Acceptance Criteria
- [ ] All 12 reports in `data/demo/flood_scenario.json` process without error.
- [ ] Demo runs smoothly via `python scripts/simulate_reports.py`.
- [ ] All subteam unit tests pass independently (`pytest backend/tests`).
- [ ] Frontend builds cleanly (`npm run build`).
