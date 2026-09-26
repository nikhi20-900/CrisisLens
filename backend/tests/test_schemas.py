"""Unit tests for Pydantic Schema validations and uncertainty flagging."""

import pytest
from app.schemas import AIAnalysisResult, DamageAssessment, PeopleAssessment, HumanReview


def test_ai_analysis_result_validation():
    """Verify strict parsing and normalization of AI output."""
    raw_payload = {
        "disaster_type": "  FLOOD  ",
        "summary": "Submerged road with trapped vehicles",
        "damage": {
            "buildings": "moderate",
            "roads": "severe",
            "utilities": "disrupted",
            "bridges": "unknown",
            "vehicles": "destroyed",
        },
        "people": {
            "visible_people": 3,
            "estimated_affected": 12,
            "possible_stranded_people": True,
            "possible_injuries": False,
            "possible_casualties": False,
        },
        "hazards": ["submerged debris", "fast water"],
        "severity": 4,
        "severity_label": "high",
        "confidence": 0.82,
        "evidence": ["water across road", "stranded cars"],
        "recommended_actions": ["close road"],
        "accessibility_issues": ["access route cut off"],
        "environmental_risks": ["rising water"],
        "uncertainty_factors": ["exact depth cannot be verified"],
    }

    result = AIAnalysisResult.model_validate(raw_payload)

    assert result.disaster_type == "flood"
    assert result.severity_label == "HIGH"
    assert result.confidence == 0.82
    assert result.damage.roads == "severe"
    assert result.people.possible_stranded_people is True


def test_human_review_schema_validation():
    """Verify human review schema validates statuses."""
    valid_review = HumanReview(
        severity_label="CRITICAL",
        severity_score=90.0,
        review_status="approved",
        reviewer_notes="Confirmed via aerial drone reconnaissance",
        reviewed_by="Commander Ops 1",
    )
    assert valid_review.review_status == "approved"

    with pytest.raises(Exception):
        HumanReview(review_status="invalid_status")
