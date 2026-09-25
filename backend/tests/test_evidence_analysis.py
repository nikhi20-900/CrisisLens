"""
Evidence Analysis Tests (Member 1 - Issue #1)
==============================================
Validates the Evidence Analysis layer for:
- Text analysis (flood, severity, people affected, needs, access status, urgency)
- Image analysis adapter (MockImageAnalyzer)
- Video analysis adapter (MockVideoAnalyzer)
- Field-level confidence calibration
- Location preservation (no GPS fabrication)
- Missing and uncertain data handling
- Original Report preservation
- Graceful partial analysis on media failure
- Prepared demo scenario reports (Report 001 - 004)
- Deterministic behavior
"""

import pytest
from app.schemas.domain import (
    AccessStatus,
    DisasterType,
    Evidence,
    EvidenceConfidence,
    Location,
    MediaItem,
    NeedType,
    Report,
    SeverityLevel,
    UrgencyLevel,
)
from app.services.evidence import (
    DeterministicDemoAnalyzer,
    EvidenceAnalysisInterface,
    EvidenceAnalysisService,
    ImageAnalysisInterface,
    MockEvidenceAnalysisService,
    MockImageAnalyzer,
    MockVideoAnalyzer,
    VideoAnalysisInterface,
    get_evidence_analyzer,
)


# ============================================================================
# Test 1: Normal Flood Report
# ============================================================================

@pytest.mark.asyncio
async def test_normal_flood_report():
    """Test 1: Input 'Road is flooded near the bridge.' identifies flood, severity, and preserves location."""
    analyzer = DeterministicDemoAnalyzer()
    report = Report(
        report_id="R-001",
        text="Road is flooded near the bridge.",
        location=Location(lat=12.935, lng=77.624, address="Market Bridge"),
    )
    evidence = await analyzer.analyze(report)

    assert evidence.report_id == "R-001"
    assert evidence.disaster_type == DisasterType.FLOOD
    assert evidence.severity in [SeverityLevel.MEDIUM, SeverityLevel.HIGH]
    assert evidence.location is not None
    assert evidence.location.lat == 12.935
    assert evidence.location.lng == 77.624
    assert evidence.confidence.disaster_type >= 0.90
    assert evidence.confidence.location >= 0.90


# ============================================================================
# Test 2: Incomplete Report
# ============================================================================

@pytest.mark.asyncio
async def test_incomplete_report():
    """Test 2: Input 'Flooding reported.' identifies flood, missing fields remain unknown/null, no fabricated count."""
    analyzer = DeterministicDemoAnalyzer()
    report = Report(
        report_id="R-002",
        text="Flooding reported.",
        location=None,
    )
    evidence = await analyzer.analyze_report(report)

    assert evidence.report_id == "R-002"
    assert evidence.disaster_type == DisasterType.FLOOD
    assert evidence.people_affected is None  # Never fabricated!
    assert evidence.location is None
    assert evidence.access_status == AccessStatus.UNKNOWN
    assert evidence.needs == []
    assert evidence.confidence.location <= 0.30


# ============================================================================
# Test 3: Multiple Needs & People Count
# ============================================================================

@pytest.mark.asyncio
async def test_multiple_needs_and_people():
    """Test 3: Input 'Five people are trapped and two need medical assistance.' detects people=5, rescue, medical."""
    analyzer = DeterministicDemoAnalyzer()
    report = Report(
        report_id="R-003",
        text="Five people are trapped and two need medical assistance.",
        location=Location(lat=12.936, lng=77.625),
    )
    evidence = await analyzer.analyze(report)

    assert evidence.people_affected == 5
    assert NeedType.RESCUE in evidence.needs
    assert NeedType.MEDICAL in evidence.needs
    assert evidence.urgency in [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]
    assert evidence.confidence.needs >= 0.85
    assert evidence.confidence.people_affected >= 0.85


# ============================================================================
# Test 4: Missing Location (No GPS Fabrication)
# ============================================================================

@pytest.mark.asyncio
async def test_missing_location_no_fabrication():
    """Test 4: Missing location remains None and coordinates are never invented."""
    analyzer = DeterministicDemoAnalyzer()
    report = Report(
        report_id="R-004",
        text="Water level rising rapidly downtown.",
        location=None,
    )
    evidence = await analyzer.analyze(report)

    assert evidence.location is None
    assert evidence.confidence.location <= 0.30


