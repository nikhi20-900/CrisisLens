"""Deterministic Priority Engine.

Calculates response priority based on severity, exposure, urgency, and accessibility.
Priority determines the ORDER in which incidents should be addressed.
"""

from app.schemas import AIAnalysisResult, SeverityBreakdown, PriorityBreakdown, WeatherContext
from typing import Optional
import logging

logger = logging.getLogger(__name__)

PRIORITY_THRESHOLDS = {
    "LOW": (0, 25),
    "MEDIUM": (26, 50),
    "HIGH": (51, 75),
    "CRITICAL": (76, 100),
}


def _exposure_score(analysis: AIAnalysisResult) -> tuple[float, list[str]]:
    """How many people/assets are exposed?"""
    score = 0.0
    reasons = []

    people = max(analysis.people.visible_people, analysis.people.estimated_affected)
    if people > 100:
        score = 1.0
        reasons.append(f"{people} people potentially exposed")
    elif people > 50:
        score = 0.85
        reasons.append(f"{people} people potentially exposed")
    elif people > 10:
        score = 0.7
        reasons.append(f"{people} people potentially exposed")
    elif people > 0:
        score = 0.5
        reasons.append(f"{people} people potentially exposed")
    else:
        score = 0.3
        reasons.append("No direct population exposure detected")

    # Infrastructure multiplier
    damage = analysis.damage
    critical_infra = sum(1 for d in [damage.buildings, damage.roads, damage.bridges, damage.utilities]
                         if d.lower() in ("severe", "destroyed", "major", "blocked"))
    if critical_infra >= 3:
        score = min(score + 0.2, 1.0)
        reasons.append(f"{critical_infra} critical infrastructure types affected")
    elif critical_infra >= 1:
        score = min(score + 0.1, 1.0)
        reasons.append(f"{critical_infra} infrastructure type(s) affected")

    return score, reasons


def _urgency_score(analysis: AIAnalysisResult, weather: Optional[WeatherContext] = None) -> tuple[float, list[str]]:
    """How time-sensitive is the response?"""
    score = 0.3  # baseline
    reasons = []

    if analysis.people.possible_casualties:
        score = 1.0
        reasons.append("Possible casualties — immediate response critical")
    elif analysis.people.possible_injuries:
        score = max(score, 0.9)
        reasons.append("Possible injuries requiring medical attention")
    elif analysis.people.possible_stranded_people:
        score = max(score, 0.8)
        reasons.append("People possibly stranded — time-sensitive rescue")

    # Hazard urgency
    critical_hazard_keywords = ["electrical", "gas", "fire", "explosion", "chemical", "fast moving", "collapse"]
    for hazard in analysis.hazards:
        if any(kw in hazard.lower() for kw in critical_hazard_keywords):
            score = max(score, 0.85)
            reasons.append(f"Urgent hazard: {hazard}")
            break

    # Weather worsening
    if weather and weather.available and weather.is_severe:
        score = min(score + 0.1, 1.0)
        reasons.append("Severe weather may worsen conditions")

    if not reasons:
        reasons.append("Standard urgency level")

    return score, reasons


def _accessibility_factor(analysis: AIAnalysisResult) -> tuple[float, list[str]]:
    """How difficult is it to reach the incident? Higher = harder = more urgent."""
    score = 0.3  # baseline easy access
    reasons = []

    if analysis.accessibility_issues:
        per_issue = 0.15
        score = min(0.3 + len(analysis.accessibility_issues) * per_issue, 1.0)
        reasons.extend(analysis.accessibility_issues)

    if analysis.damage.roads.lower() in ("blocked", "destroyed", "severe"):
        score = min(score + 0.2, 1.0)
        reasons.append("Road access compromised")

    if analysis.damage.bridges.lower() in ("blocked", "destroyed", "severe"):
        score = min(score + 0.15, 1.0)
        reasons.append("Bridge access compromised")

    if not reasons:
        reasons.append("No significant accessibility barriers")

    return score, reasons


def calculate_priority(
    analysis: AIAnalysisResult,
    severity: SeverityBreakdown,
    weather: Optional[WeatherContext] = None,
) -> PriorityBreakdown:
    """Calculate response priority.

    priority = severity_normalized × exposure × urgency × accessibility_factor

    All components are 0-1. Final score is normalized to 0-100.
    """
    severity_norm = severity.normalized_score / 100.0

    exposure, exposure_reasons = _exposure_score(analysis)
    urgency, urgency_reasons = _urgency_score(analysis, weather)
    accessibility, accessibility_reasons = _accessibility_factor(analysis)

    # Weighted combination (not pure multiplication to avoid tiny scores)
    raw = (
        severity_norm * 0.35
        + exposure * 0.25
        + urgency * 0.25
        + accessibility * 0.15
    )

    normalized = min(round(raw * 100, 1), 100.0)

    # Determine label
    label = "LOW"
    for lbl, (lo, hi) in PRIORITY_THRESHOLDS.items():
        if lo <= normalized <= hi:
            label = lbl
            break

    all_reasons = exposure_reasons + urgency_reasons + accessibility_reasons

    breakdown = PriorityBreakdown(
        severity_component=round(severity_norm, 3),
        exposure_component=round(exposure, 3),
        urgency_component=round(urgency, 3),
        accessibility_component=round(accessibility, 3),
        raw_score=round(raw, 4),
        normalized_score=normalized,
        label=label,
        reasons=all_reasons,
    )

    logger.info(f"Priority: {normalized}/100 ({label}) | S={severity_norm:.2f} E={exposure:.2f} U={urgency:.2f} A={accessibility:.2f}")
    return breakdown
