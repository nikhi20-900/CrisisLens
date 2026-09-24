# [AI] Build Evidence Analysis Layer

**Assignee**: Member 1 (AI / Multimodal Evidence Analysis)  
**Labels**: `component:ai`, `member:1`, `p0`

## Objective
Build the evidence-analysis layer that converts raw disaster reports into structured, confidence-aware evidence.

## Scope
Implement the interfaces/services required to analyze:
- Text reports
- Images
- Location metadata

The implementation must extract, where available:
- disaster type
- severity
- people affected
- critical needs
- access status
- location
- urgency
- confidence for individual fields

## Input
The service receives a `Report` using the shared `Report` contract.

Example:
```json
{
  "report_id": "R-001",
  "text": "Five people are trapped near the bridge",
  "media": [],
  "location": {
    "lat": 12.935,
    "lng": 77.624
  }
}
```

## Output
Return structured `Evidence` using the shared contract.

Example fields:
```json
{
  "report_id": "R-001",
  "disaster_type": "flood",
  "severity": "high",
  "people_affected": 5,
  "needs": ["rescue"],
  "access_status": "unknown",
  "location": {},
  "confidence": {}
}
```

## Requirements
- Create clean service interfaces (`app.services.evidence_analysis.EvidenceAnalysisInterface`).
- Keep AI/model calls isolated from business logic.
- Support a deterministic mock/demo implementation when an external AI model is unavailable.
- Return structured data only.
- Preserve the original report.
- Store confidence per extracted field.
- Handle missing/uncertain information explicitly.
- Do not implement incident fusion.
- Do not implement priority calculation.
- Do not implement resource matching.
- Do not implement frontend UI.

## Testing
Add tests for:
- normal flood report
- incomplete report
- report containing multiple needs
- uncertain/missing location
- image analysis mock
- text analysis mock

## Definition of Done
- Evidence schema implemented.
- Analysis service implemented.
- Mock/demo mode works without external AI dependencies.
- Tests pass.
- Documentation added.
- Output strictly follows shared contracts.
