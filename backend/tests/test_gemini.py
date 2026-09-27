"""Unit and integration tests for Google Gemini Multimodal AI and Crisis Zone evolution."""

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db


@pytest.fixture(autouse=True)
async def setup_database():
    """Ensure database schema and migrations exist before running tests."""
    await init_db()


@pytest.fixture
async def client():
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


from app.schemas import GeminiDisasterAnalysis
from app.services.gemini_service import (
    get_api_key,
    get_model,
    GeminiConfigError,
    GeminiAPIError,
    GeminiResponseError,
    GeminiImageError,
    parse_and_validate_gemini_response,
    analyze_with_gemini,
    convert_gemini_to_ai_result,
)
from app.services.crisis_zone_service import haversine_distance_km
from app.config import settings


# 1. Structured Response Validation Tests
def test_gemini_schema_validation_success():
    """Test valid structured AI output parses cleanly into GeminiDisasterAnalysis."""
    valid_payload = {
        "disaster_type": "flood",
        "observed_conditions": ["fast moving water across roadway", "partially submerged vehicles"],
        "visible_damage": ["road pavement eroded", "two ground floor storefronts flooded"],
        "affected_area_description": "Commercial arterial corridor along low-lying riverbank",
        "possible_people_at_risk": "3-5 motorists stranded near stalled vehicles",
        "accessibility_issues": ["80 Feet Road completely blocked", "Bridge access restricted"],
        "severity_indicators": ["Swift water currents over 1 meter deep", "Downed power lines"],
        "supporting_evidence": ["Visible brown sediment flood water reaching car windows", "Stop signs submerged"],
        "unknown_information": ["Structural integrity of bridge foundation", "Condition of underground electrical grid"],
        "confidence": 0.88,
        "recommended_attention_level": "CRITICAL",
    }
    analysis = parse_and_validate_gemini_response(json.dumps(valid_payload))
    assert analysis.disaster_type == "flood"
    assert analysis.confidence == 0.88
    assert analysis.recommended_attention_level == "CRITICAL"
    assert len(analysis.observed_conditions) == 2
    assert len(analysis.visible_damage) == 2
    assert len(analysis.accessibility_issues) == 2


def test_gemini_schema_with_markdown_fences():
    """Test parser strips markdown code fences enclosing JSON."""
    raw = """```json
    {
        "disaster_type": "earthquake",
        "observed_conditions": ["rubble piled on sidewalk", "partial facade collapse"],
        "visible_damage": ["brick walls fractured", "power pole leaning at 45 degrees"],
        "affected_area_description": "Historic downtown district with unreinforced masonry buildings",
        "possible_people_at_risk": "Unknown from provided evidence",
        "accessibility_issues": ["Main St impassable due to fallen debris"],
        "severity_indicators": ["Structural collapse of multi-story wall"],
        "supporting_evidence": ["Visible cracks in adjacent building foundation"],
        "unknown_information": ["Number of occupants inside during tremor"],
        "confidence": 0.75,
        "recommended_attention_level": "HIGH"
    }
    ```"""
    analysis = parse_and_validate_gemini_response(raw)
    assert analysis.disaster_type == "earthquake"
    assert analysis.recommended_attention_level == "HIGH"
    assert analysis.confidence == 0.75


# 2. Malformed AI Response Handling
def test_gemini_malformed_ai_response():
    """Test error raised when model returns invalid JSON/garbage without silent hallucination."""
    garbage = "I am an AI and here is my text explanation without any JSON format."
    with pytest.raises(GeminiResponseError):
        parse_and_validate_gemini_response(garbage)


# 3. Missing API Key Test
def test_missing_gemini_api_key(monkeypatch):
    """Test error raised when GEMINI_API_KEY is missing."""
    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    with pytest.raises(GeminiConfigError) as exc_info:
        get_api_key()
    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)


# 4. Conversion to Engine Representation
def test_convert_gemini_to_ai_result():
    """Test translation from Gemini schema into CrisisLens deterministic engine schema."""
    analysis = GeminiDisasterAnalysis(
        disaster_type="flood",
        observed_conditions=["submerged road", "flooded houses"],
        visible_damage=["roads destroyed", "bridge blocked"],
        affected_area_description="Riverfront district",
        possible_people_at_risk="15 people stranded on roofs",
        accessibility_issues=["roads blocked", "bridge submerged"],
        severity_indicators=["fast moving water", "downed power lines"],
        supporting_evidence=["Water levels 1.5m high"],
        unknown_information=["Power grid status"],
        confidence=0.85,
        recommended_attention_level="CRITICAL",
    )
    ai_result = convert_gemini_to_ai_result(analysis, citizen_report="15 people stranded on roofs")
    assert ai_result.disaster_type == "flood"
    assert ai_result.severity == 5
    assert ai_result.people.possible_stranded_people is True
    assert ai_result.damage.roads == "blocked"
    assert ai_result.damage.bridges == "blocked"
    assert ai_result.confidence == 0.85


# 5. Haversine Distance Calculation Test
def test_haversine_distance():
    """Test geospatial calculation for Crisis Zone clustering."""
    lat1, lon1 = 12.9352, 77.6245
    lat2, lon2 = 12.9260, 77.6310
    dist = haversine_distance_km(lat1, lon1, lat2, lon2)
    assert 0.8 < dist < 1.6


