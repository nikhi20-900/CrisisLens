import pytest
from app.schemas.domain import Report, Location, MediaItem, DisasterType, SeverityLevel, NeedType, AccessStatus
from app.services.evidence_analysis import MockEvidenceAnalysisService


@pytest.mark.asyncio
async def test_normal_flood_report():
    analyzer = MockEvidenceAnalysisService()
    report = Report(
        report_id="R-001",
        text="Severe flood on Main Street. Water rising rapidly near the marketplace.",
        location=Location(lat=12.935, lng=77.624, address="Main Street Market"),
    )
    evidence = await analyzer.analyze_report(report)
    assert evidence.report_id == "R-001"
    assert evidence.disaster_type == DisasterType.FLOOD
    assert evidence.severity in [SeverityLevel.HIGH, SeverityLevel.MEDIUM]
    assert evidence.confidence.disaster_type >= 0.90


@pytest.mark.asyncio
async def test_incomplete_report():
    analyzer = MockEvidenceAnalysisService()
    report = Report(
        report_id="R-002",
        text="Help!",
    )
    evidence = await analyzer.analyze_report(report)
    assert evidence.report_id == "R-002"
    assert evidence.location is None
    assert evidence.people_affected is None
    assert evidence.confidence.location < 0.50


@pytest.mark.asyncio
async def test_report_multiple_needs():
    analyzer = MockEvidenceAnalysisService()
    report = Report(
        report_id="R-003",
        text="Five people are trapped by water and need a rescue boat. One elderly person needs urgent medical doctor attention.",
        location=Location(lat=12.936, lng=77.625),
    )
    evidence = await analyzer.analyze_report(report)
    assert NeedType.RESCUE in evidence.needs
    assert NeedType.MEDICAL in evidence.needs
    assert evidence.people_affected == 5
    assert evidence.severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]


@pytest.mark.asyncio
async def test_uncertain_missing_location():
    analyzer = MockEvidenceAnalysisService()
    report = Report(
        report_id="R-004",
        text="Road blocked completely by flood water",
        location=None,
    )
    evidence = await analyzer.analyze_report(report)
    assert evidence.location is None
    assert evidence.access_status == AccessStatus.BLOCKED
    assert evidence.confidence.location <= 0.30


@pytest.mark.asyncio
async def test_image_and_text_mock():
    analyzer = MockEvidenceAnalysisService()
    report = Report(
        report_id="R-005",
        text="Bridge is submerged under water",
        media=[
            MediaItem(media_id="M-01", media_type="image/jpeg", url="https://example.com/demo_flood.jpg", caption="Submerged bridge")
        ],
        location=Location(lat=12.937, lng=77.626),
    )
    evidence = await analyzer.analyze_report(report)
    assert evidence.extracted_entities["has_media"] is True
    assert evidence.access_status == AccessStatus.BLOCKED
