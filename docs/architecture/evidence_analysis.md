# Evidence Analysis Layer Architecture (Member 1 - Issue #1)

## 1. Overview & Objective

The **Evidence Analysis Layer** is the first operational stage of the CrisisLens intelligence pipeline. It converts raw, unstructured disaster reports (citizen submissions, emergency calls, drone captures, field agent dispatches) into structured, confidence-aware **Evidence** objects.

```
Report (Text, Image, Video, Location)
  ↓
EvidenceAnalysisInterface
  ├── EvidenceAnalysisService (Main Coordinator)
  ├── ImageAnalysisInterface (MockImageAnalyzer)
  └── VideoAnalysisInterface (MockVideoAnalyzer)
  ↓
Structured Evidence Object (app.schemas.domain.Evidence)
  ↓
Member 2: Incident Intelligence (IncidentFusionService)
```

---

## 2. Core Service Architecture

The Evidence Analysis subsystem is strictly separated from API routes and business logic. It lives under `backend/app/services/evidence/`:

```
backend/app/services/evidence/
├── __init__.py      # Re-exports interfaces, services, and analyzers
├── interface.py     # Protocol definitions (EvidenceAnalysisInterface, ImageAnalysisInterface, VideoAnalysisInterface)
├── image.py         # MockImageAnalyzer implementation
├── video.py         # MockVideoAnalyzer implementation
├── service.py       # EvidenceAnalysisService (coordinates text, image, video, and location analysis)
└── analysis.py      # DeterministicDemoAnalyzer, MockEvidenceAnalysisService alias, and factory functions
```

`backend/app/services/evidence_analysis.py` serves as a backward-compatibility bridge for any legacy imports.

---

## 3. Supported Inputs & Modalities

### 3.1 Text Analysis
Deterministic keyword and rule matching extracts:
- **Disaster Type**: `flood`, `earthquake`, `fire`, `landslide`, `other` (defaults to flood for MVP).
- **Severity**: `low`, `medium`, `high`, `critical`.
- **People Affected**: Explicit quantities only (e.g. "Five people" -> `5`, digits "2" -> `2`). If no count is mentioned, field remains `None` (no hallucination/fabrication).
- **Needs**: Multiple critical needs detected simultaneously (`rescue`, `medical`, `food`, `water`, `shelter`, `transport`).
- **Access Status**: `open`, `partially_blocked`, `blocked`, `submerged`, `unknown`.
- **Urgency**: `low`, `medium`, `high`, `critical`.

### 3.2 Image Analysis (`ImageAnalysisInterface`)
Handled by `MockImageAnalyzer`:
- Analyzes image metadata, filename context, and captions.
- Extracts visual observations (e.g., submerged infrastructure, visible roadway obstruction).
- Produces structured attributes (`disaster_type`, `severity`, `access_status`, `observations`, `confidence`).
- Does not require external vision APIs or large ML models for the deterministic MVP.

### 3.3 Video Analysis (`VideoAnalysisInterface`)
Handled by `MockVideoAnalyzer`:
- Analyzes video metadata, filename context, and accompanying text descriptions.
- Extracts structured observations and access conditions without claiming real continuous computer-vision video understanding.
- Preserves original media references (`media_id`, `url`, `media_type`) in `raw_report.media`.
- Replaceable design allows future integration of multimodal video AI providers (e.g. Gemini).

### 3.4 Location Handling
- If `report.location` is provided, coordinates (`lat`, `lng`, `address`) are **strictly preserved**.
- If location is missing, `evidence.location` is set to `None`.
- **GPS coordinates are never invented or fabricated**.
- Location confidence is calibrated to `0.95` when supplied, and `0.0` or `<= 0.30` when missing.

---

## 4. Field-Level Confidence Calibration

Every `Evidence` object carries an `EvidenceConfidence` model with granular uncertainty indicators:
- `disaster_type`: `0.95` for direct keywords, `0.70` default.
- `severity`: `0.88` for explicit severity cues, `0.65` default.
- `people_affected`: `0.95` when explicit headcounts exist, `0.50` when missing.
- `needs`: `0.90` when specific needs are identified, `0.50` when empty.
- `access_status`: `0.85` – `0.90` when status is determined, `0.40` when unknown.
- `location`: `0.95` when supplied, `<= 0.30` when absent.
- `urgency`: `0.85` – `0.92`.

---

## 5. Missing & Uncertain Information

The system handles incomplete reports gracefully:
- Partial evidence is fully valid.
- Missing fields remain `None` or `unknown`.
- No assumptions or fabricated values are injected.
- If media analysis fails, the service logs a warning and proceeds with text and location analysis without failing the report ingestion.

---

## 6. Original Evidence Preservation

Evidence analysis never discards the originating report:
- `evidence.raw_report` retains an immutable copy of the incoming `Report`.
- `evidence.report_id` maps directly back to the report.
- Responders can audit every structured deduction against the raw citizen text and media files.

---

## 7. Integration with Member 2 (Incident Intelligence)

Member 1 produces structured `Evidence` consumed by Member 2's `IncidentFusionService`:

```
POST /api/v1/reports/
    ↓
evidence = await evidence_analyzer.analyze_report(report)
    ↓
incident, link = await incident_fusion_service.match_or_create_incident(evidence)
```

The output conforms strictly to `app.schemas.domain.Evidence`, guaranteeing zero schema mismatch with downstream subsystems.
