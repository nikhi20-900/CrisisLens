"""Deterministic Recommendation Engine.

Generates response recommendations based on structured evidence.
Each recommendation explains WHY it was generated.
"""

from app.schemas import AIAnalysisResult, SeverityBreakdown, PriorityBreakdown
import logging

logger = logging.getLogger(__name__)


def _rescue_recommendations(analysis: AIAnalysisResult) -> list[dict]:
    """Recommendations related to rescue operations."""
    recs = []

    if analysis.people.possible_stranded_people:
        recs.append({
            "action": "Prioritize rescue assessment and establish safe access to stranded individuals",
            "reason": "People appear to be stranded based on visual and report evidence",
            "priority": "CRITICAL",
            "category": "rescue",
        })

    if analysis.people.possible_casualties:
        recs.append({
            "action": "Deploy emergency medical response and search-and-rescue teams immediately",
            "reason": "Possible casualties reported — time-critical response required",
            "priority": "CRITICAL",
            "category": "rescue",
        })

    if analysis.people.possible_injuries:
        recs.append({
            "action": "Escalate for medical response and prepare triage facilities",
            "reason": "Possible injuries detected requiring medical attention",
            "priority": "HIGH",
            "category": "medical",
        })

    estimated = max(analysis.people.visible_people, analysis.people.estimated_affected)
    if estimated > 20:
        recs.append({
            "action": f"Coordinate mass evacuation or sheltering for approximately {estimated} affected individuals",
            "reason": f"Large number of people ({estimated}) potentially affected",
            "priority": "HIGH",
            "category": "evacuation",
        })

    return recs


def _infrastructure_recommendations(analysis: AIAnalysisResult) -> list[dict]:
    """Recommendations related to infrastructure damage."""
    recs = []

    if analysis.damage.roads.lower() in ("blocked", "destroyed", "severe"):
        recs.append({
            "action": "Restrict vehicle access to affected road and assess alternate evacuation routes",
            "reason": f"Road status: {analysis.damage.roads}",
            "priority": "HIGH",
            "category": "access",
        })

    if analysis.damage.bridges.lower() in ("blocked", "destroyed", "severe"):
        recs.append({
            "action": "Close affected bridge and establish alternate crossing points",
            "reason": f"Bridge status: {analysis.damage.bridges}",
            "priority": "HIGH",
            "category": "access",
        })

    if analysis.damage.buildings.lower() in ("destroyed", "severe", "major"):
        recs.append({
            "action": "Deploy structural assessment team and establish exclusion zone around damaged buildings",
            "reason": f"Building damage: {analysis.damage.buildings}",
            "priority": "HIGH",
            "category": "structural",
        })

    if analysis.damage.utilities.lower() in ("destroyed", "severe", "disrupted"):
        recs.append({
            "action": "Contact utility providers for emergency shutoff and damage assessment",
            "reason": f"Utility status: {analysis.damage.utilities}",
            "priority": "MEDIUM",
            "category": "utilities",
        })

    return recs


def _hazard_recommendations(analysis: AIAnalysisResult) -> list[dict]:
    """Recommendations based on identified hazards."""
    recs = []

    for hazard in analysis.hazards:
        hazard_lower = hazard.lower()

        if "electric" in hazard_lower or "power" in hazard_lower:
            recs.append({
                "action": "Flag electrical infrastructure for emergency isolation and inspection",
                "reason": f"Hazard detected: {hazard}",
                "priority": "CRITICAL",
                "category": "hazard",
            })
        elif "fire" in hazard_lower:
            recs.append({
                "action": "Deploy fire suppression resources and establish fire break perimeter",
                "reason": f"Hazard detected: {hazard}",
                "priority": "CRITICAL",
                "category": "fire",
            })
        elif "gas" in hazard_lower or "chemical" in hazard_lower or "toxic" in hazard_lower:
            recs.append({
                "action": "Evacuate immediate area and deploy HAZMAT response team",
                "reason": f"Hazard detected: {hazard}",
                "priority": "CRITICAL",
                "category": "hazmat",
            })
        elif "water" in hazard_lower or "flood" in hazard_lower:
            recs.append({
                "action": "Restrict access to flooded area and monitor water levels",
                "reason": f"Hazard detected: {hazard}",
                "priority": "HIGH",
                "category": "flood",
            })
        elif "collapse" in hazard_lower or "unstable" in hazard_lower:
            recs.append({
                "action": "Establish structural exclusion zone and deploy engineering assessment",
                "reason": f"Hazard detected: {hazard}",
                "priority": "HIGH",
                "category": "structural",
            })
        else:
            recs.append({
                "action": f"Assess and mitigate identified hazard: {hazard}",
                "reason": f"Hazard detected: {hazard}",
                "priority": "MEDIUM",
                "category": "general",
            })

    return recs


