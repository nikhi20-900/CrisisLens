"""
Incident Fusion & Situation Evolution Orchestrator
===================================================
Coordinates evidence matching, state evolution, field-level confidence tracking,
provenance preservation, append-only snapshot generation, and contradiction detection.
"""

from __future__ import annotations
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime

from app.schemas.domain import (
    Evidence,
    EvidenceLink,
    Incident,
    IncidentSnapshot,
    Contradiction,
    Need,
    NeedStatus,
    NeedType,
    Location,
    AccessStatus,
    SeverityLevel,
    MatchResult,
    MatchDecision,
    FieldProvenance,
    SituationDelta,
    utc_now,
)
from app.services.incidents.matcher import IncidentMatcher, incident_matcher
from app.services.incidents.snapshots import SnapshotEngine, snapshot_engine
from app.services.incidents.changes import ChangeDetectionEngine, change_detection_engine
from app.services.incidents.contradictions import ContradictionEngine, contradiction_engine
from typing import Protocol


class IncidentFusionInterface(Protocol):
    """Interface for Incident Matching, Fusion, and Evolution Tracking."""

    async def match_or_create_incident(self, evidence: Evidence) -> Tuple[Incident, EvidenceLink]:
        """Matches evidence to an existing incident or spins up a new incident."""
        ...

    async def detect_contradictions(self, incident: Incident, evidence: Evidence) -> List[Contradiction]:
        """Detects conflicting reports without silently discarding data."""
        ...


