"""
Situation Changes & Delta Engine ("What Changed?")
===================================================
Produces clean, structured diffs between incident states and snapshots.
Filters out unchanged fields to avoid clutter, providing concise, human-readable
bullet points and structured field-level diff objects for the Command Center.
"""

from __future__ import annotations
from typing import List, Optional, Tuple, Dict, Any
from app.schemas.domain import (
    Incident,
    IncidentSnapshot,
    Evidence,
    AccessStatus,
    SeverityLevel,
    NeedStatus,
    FieldDiff,
    SituationDelta,
    utc_now,
)


class ChangeDetectionEngine:
    """Computes structured state deltas without noisy unchanged fields."""

    @staticmethod
    def compute_evidence_deltas(
        incident: Incident, evidence: Evidence
    ) -> Tuple[List[str], List[FieldDiff]]:
        """
        Calculates changes that incoming evidence would introduce to the incident state.
        Returns clean delta_summary strings and structured FieldDiff items.
        """
        deltas: List[str] = []
        diffs: List[FieldDiff] = []

        # 1. People Affected Change
        if evidence.people_affected is not None:
            old_val = incident.people_affected
            new_val = evidence.people_affected
            if new_val != old_val:
                diff = new_val - old_val
                sign = "+" if diff > 0 else ""
                deltas.append(f"{sign}{diff} people affected (now {new_val})")
                diffs.append(
                    FieldDiff(
                        field_name="people_affected",
                        before=old_val,
                        after=new_val,
                        source_evidence_id=evidence.evidence_id,
                        description=f"People affected updated by {sign}{diff} to {new_val}",
                    )
                )

        # 2. Access Status Change
        if evidence.access_status not in (AccessStatus.UNKNOWN, None):
            old_access = incident.access_status
            new_access = evidence.access_status
            if old_access != new_access and old_access != AccessStatus.UNKNOWN:
                deltas.append(
                    f"Access status changed from {old_access.value} to {new_access.value}"
                )
                diffs.append(
                    FieldDiff(
                        field_name="access_status",
                        before=old_access.value,
                        after=new_access.value,
                        source_evidence_id=evidence.evidence_id,
                        description=f"Access status transitioned from {old_access.value} to {new_access.value}",
                    )
                )
            elif old_access == AccessStatus.UNKNOWN and new_access != AccessStatus.UNKNOWN:
                deltas.append(f"Access status determined as {new_access.value}")
                diffs.append(
                    FieldDiff(
                        field_name="access_status",
                        before="unknown",
                        after=new_access.value,
                        source_evidence_id=evidence.evidence_id,
                        description=f"Access status identified as {new_access.value}",
                    )
                )

        # 3. New or Escalated Needs
        existing_need_types = {n.type for n in incident.current_needs}
        for n_type in evidence.needs:
            if n_type not in existing_need_types:
                deltas.append(f"New need identified: {n_type.value.capitalize()}")
                diffs.append(
                    FieldDiff(
                        field_name="current_needs",
                        before=None,
                        after=n_type.value,
                        source_evidence_id=evidence.evidence_id,
                        description=f"New relief need identified: {n_type.value}",
                    )
                )

        # 4. Severity Escalation
        severity_rank = {
            SeverityLevel.LOW: 1,
            SeverityLevel.MEDIUM: 2,
            SeverityLevel.HIGH: 3,
            SeverityLevel.CRITICAL: 4,
        }
        old_rank = severity_rank.get(incident.severity, 2)
        new_rank = severity_rank.get(evidence.severity, 2)

        if new_rank > old_rank:
            if evidence.severity == SeverityLevel.CRITICAL:
                deltas.append("Severity escalated to CRITICAL")
            else:
                deltas.append(
                    f"Severity escalated from {incident.severity.value.upper()} to {evidence.severity.value.upper()}"
                )
            diffs.append(
                FieldDiff(
                    field_name="severity",
                    before=incident.severity.value,
                    after=evidence.severity.value,
                    source_evidence_id=evidence.evidence_id,
                    description=f"Severity escalated to {evidence.severity.value}",
                )
            )

        # 5. Fallback if no material changes occurred
        if not deltas:
            deltas.append("Evidence corroborated current situation")

        return deltas, diffs

    @staticmethod
    def diff_snapshots(
        snap_a: IncidentSnapshot, snap_b: IncidentSnapshot
    ) -> SituationDelta:
        """
        Computes structured difference between two point-in-time snapshots (from snap_a to snap_b).
        Omits all unchanged fields.
        """
        deltas: List[str] = []
        diffs: List[FieldDiff] = []

        # Severity
        if snap_a.severity != snap_b.severity:
            deltas.append(f"Severity changed: {snap_a.severity.value} -> {snap_b.severity.value}")
            diffs.append(
                FieldDiff(
                    field_name="severity",
                    before=snap_a.severity.value,
                    after=snap_b.severity.value,
                    description=f"Severity shifted from {snap_a.severity.value} to {snap_b.severity.value}",
                )
            )

        # People Affected
        if snap_a.people_affected != snap_b.people_affected:
            diff = snap_b.people_affected - snap_a.people_affected
            sign = "+" if diff > 0 else ""
            deltas.append(f"People affected: {snap_a.people_affected} -> {snap_b.people_affected} ({sign}{diff})")
            diffs.append(
                FieldDiff(
                    field_name="people_affected",
                    before=snap_a.people_affected,
                    after=snap_b.people_affected,
                    description=f"People affected changed by {sign}{diff}",
                )
            )

        # Access Status
        if snap_a.access_status != snap_b.access_status:
            deltas.append(f"Access status changed: {snap_a.access_status.value} -> {snap_b.access_status.value}")
            diffs.append(
                FieldDiff(
                    field_name="access_status",
                    before=snap_a.access_status.value,
                    after=snap_b.access_status.value,
                    description=f"Access status changed from {snap_a.access_status.value} to {snap_b.access_status.value}",
                )
            )

        # Active Needs
        a_needs = set(snap_a.active_needs)
        b_needs = set(snap_b.active_needs)
        added_needs = b_needs - a_needs
        removed_needs = a_needs - b_needs
        if added_needs:
            deltas.append(f"Needs added: {[n.value for n in added_needs]}")
            diffs.append(
                FieldDiff(
                    field_name="active_needs",
                    before=[n.value for n in snap_a.active_needs],
                    after=[n.value for n in snap_b.active_needs],
                    description=f"Added needs: {[n.value for n in added_needs]}",
                )
            )
        if removed_needs:
            deltas.append(f"Needs fulfilled/removed: {[n.value for n in removed_needs]}")

        # Priority Score
        if abs(snap_a.priority_score - snap_b.priority_score) >= 1.0:
            deltas.append(f"Priority score: {snap_a.priority_score:.1f} -> {snap_b.priority_score:.1f}")
            diffs.append(
                FieldDiff(
                    field_name="priority_score",
                    before=snap_a.priority_score,
                    after=snap_b.priority_score,
                    description=f"Priority score changed to {snap_b.priority_score:.1f}",
                )
            )

        if not deltas:
            deltas.append("No material state differences detected between snapshots")

        return SituationDelta(
            incident_id=snap_a.incident_id,
            from_snapshot_id=snap_a.snapshot_id,
            to_snapshot_id=snap_b.snapshot_id,
            timestamp=utc_now(),
            delta_summary=deltas,
            field_diffs=diffs,
        )


change_detection_engine = ChangeDetectionEngine()
