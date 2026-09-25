"""
Member 2: Incident Intelligence Service
=======================================
Fuses incoming Evidence into evolving Incidents, tracks situation evolution,
produces snapshots ("What changed?"), and flags contradictions.
"""

from typing import Protocol, List, Optional, Tuple
from app.schemas.domain import (
    Evidence,
    EvidenceLink,
    Incident,
    IncidentSnapshot,
    Contradiction,
    Need,
    NeedStatus,
    NeedType,
    Impact,
    AccessStatus,
    SeverityLevel,
    utc_now,
)


class IncidentFusionInterface(Protocol):
    """Interface for Incident Matching, Fusion, and Evolution Tracking."""

    async def match_or_create_incident(self, evidence: Evidence) -> Tuple[Incident, EvidenceLink]:
        """Matches evidence to an existing incident or spins up a new incident."""
        ...

    async def evolve_incident(self, incident: Incident, new_evidence: Evidence) -> IncidentSnapshot:
        """Updates incident state, computes delta summary ('What changed?'), and creates snapshot."""
        ...

    async def detect_contradictions(self, incident: Incident, new_evidence: Evidence) -> List[Contradiction]:
        """Detects conflicting reports without silently discarding data."""
        ...


class IncidentFusionService:
    """
    Demo/MVP implementation of Incident Fusion & Situation Evolution.
    Maintains in-memory incidents for the hackathon lifecycle.
    """

    def __init__(self):
        self._incidents: dict[str, Incident] = {}

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self._incidents.get(incident_id)

    def list_incidents(self) -> List[Incident]:
        return list(self._incidents.values())

    async def match_or_create_incident(self, evidence: Evidence) -> Tuple[Incident, EvidenceLink]:
        # For Hackathon MVP flood scenario: single evolving flood incident
        if not self._incidents:
            incident_id = "INC-001"
            incident = Incident(
                incident_id=incident_id,
                title="Urban Flash Flood - Sector 4 & Central Canal",
                disaster_type=evidence.disaster_type,
                severity=evidence.severity,
                priority_level=evidence.severity,
                priority_score=60.0,
                location=evidence.location or {"lat": 12.935, "lng": 77.624, "address": "Central Market Bridge"},
                people_affected=evidence.people_affected or 0,
                access_status=evidence.access_status,
                created_at=utc_now(),
                updated_at=utc_now(),
            )
            self._incidents[incident_id] = incident
        else:
            incident = next(iter(self._incidents.values()))

        # Create Evidence Link
        link_id = f"EL-{len(incident.evidence_links) + 1:03d}"
        link = EvidenceLink(
            link_id=link_id,
            incident_id=incident.incident_id,
            evidence_id=evidence.evidence_id,
            similarity_score=0.92,
            link_rationale="Proximity within 200m and shared flood context",
            linked_at=utc_now(),
            evidence=evidence,
        )
        incident.evidence_links.append(link)

        # Detect contradictions
        contradictions = await self.detect_contradictions(incident, evidence)
        incident.contradictions.extend(contradictions)

        # Situation evolution
        await self.evolve_incident(incident, evidence)

        return incident, link

    async def detect_contradictions(self, incident: Incident, new_evidence: Evidence) -> List[Contradiction]:
        conflicts = []
        if (
            incident.access_status == AccessStatus.OPEN
            and new_evidence.access_status == AccessStatus.BLOCKED
        ):
            conflicts.append(
                Contradiction(
                    contradiction_id=f"CONTR-{len(incident.contradictions) + 1:03d}",
                    field_name="access_status",
                    claim_a={"incident_status": incident.access_status.value},
                    claim_b={"evidence_id": new_evidence.evidence_id, "status": new_evidence.access_status.value},
                    requires_human_resolution=True,
                )
            )
        return conflicts

    async def evolve_incident(self, incident: Incident, new_evidence: Evidence) -> IncidentSnapshot:
        deltas: List[str] = []

        # Check people affected change
        if new_evidence.people_affected and new_evidence.people_affected != incident.people_affected:
            diff = new_evidence.people_affected - incident.people_affected
            sign = "+" if diff > 0 else ""
            deltas.append(f"{sign}{diff} people affected (now {new_evidence.people_affected})")
            incident.people_affected = max(incident.people_affected, new_evidence.people_affected)

        # Check access change
        if new_evidence.access_status != AccessStatus.UNKNOWN and new_evidence.access_status != incident.access_status:
            deltas.append(f"Access status changed from {incident.access_status.value} to {new_evidence.access_status.value}")
            incident.access_status = new_evidence.access_status

        # Check new needs
        existing_need_types = {n.type for n in incident.current_needs}
        for n_type in new_evidence.needs:
            if n_type not in existing_need_types:
                new_need = Need(
                    need_id=f"ND-{len(incident.current_needs) + 1:03d}",
                    type=n_type,
                    urgency=new_evidence.urgency,
                    confidence=new_evidence.confidence.needs,
                    status=NeedStatus.UNMET,
                    quantity=new_evidence.people_affected or 1,
                    description=f"{n_type.value.capitalize()} requested via {new_evidence.evidence_id}",
                )
                incident.current_needs.append(new_need)
                deltas.append(f"New need identified: {n_type.value.capitalize()}")

        # Update severity if higher
        if new_evidence.severity == SeverityLevel.CRITICAL and incident.severity != SeverityLevel.CRITICAL:
            deltas.append("Severity escalated to CRITICAL")
            incident.severity = SeverityLevel.CRITICAL

        if not deltas:
            deltas.append("Evidence corroborated current situation")

        # Create snapshot
        snapshot_id = f"SNAP-{len(incident.snapshots) + 1:03d}"
        snapshot = IncidentSnapshot(
            snapshot_id=snapshot_id,
            incident_id=incident.incident_id,
            timestamp=utc_now(),
            severity=incident.severity,
            people_affected=incident.people_affected,
            access_status=incident.access_status,
            active_needs=[n.type for n in incident.current_needs if n.status == NeedStatus.UNMET],
            priority_score=incident.priority_score,
            summary=f"Update from Evidence {new_evidence.evidence_id}: {', '.join(deltas[:2])}",
            delta_summary=deltas,
        )
        incident.snapshots.append(snapshot)
        incident.updated_at = utc_now()
        return snapshot


incident_fusion_service = IncidentFusionService()