class IncidentService:
    """
    Core Incident Intelligence Service.
    Maintains in-memory incidents with full evidence provenance and explainability.
    """

    def __init__(
        self,
        matcher: Optional[IncidentMatcher] = None,
        snapshots: Optional[SnapshotEngine] = None,
        changes: Optional[ChangeDetectionEngine] = None,
        contradictions: Optional[ContradictionEngine] = None,
    ):
        self._incidents: Dict[str, Incident] = {}
        self.matcher = matcher or incident_matcher
        self.snapshots = snapshots or snapshot_engine
        self.changes = changes or change_detection_engine
        self.contradictions = contradictions or contradiction_engine
        self._next_incident_num = 1

    def reset(self):
        """Clears in-memory storage (used for test isolation)."""
        self._incidents.clear()
        self._next_incident_num = 1

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Retrieves an incident by its unique ID."""
        return self._incidents.get(incident_id)

    def list_incidents(self) -> List[Incident]:
        """Lists all known evolving incidents."""
        return list(self._incidents.values())

    def get_timeline(self, incident_id: str) -> List[IncidentSnapshot]:
        """Retrieves the strictly chronological snapshot timeline for an incident."""
        incident = self.get_incident(incident_id)
        if not incident:
            return []
        return self.snapshots.get_timeline(incident)

    def get_evidence(self, incident_id: str) -> List[EvidenceLink]:
        """Retrieves all evidence links for an incident."""
        incident = self.get_incident(incident_id)
        if not incident:
            return []
        return incident.evidence_links

    def diff_snapshots(
        self,
        incident_id: str,
        from_snapshot_id: Optional[str] = None,
        to_snapshot_id: Optional[str] = None,
    ) -> Optional[SituationDelta]:
        """
        Computes structured situation diff between two snapshots of an incident.
        Defaults to comparing the second-to-last and latest snapshots.
        """
        incident = self.get_incident(incident_id)
        if not incident or len(incident.snapshots) < 1:
            return None

        timeline = self.snapshots.get_timeline(incident)

        if from_snapshot_id and to_snapshot_id:
            snap_a = self.snapshots.get_snapshot(incident, from_snapshot_id)
            snap_b = self.snapshots.get_snapshot(incident, to_snapshot_id)
            if not snap_a or not snap_b:
                return None
        elif len(timeline) >= 2:
            snap_a = timeline[-2]
            snap_b = timeline[-1]
        else:
            # Only one snapshot exists
            snap_b = timeline[0]
            return SituationDelta(
                incident_id=incident.incident_id,
                from_snapshot_id=None,
                to_snapshot_id=snap_b.snapshot_id,
                timestamp=utc_now(),
                delta_summary=snap_b.delta_summary or ["Initial state established"],
                field_diffs=[],
            )

        return self.changes.diff_snapshots(snap_a, snap_b)

    async def detect_contradictions(
        self, incident: Incident, evidence: Evidence
    ) -> List[Contradiction]:
        """Public helper interface to detect contradictions between an incident and new evidence."""
        return self.contradictions.detect_contradictions(incident, evidence)

    def resolve_contradiction(
        self,
        incident_id: str,
        contradiction_id: str,
        chosen_value: Any,
        resolution_notes: str,
        resolver_id: Optional[str] = "operator_hq",
    ) -> Optional[Contradiction]:
        """Resolves a flagged contradiction for an incident."""
        incident = self.get_incident(incident_id)
        if not incident:
            return None
        resolved = self.contradictions.resolve_contradiction(
            incident=incident,
            contradiction_id=contradiction_id,
            chosen_value=chosen_value,
            resolution_notes=resolution_notes,
            resolver_id=resolver_id,
        )
        if resolved:
            # Create a snapshot recording human resolution
            self.snapshots.create_snapshot(
                incident=incident,
                delta_summary=[
                    f"Contradiction {contradiction_id} resolved by {resolver_id}: {resolution_notes}"
                ],
                custom_summary=f"Human Resolution: {resolution_notes}",
            )
        return resolved

    async def evaluate_match(
        self, evidence: Evidence
    ) -> Tuple[Optional[Incident], MatchResult]:
        """
        Evaluates candidate match for incoming evidence against existing incidents
        without modifying any internal state.
        """
        return self.matcher.find_best_match(self.list_incidents(), evidence)

    async def match_or_create_incident(
        self, evidence: Evidence
    ) -> Tuple[Incident, EvidenceLink]:
        """
        Core ingestion pipeline returning (Incident, EvidenceLink).
        Preserves backward compatibility for other modules.
        """
        incident, link, _, _ = await self.ingest_evidence(evidence)
        return incident, link

    async def ingest_evidence(
        self, evidence: Evidence
    ) -> Tuple[Incident, EvidenceLink, MatchResult, IncidentSnapshot]:
        """
        Full incident intelligence pipeline:
        1. Match evaluation (spatial, temporal, semantic, context)
        2. Incident creation (if NO_MATCH or first) or fusion (if MATCH)
        3. Contradiction detection without destructive overwrites
        4. State evolution with field-level evidence confidence tracking
        5. Structured delta change detection ("What Changed?")
        6. Append-only snapshot recording
        """
        matched_incident, match_result = await self.evaluate_match(evidence)

        if matched_incident is None or match_result.decision != MatchDecision.MATCH:
            # Create a new Incident
            incident = self._create_incident_from_evidence(evidence)
            self._incidents[incident.incident_id] = incident

            # Link founding evidence
            link = EvidenceLink(
                link_id=f"EL-{len(incident.evidence_links) + 1:03d}",
                incident_id=incident.incident_id,
                evidence_id=evidence.evidence_id,
                similarity_score=1.0,
                link_rationale="Initial founding evidence establishing incident",
                linked_at=utc_now(),
            )
            incident.evidence_links.append(link)

            # Founding snapshot
            snapshot = self.snapshots.create_snapshot(
                incident=incident,
                delta_summary=["Incident initialized from primary evidence"],
                trigger_evidence_id=evidence.evidence_id,
                custom_summary=f"Initial incident created from {evidence.evidence_id}",
            )
            return incident, link, match_result, snapshot

        # Existing Incident Fusion
        incident = matched_incident

        # 1. Detect Contradictions
        new_contradictions = self.contradictions.detect_contradictions(incident, evidence)
        incident.contradictions.extend(new_contradictions)

        # 2. Compute Structured Deltas BEFORE mutating state
        deltas, field_diffs = self.changes.compute_evidence_deltas(incident, evidence)

        # 3. Create Evidence Link
        rationale_summary = "; ".join(match_result.reasons[:2]) if match_result.reasons else "High multi-factor correlation"
        link = EvidenceLink(
            link_id=f"EL-{len(incident.evidence_links) + 1:03d}",
            incident_id=incident.incident_id,
            evidence_id=evidence.evidence_id,
            similarity_score=match_result.overall_score,
            link_rationale=f"Fused based on multi-factor match (score: {match_result.overall_score:.2f}): {rationale_summary}",
            linked_at=utc_now(),
        )
        incident.evidence_links.append(link)

        # 4. State Evolution with Field-Level Evidence Confidence Tracking
        self._update_incident_state(incident, evidence, new_contradictions)

        # 5. Append-only Snapshot
        snapshot = self.snapshots.create_snapshot(
            incident=incident,
            delta_summary=deltas,
            trigger_evidence_id=evidence.evidence_id,
        )
        incident.updated_at = utc_now()

        return incident, link, match_result, snapshot

    def _create_incident_from_evidence(self, evidence: Evidence) -> Incident:
        """Instantiates a new Incident from founding evidence, tracking initial provenance."""
        incident_id = f"INC-{self._next_incident_num:03d}"
        self._next_incident_num += 1

        loc = evidence.location or Location(
            lat=12.935, lng=77.624, address="Disaster Zone - Coordinates Pending"
        )
        address_name = loc.address or f"Coordinates ({loc.lat:.3f}, {loc.lng:.3f})"
        title = f"{evidence.disaster_type.value.capitalize()} Emergency - {address_name}"

        # Initialize needs
        needs: List[Need] = []
        for i, n_type in enumerate(evidence.needs):
            needs.append(
                Need(
                    need_id=f"ND-{i + 1:03d}",
                    type=n_type,
                    urgency=evidence.urgency,
                    confidence=evidence.confidence.needs,
                    status=NeedStatus.UNMET,
                    quantity=evidence.people_affected or 1,
                    description=f"{n_type.value.capitalize()} requested via {evidence.evidence_id}",
                    identified_at=utc_now(),
                )
            )

        now = utc_now()
        # Initial Field Provenance
        provenance: Dict[str, FieldProvenance] = {
            "disaster_type": FieldProvenance(
                field_name="disaster_type",
                source_evidence_id=evidence.evidence_id,
                confidence=evidence.confidence.disaster_type,
                value=evidence.disaster_type.value,
                updated_at=now,
                rationale="Initial disaster type extraction",
            ),
            "severity": FieldProvenance(
                field_name="severity",
                source_evidence_id=evidence.evidence_id,
                confidence=evidence.confidence.severity,
                value=evidence.severity.value,
                updated_at=now,
                rationale="Initial severity evaluation",
            ),
            "people_affected": FieldProvenance(
                field_name="people_affected",
                source_evidence_id=evidence.evidence_id,
                confidence=evidence.confidence.people_affected,
                value=evidence.people_affected or 0,
                updated_at=now,
                rationale="Initial casualty / affected estimation",
            ),
            "access_status": FieldProvenance(
                field_name="access_status",
                source_evidence_id=evidence.evidence_id,
                confidence=evidence.confidence.access_status,
                value=evidence.access_status.value,
                updated_at=now,
                rationale="Initial route access report",
            ),
            "location": FieldProvenance(
                field_name="location",
                source_evidence_id=evidence.evidence_id,
                confidence=evidence.confidence.location,
                value={"lat": loc.lat, "lng": loc.lng, "address": loc.address},
                updated_at=now,
                rationale="Initial coordinates",
            ),
        }

        return Incident(
            incident_id=incident_id,
            title=title,
            disaster_type=evidence.disaster_type,
            status=evidence.access_status if False else "active",
            severity=evidence.severity,
            priority_level=evidence.severity,
            priority_score=50.0,
            location=loc,
            people_affected=evidence.people_affected or 0,
            access_status=evidence.access_status,
            evidence_links=[],
            current_needs=needs,
            snapshots=[],
            contradictions=[],
            field_provenance=provenance,
            created_at=now,
            updated_at=now,
        )

    def _update_incident_state(
        self, incident: Incident, evidence: Evidence, contradictions: List[Contradiction]
    ):
        """
        Updates incident state with field-level evidence confidence tracking.
        Preserves previous values and provenance without destructive loss.
        """
        now = utc_now()
        contradiction_fields = {c.field_name for c in contradictions}

        # 1. Update People Affected with Confidence Tracking
        if evidence.people_affected is not None:
            prev_people = incident.people_affected
            current_prov = incident.field_provenance.get("people_affected")
            current_conf = current_prov.confidence if current_prov else 0.5
            new_conf = evidence.confidence.people_affected

            # Update if higher confidence or higher count reported with sufficient confidence
            if new_conf >= current_conf or evidence.people_affected > prev_people:
                incident.people_affected = max(prev_people, evidence.people_affected)
                incident.field_provenance["people_affected"] = FieldProvenance(
                    field_name="people_affected",
                    source_evidence_id=evidence.evidence_id,
                    confidence=new_conf,
                    value=incident.people_affected,
                    previous_value=prev_people,
                    updated_at=now,
                    rationale=f"Updated count from {prev_people} to {incident.people_affected} via {evidence.evidence_id} (confidence: {new_conf:.2f})",
                )

        # 2. Update Access Status (respecting contradictions)
        if evidence.access_status not in (AccessStatus.UNKNOWN, None):
            prev_access = incident.access_status
            if "access_status" in contradiction_fields:
                # Flagged as contradiction: DO NOT overwrite destructively
                pass
            else:
                current_prov = incident.field_provenance.get("access_status")
                current_conf = current_prov.confidence if current_prov else 0.5
                new_conf = evidence.confidence.access_status

                if new_conf >= current_conf or prev_access == AccessStatus.UNKNOWN:
                    incident.access_status = evidence.access_status
                    incident.field_provenance["access_status"] = FieldProvenance(
                        field_name="access_status",
                        source_evidence_id=evidence.evidence_id,
                        confidence=new_conf,
                        value=evidence.access_status.value,
                        previous_value=prev_access.value if prev_access else None,
                        updated_at=now,
                        rationale=f"Access status updated to {evidence.access_status.value} (conf: {new_conf:.2f})",
                    )

        # 3. Update Needs
        existing_need_types = {n.type for n in incident.current_needs}
        for n_type in evidence.needs:
            if n_type not in existing_need_types:
                new_need = Need(
                    need_id=f"ND-{len(incident.current_needs) + 1:03d}",
                    type=n_type,
                    urgency=evidence.urgency,
                    confidence=evidence.confidence.needs,
                    status=NeedStatus.UNMET,
                    quantity=evidence.people_affected or 1,
                    description=f"{n_type.value.capitalize()} requested via {evidence.evidence_id}",
                    identified_at=now,
                )
                incident.current_needs.append(new_need)
                incident.field_provenance[f"need_{n_type.value}"] = FieldProvenance(
                    field_name=f"need_{n_type.value}",
                    source_evidence_id=evidence.evidence_id,
                    confidence=evidence.confidence.needs,
                    value=n_type.value,
                    updated_at=now,
                    rationale=f"Need identified with urgency {evidence.urgency.value}",
                )

        # 4. Severity Escalation with Confidence
        severity_rank = {
            SeverityLevel.LOW: 1,
            SeverityLevel.MEDIUM: 2,
            SeverityLevel.HIGH: 3,
            SeverityLevel.CRITICAL: 4,
        }
        if severity_rank.get(evidence.severity, 2) > severity_rank.get(incident.severity, 2):
            prev_sev = incident.severity
            incident.severity = evidence.severity
            incident.field_provenance["severity"] = FieldProvenance(
                field_name="severity",
                source_evidence_id=evidence.evidence_id,
                confidence=evidence.confidence.severity,
                value=evidence.severity.value,
                previous_value=prev_sev.value,
                updated_at=now,
                rationale=f"Severity escalated to {evidence.severity.value}",
            )


# Default singleton instance for application runtime
incident_fusion_service = IncidentService()
IncidentFusionService = IncidentService  # Alias for backward compatibility
