"""Unit tests for CrisisLens deterministic engines:
- Severity Engine
- Priority Engine
- Recommendation Engine
- Uncertainty handling
"""

import pytest
from app.schemas import (
    AIAnalysisResult,
    DamageAssessment,
    PeopleAssessment,
    WeatherContext,
)
from app.engines.severity_engine import calculate_severity
from app.engines.priority_engine import calculate_priority
from app.engines.recommendation_engine import generate_recommendations


def test_severity_calculation_critical_flood():
    """Test severity engine with high damage and stranded individuals."""
    analysis = AIAnalysisResult(
        disaster_type="flood",
        summary="Flash flood submerging town center",
        damage=DamageAssessment(
            buildings="severe",
            roads="blocked",
            utilities="disrupted",
            bridges="severe",
            vehicles="destroyed",
        ),
        people=PeopleAssessment(
            visible_people=8,
            estimated_affected=30,
            possible_stranded_people=True,
            possible_injuries=True,
            possible_casualties=False,
        ),
        hazards=["fast moving water", "electrical downed lines", "blocked bridges"],
        severity=4,
        severity_label="HIGH",
        confidence=0.85,
        evidence=["water covering road", "civilians on roof"],
        accessibility_issues=["road completely blocked", "bridge compromised"],
        environmental_risks=["ongoing heavy rain"],
    )

    breakdown = calculate_severity(analysis)
    
    assert breakdown.normalized_score >= 60.0
    assert breakdown.label in ("HIGH", "CRITICAL")
    assert len(breakdown.factors) == 5
    
    # Check factor explainability
    factor_names = [f.factor for f in breakdown.factors]
    assert "People Impact" in factor_names
    assert "Infrastructure Damage" in factor_names
    assert "Immediate Hazards" in factor_names
    assert "Accessibility" in factor_names
    assert "Environmental Risk" in factor_names


def test_severity_calculation_minimal():
    """Test severity engine with negligible impact returns LOW."""
    analysis = AIAnalysisResult(
        disaster_type="flood",
        summary="Minor puddle on sidewalk",
        damage=DamageAssessment(
            buildings="none",
            roads="none",
            utilities="none",
            bridges="none",
            vehicles="none",
        ),
        people=PeopleAssessment(
            visible_people=0,
            estimated_affected=0,
            possible_stranded_people=False,
            possible_injuries=False,
            possible_casualties=False,
        ),
        hazards=[],
        severity=1,
        severity_label="LOW",
        confidence=0.9,
    )

    breakdown = calculate_severity(analysis)
    assert breakdown.normalized_score <= 25.0
    assert breakdown.label == "LOW"


def test_priority_engine_calculation():
    """Test priority engine combines severity, exposure, urgency, and accessibility."""
    analysis = AIAnalysisResult(
        disaster_type="earthquake",
        summary="Apartment collapse with trapped survivors",
        damage=DamageAssessment(
            buildings="destroyed",
            roads="blocked",
            utilities="destroyed",
            bridges="none",
            vehicles="severe",
        ),
        people=PeopleAssessment(
            visible_people=5,
            estimated_affected=40,
            possible_stranded_people=True,
            possible_injuries=True,
            possible_casualties=True,
        ),
        hazards=["structural collapse", "active gas leak"],
        severity=5,
        severity_label="CRITICAL",
        confidence=0.92,
        accessibility_issues=["street debris blocking heavy transit"],
    )

    severity = calculate_severity(analysis)
    weather = WeatherContext(
        temperature_c=10.0,
        precipitation_mm=0.0,
        weather_description="Clear",
        available=True,
    )

    priority = calculate_priority(analysis, severity, weather)

    assert priority.normalized_score >= 70.0
    assert priority.label in ("HIGH", "CRITICAL")
    assert len(priority.reasons) > 0
    assert priority.exposure_component > 0.5
    assert priority.urgency_component >= 0.8


def test_recommendation_engine_explainable_rules():
    """Test recommendations generate concrete actions with explainable reasons."""
    analysis = AIAnalysisResult(
        disaster_type="flood",
        summary="Stranded flood victims with downed power lines",
        damage=DamageAssessment(
            buildings="minor",
            roads="blocked",
            utilities="disrupted",
            bridges="none",
            vehicles="minor",
        ),
        people=PeopleAssessment(
            visible_people=4,
            estimated_affected=15,
            possible_stranded_people=True,
            possible_injuries=False,
            possible_casualties=False,
        ),
        hazards=["downed live electrical lines", "water level rising"],
        severity=4,
        severity_label="HIGH",
        confidence=0.88,
    )

    severity = calculate_severity(analysis)
    priority = calculate_priority(analysis, severity)
    recommendations = generate_recommendations(analysis, severity, priority)

    assert len(recommendations) > 0

    # Must contain rescue recommendation due to stranded people
    actions = [r["action"].lower() for r in recommendations]
    assert any("rescue" in a for a in actions)

    # Must contain electrical isolation due to hazard
    assert any("electric" in a for a in actions)

    # Must contain road restriction due to blocked road
    assert any("access" in a or "road" in a for a in actions)

    # Verify each recommendation has an explanation
    for r in recommendations:
        assert "reason" in r and len(r["reason"]) > 0
        assert "priority" in r
        assert "category" in r