# 6. Endpoint Integration: Missing Input Verification (Requires BOTH image AND report)
@pytest.mark.asyncio
async def test_endpoint_missing_input(client):
    """Test POST /api/analyze-disaster rejects request when either image or citizen report is missing."""
    # Neither
    resp_empty = await client.post("/api/analyze-disaster", data={})
    assert resp_empty.status_code == 400
    assert "Both a disaster photograph and a citizen report are required" in resp_empty.json()["detail"]

    # Only report, no image
    resp_text_only = await client.post(
        "/api/analyze-disaster",
        data={"citizen_report": "Flooding reported on 5th cross road"},
    )
    assert resp_text_only.status_code == 400
    assert "Both a disaster photograph and a citizen report are required" in resp_text_only.json()["detail"]


# 7. Endpoint Integration: Invalid Image Format Verification
@pytest.mark.asyncio
async def test_endpoint_invalid_image(client):
    """Test POST /api/analyze-disaster rejects non-image file extensions."""
    files = {"image": ("malicious.exe", b"MZexecutable", "application/octet-stream")}
    data = {"citizen_report": "Field report text"}
    response = await client.post("/api/analyze-disaster", data=data, files=files)
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"]


# 8. Endpoint Integration: Successful Multimodal Analysis & Crisis Zone Evolution
@pytest.mark.asyncio
async def test_endpoint_successful_analysis_and_crisis_zone_evolution(client, monkeypatch):
    """Test full multimodal analysis flow and crisis zone evolution across 2 sequential reports."""
    monkeypatch.setattr(settings, "gemini_api_key", "mock-gemini-key")

    mock_analysis_1 = GeminiDisasterAnalysis(
        disaster_type="flood",
        observed_conditions=["flooded road"],
        visible_damage=["standing water on asphalt"],
        affected_area_description="Koramangala 80 Feet Road",
        possible_people_at_risk="Motorists experiencing delays",
        accessibility_issues=["single lane impassable"],
        severity_indicators=["water accumulation"],
        supporting_evidence=["Water reaches 30cm on curb"],
        unknown_information=["Drainage pump operating status"],
        confidence=0.82,
        recommended_attention_level="MEDIUM",
    )

    mock_analysis_2 = GeminiDisasterAnalysis(
        disaster_type="flood",
        observed_conditions=["residential inundation", "stranded families"],
        visible_damage=["ground floor houses submerged", "arterial road completely blocked"],
        affected_area_description="Koramangala 80 Feet Road residential sector",
        possible_people_at_risk="12 people stranded on second floor balcony",
        accessibility_issues=["road completely impassable", "ambulances unable to enter"],
        severity_indicators=["swift rising floodwater", "electrical hazard"],
        supporting_evidence=["Water level 1.8m high", "Residents waving for help from balcony"],
        unknown_information=["Medical condition of stranded elderly"],
        confidence=0.91,
        recommended_attention_level="CRITICAL",
    )

    import random
    import uuid

    # Generate unique test location to prevent collision across test runs
    base_lat = round(30.0 + random.uniform(1.0, 20.0), 4)
    base_lon = round(75.0 + random.uniform(1.0, 20.0), 4)
    loc_name = f"Test Sector {uuid.uuid4().hex[:6]}"

    dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa74d\xaa\x00\x00\x00\x00IEND\xaeB`\x82"

    with patch("app.services.gemini_service.analyze_with_gemini") as mock_analyze:
        # First Report: Creates Crisis Zone
        mock_analyze.return_value = mock_analysis_1
        resp1 = await client.post(
            "/api/analyze-disaster",
            data={
                "citizen_report": "Water rising on sector road, some cars stalled.",
                "latitude": str(base_lat),
                "longitude": str(base_lon),
                "location_name": loc_name,
            },
            files={"image": ("test1.png", dummy_png, "image/png")},
        )
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["analysis"]["disaster_type"] == "flood"
        assert data1["crisis_zone"]["is_update"] is False
        assert data1["crisis_zone"]["zone_id"] is not None
        initial_incident_id = data1["incident"]["id"]
        zone_id = data1["crisis_zone"]["zone_id"]
        assert len(data1["crisis_zone"]["evolution_history"]) == 1

        # Second Report: Correlates to existing Crisis Zone (< 0.2 km away)
        mock_analyze.return_value = mock_analysis_2
        resp2 = await client.post(
            "/api/analyze-disaster",
            data={
                "citizen_report": "Water has entered homes, 12 people stranded on balcony! Road blocked!",
                "latitude": str(round(base_lat + 0.0005, 4)),
                "longitude": str(round(base_lon + 0.0005, 4)),
                "location_name": f"{loc_name} North",
            },
            files={"image": ("test2.png", dummy_png, "image/png")},
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        # Verify it updated the existing crisis zone instead of creating duplicate!
        assert data2["crisis_zone"]["is_update"] is True
        assert data2["incident"]["id"] == initial_incident_id
        assert data2["crisis_zone"]["zone_id"] == zone_id
        assert len(data2["crisis_zone"]["evolution_history"]) == 2
        # Priority must have escalated
        assert data2["incident"]["priority_label"] in ("HIGH", "CRITICAL")
        assert "Priority escalated" in data2["crisis_zone"]["priority_change_reason"]
