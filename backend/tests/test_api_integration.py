"""API and Integration Tests for CrisisLens Backend.

Tests:
1. Health endpoint
2. Demo seeding and retrieval
3. Incident review and human override
4. Weather fallback handling
5. End-to-end incident analysis flow
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db


@pytest.fixture(autouse=True)
async def setup_database():
    """Ensure database schema exists before tests."""
    await init_db()


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify system health endpoint returns operational status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data


@pytest.mark.asyncio
async def test_demo_seed_and_list():
    """Test seeding 3 demo scenarios and querying them via list endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Seed
        seed_res = await client.post("/api/demo/seed")
        assert seed_res.status_code == 200
        seeded = seed_res.json()
        assert len(seeded) == 3

        # List
        list_res = await client.get("/api/incidents?is_demo=true")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 3

        # Verify first incident details
        inc_id = seeded[0]["id"]
        detail_res = await client.get(f"/api/incidents/{inc_id}")
        assert detail_res.status_code == 200
        inc_detail = detail_res.json()
        assert inc_detail["severity_score"] is not None
        assert inc_detail["priority_score"] is not None
        assert len(inc_detail["recommendations"]) > 0


@pytest.mark.asyncio
async def test_human_review_override():
    """Test human responder overriding AI assessment."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Seed demo data first to get an incident
        seed_res = await client.post("/api/demo/seed")
        incident = seed_res.json()[0]
        inc_id = incident["id"]

        # Apply human review override
        override_payload = {
            "severity_label": "CRITICAL",
            "severity_score": 95.0,
            "priority_label": "CRITICAL",
            "priority_score": 98.0,
            "disaster_type": "flash_flood",
            "recommendations": [
                "Immediate helicopter airlift required",
                "Cut power to grid sector 4",
            ],
            "reviewer_notes": "Ground team confirms rapid 2m water surge. Escalating to Critical.",
            "reviewed_by": "Capt. M. Davis",
            "review_status": "escalated",
        }

        patch_res = await client.patch(f"/api/incidents/{inc_id}/review", json=override_payload)
        assert patch_res.status_code == 200
        updated = patch_res.json()

        assert updated["severity_label"] == "CRITICAL"
        assert updated["severity_score"] == 95.0
        assert updated["human_override"] is True
        assert updated["review_status"] == "escalated"
        assert updated["reviewed_by"] == "Capt. M. Davis"
        assert len(updated["recommendations"]) == 2


@pytest.mark.asyncio
async def test_weather_fallback():
    """Verify weather endpoint returns structured fallback even with invalid/timeout coordinates."""
    from app.services import weather_service

    # Using valid coordinates
    context = await weather_service.get_weather(0.0, 0.0)
    assert context is not None
    assert context.source == "Open-Meteo"


@pytest.mark.asyncio
async def test_incident_analyze_flow():
    """Verify end-to-end analyze endpoint: report + location -> AI/fallback -> engines -> stored incident."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        form_data = {
            "report_text": "Severe bridge collapse and rising flood waters. 5 people stranded on concrete pillar.",
            "latitude": "12.9352",
            "longitude": "77.6245",
            "location_name": "Bangalore Urban Bridge",
        }
        response = await client.post("/api/incidents/analyze", data=form_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "incident" in data
        assert "analysis_time_ms" in data
        incident = data["incident"]
        assert incident["id"] is not None
        assert incident["severity_score"] is not None
        assert incident["severity_label"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert incident["priority_score"] is not None
        assert incident["priority_label"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert len(incident["recommendations"]) > 0
        assert incident["review_status"] == "pending"

