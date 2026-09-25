"""
Contradiction Detection & Conflict Preservation Engine
======================================================
Identifies semantic and factual conflicts between incoming evidence and
the current incident state (or historical evidence) without destructive overwrites.
Flags conflicts for human-in-the-loop review while preserving full provenance.
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from app.schemas.domain import (
    Incident,
    Evidence,
    Contradiction,
    AccessStatus,
    SeverityLevel,
    utc_now,
)


class ContradictionEngine:
    """Detects and manages contradictions between reports and incident state."""

    @staticmethod
    def generate_contradiction_id(incident: Incident) -> str:
        count = len(incident.contradictions) + 1
        return f"CONTR-{count:03d}"

    @classmethod
    def detect_contradictions(
        cls, incident: Incident, evidence: Evidence
    ) -> List[Contradiction]:
        """
        Scans for factual conflicts between current incident state and new evidence.
        Preserves all conflicting claims for human resolution.
        """
        conflicts: List[Contradiction] = []

        # 1. Access Status Contradiction (e.g. OPEN vs BLOCKED / SUBMERGED)
        if incident.access_status not in (AccessStatus.UNKNOWN, None) and evidence.access_status not in (AccessStatus.UNKNOWN, None):
            is_open_inc = incident.access_status == AccessStatus.OPEN
            is_blocked_inc = incident.access_status in (AccessStatus.BLOCKED, AccessStatus.SUBMERGED)
            is_open_ev = evidence.access_status == AccessStatus.OPEN
            is_blocked_ev = evidence.access_status in (AccessStatus.BLOCKED, AccessStatus.SUBMERGED)

            if (is_open_inc and is_blocked_ev) or (is_blocked_inc and is_open_ev):
                # Retrieve source evidence for incident's current access_status if available
                prev_ev_id = "initial_report"
                if incident.field_provenance and "access_status" in incident.field_provenance:
                    prev_ev_id = incident.field_provenance["access_status"].source_evidence_id
                elif incident.evidence_links:
                    prev_ev_id = incident.evidence_links[0].evidence_id

                conflicts.append(
                    Contradiction(
                        contradiction_id=cls.generate_contradiction_id(incident),
                        field_name="access_status",
                        claim_a={
                            "evidence_id": prev_ev_id,
                            "incident_status": incident.access_status.value,
                            "value": incident.access_status.value,
                        },
                        claim_b={
                            "evidence_id": evidence.evidence_id,
                            "status": evidence.access_status.value,
                            "value": evidence.access_status.value,
                        },
                        requires_human_resolution=True,
                        resolved=False,
                        created_at=utc_now(),
                    )
                )

        # 2. Extreme Severity Contradiction (e.g. CRITICAL vs LOW)
        if evidence.severity is not None and incident.severity is not None:
            if (
                (incident.severity == SeverityLevel.CRITICAL and evidence.severity == SeverityLevel.LOW)
                or (incident.severity == SeverityLevel.LOW and evidence.severity == SeverityLevel.CRITICAL)
            ):
                prev_ev_id = "initial_report"
                if incident.field_provenance and "severity" in incident.field_provenance:
                    prev_ev_id = incident.field_provenance["severity"].source_evidence_id
                elif incident.evidence_links:
                    prev_ev_id = incident.evidence_links[0].evidence_id

                conflicts.append(
                    Contradiction(
                        contradiction_id=cls.generate_contradiction_id(incident),
                        field_name="severity",
                        claim_a={
                            "evidence_id": prev_ev_id,
                            "value": incident.severity.value,
                        },
                        claim_b={
                            "evidence_id": evidence.evidence_id,
                            "value": evidence.severity.value,
                        },
                        requires_human_resolution=True,
                        resolved=False,
                        created_at=utc_now(),
                    )
                )

        # 3. People Affected Major Discrepancy (e.g., 0 vs 20+ when established)
        if evidence.people_affected is not None and incident.people_affected > 0:
            if evidence.people_affected == 0 and incident.people_affected >= 15:
                prev_ev_id = "initial_report"
                if incident.field_provenance and "people_affected" in incident.field_provenance:
                    prev_ev_id = incident.field_provenance["people_affected"].source_evidence_id
                elif incident.evidence_links:
                    prev_ev_id = incident.evidence_links[0].evidence_id

                conflicts.append(
                    Contradiction(
                        contradiction_id=cls.generate_contradiction_id(incident),
                        field_name="people_affected",
                        claim_a={
                            "evidence_id": prev_ev_id,
                            "value": incident.people_affected,
                        },
                        claim_b={
                            "evidence_id": evidence.evidence_id,
                            "value": evidence.people_affected,
                        },
                        requires_human_resolution=True,
                        resolved=False,
                        created_at=utc_now(),
                    )
                )

        return conflicts

    @staticmethod
    def resolve_contradiction(
        incident: Incident,
        contradiction_id: str,
        chosen_value: Any,
        resolution_notes: str,
        resolver_id: Optional[str] = "operator_hq",
    ) -> Optional[Contradiction]:
        """
        Marks a flagged contradiction as resolved by a human operator,
        recording the justification and optionally updating the field on the incident.
        """
        for c in incident.contradictions:
            if c.contradiction_id == contradiction_id:
                c.resolved = True
                c.requires_human_resolution = False
                c.resolution_notes = resolution_notes
                c.resolved_at = utc_now()
                c.resolved_by = resolver_id

                # Update the target field on the incident if attribute exists
                if hasattr(incident, c.field_name) and chosen_value is not None:
                    # Parse enum if necessary
                    if c.field_name == "access_status" and isinstance(chosen_value, str):
                        setattr(incident, c.field_name, AccessStatus(chosen_value))
                    elif c.field_name == "severity" and isinstance(chosen_value, str):
                        setattr(incident, c.field_name, SeverityLevel(chosen_value))
                    else:
                        setattr(incident, c.field_name, chosen_value)

                incident.updated_at = utc_now()
                return c
        return None


contradiction_engine = ContradictionEngine()
