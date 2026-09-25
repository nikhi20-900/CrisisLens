"""
Phase 2: Priority Engine
========================
Calculates a deterministic, explainable, bounded priority score (0-100), severity level,
factor breakdown, and grounded reasons for incident decision support.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field

from app.schemas.domain import (
    Incident,
    SeverityLevel,
    UrgencyLevel,
    NeedStatus,
    AccessStatus,
)
from app.services.response.config import PriorityConfig, default_priority_config
from app.services.response.needs import NeedsEngine, needs_engine


class PriorityResult(BaseModel):
    """Structured decision-support result of the priority calculation."""

    score: float = Field(..., ge=0.0, le=100.0, description="Bounded priority score (0.0 to 100.0)")
    priority_level: SeverityLevel = Field(..., description="Mapped severity/priority level")
    factors: Dict[str, float] = Field(default_factory=dict, description="Normalized factor contributions (0.0 to 1.0)")
    reasons: List[str] = Field(default_factory=list, description="Grounded reasons referencing actual incident data")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Overall confidence level of priority assessment")
    situation_trend: str = Field("STABLE", description="Trend direction: WORSENING, STABLE, or IMPROVING")
    configuration_version: str = Field("v1.0.0", description="Version of PriorityConfig used for calculation")


class PriorityEngine:
    """
    Deterministic priority scoring engine.
    """

    def __init__(
        self,
        config: Optional[PriorityConfig] = None,
        needs_eng: Optional[NeedsEngine] = None,
    ):
        self.config = config or default_priority_config
        self.needs_engine = needs_eng or needs_engine

    def calculate_priority(self, incident: Incident) -> PriorityResult:
        """
        Calculates priority score (0-100), factors, reasons, trend, and severity level.
        """
        reasons: List[str] = []
        factors: Dict[str, float] = {}

        # Ensure needs are extracted/evaluated consistently
        current_needs = self.needs_engine.extract_needs(incident)

        # 1. Severity Factor
        severity_map = {
            SeverityLevel.LOW: 0.25,
            SeverityLevel.MEDIUM: 0.50,
            SeverityLevel.HIGH: 0.75,
            SeverityLevel.CRITICAL: 1.00,
        }
        raw_severity = severity_map.get(incident.severity, 0.5)
        factors["severity"] = raw_severity
        if incident.severity in (SeverityLevel.HIGH, SeverityLevel.CRITICAL):
            reasons.append(f"Incident severity is classified as {incident.severity.value.upper()}.")

        # 2. People Affected Factor
        people_count = incident.people_affected
        people_norm = min(people_count / max(self.config.max_people_affected_cap, 1), 1.0)
        factors["people_affected"] = people_norm
        if people_count > 0:
            reasons.append(f"{people_count} people reported affected.")

        # 3. Critical Needs Factor
        unmet_needs = [n for n in current_needs if n.status == NeedStatus.UNMET]
        critical_count = sum(1 for n in unmet_needs if n.urgency in (UrgencyLevel.CRITICAL, UrgencyLevel.HIGH))
        
        need_norm = min(critical_count / 1.0, 1.0) if unmet_needs else 0.0
        factors["critical_needs"] = need_norm
        
        for n in unmet_needs:
            if n.urgency == UrgencyLevel.CRITICAL:
                reasons.append(f"{n.type.value.capitalize()} need is marked CRITICAL.")
            elif n.urgency == UrgencyLevel.HIGH:
                reasons.append(f"{n.type.value.capitalize()} need is marked HIGH priority.")

        # 4. Accessibility Factor
        access_map = {
            AccessStatus.OPEN: 0.0,
            AccessStatus.PARTIALLY_BLOCKED: 0.50,
            AccessStatus.BLOCKED: 0.90,
            AccessStatus.SUBMERGED: 1.00,
            AccessStatus.UNKNOWN: 0.30,
        }
        access_norm = access_map.get(incident.access_status, 0.30)
        factors["accessibility"] = access_norm
        if incident.access_status in (AccessStatus.BLOCKED, AccessStatus.SUBMERGED):
            reasons.append(f"Road access is {incident.access_status.value}.")
        elif incident.access_status == AccessStatus.PARTIALLY_BLOCKED:
            reasons.append("Road access is partially blocked.")

        # 5. Situation Trend Factor
        trend = self._infer_situation_trend(incident)
        trend_map = {"WORSENING": 1.0, "STABLE": 0.5, "IMPROVING": 0.0}
        trend_norm = trend_map.get(trend, 0.5)
        factors["situation_trend"] = trend_norm
        if trend == "WORSENING":
            reasons.append("Situation trend is worsening over recent updates.")
        elif trend == "IMPROVING":
            reasons.append("Situation trend is improving over recent updates.")

        # 6. Confidence Calculation
        need_confidences = [n.confidence for n in current_needs]
        avg_confidence = (
            sum(need_confidences) / len(need_confidences) if need_confidences else 1.0
        )
        factors["confidence"] = avg_confidence

        # Combine Weighted Score
        weighted_score = (
            factors["severity"] * self.config.severity_weight
            + factors["people_affected"] * self.config.people_weight
            + factors["critical_needs"] * self.config.critical_need_weight
            + factors["accessibility"] * self.config.accessibility_weight
            + factors["situation_trend"] * self.config.trend_weight
            + factors["confidence"] * self.config.confidence_weight
        )

        # Ensure bounded range [0.0, 100.0]
        final_score = max(
            self.config.score_min_bound,
            min(round(weighted_score, 1), self.config.score_max_bound),
        )

        # Map final score to Severity/Priority Level
        if final_score >= 80.0:
            level = SeverityLevel.CRITICAL
        elif final_score >= 60.0:
            level = SeverityLevel.HIGH
        elif final_score >= 40.0:
            level = SeverityLevel.MEDIUM
        else:
            level = SeverityLevel.LOW

        # Ensure fallback reason if none matched
        if not reasons:
            reasons.append("Incident priority evaluated based on default baseline factors.")

        return PriorityResult(
            score=final_score,
            priority_level=level,
            factors=factors,
            reasons=reasons,
            confidence=avg_confidence,
            situation_trend=trend,
            configuration_version=self.config.configuration_version,
        )

    @staticmethod
    def _infer_situation_trend(incident: Incident) -> str:
        """Infers trend from snapshots if available, or returns STABLE."""
        snapshots = incident.snapshots
        if not snapshots or len(snapshots) < 2:
            return "STABLE"

        prev_snap = snapshots[-2]
        curr_snap = snapshots[-1]

        worsening_score = 0
        improving_score = 0

        # Compare people affected
        if curr_snap.people_affected > prev_snap.people_affected:
            worsening_score += 1
        elif curr_snap.people_affected < prev_snap.people_affected:
            improving_score += 1

        # Compare severity
        sev_rank = {
            SeverityLevel.LOW: 1,
            SeverityLevel.MEDIUM: 2,
            SeverityLevel.HIGH: 3,
            SeverityLevel.CRITICAL: 4,
        }
        if sev_rank.get(curr_snap.severity, 1) > sev_rank.get(prev_snap.severity, 1):
            worsening_score += 1
        elif sev_rank.get(curr_snap.severity, 1) < sev_rank.get(prev_snap.severity, 1):
            improving_score += 1

        # Compare active needs count
        if len(curr_snap.active_needs) > len(prev_snap.active_needs):
            worsening_score += 1
        elif len(curr_snap.active_needs) < len(prev_snap.active_needs):
            improving_score += 1

        if worsening_score > improving_score:
            return "WORSENING"
        elif improving_score > worsening_score:
            return "IMPROVING"
        return "STABLE"


priority_engine = PriorityEngine()
