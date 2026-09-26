"""Unit and integration tests for OpenRouter Multimodal AI and Crisis Zone evolution."""

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import Response, Request, AsyncClient, ASGITransport
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

from app.schemas import OpenRouterDisasterAnalysis
from app.services.openrouter_service import (
    get_api_key,
    get_model,
    OpenRouterConfigError,
    OpenRouterAPIError,
    parse_and_validate_openrouter_response,
    analyze_with_openrouter,
    convert_openrouter_to_ai_result,
)
from app.services.crisis_zone_service import haversine_distance_km
from app.config import settings


# 1. Structured Response Validation Tests
def test_openrouter_schema_validation_success():
    """Test valid structured AI output parses cleanly into schema."""
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
    analysis = parse_and_validate_openrouter_response(json.dumps(valid_payload))
    assert analysis.disaster_type == "flood"
    assert analysis.confidence == 0.88
    assert analysis.recommended_attention_level == "CRITICAL"
    assert len(analysis.observed_conditions) == 2
    assert len(analysis.visible_damage) == 2
    assert len(analysis.accessibility_issues) == 2
    assert len(analysis.unknown_information) == 2


def test_openrouter_schema_with_markdown_fences():
    """Test response enclosed in markdown code fences is cleaned and parsed."""
    raw = """```json
    {
      "disaster_type": "earthquake",
      "observed_conditions": ["cracked masonry", "fallen plaster"],
      "visible_damage": ["residential wall collapse"],
      "affected_area_description": "Urban apartment block",
      "possible_people_at_risk": "Unknown - residents may be inside",
      "accessibility_issues": ["sidewalk blocked by debris"],
      "severity_indicators": ["structural instability"],
      "supporting_evidence": ["diagonal shear cracks on facade"],
      "unknown_information": ["interior load-bearing wall condition"],
      "confidence": 0.75,
      "recommended_attention_level": "HIGH"
    }
    ```"""
    analysis = parse_and_validate_openrouter_response(raw)
    assert analysis.disaster_type == "earthquake"
    assert analysis.recommended_attention_level == "HIGH"
    assert analysis.confidence == 0.75


# 2. Malformed AI Response Handling
def test_openrouter_malformed_ai_response():
    """Test graceful degradation when model returns invalid JSON/garbage."""
    garbage = "I am an AI and here is my text explanation without any JSON format."
    fallback = parse_and_validate_openrouter_response(garbage)
    assert fallback.disaster_type == "unknown"
    assert fallback.confidence <= 0.20
    assert any("valid JSON" in u for u in fallback.unknown_information)


# 3. Missing API Key Test
def test_missing_openrouter_api_key(monkeypatch):
    """Test error raised when OPENROUTER_API_KEY is missing."""
    monkeypatch.setattr(settings, "openrouter_api_key", "")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    with pytest.raises(OpenRouterConfigError) as exc_info:
        get_api_key()
    assert "OPENROUTER_API_KEY is not configured" in str(exc_info.value)


# 4. OpenRouter API Failure / Timeout Test
@pytest.mark.asyncio
async def test_openrouter_api_failure_handling(monkeypatch):
    """Test handling of 500/502 HTTP errors from OpenRouter."""
    monkeypatch.setattr(settings, "openrouter_api_key", "sk-test-key-mock")

    mock_client = AsyncMock()
    mock_response = MagicMock(spec=Response)
    mock_response.status_code = 502
    mock_response.text = "Bad Gateway from upstream AI provider"
    mock_client.post.return_value = mock_response

    with pytest.raises(OpenRouterAPIError) as exc_info:
        await analyze_with_openrouter(
            citizen_report="Heavy flooding observed on Main St",
            client=mock_client,
        )
    assert "HTTP 502" in str(exc_info.value)


# 5. Conversion to Engine Representation
def test_convert_openrouter_to_ai_result():
    """Test translation from OpenRouter schema into CrisisLens deterministic engine schema."""
    analysis = OpenRouterDisasterAnalysis(
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
    ai_result = convert_openrouter_to_ai_result(analysis, citizen_report="15 people stranded on roofs")
    assert ai_result.disaster_type == "flood"
    assert ai_result.severity == 5
    assert ai_result.people.possible_stranded_people is True
    assert ai_result.damage.roads == "blocked"
    assert ai_result.damage.bridges == "blocked"
    assert ai_result.confidence == 0.85


# 6. Haversine Distance Calculation Test
def test_haversine_distance():
    """Test geospatial calculation for Crisis Zone clustering."""
    # Two points in Bengaluru ~1.2 km apart
    lat1, lon1 = 12.9352, 77.6245
    lat2, lon2 = 12.9260, 77.6310
    dist = haversine_distance_km(lat1, lon1, lat2, lon2)
    assert 0.8 < dist < 1.6


# 7. Endpoint Integration: Missing Input Verification
@pytest.mark.asyncio
async def test_endpoint_missing_input(client):
    """Test POST /api/analyze-disaster rejects request with neither image nor report."""
    response = await client.post("/api/analyze-disaster", data={})
    assert response.status_code == 400
    assert "At least a disaster photograph or a citizen report" in response.json()["detail"]


# 8. Endpoint Integration: Invalid Image Format Verification
@pytest.mark.asyncio
async def test_endpoint_invalid_image(client):
    """Test POST /api/analyze-disaster rejects non-image file extensions."""
    files = {"image": ("malicious.exe", b"MZexecutable", "application/octet-stream")}
    data = {"citizen_report": "Field report text"}
    response = await client.post("/api/analyze-disaster", data=data, files=files)
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"]


# 9. Endpoint Integration: Successful Multimodal Analysis & Crisis Zone Evolution
@pytest.mark.asyncio
async def test_endpoint_successful_analysis_and_crisis_zone_evolution(client, monkeypatch):
    """Test full multimodal analysis flow and crisis zone evolution across 2 sequential reports."""
    monkeypatch.setattr(settings, "openrouter_api_key", "sk-mock-key")

    mock_analysis_1 = OpenRouterDisasterAnalysis(
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

    mock_analysis_2 = OpenRouterDisasterAnalysis(
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

    with patch("app.services.openrouter_service.analyze_with_openrouter") as mock_analyze:
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
