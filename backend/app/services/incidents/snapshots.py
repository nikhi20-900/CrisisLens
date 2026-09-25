"""
Snapshot Generator: Append-Only Situation Snapshots
===================================================
Captures immutable, point-in-time state records of an incident as it evolves,
preserving full chronological situation history and 'What Changed?' deltas.
"""

from __future__ import annotations
from typing import List, Optional
from datetime import datetime, timezone
from app.schemas.domain import (
    Incident,
    IncidentSnapshot,
    NeedStatus,
    utc_now,
)


class SnapshotEngine:
    """Manages creation and retrieval of append-only incident snapshots."""

    @staticmethod
    def generate_snapshot_id(incident: Incident) -> str:
        """Generates monotonically incrementing snapshot ID: e.g. SNAP-001."""
        count = len(incident.snapshots) + 1
        return f"SNAP-{count:03d}"

    @classmethod
    def create_snapshot(
        cls,
        incident: Incident,
        delta_summary: List[str],
        trigger_evidence_id: Optional[str] = None,
        custom_summary: Optional[str] = None,
        timestamp: Optional[datetime] = None,
    ) -> IncidentSnapshot:
        """
        Creates an immutable, point-in-time snapshot of the current incident state
        and appends it to the incident's snapshot history.
        """
        snapshot_id = cls.generate_snapshot_id(incident)
        snap_time = timestamp or utc_now()
        if not snap_time.tzinfo:
            snap_time = snap_time.replace(tzinfo=timezone.utc)

        # Active needs that remain unmet
        active_needs = [
            n.type for n in incident.current_needs
            if n.status in (NeedStatus.UNMET, NeedStatus.IN_PROGRESS)
        ]

        if custom_summary:
            summary = custom_summary
        elif trigger_evidence_id:
            summary = f"Updated via {trigger_evidence_id}: {'; '.join(delta_summary[:2])}"
        else:
            summary = f"Incident state snapshot: {'; '.join(delta_summary[:2])}" if delta_summary else "Incident state snapshot"

        snapshot = IncidentSnapshot(
            snapshot_id=snapshot_id,
            incident_id=incident.incident_id,
            timestamp=snap_time,
            severity=incident.severity,
            people_affected=incident.people_affected,
            access_status=incident.access_status,
            active_needs=active_needs,
            priority_score=incident.priority_score,
            summary=summary,
            delta_summary=list(delta_summary),
        )

        # Append-only guarantee
        incident.snapshots.append(snapshot)
        return snapshot

    @staticmethod
    def get_timeline(incident: Incident) -> List[IncidentSnapshot]:
        """
        Returns all snapshots for the incident in strictly ascending chronological order.
        """
        return sorted(incident.snapshots, key=lambda s: s.timestamp)

    @staticmethod
    def get_snapshot(incident: Incident, snapshot_id: str) -> Optional[IncidentSnapshot]:
        """Retrieves a specific snapshot by ID."""
        for s in incident.snapshots:
            if s.snapshot_id == snapshot_id:
                return s
        return None


snapshot_engine = SnapshotEngine()
