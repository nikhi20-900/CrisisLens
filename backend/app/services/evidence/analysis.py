"""
Member 1: AI / Multimodal Evidence Analysis Service
===================================================
Converts raw disaster reports (text, media, location) into structured,
confidence-aware Evidence using the shared domain contract.
"""

from typing import Protocol, Dict, Any, Optional
from app.schemas.domain import (
    Report,
    Evidence,
    EvidenceConfidence,
    DisasterType,
    SeverityLevel,
    UrgencyLevel,
    AccessStatus,
    NeedType,
    utc_now,
)


class EvidenceAnalysisInterface(Protocol):
    """Clean interface isolating AI / extraction logic from business workflows."""

    async def analyze_report(self, report: Report) -> Evidence:
        """Analyzes a raw report and extracts structured, confidence-aware evidence."""
        ...


class MockEvidenceAnalysisService:
    """
    Deterministic mock implementation for Hackathon MVP demonstration.
    Extracts structured evidence using deterministic rule matching and keywords.
    """

    async def analyze_report(self, report: Report) -> Evidence:
        text_lower = report.text.lower()

        # Disaster Type extraction
        disaster_type = DisasterType.FLOOD
        disaster_conf = 0.95 if "flood" in text_lower or "water" in text_lower else 0.70

        # Severity & Urgency extraction
        if any(w in text_lower for w in ["critical", "emergency", "drowning", "swept away", "submerged"]):
            severity = SeverityLevel.CRITICAL
            urgency = UrgencyLevel.CRITICAL
        elif any(w in text_lower for w in ["trapped", "cannot pass", "stranded", "severe"]):
            severity = SeverityLevel.HIGH
            urgency = UrgencyLevel.HIGH
        elif any(w in text_lower for w in ["receding", "minor", "shallow"]):
            severity = SeverityLevel.LOW
            urgency = UrgencyLevel.LOW
        else:
            severity = SeverityLevel.MEDIUM
            urgency = UrgencyLevel.MEDIUM

        # Needs extraction
        needs = []
        if any(w in text_lower for w in ["trap", "rescue", "boat", "stuck"]):
            needs.append(NeedType.RESCUE)
        if any(w in text_lower for w in ["medical", "injury", "injured", "heart", "doctor", "ambulance"]):
            needs.append(NeedType.MEDICAL)
        if any(w in text_lower for w in ["food", "starving", "hungry"]):
            needs.append(NeedType.FOOD)
        if any(w in text_lower for w in ["water", "drinking", "thirsty"]):
            needs.append(NeedType.WATER)
        if any(w in text_lower for w in ["shelter", "homeless", "displaced"]):
            needs.append(NeedType.SHELTER)
        if any(w in text_lower for w in ["evacuate", "bus", "transport"]):
            needs.append(NeedType.TRANSPORT)

        # Access Status extraction
        if any(w in text_lower for w in ["road blocked", "blocked", "cannot pass", "submerged"]):
            access_status = AccessStatus.BLOCKED
        elif any(w in text_lower for w in ["partially", "slow", "single lane"]):
            access_status = AccessStatus.PARTIALLY_BLOCKED
        elif any(w in text_lower for w in ["open", "clear"]):
            access_status = AccessStatus.OPEN
        else:
            access_status = AccessStatus.UNKNOWN

        # People affected heuristic
        people_affected = None
        for word in text_lower.split():
            if word.isdigit():
                people_affected = int(word)
                break
        if "five" in text_lower:
            people_affected = 5
        elif "two" in text_lower:
            people_affected = 2
        elif "ten" in text_lower:
            people_affected = 10

        evidence_id = f"EV-{report.report_id.replace('R-', '') if 'R-' in report.report_id else report.report_id}"

        return Evidence(
            evidence_id=evidence_id,
            report_id=report.report_id,
            disaster_type=disaster_type,
            severity=severity,
            people_affected=people_affected,
            needs=needs,
            access_status=access_status,
            location=report.location,
            urgency=urgency,
            extracted_entities={"text_length": len(report.text), "has_media": len(report.media) > 0},
            confidence=EvidenceConfidence(
                disaster_type=disaster_conf,
                severity=0.88,
                people_affected=0.80 if people_affected else 0.50,
                needs=0.90 if needs else 0.50,
                access_status=0.85 if access_status != AccessStatus.UNKNOWN else 0.40,
                location=0.95 if report.location else 0.30,
                urgency=0.85,
            ),
            raw_report=report,
            extracted_at=utc_now(),
        )


evidence_analyzer: EvidenceAnalysisInterface = MockEvidenceAnalysisService()
