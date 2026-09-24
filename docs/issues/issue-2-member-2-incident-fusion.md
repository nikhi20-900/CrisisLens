# [INTELLIGENCE] Build Incident Fusion and Situation Evolution Engine

**Assignee**: Member 2 (Incident Intelligence)  
**Labels**: `component:intelligence`, `member:2`, `p0`

## Objective
Build the incident intelligence layer that converts multiple related reports into one evolving incident.

## Scope
Implement:
1. Incident matching
2. Incident creation
3. Incident updates
4. Evidence linking
5. Incident snapshots
6. Situation change detection ("What changed?")
7. Contradiction detection

## Incident Matching
Determine whether a new report belongs to an existing incident using:
- spatial similarity
- temporal proximity
- semantic similarity
- shared entities/context

For the MVP, deterministic/demo rules are acceptable.

## Example
Report 001: *"Road is flooded"*  
Report 002: *"People are trapped near the bridge"*  
Report 003: *"Vehicles cannot pass"*  

If they occur within the relevant time/location context, they should be linked to the same incident.

Expected:
```
REPORT 001 ─┐
REPORT 002 ─┼──→ INCIDENT-001
REPORT 003 ─┘
```

## Situation Evolution
Every meaningful incident update must create an `IncidentSnapshot`.

Example:
- **10:02**: Severity: Medium
- **10:08**: People affected: 5, Need: Rescue
- **10:14**: Road: Blocked
- **10:21**: Medical need: Critical

The system must be able to compare snapshots and produce a structured "what changed" result (`delta_summary`).

## Contradictions
If reports disagree, do not silently overwrite information.

Example:
- Report A → road open
- Report B → road blocked

Create a contradiction flag (`Contradiction`) requiring human verification.

## Requirements
- Use shared domain contracts (`app.schemas.domain`).
- Preserve original evidence links (`EvidenceLink`).
- Maintain incident history (`IncidentSnapshot`).
- Do not implement resource matching.
- Do not implement frontend.
- Do not implement external disaster feeds.

## Testing
Test:
- new incident creation
- duplicate report detection
- related report fusion
- unrelated report separation
- incident update
- snapshot creation
- change detection
- contradictory reports

## Definition of Done
- Incident fusion works with demo data.
- Incident history is preserved.
- "What changed?" can be generated from snapshots.
- Contradictions are represented.
- Tests pass.
- Documentation added.
