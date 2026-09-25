"""
Evidence Analysis Service
=========================
Core service coordinating text analysis, image analysis, and video analysis
to convert raw disaster reports into validated, confidence-aware Evidence.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.schemas.domain import (
    AccessStatus,
    DisasterType,
    Evidence,
    EvidenceConfidence,
    NeedType,
    Report,
    SeverityLevel,
    UrgencyLevel,
    utc_now,
)
from app.services.evidence.image import MockImageAnalyzer
from app.services.evidence.interface import (
    EvidenceAnalysisInterface,
    ImageAnalysisInterface,
    VideoAnalysisInterface,
)
from app.services.evidence.video import MockVideoAnalyzer

logger = logging.getLogger(__name__)


class EvidenceAnalysisService(EvidenceAnalysisInterface):
    """
    Modular, replaceable Evidence Analysis Service implementing EvidenceAnalysisInterface.
    Analyzes text, images, video, and location metadata into structured Evidence.
    """

    def __init__(
        self,
        image_analyzer: Optional[ImageAnalysisInterface] = None,
        video_analyzer: Optional[VideoAnalysisInterface] = None,
    ):
        self.image_analyzer = image_analyzer or MockImageAnalyzer()
        self.video_analyzer = video_analyzer or MockVideoAnalyzer()

    async def analyze(self, report: Report) -> Evidence:
        """Alias for analyze_report conforming to EvidenceAnalysisInterface."""
        return await self.analyze_report(report)

    async def analyze_report(self, report: Report) -> Evidence:
        """
        Converts a raw Report into structured, confidence-aware Evidence.
        Preserves original report reference, media references, and location metadata.
        """
        text_lower = (report.text or "").lower()
        extracted_observations: List[str] = []

        # --------------------------------------------------------------------
        # 1. Disaster Type Extraction
        # --------------------------------------------------------------------
        if any(w in text_lower for w in ["fire", "blaze", "burn", "smoke", "wildfire"]):
            disaster_type = DisasterType.FIRE
            conf_disaster = 0.90
        elif any(w in text_lower for w in ["earthquake", "tremor", "quake", "rubble"]):
            disaster_type = DisasterType.EARTHQUAKE
            conf_disaster = 0.90
        elif any(w in text_lower for w in ["landslide", "mudslide", "slope"]):
            disaster_type = DisasterType.LANDSLIDE
            conf_disaster = 0.90
        elif any(w in text_lower for w in ["flood", "water", "river", "submerged", "drowning", "rising", "tsunami"]):
            disaster_type = DisasterType.FLOOD
            conf_disaster = 0.95
        elif any(w in text_lower for w in ["building collapse", "collapsed building", "structural collapse"]):
            disaster_type = DisasterType.EARTHQUAKE
            conf_disaster = 0.80
        else:
            disaster_type = DisasterType.FLOOD
            conf_disaster = 0.70

        # --------------------------------------------------------------------
        # 2. Severity & Urgency Extraction
        # --------------------------------------------------------------------
        if any(w in text_lower for w in ["critical", "emergency", "drowning", "swept away", "submerged", "immediate danger", "immediate medical"]):
            severity = SeverityLevel.CRITICAL
            urgency = UrgencyLevel.CRITICAL
            conf_severity = 0.92
            conf_urgency = 0.92
        elif any(w in text_lower for w in ["trapped", "cannot pass", "stranded", "severe", "impassable", "immediate", "injured"]):
            severity = SeverityLevel.HIGH
            urgency = UrgencyLevel.HIGH
            conf_severity = 0.88
            conf_urgency = 0.88
        elif any(w in text_lower for w in ["receding", "minor", "shallow"]):
            severity = SeverityLevel.LOW
            urgency = UrgencyLevel.LOW
            conf_severity = 0.80
            conf_urgency = 0.80
        elif any(w in text_lower for w in ["flooding reported", "water level rising", "flood"]):
            severity = SeverityLevel.MEDIUM
            urgency = UrgencyLevel.MEDIUM
            conf_severity = 0.75
            conf_urgency = 0.75
        else:
            severity = SeverityLevel.MEDIUM
            urgency = UrgencyLevel.MEDIUM
            conf_severity = 0.65
            conf_urgency = 0.65

        # --------------------------------------------------------------------
        # 3. People Affected Extraction (Explicit counts only - no fabrication)
        # --------------------------------------------------------------------
        people_affected: Optional[int] = None
        conf_people = 0.50

        # Numerical digits matching
        words = text_lower.split()
        for i, word in enumerate(words):
            if word.isdigit():
                val = int(word)
                if val >= 0:
                    people_affected = val
                    conf_people = 0.95
                    break

        # Written number heuristics
        if people_affected is None:
            if "five" in words or "five people" in text_lower:
                people_affected = 5
                conf_people = 0.95
            elif "two" in words or "two people" in text_lower:
                people_affected = 2
                conf_people = 0.95
            elif "ten" in words or "ten people" in text_lower:
                people_affected = 10
                conf_people = 0.95
            elif "three" in words or "three people" in text_lower:
                people_affected = 3
                conf_people = 0.95
            elif "one" in words:
                people_affected = 1
                conf_people = 0.90

        # --------------------------------------------------------------------
        # 4. Critical Needs Extraction (Multiple needs supported)
        # --------------------------------------------------------------------
        needs: List[NeedType] = []
        if any(w in text_lower for w in ["trap", "trapped", "rescue", "boat", "stuck", "stranded"]):
            needs.append(NeedType.RESCUE)
        if any(w in text_lower for w in ["medical", "injury", "injured", "heart", "doctor", "ambulance", "breathing"]):
            needs.append(NeedType.MEDICAL)
        if any(w in text_lower for w in ["food", "starving", "hungry"]):
            needs.append(NeedType.FOOD)
        if any(w in text_lower for w in ["water", "drinking", "thirsty"]):
            needs.append(NeedType.WATER)
        if any(w in text_lower for w in ["shelter", "homeless", "displaced"]):
            needs.append(NeedType.SHELTER)
        if any(w in text_lower for w in ["evacuate", "evacuation", "bus", "transport"]):
            needs.append(NeedType.TRANSPORT)

        conf_needs = 0.90 if needs else 0.50

        # --------------------------------------------------------------------
        # 5. Access Status Extraction
        # --------------------------------------------------------------------
        if any(w in text_lower for w in ["road blocked", "blocked", "cannot pass", "vehicles cannot pass", "impassable"]):
            access_status = AccessStatus.BLOCKED
            conf_access = 0.90
        elif any(w in text_lower for w in ["submerged", "bridge is submerged", "under water"]):
            access_status = AccessStatus.BLOCKED
            conf_access = 0.88
        elif any(w in text_lower for w in ["partially", "slow", "single lane", "restricted"]):
            access_status = AccessStatus.PARTIALLY_BLOCKED
            conf_access = 0.85
        elif any(w in text_lower for w in ["open", "clear", "passable"]):
            access_status = AccessStatus.OPEN
            conf_access = 0.85
        else:
            access_status = AccessStatus.UNKNOWN
            conf_access = 0.40

        # --------------------------------------------------------------------
        # 6. Multimodal Image & Video Integration (With Graceful Fallback)
        # --------------------------------------------------------------------
        has_media = len(report.media) > 0
        has_image = False
        has_video = False

        for media in report.media:
            m_type = (media.media_type or "").lower()
            m_url = (media.url or "").lower()

            # Handle Image Evidence
            if m_type.startswith("image/") or any(m_url.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                has_image = True
                try:
                    img_result = await self.image_analyzer.analyze_image(media, context_text=report.text)
                    if img_result.get("observations"):
                        extracted_observations.extend(img_result["observations"])
                    # Elevate access status or severity if image visually confirms blockage
                    if img_result.get("access_status") in (AccessStatus.BLOCKED, AccessStatus.SUBMERGED):
                        if access_status == AccessStatus.UNKNOWN:
                            access_status = AccessStatus.BLOCKED
                            conf_access = max(conf_access, 0.85)
                except Exception as exc:
                    logger.warning("Image analysis failed for media %s: %s", media.media_id, exc)

            # Handle Video Evidence
            elif m_type.startswith("video/") or any(m_url.endswith(ext) for ext in [".mp4", ".mov", ".avi", ".webm"]):
                has_video = True
                try:
                    vid_result = await self.video_analyzer.analyze_video(media, context_text=report.text)
                    if vid_result.get("observations"):
                        extracted_observations.extend(vid_result["observations"])
                    if vid_result.get("access_status") in (AccessStatus.BLOCKED, AccessStatus.SUBMERGED):
                        if access_status == AccessStatus.UNKNOWN:
                            access_status = AccessStatus.BLOCKED
                            conf_access = max(conf_access, 0.85)
                except Exception as exc:
                    logger.warning("Video analysis failed for media %s: %s", media.media_id, exc)

        # --------------------------------------------------------------------
        # 7. Location Handling (Preserve metadata; never invent GPS coordinates)
        # --------------------------------------------------------------------
        if report.location is not None:
            location = report.location
            conf_location = 0.95
        else:
            location = None
            conf_location = 0.0

        # --------------------------------------------------------------------
        # 8. Field-Level Confidence Object
        # --------------------------------------------------------------------
        confidence = EvidenceConfidence(
            disaster_type=conf_disaster,
            severity=conf_severity,
            people_affected=conf_people,
            needs=conf_needs,
            access_status=conf_access,
            location=conf_location,
            urgency=conf_urgency,
        )

        # --------------------------------------------------------------------
        # 9. Structure Result & Preserve Original Report
        # --------------------------------------------------------------------
        clean_rep_id = report.report_id.replace("R-", "") if "R-" in report.report_id else report.report_id
        evidence_id = f"EV-{clean_rep_id}"

        extracted_entities: Dict[str, Any] = {
            "text_length": len(report.text or ""),
            "has_media": has_media,
            "has_image": has_image,
            "has_video": has_video,
            "media_count": len(report.media),
            "media_types": [m.media_type for m in report.media],
            "observations": extracted_observations,
            "analyzer": "deterministic_service",
        }

        return Evidence(
            evidence_id=evidence_id,
            report_id=report.report_id,
            disaster_type=disaster_type,
            severity=severity,
            people_affected=people_affected,
            needs=needs,
            access_status=access_status,
            location=location,
            urgency=urgency,
            extracted_entities=extracted_entities,
            confidence=confidence,
            raw_report=report,  # Preserves complete original report reference
            extracted_at=utc_now(),
        )