# ============================================================================
# Test 5: Image Analyzer
# ============================================================================

@pytest.mark.asyncio
async def test_image_analyzer_adapter():
    """Test 5: Image adapter exists, produces deterministic structured evidence."""
    image_analyzer = MockImageAnalyzer()
    media_item = MediaItem(
        media_id="M-IMG-01",
        media_type="image/jpeg",
        url="https://example.com/submerged_road.jpg",
        caption="Submerged road and blocked traffic",
    )
    result = await image_analyzer.analyze_image(media_item, context_text="Flash flood")

    assert result["disaster_type"] == DisasterType.FLOOD
    assert result["access_status"] == AccessStatus.BLOCKED
    assert "observations" in result
    assert result["confidence"]["disaster_type"] >= 0.80

    # Service-level integration
    service = EvidenceAnalysisService(image_analyzer=image_analyzer)
    report = Report(
        report_id="R-IMG-EVID",
        text="Photo from resident showing submerged roadway.",
        media=[media_item],
    )
    evidence = await service.analyze(report)
    assert evidence.extracted_entities["has_image"] is True
    assert evidence.access_status == AccessStatus.BLOCKED


# ============================================================================
# Test 6: Video Analyzer
# ============================================================================

@pytest.mark.asyncio
async def test_video_analyzer_adapter():
    """Test 6: Video adapter exists, demo output is deterministic, original video reference preserved."""
    video_analyzer = MockVideoAnalyzer()
    media_item = MediaItem(
        media_id="V-VID-01",
        media_type="video/mp4",
        url="bridge-road-blocked.mp4",
        caption="Vehicles are unable to pass through the flooded road.",
    )
    result = await video_analyzer.analyze_video(media_item)

    assert result["disaster_type"] == DisasterType.FLOOD
    assert result["access_status"] == AccessStatus.BLOCKED
    assert result["severity"] in [SeverityLevel.HIGH, SeverityLevel.MEDIUM]

    # Service-level integration
    service = EvidenceAnalysisService(video_analyzer=video_analyzer)
    report = Report(
        report_id="R-VID-EVID",
        text="Video captured by citizen.",
        media=[media_item],
    )
    evidence = await service.analyze(report)
    assert evidence.raw_report.media[0].url == "bridge-road-blocked.mp4"
    assert evidence.extracted_entities["has_video"] is True
    assert evidence.access_status == AccessStatus.BLOCKED


# ============================================================================
# Test 7: Field-Level Confidence Calibration
# ============================================================================

@pytest.mark.asyncio
async def test_field_level_confidence():
    """Test 7: Field-level confidence present according to schema, calibrated by evidence strength."""
    analyzer = DeterministicDemoAnalyzer()

    # Explicit text -> high confidence
    explicit_rep = Report(
        report_id="R-CONF-HIGH",
        text="Severe critical flood! Five people trapped, rescue boat needed.",
        location=Location(lat=12.91, lng=77.61),
    )
    ev_high = await analyzer.analyze(explicit_rep)
    assert ev_high.confidence.disaster_type >= 0.90
    assert ev_high.confidence.severity >= 0.85
    assert ev_high.confidence.people_affected >= 0.85
    assert ev_high.confidence.needs >= 0.85
    assert ev_high.confidence.location >= 0.90

    # Vague text -> lower confidence
    vague_rep = Report(report_id="R-CONF-LOW", text="Situation is unclear.", location=None)
    ev_low = await analyzer.analyze(vague_rep)
    assert ev_low.confidence.location <= 0.30
    assert ev_low.confidence.people_affected <= 0.50


# ============================================================================
# Test 8: Original Report Preservation
# ============================================================================

@pytest.mark.asyncio
async def test_original_report_preservation():
    """Test 8: Original report preserved intact and linked via report_id."""
    analyzer = DeterministicDemoAnalyzer()
    original_report = Report(
        report_id="R-ORIG-01",
        text="Water entering houses on 4th cross road.",
        source="emergency_call",
        reporter_id="caller-99",
        location=Location(lat=12.92, lng=77.63, address="4th Cross"),
    )
    evidence = await analyzer.analyze(original_report)

    assert evidence.raw_report is not None
    assert evidence.raw_report.report_id == "R-ORIG-01"
    assert evidence.raw_report.text == original_report.text
    assert evidence.raw_report.source == "emergency_call"
    assert evidence.raw_report.reporter_id == "caller-99"
    assert evidence.raw_report.location.lat == 12.92
    assert evidence.report_id == "R-ORIG-01"


