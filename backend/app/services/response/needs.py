"""
Phase 1: Needs Engine
=====================
Extracts and infers structured relief needs (RESCUE, MEDICAL, FOOD, WATER, SHELTER, TRANSPORT)
from incident state and linked evidence deterministically.
"""

from typing import List, Dict, Optional
from app.schemas.domain import (
    Incident,
    Need,
    NeedType,
    NeedStatus,
    UrgencyLevel,
    AccessStatus,
    utc_now,
)


class NeedsEngine:
    """
    Deterministic engine to analyze incident state and evidence to produce complete active needs.
    """

    SUPPORTED_NEEDS = {
        NeedType.RESCUE,
        NeedType.MEDICAL,
        NeedType.FOOD,
        NeedType.WATER,
        NeedType.SHELTER,
        NeedType.TRANSPORT,
    }

    def extract_needs(self, incident: Incident) -> List[Need]:
        """
        Processes existing needs and infers additional needs strictly from incident state and evidence.
        Returns a list of unique Need objects sorted by urgency.
        """
        existing_needs_by_type: Dict[NeedType, Need] = {
            n.type: n for n in incident.current_needs if n.type in self.SUPPORTED_NEEDS
        }

        # Analyze evidence links if present
        evidence_need_types = set()
        avg_confidence = 1.0
        conf_scores = []
        for link in incident.evidence_links:
            # If evidence objects exist or were attached
            if hasattr(link, "evidence") and link.evidence:
                evidence_need_types.update(link.evidence.needs)
                conf_scores.append(link.evidence.confidence.needs)
        if conf_scores:
            avg_confidence = sum(conf_scores) / len(conf_scores)

        # 1. RESCUE Detection
        is_trapped = (
            incident.current_impact and incident.current_impact.trapped_count > 0
        )
        has_rescue_evidence = (
            NeedType.RESCUE in evidence_need_types or NeedType.RESCUE in existing_needs_by_type
        )
        if (incident.people_affected > 0 and has_rescue_evidence) or is_trapped or (
            incident.people_affected > 0 and incident.access_status == AccessStatus.SUBMERGED
        ):
            urgency = (
                UrgencyLevel.CRITICAL
                if is_trapped or incident.people_affected >= 5
                else UrgencyLevel.HIGH
            )
            self._ensure_need(
                existing_needs_by_type,
                NeedType.RESCUE,
                urgency,
                confidence=avg_confidence,
                quantity=incident.people_affected or 1,
                description="Water/structural rescue required for affected people",
            )

        # 2. MEDICAL Detection
        has_medical_evidence = (
            NeedType.MEDICAL in evidence_need_types or NeedType.MEDICAL in existing_needs_by_type
        )
        has_casualties = (
            incident.current_impact and incident.current_impact.casualty_count > 0
        )
        if has_medical_evidence or has_casualties:
            urgency = (
                UrgencyLevel.CRITICAL
                if has_casualties
                else (
                    existing_needs_by_type[NeedType.MEDICAL].urgency
                    if NeedType.MEDICAL in existing_needs_by_type
                    else UrgencyLevel.HIGH
                )
            )
            self._ensure_need(
                existing_needs_by_type,
                NeedType.MEDICAL,
                urgency,
                confidence=avg_confidence,
                quantity=incident.current_impact.casualty_count if has_casualties else None,
                description="Medical emergency triage and response required",
            )

        # 3. FOOD Detection
        if NeedType.FOOD in evidence_need_types or NeedType.FOOD in existing_needs_by_type:
            urgency = (
                existing_needs_by_type[NeedType.FOOD].urgency
                if NeedType.FOOD in existing_needs_by_type
                else UrgencyLevel.MEDIUM
            )
            self._ensure_need(
                existing_needs_by_type,
                NeedType.FOOD,
                urgency,
                confidence=avg_confidence,
                description="Food rations required for displaced population",
            )

        # 4. WATER Detection
        if NeedType.WATER in evidence_need_types or NeedType.WATER in existing_needs_by_type:
            urgency = (
                existing_needs_by_type[NeedType.WATER].urgency
                if NeedType.WATER in existing_needs_by_type
                else UrgencyLevel.MEDIUM
            )
            self._ensure_need(
                existing_needs_by_type,
                NeedType.WATER,
                urgency,
                confidence=avg_confidence,
                description="Clean drinking water supply required",
            )

        # 5. SHELTER Detection
        has_displaced = (
            incident.current_impact and incident.current_impact.displaced_count > 0
        )
        if NeedType.SHELTER in evidence_need_types or NeedType.SHELTER in existing_needs_by_type or has_displaced:
            urgency = (
                existing_needs_by_type[NeedType.SHELTER].urgency
                if NeedType.SHELTER in existing_needs_by_type
                else UrgencyLevel.MEDIUM
            )
            self._ensure_need(
                existing_needs_by_type,
                NeedType.SHELTER,
                urgency,
                confidence=avg_confidence,
                quantity=incident.current_impact.displaced_count if has_displaced else None,
                description="Emergency temporary shelter required",
            )

        # 6. TRANSPORT Detection
        has_access_issue = incident.access_status in (
            AccessStatus.BLOCKED,
            AccessStatus.SUBMERGED,
            AccessStatus.PARTIALLY_BLOCKED,
        )
        if NeedType.TRANSPORT in evidence_need_types or NeedType.TRANSPORT in existing_needs_by_type or (has_access_issue and incident.people_affected > 0):
            urgency = (
                existing_needs_by_type[NeedType.TRANSPORT].urgency
                if NeedType.TRANSPORT in existing_needs_by_type
                else UrgencyLevel.HIGH
            )
            self._ensure_need(
                existing_needs_by_type,
                NeedType.TRANSPORT,
                urgency,
                confidence=avg_confidence,
                description="Emergency evacuation/transportation required due to access restrictions",
            )

        # Return list preserving existing needs and newly generated ones
        return list(existing_needs_by_type.values())

    def _ensure_need(
        self,
        needs_map: Dict[NeedType, Need],
        need_type: NeedType,
        urgency: UrgencyLevel,
        confidence: float,
        quantity: Optional[int] = None,
        description: Optional[str] = None,
    ) -> None:
        """Helper to update existing need or insert a new UNMET need."""
        if need_type in needs_map:
            existing = needs_map[need_type]
            # Update fields if more severe/specific
            needs_map[need_type] = Need(
                need_id=existing.need_id,
                type=existing.type,
                urgency=urgency if self._urgency_score(urgency) > self._urgency_score(existing.urgency) else existing.urgency,
                confidence=existing.confidence if existing.confidence < 1.0 else confidence,
                status=existing.status,
                quantity=quantity if quantity is not None else existing.quantity,
                description=existing.description or description,
                identified_at=existing.identified_at,
            )
        else:
            need_id = f"ND-{need_type.value.upper()[:3]}-{len(needs_map) + 1:02d}"
            needs_map[need_type] = Need(
                need_id=need_id,
                type=need_type,
                urgency=urgency,
                confidence=confidence,
                status=NeedStatus.UNMET,
                quantity=quantity,
                description=description,
                identified_at=utc_now(),
            )

    @staticmethod
    def _urgency_score(urgency: UrgencyLevel) -> int:
        order = {
            UrgencyLevel.LOW: 1,
            UrgencyLevel.MEDIUM: 2,
            UrgencyLevel.HIGH: 3,
            UrgencyLevel.CRITICAL: 4,
        }
        return order.get(urgency, 1)


needs_engine = NeedsEngine()
