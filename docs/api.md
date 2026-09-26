# API Reference Documentation

All API endpoints are prefixed with `/api` and served by the FastAPI application.

Interactive OpenAPI documentation is available locally at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 1. Multimodal Disaster Intelligence

### `POST /api/analyze-disaster`
Analyzes uploaded disaster evidence with OpenRouter Multimodal AI, evaluates deterministic severity/priority engines, and creates or evolves a Crisis Zone.

- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  - `image` *(UploadFile, optional)*: Image file (`.png`, `.jpg`, `.jpeg`, `.webp`), max 10MB.
  - `citizen_report` *(string, optional)*: Natural language citizen or dispatch report.
  - `report_text` *(string, optional)*: Alias for citizen report.
  - `latitude` *(float, optional)*: Target incident latitude (e.g., `12.9352`).
  - `longitude` *(float, optional)*: Target incident longitude (e.g., `77.6245`).
  - `location_name` *(string, optional)*: Name of locality or region.
  - `crisis_zone_id` *(string, optional)*: Explicit Crisis Zone ID to update (e.g., `ZONE-20260926-A1B2C3`).

- **Success Response (200 OK)**:
```json
{
  "analysis": {
    "disaster_type": "flood",
    "observed_conditions": [
      "Inundated roadway with water levels exceeding 1 meter",
      "Stalled passenger vehicles in transit lane"
    ],
    "visible_damage": [
      "Submerged asphalt roadway",
      "Ground floor structural inundation"
    ],
    "affected_area_description": "Residential corridor near Koramangala canal",
    "possible_people_at_risk": "Multiple individuals stranded on rooftop",
    "accessibility_issues": [
      "80ft road blocked and impassable for standard vehicles"
    ],
    "severity_indicators": [
      "Fast-moving flood water",
      "Cut-off evacuation routes"
    ],
    "supporting_evidence": [
      "Visible water reaching vehicle hoods in provided imagery"
    ],
    "unknown_information": [
      "Exact number of stranded individuals",
      "Current structural stability of building foundation"
    ],
    "confidence": 0.85,
    "recommended_attention_level": "HIGH"
  },
  "crisis_zone": {
    "zone_id": "ZONE-20260926-A007D9",
    "zone_name": "Bangalore Urban Bridge Flood Crisis Zone",
    "is_update": true,
    "evolution_history": [
      {
        "timestamp": "2026-09-26T10:05:00Z",
        "observation": "Road flooded near 80ft road",
        "priority_score": 38.0,
        "priority_label": "MEDIUM",
        "severity_score": 35.0,
        "severity_label": "LOW",
        "change_reason": "Baseline crisis zone established at MEDIUM (38/100)."
      },
      {
        "timestamp": "2026-09-26T10:25:00Z",
        "observation": "Water reached doorways; families on roof",
        "priority_score": 56.5,
        "priority_label": "HIGH",
        "severity_score": 42.0,
        "severity_label": "MEDIUM",
        "change_reason": "Priority escalated by +18 pts: residential breach and rooftop evacuation."
      }
    ],
    "priority_change_reason": "Priority escalated by +18 pts: residential breach and rooftop evacuation."
  },
  "incident": {
    "id": 4,
    "disaster_type": "flood",
    "severity_score": 42.0,
    "severity_label": "MEDIUM",
    "priority_score": 56.5,
    "priority_label": "HIGH",
    "confidence_score": 0.85,
    "uncertainty_flag": false,
    "crisis_zone_id": "ZONE-20260926-A007D9",
    "crisis_zone_name": "Bangalore Urban Bridge Flood Crisis Zone"
  },
  "analysis_time_ms": 1320.4,
  "warnings": []
}
```

- **Error Responses**:
  - `400 Bad Request`: When neither image nor citizen report is provided.
  - `429 Too Many Requests`: When the AI provider is rate-limited:
    ```json
    {
      "success": false,
      "error_type": "RATE_LIMITED",
      "message": "The AI provider is temporarily rate-limited. Please retry shortly."
    }
    ```
  - `502 Bad Gateway`: Upstream AI connection failure.
  - `503 Service Unavailable`: Missing `OPENROUTER_API_KEY` configuration.

---

## 2. Incidents & Crisis Records

### `GET /api/incidents`
Retrieve a paginated, sorted list of recorded incidents and crisis zones.

- **Query Parameters**:
  - `skip` *(int, default: 0)*: Pagination offset.
  - `limit` *(int, default: 50, max: 100)*: Items per page.
  - `severity` *(string, optional)*: Filter by `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `review_status` *(string, optional)*: Filter by `pending`, `approved`, `modified`, `escalated`.
  - `is_demo` *(bool, optional)*: Filter demo vs. live citizen records.

- **Response (200 OK)**:
```json
{
  "incidents": [ ... ],
  "total": 12
}
```

### `GET /api/incidents/{incident_id}`
Retrieve complete detail, telemetry, and audit trail for a single incident.

- **Response (200 OK)**: Full `IncidentResponse` schema.
- **Errors**: `404 Not Found` if incident ID does not exist.

### `PATCH /api/incidents/{incident_id}/review`
Allows human emergency commanders to review, override, or escalate an assessment.

- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "review_status": "approved",
  "reviewed_by": "Capt. R. Sharma (Duty Commander)",
  "reviewer_notes": "Ground boat units dispatched to 80ft road corridor.",
  "priority_label": "HIGH",
  "priority_score": 60.0
}
```
- **Response (200 OK)**: Updated `IncidentResponse` object with `human_override: true` and timestamp.

---

## 3. Context & Geospatial Feeds

### `GET /api/weather`
Fetches hyper-local meteorological telemetry for coordinates via Open-Meteo.
- **Query Parameters**: `lat` *(float)*, `lon` *(float)*.
- **Response**: Current temperature, precipitation rate, wind speed, weather code, and severe weather flags.

### `GET /api/earthquakes`
Fetches real-time seismic event telemetry from USGS GeoJSON streams.
- **Query Parameters**: `feed` *(string, default: "week_4.5")*, `limit` *(int, default: 100)*.

### `GET /api/fires`
Fetches active satellite thermal anomalies from NASA FIRMS.
- **Query Parameters**: `lat` *(float)*, `lon` *(float)*, `radius_km` *(int)*.

### `GET /api/map/context`
Fetches surrounding emergency infrastructure (hospitals, fire stations, shelters) using OpenStreetMap Nominatim.
- **Query Parameters**: `lat` *(float)*, `lon` *(float)*.
- **Response**: List of nearby facilities with name, type, and geographic coordinates.

### `GET /api/health`
System and external integration health check.
- **Response (200 OK)**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "openrouter_configured": true,
    "openrouter_model": "openrouter/free",
    "openstreetmap_tiles": "active (no key required)",
    "open_meteo": "active (no key required)",
    "usgs_earthquakes": "active (no key required)",
    "database": "./crisislens.db"
  }
}
```
