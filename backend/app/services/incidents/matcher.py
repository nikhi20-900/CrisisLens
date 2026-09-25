"""
Incident Matcher: Multi-factor Deterministic Fusion Matcher
============================================================
Evaluates spatial, temporal, semantic, and context/entity overlap
between incoming Evidence and candidate Incidents. Produces explainable
MatchResult with decision (MATCH / NO_MATCH / UNCERTAIN), sub-scores, and reasons.
"""

from __future__ import annotations
import math
from typing import List, Optional, Tuple, Sequence
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.schemas.domain import (
    Evidence,
    Incident,
    Location,
    DisasterType,
    SeverityLevel,
    MatchDecision,
    MatchSubScores,
    MatchResult,
    utc_now,
)


class MatcherConfig(BaseModel):
    """Configurable thresholds and weights for deterministic incident matching."""
    spatial_weight: float = Field(0.40, ge=0.0, le=1.0)
    temporal_weight: float = Field(0.20, ge=0.0, le=1.0)
    semantic_weight: float = Field(0.25, ge=0.0, le=1.0)
    context_weight: float = Field(0.15, ge=0.0, le=1.0)

    # Thresholds for decision boundaries
    match_threshold: float = Field(0.60, ge=0.0, le=1.0)
    uncertain_threshold: float = Field(0.40, ge=0.0, le=1.0)

    # Spatial scale
    max_spatial_distance_meters: float = Field(2500.0, ge=100.0)  # Beyond this, spatial score is 0
    immediate_proximity_meters: float = Field(150.0, ge=0.0)     # Within this, spatial score is 1.0

    # Temporal scale
    max_temporal_window_hours: float = Field(48.0, ge=1.0)       # Beyond this, temporal score is 0
    immediate_temporal_hours: float = Field(2.0, ge=0.0)         # Within this, temporal score is 1.0

    # Strict disaster type segregation
    strict_disaster_type: bool = True