# ============================================================================
# Test 9: Graceful Partial Analysis on Media Failure
# ============================================================================

@pytest.mark.asyncio
async def test_graceful_partial_analysis():
    """Test 9: If media analysis fails, service continues and extracts text/location."""
    class FailingImageAnalyzer:
        async def analyze_image(self, media_item, context_text=None):
            raise RuntimeError("Vision service unavailable")

    service = EvidenceAnalysisService(image_analyzer=FailingImageAnalyzer())
    report = Report(
        report_id="R-PARTIAL",
        text="Road is completely flooded and vehicles cannot pass.",
        media=[MediaItem(media_id="M-FAIL", media_type="image/jpeg", url="corrupt.jpg")],
        location=Location(lat=12.93, lng=77.62),
    )
    # Should not throw exception; text analysis succeeds
    evidence = await service.analyze(report)

    assert evidence.report_id == "R-PARTIAL"
    assert evidence.disaster_type == DisasterType.FLOOD
    assert evidence.access_status == AccessStatus.BLOCKED
    assert evidence.location.lat == 12.93


# ============================================================================
# Test 10: Prepared Demo Scenario Reports (Reports 001 - 004)
# ============================================================================

@pytest.mark.asyncio
async def test_prepared_demo_scenario_reports():
    """Tests the 4 canonical demo reports from Section 19."""
    analyzer = DeterministicDemoAnalyzer()

    # REPORT 001: "Road is flooded near the bridge."
    r1 = Report(report_id="R-001", text="Road is flooded near the bridge.", location=Location(lat=12.935, lng=77.624))
    e1 = await analyzer.analyze(r1)
    assert e1.disaster_type == DisasterType.FLOOD
    assert e1.severity in [SeverityLevel.MEDIUM, SeverityLevel.HIGH]
    assert e1.location is not None

    # REPORT 002: "Five people are trapped near the bridge."
    r2 = Report(report_id="R-002", text="Five people are trapped near the bridge.")
    e2 = await analyzer.analyze(r2)
    assert e2.people_affected == 5
    assert NeedType.RESCUE in e2.needs
    assert e2.urgency in [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]

    # REPORT 003: "Vehicles cannot pass through the flooded road."
    r3 = Report(report_id="R-003", text="Vehicles cannot pass through the flooded road.")
    e3 = await analyzer.analyze(r3)
    assert e3.access_status == AccessStatus.BLOCKED

    # REPORT 004: "Two people need immediate medical assistance."
    r4 = Report(report_id="R-004", text="Two people need immediate medical assistance.")
    e4 = await analyzer.analyze(r4)
    assert e4.people_affected == 2
    assert NeedType.MEDICAL in e4.needs
    assert e4.urgency in [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]


# ============================================================================
# Test 11: Interface & Alias Compatibility
# ============================================================================

def test_interface_and_alias_compatibility():
    """Verifies EvidenceAnalysisInterface compliance and MockEvidenceAnalysisService alias."""
    analyzer = get_evidence_analyzer()
    assert isinstance(analyzer, EvidenceAnalysisInterface)
    assert isinstance(analyzer, EvidenceAnalysisService)
    assert MockEvidenceAnalysisService is DeterministicDemoAnalyzer


# ============================================================================
# Test 12: Ingestion Endpoint Integration
# ============================================================================

@pytest.mark.asyncio
async def test_reports_endpoint_integration():
    """Verifies that POST /api/v1/reports/ calls Evidence Analysis service properly."""
    import httpx
    from app.main import app

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "report_id": "R-INGEST-01",
            "text": "Road is flooded near the bridge with five people trapped.",
            "location": {"lat": 12.935, "lng": 77.624, "address": "Market Road"},
            "source": "citizen",
        }
        resp = await ac.post("/api/v1/reports/", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["report_id"] == "R-INGEST-01"
        assert data["evidence"]["disaster_type"] == "flood"
        assert data["evidence"]["people_affected"] == 5
        assert "rescue" in data["evidence"]["needs"]
        assert data["evidence"]["location"]["lat"] == 12.935