def _accessibility_recommendations(analysis: AIAnalysisResult) -> list[dict]:
    """Recommendations for accessibility issues."""
    recs = []

    for issue in analysis.accessibility_issues:
        recs.append({
            "action": f"Plan alternate access: {issue}",
            "reason": f"Accessibility constraint: {issue}",
            "priority": "MEDIUM",
            "category": "access",
        })

    return recs


def _general_recommendations(analysis: AIAnalysisResult, severity_label: str) -> list[dict]:
    """General recommendations based on disaster type and severity."""
    recs = []

    dtype = analysis.disaster_type.lower()

    if dtype in ("flood", "flash flood"):
        recs.append({
            "action": "Monitor upstream water levels and prepare for potential escalation",
            "reason": f"Disaster type: {analysis.disaster_type}",
            "priority": "MEDIUM",
            "category": "monitoring",
        })
    elif dtype in ("earthquake", "tremor"):
        recs.append({
            "action": "Prepare for aftershocks and conduct rapid structural assessments of nearby buildings",
            "reason": f"Disaster type: {analysis.disaster_type}",
            "priority": "HIGH",
            "category": "structural",
        })
    elif dtype in ("wildfire", "fire", "bushfire"):
        recs.append({
            "action": "Monitor wind direction and speed; prepare evacuation routes downwind",
            "reason": f"Disaster type: {analysis.disaster_type}",
            "priority": "HIGH",
            "category": "fire",
        })
    elif dtype in ("cyclone", "hurricane", "typhoon", "storm"):
        recs.append({
            "action": "Activate storm shelter protocols and monitor storm trajectory",
            "reason": f"Disaster type: {analysis.disaster_type}",
            "priority": "HIGH",
            "category": "storm",
        })
    elif dtype in ("landslide", "mudslide"):
        recs.append({
            "action": "Establish exclusion zone and monitor for secondary slides",
            "reason": f"Disaster type: {analysis.disaster_type}",
            "priority": "HIGH",
            "category": "geotechnical",
        })

    if dtype in ("unknown", "") or not dtype:
        recs.append({
            "action": "Deploy field liaison team to conduct immediate ground reconnaissance and confirm impact extent",
            "reason": "Baseline protocol: Ground verification required for unconfirmed or ambiguous situation reports",
            "priority": "HIGH",
            "category": "reconnaissance",
        })

    if severity_label in ("CRITICAL", "HIGH"):
        recs.append({
            "action": "Establish incident command post and coordinate multi-agency response",
            "reason": f"Severity level: {severity_label}",
            "priority": "HIGH",
            "category": "coordination",
        })
    elif not recs:
        recs.append({
            "action": "Log incident report and maintain standard area monitoring",
            "reason": "Standard operational baseline for low-severity or informational reports",
            "priority": "LOW",
            "category": "monitoring",
        })

    return recs


def generate_recommendations(
    analysis: AIAnalysisResult,
    severity: SeverityBreakdown,
    priority: PriorityBreakdown,
) -> list[dict]:
    """Generate all response recommendations with explanations.

    Returns a list of recommendation dicts, each with:
    - action: What to do
    - reason: Why it's recommended
    - priority: How urgent (CRITICAL/HIGH/MEDIUM/LOW)
    - category: Type of recommendation
    """
    all_recs = []

    all_recs.extend(_rescue_recommendations(analysis))
    all_recs.extend(_hazard_recommendations(analysis))
    all_recs.extend(_infrastructure_recommendations(analysis))
    all_recs.extend(_accessibility_recommendations(analysis))
    all_recs.extend(_general_recommendations(analysis, severity.label))

    # Sort by priority
    priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    all_recs.sort(key=lambda r: priority_order.get(r.get("priority", "LOW"), 3))

    # Deduplicate by action
    seen = set()
    unique_recs = []
    for rec in all_recs:
        if rec["action"] not in seen:
            seen.add(rec["action"])
            unique_recs.append(rec)

    logger.info(f"Generated {len(unique_recs)} recommendations")
    return unique_recs