def haversine_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates the great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class IncidentMatcher:
    """Deterministic, explainable incident matching engine."""

    def __init__(self, config: Optional[MatcherConfig] = None):
        self.config = config or MatcherConfig()

    def calculate_spatial_score(
        self, ev_loc: Optional[Location], inc_loc: Optional[Location]
    ) -> Tuple[float, str]:
        """Calculates distance-decayed spatial score and explanation."""
        if not ev_loc and not inc_loc:
            return 0.5, "Geographic coordinates absent on both; applying neutral spatial baseline (0.50)"

        if not ev_loc or not inc_loc:
            return 0.3, "One entity lacks geographic coordinates (fallback baseline: 0.30)"

        if ev_loc.lat is None or ev_loc.lng is None or inc_loc.lat is None or inc_loc.lng is None:
            # Fallback to address comparison
            if ev_loc.address and inc_loc.address:
                tokens_ev = set(ev_loc.address.lower().split())
                tokens_inc = set(inc_loc.address.lower().split())
                overlap = len(tokens_ev & tokens_inc)
                if overlap > 0:
                    score = min(0.4 + 0.2 * overlap, 0.9)
                    return score, f"Address match: shared keywords {list(tokens_ev & tokens_inc)} (score: {score:.2f})"
            return 0.3, "Coordinates incomplete; minimal spatial baseline (0.30)"

        distance = haversine_distance_meters(ev_loc.lat, ev_loc.lng, inc_loc.lat, inc_loc.lng)

        if distance <= self.config.immediate_proximity_meters:
            return 1.0, f"Immediate spatial proximity: {distance:.0f}m apart (score: 1.00)"

        if distance >= self.config.max_spatial_distance_meters:
            return 0.0, f"Outside spatial threshold: {distance:.0f}m exceeds max {self.config.max_spatial_distance_meters:.0f}m (score: 0.00)"

        # Linear decay between immediate and max distance
        decay_range = self.config.max_spatial_distance_meters - self.config.immediate_proximity_meters
        score = 1.0 - ((distance - self.config.immediate_proximity_meters) / decay_range)
        score = max(0.0, min(1.0, score))
        return score, f"Spatial proximity: {distance:.0f}m apart (score: {score:.2f})"


    def calculate_temporal_score(
        self, ev_time: Optional[datetime], inc_time: Optional[datetime]
    ) -> Tuple[float, str]:
        """Calculates time-decayed temporal score and explanation."""
        if not ev_time or not inc_time:
            return 0.7, "Timestamp missing on evidence or incident; baseline temporal score: 0.70"

        # Ensure both datetimes are timezone-aware
        t1 = ev_time if ev_time.tzinfo else ev_time.replace(tzinfo=timezone.utc)
        t2 = inc_time if inc_time.tzinfo else inc_time.replace(tzinfo=timezone.utc)

        delta_seconds = abs((t1 - t2).total_seconds())
        delta_hours = delta_seconds / 3600.0

        if delta_hours <= self.config.immediate_temporal_hours:
            return 1.0, f"Immediate temporal window: {delta_hours:.1f}h delta (score: 1.00)"

        if delta_hours >= self.config.max_temporal_window_hours:
            return 0.0, f"Outside temporal window: {delta_hours:.1f}h exceeds max {self.config.max_temporal_window_hours:.0f}h (score: 0.00)"

        decay_range = self.config.max_temporal_window_hours - self.config.immediate_temporal_hours
        score = 1.0 - ((delta_hours - self.config.immediate_temporal_hours) / decay_range)
        score = max(0.0, min(1.0, score))
        return score, f"Temporal proximity: {delta_hours:.1f}h delta (score: {score:.2f})"

    def calculate_semantic_score(
        self, ev_type: DisasterType, inc_type: DisasterType,
        ev_sev: SeverityLevel, inc_sev: SeverityLevel
    ) -> Tuple[float, str, bool]:
        """
        Calculates hazard type compatibility and severity alignment.
        Returns: (score, explanation, is_hard_mismatch)
        """
        reasons = []
        is_hard_mismatch = False

        # Disaster type alignment
        if ev_type == inc_type:
            type_score = 1.0
            reasons.append(f"Disaster type identical ({ev_type.value})")
        elif ev_type == DisasterType.OTHER or inc_type == DisasterType.OTHER:
            type_score = 0.5
            reasons.append(f"One disaster type is '{DisasterType.OTHER.value}' (partial compatibility: 0.5)")
        else:
            type_score = 0.0
            reasons.append(f"Conflicting disaster types: {ev_type.value} vs {inc_type.value}")
            if self.config.strict_disaster_type:
                is_hard_mismatch = True

        # Severity compatibility (soft metric)
        severity_order = {
            SeverityLevel.LOW: 1,
            SeverityLevel.MEDIUM: 2,
            SeverityLevel.HIGH: 3,
            SeverityLevel.CRITICAL: 4,
        }
        diff = abs(severity_order.get(ev_sev, 2) - severity_order.get(inc_sev, 2))
        if diff == 0:
            sev_score = 1.0
            reasons.append(f"Severity identical ({ev_sev.value})")
        elif diff == 1:
            sev_score = 0.8
            reasons.append(f"Severity adjacent ({ev_sev.value} vs {inc_sev.value})")
        else:
            sev_score = 0.4
            reasons.append(f"Severity differs significantly ({ev_sev.value} vs {inc_sev.value})")

        combined = 0.75 * type_score + 0.25 * sev_score
        return combined, "; ".join(reasons), is_hard_mismatch

    def calculate_context_score(
        self, evidence: Evidence, incident: Incident
    ) -> Tuple[float, str]:
        """Calculates entity, needs, and textual context overlap."""
        reasons = []
        sub_scores = []

        # Needs overlap
        inc_need_types = {n.type for n in incident.current_needs}
        ev_need_types = set(evidence.needs)
        if inc_need_types and ev_need_types:
            intersection = inc_need_types & ev_need_types
            union = inc_need_types | ev_need_types
            jaccard = len(intersection) / len(union)
            sub_scores.append(jaccard)
            if intersection:
                reasons.append(f"Shared needs: {[n.value for n in intersection]}")
        elif not inc_need_types and not ev_need_types:
            sub_scores.append(0.5)
        else:
            sub_scores.append(0.3)

        # Entity overlap from extracted_entities
        ev_entities = set(str(v).lower() for v in evidence.extracted_entities.values() if v)
        if hasattr(evidence, "raw_report") and evidence.raw_report and evidence.raw_report.text:
            text_tokens = set(evidence.raw_report.text.lower().split())
        else:
            text_tokens = set()

        inc_title_tokens = set(incident.title.lower().split())
        shared_text = (ev_entities | text_tokens) & inc_title_tokens
        # Filter common stopwords
        stopwords = {"and", "or", "the", "in", "at", "of", "a", "an", "-", "&"}
        shared_meaningful = shared_text - stopwords
        if shared_meaningful:
            sub_scores.append(min(0.5 + 0.15 * len(shared_meaningful), 1.0))
            reasons.append(f"Shared landmark/title keywords: {list(shared_meaningful)}")
        else:
            sub_scores.append(0.35)

        avg_score = sum(sub_scores) / len(sub_scores) if sub_scores else 0.4
        explanation = "; ".join(reasons) if reasons else "Baseline context overlap (0.40)"
        return avg_score, explanation

    def evaluate_candidate(self, incident: Incident, evidence: Evidence) -> MatchResult:
        """Evaluates whether an evidence item matches a candidate incident."""
        # 1. Spatial
        spatial_score, spatial_reason = self.calculate_spatial_score(evidence.location, incident.location)

        # 2. Temporal
        ev_time = evidence.extracted_at
        if evidence.raw_report and evidence.raw_report.timestamp:
            ev_time = evidence.raw_report.timestamp
        temporal_score, temporal_reason = self.calculate_temporal_score(ev_time, incident.updated_at)

        # 3. Semantic
        semantic_score, semantic_reason, hard_mismatch = self.calculate_semantic_score(
            evidence.disaster_type, incident.disaster_type,
            evidence.severity, incident.severity
        )

        # 4. Context / Entity Overlap
        context_score, context_reason = self.calculate_context_score(evidence, incident)

        # Composite total score
        total_score = (
            self.config.spatial_weight * spatial_score
            + self.config.temporal_weight * temporal_score
            + self.config.semantic_weight * semantic_score
            + self.config.context_weight * context_score
        )
        total_score = round(max(0.0, min(1.0, total_score)), 4)

        reasons = [
            spatial_reason,
            temporal_reason,
            semantic_reason,
            context_reason,
        ]

        # Determine MatchDecision
        is_spatially_separated = False
        if (
            evidence.location
            and incident.location
            and evidence.location.lat is not None
            and incident.location.lat is not None
            and evidence.location.lng is not None
            and incident.location.lng is not None
        ):
            dist = haversine_distance_meters(
                evidence.location.lat, evidence.location.lng,
                incident.location.lat, incident.location.lng
            )
            if dist > self.config.max_spatial_distance_meters:
                is_spatially_separated = True

        if hard_mismatch:
            decision = MatchDecision.NO_MATCH
            reasons.append("Hard conflict: Disparate disaster types cannot be fused.")
            total_score = min(total_score, 0.2)
        elif is_spatially_separated:
            decision = MatchDecision.NO_MATCH
            reasons.append(f"Spatial separation: distance exceeds threshold {self.config.max_spatial_distance_meters:.0f}m.")
            total_score = min(total_score, 0.35)
        elif total_score >= self.config.match_threshold:
            decision = MatchDecision.MATCH
            reasons.append(f"Confidence score {total_score:.2f} meets or exceeds MATCH threshold {self.config.match_threshold:.2f}")
        elif total_score >= self.config.uncertain_threshold:
            decision = MatchDecision.UNCERTAIN
            reasons.append(f"Confidence score {total_score:.2f} falls into UNCERTAIN range [{self.config.uncertain_threshold:.2f}, {self.config.match_threshold:.2f})")
        else:
            decision = MatchDecision.NO_MATCH
            reasons.append(f"Confidence score {total_score:.2f} is below UNCERTAIN threshold {self.config.uncertain_threshold:.2f}")


        sub_scores = MatchSubScores(
            spatial_score=round(spatial_score, 4),
            temporal_score=round(temporal_score, 4),
            semantic_score=round(semantic_score, 4),
            context_score=round(context_score, 4),
            total_score=total_score,
        )

        return MatchResult(
            decision=decision,
            incident_id=incident.incident_id,
            overall_score=total_score,
            sub_scores=sub_scores,
            reasons=reasons,
            matched_at=utc_now(),
        )

    def find_best_match(
        self, incidents: Sequence[Incident], evidence: Evidence
    ) -> Tuple[Optional[Incident], MatchResult]:
        """
        Evaluates evidence against all candidate incidents.
        Returns the best matching incident and its MatchResult, or (None, best_result).
        """
        if not incidents:
            # No existing incidents to match against
            sub_scores = MatchSubScores(
                spatial_score=0.0,
                temporal_score=0.0,
                semantic_score=0.0,
                context_score=0.0,
                total_score=0.0,
            )
            return None, MatchResult(
                decision=MatchDecision.NO_MATCH,
                incident_id=None,
                overall_score=0.0,
                sub_scores=sub_scores,
                reasons=["No existing incidents available in the system"],
                matched_at=utc_now(),
            )

        evaluated = []
        for inc in incidents:
            result = self.evaluate_candidate(inc, evidence)
            evaluated.append((inc, result))

        # Sort primarily by overall_score descending
        evaluated.sort(key=lambda item: item[1].overall_score, reverse=True)
        best_inc, best_res = evaluated[0]

        if best_res.decision == MatchDecision.MATCH:
            return best_inc, best_res

        # If uncertain or no_match, return None with best candidate evaluation
        return None, best_res


incident_matcher = IncidentMatcher()
