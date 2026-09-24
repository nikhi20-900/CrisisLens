# [RESPONSE] Build Priority, Needs and Resource Matching Engine

**Assignee**: Member 3 (Decision & Response Intelligence)  
**Labels**: `component:response`, `member:3`, `p0`

## Objective
Build the decision-support layer that converts an evolving incident into operational needs, priority and explainable resource recommendations.

## Scope
Implement:
1. Needs identification
2. Dynamic priority calculation
3. Resource matching
4. Action recommendation
5. Human verification state

## Needs
Support MVP needs such as:
- rescue
- medical
- food
- water
- shelter
- transport

Needs must include:
- type (`NeedType`)
- urgency (`UrgencyLevel`)
- confidence (`float`)
- status (`NeedStatus`)

## Priority
Priority should consider:
- severity
- people affected
- critical needs
- accessibility
- time sensitivity
- confidence
- situation trend

Use a deterministic and configurable scoring mechanism (0 to 100) for the MVP. Do not claim the score is objectively correct; make it explainable.

Example:
```
Priority: HIGH (88.5 / 100)
Reasons:
- 5 people trapped
- Road blocked
- Medical emergency
- Situation worsening
```

## Resource Matching
Create demo resources with:
- resource type
- location
- availability
- capacity
- deployment status

Match resources to incident needs.

Example:
- Incident Need = `Rescue` + `Medical`
- Available: `Rescue Team 01`, `Ambulance 01`
- Recommendation: `Rescue Team 01`, `Ambulance 01`
- Rationale: Human-readable justification.

## Human Verification
Recommendations must have a state:
- `pending`
- `approved`
- `rejected`
- `edited`

A responder must be able to verify the recommendation through the API (`POST /recommendations/{id}/verify`).

## Requirements
- Use shared domain contracts (`app.schemas.domain`).
- Keep scoring deterministic/configurable.
- Make recommendations explainable.
- Support demo data.
- Do not implement frontend.
- Do not implement AI evidence extraction.
- Do not implement incident fusion.

## Testing
Test:
- priority calculation
- critical medical need
- worsening incident
- resource availability
- unavailable resource
- resource capacity
- recommendation generation
- approval/rejection state

## Definition of Done
- Needs engine works.
- Priority engine works.
- Resource matching works.
- Recommendation contains rationale.
- Verification state works.
- Tests pass.
- Documentation added.
