"""Deterministic Severity Engine.

Converts structured AI evidence into a severity score (0-100).
The AI provides evidence. This engine converts it into a score.
This makes the system more explainable and less dependent on hallucinated AI judgments.
"""

from app.schemas import AIAnalysisResult, SeverityFactor, SeverityBreakdown
import logging

logger = logging.getLogger(__name__)

# ─── Configurable Thresholds ────────────────────────────────────────

SEVERITY_THRESHOLDS = {
    "LOW": (0, 25),
    "MEDIUM": (26, 50),
    "HIGH": (51, 75),
    "CRITICAL": (76, 100),
}

# Maximum points per factor category
MAX_SCORES = {
    "people": 30,
    "infrastructure": 20,
    "hazards": 20,
    "accessibility": 15,
    "environmental": 15,
}


def _score_people(analysis: AIAnalysisResult) -> SeverityFactor:
    """Score based on people potentially affected."""
    score = 0.0
    reasons = []

    people = analysis.people
    if people.possible_casualties:
        score += 30
        reasons.append("Possible casualties reported")
    elif people.possible_injuries:
        score += 22
        reasons.append("Possible injuries")
    elif people.possible_stranded_people:
        score += 18
        reasons.append("People possibly stranded")

    # Scale by estimated affected
    estimated = max(people.visible_people, people.estimated_affected)
    if estimated > 50:
        score = min(score + 10, 30)
        reasons.append(f"{estimated} people potentially affected")
    elif estimated > 10:
        score = min(score + 6, 30)
        reasons.append(f"{estimated} people potentially affected")
    elif estimated > 0:
        score = min(score + 3, 30)
        reasons.append(f"{estimated} people potentially affected")

    if not reasons:
        reasons.append("No direct people impact detected")

    return SeverityFactor(
        factor="People Impact",
        score=min(score, MAX_SCORES["people"]),
        max_score=MAX_SCORES["people"],
        description="; ".join(reasons),
    )


def _score_infrastructure(analysis: AIAnalysisResult) -> SeverityFactor:
    """Score based on infrastructure damage."""
    score = 0.0
    reasons = []

    damage = analysis.damage
    damage_levels = {
        "destroyed": 5, "severe": 4, "major": 4,
        "moderate": 3, "minor": 2, "light": 1,
        "none": 0, "unknown": 0,
    }

    for field, label in [
        ("buildings", damage.buildings),
        ("roads", damage.roads),
        ("utilities", damage.utilities),
        ("bridges", damage.bridges),
        ("vehicles", damage.vehicles),
    ]:
        level = damage_levels.get(label.lower(), 0)
        if level > 0:
            score += level
            reasons.append(f"{field}: {label}")

    # Normalize: max 5 fields × 5 points = 25, scale to max_score
    score = (score / 25) * MAX_SCORES["infrastructure"]

    if not reasons:
        reasons.append("No significant infrastructure damage detected")

    return SeverityFactor(
        factor="Infrastructure Damage",
        score=min(round(score, 1), MAX_SCORES["infrastructure"]),
        max_score=MAX_SCORES["infrastructure"],
        description="; ".join(reasons),
    )


def _score_hazards(analysis: AIAnalysisResult) -> SeverityFactor:
    """Score based on immediate hazards identified."""
    score = 0.0
    reasons = []

    critical_keywords = [
        "electrical", "gas leak", "chemical", "explosion", "collapse",
        "fast moving water", "tsunami", "fire", "toxic",
    ]
    high_keywords = [
        "flooding", "debris", "landslide", "blocked", "unstable",
        "contaminated", "sewage",
    ]

    for hazard in analysis.hazards:
        hazard_lower = hazard.lower()
        if any(kw in hazard_lower for kw in critical_keywords):
            score += 7
            reasons.append(f"Critical: {hazard}")
        elif any(kw in hazard_lower for kw in high_keywords):
            score += 4
            reasons.append(f"High: {hazard}")
        else:
            score += 2
            reasons.append(hazard)

    if not reasons:
        reasons.append("No immediate hazards identified")

    return SeverityFactor(
        factor="Immediate Hazards",
        score=min(round(score, 1), MAX_SCORES["hazards"]),
        max_score=MAX_SCORES["hazards"],
        description="; ".join(reasons),
    )


def _score_accessibility(analysis: AIAnalysisResult) -> SeverityFactor:
    """Score based on accessibility issues."""
    score = 0.0
    reasons = []

    for issue in analysis.accessibility_issues:
        score += 5
        reasons.append(issue)

    # If roads are blocked, add to accessibility
    if analysis.damage.roads.lower() in ("blocked", "destroyed", "severe"):
        score += 5
        reasons.append("Road access compromised")

    if not reasons:
        reasons.append("No accessibility issues detected")

    return SeverityFactor(
        factor="Accessibility",
        score=min(round(score, 1), MAX_SCORES["accessibility"]),
        max_score=MAX_SCORES["accessibility"],
        description="; ".join(reasons),
    )


def _score_environmental(analysis: AIAnalysisResult) -> SeverityFactor:
    """Score based on environmental risks."""
    score = 0.0
    reasons = []

    for risk in analysis.environmental_risks:
        score += 5
        reasons.append(risk)

    # Weather-sensitive disaster types get bonus
    if analysis.disaster_type in ("flood", "cyclone", "hurricane", "typhoon", "storm"):
        score += 3
        reasons.append(f"Weather-sensitive disaster type: {analysis.disaster_type}")

    if not reasons:
        reasons.append("No significant environmental risks")

    return SeverityFactor(
        factor="Environmental Risk",
        score=min(round(score, 1), MAX_SCORES["environmental"]),
        max_score=MAX_SCORES["environmental"],
        description="; ".join(reasons),
    )


def calculate_severity(analysis: AIAnalysisResult) -> SeverityBreakdown:
    """Calculate deterministic severity score from structured AI evidence.

    Returns a full breakdown for explainability.
    """
    factors = [
        _score_people(analysis),
        _score_infrastructure(analysis),
        _score_hazards(analysis),
        _score_accessibility(analysis),
        _score_environmental(analysis),
    ]

    raw_total = sum(f.score for f in factors)
    max_total = sum(f.max_score for f in factors)  # should be 100

    normalized = min(round((raw_total / max_total) * 100, 1), 100.0) if max_total > 0 else 0.0

    # Determine label
    label = "LOW"
    for lbl, (lo, hi) in SEVERITY_THRESHOLDS.items():
        if lo <= normalized <= hi:
            label = lbl
            break

    breakdown = SeverityBreakdown(
        factors=factors,
        raw_total=round(raw_total, 1),
        normalized_score=normalized,
        label=label,
    )

    logger.info(f"Severity: {normalized}/100 ({label}) | Factors: {[(f.factor, f.score) for f in factors]}")
    return breakdown
