# Verification & Testing Guide

CrisisLens features automated unit and integration tests across both the FastAPI backend and React frontend.

---

## 1. Backend Test Suite (Pytest)

The backend test suite is located in `backend/tests/` and contains **21 automated tests** covering:
- OpenRouter multimodal schema validation and markdown code fence stripping
- Single-retry handling on rate limits (HTTP 429)
- Handling of malformed AI responses without hallucinating fake data
- Haversine great-circle distance and 2.0 km Crisis Zone correlation
- Deterministic Severity and Priority calculation formulas
- Health, weather fallback, and human review override endpoints

### Running Backend Tests
Execute pytest using the project's virtual environment:

```bash
cd crisislens/backend
pytest -v
```

### Verified Test Output
```
tests/test_api_integration.py::test_health_endpoint PASSED               [  4%]
tests/test_api_integration.py::test_demo_seed_and_list PASSED            [  9%]
tests/test_api_integration.py::test_human_review_override PASSED         [ 14%]
tests/test_api_integration.py::test_weather_fallback PASSED              [ 19%]
tests/test_api_integration.py::test_incident_analyze_flow PASSED         [ 23%]
tests/test_engines.py::test_severity_calculation_critical_flood PASSED   [ 28%]
tests/test_engines.py::test_severity_calculation_minimal PASSED          [ 33%]
tests/test_engines.py::test_priority_engine_calculation PASSED           [ 38%]
tests/test_engines.py::test_recommendation_engine_explainable_rules PASSED [ 42%]
tests/test_openrouter.py::test_openrouter_schema_validation_success PASSED [ 47%]
tests/test_openrouter.py::test_openrouter_schema_with_markdown_fences PASSED [ 52%]
tests/test_openrouter.py::test_openrouter_malformed_ai_response PASSED   [ 57%]
tests/test_openrouter.py::test_missing_openrouter_api_key PASSED         [ 61%]
tests/test_openrouter.py::test_openrouter_api_failure_handling PASSED    [ 66%]
tests/test_openrouter.py::test_convert_openrouter_to_ai_result PASSED    [ 71%]
tests/test_openrouter.py::test_haversine_distance PASSED                 [ 76%]
tests/test_openrouter.py::test_endpoint_missing_input PASSED             [ 80%]
tests/test_openrouter.py::test_endpoint_invalid_image PASSED             [ 85%]
tests/test_openrouter.py::test_endpoint_successful_analysis_and_crisis_zone_evolution PASSED [ 90%]
tests/test_schemas.py::test_ai_analysis_result_validation PASSED         [ 95%]
tests/test_schemas.py::test_human_review_schema_validation PASSED        [100%]

============================= 21 passed in 14.29s ==============================
```

---

## 2. Frontend Build & Static Analysis

The frontend pipeline is strictly validated against TypeScript type safety and bundling:

### Running Linting (Oxlint)
```bash
cd crisislens/frontend
npm run lint
```
*Result: 0 errors across 58 source files.*

### Production Build Verification (Vite)
```bash
cd crisislens/frontend
npm run build
```
*Result: Successfully compiles to `/dist` bundle with 0 errors.*

---

## 3. Live End-to-End Multimodal Analysis Test

To test the multimodal AI endpoint directly from the command line against the running server:

```bash
curl -X POST "http://127.0.0.1:8000/api/analyze-disaster" \
  -F "citizen_report=Heavy rain has been falling since last night. Our residential area is completely flooded. Water has entered several houses, and multiple cars are stuck on the road. Some residents, including children and elderly people, are unable to leave their homes. The main access road is blocked and the water level appears to be rising. We need urgent assistance for evacuation." \
  -F "latitude=12.9352" \
  -F "longitude=77.6245" \
  -F "location_name=Koramangala, Bengaluru"
```

### Expected Output:
- HTTP Status: `200 OK`
- `disaster_type`: `"flood"`
- `recommended_attention_level`: `"HIGH"` or `"CRITICAL"`
- `possible_people_at_risk`: Identifies stranded residents, children, and elderly individuals
- `accessibility_issues`: Identifies main access road blockage
- `crisis_zone`: Correlates with local zone and updates evolution timeline
