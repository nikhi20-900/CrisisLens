"""
Video Analysis Module
=====================
Defines VideoAnalysisInterface and MockVideoAnalyzer for deterministic
video evidence interpretation without claiming real computer-vision understanding.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from app.schemas.domain import AccessStatus, DisasterType, MediaItem, SeverityLevel
from app.services.evidence.interface import VideoAnalysisInterface


class MockVideoAnalyzer(VideoAnalysisInterface):
    """
    Deterministic mock video analyzer for MVP and demo operations.
    Extracts structured observations from video metadata, filename keywords,
    caption, and associated report text context.
    
    NOTE: This is a deterministic rule-based adapter and does NOT perform
    real-time continuous video understanding.
    """

    async def analyze_video(
        self,
        media_item: MediaItem,
        context_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes supplied video media deterministically.
        Extracts disaster type, severity, access status, observations, and confidence.
        """
        url_lower = (media_item.url or "").lower()
        caption_lower = (media_item.caption or "").lower()
        context_lower = (context_text or "").lower()
        combined_text = f"{url_lower} {caption_lower} {context_lower}"

        observations = []

        # 1. Disaster Type
        if any(w in combined_text for w in ["fire", "blaze", "burn"]):
            disaster_type = DisasterType.FIRE
            conf_disaster = 0.90
            observations.append("Video indicates active fire condition")
        elif any(w in combined_text for w in ["quake", "earthquake", "collapse"]):
            disaster_type = DisasterType.EARTHQUAKE
            conf_disaster = 0.85
            observations.append("Video indicates seismic structural collapse")
        elif any(w in combined_text for w in ["landslide", "mud"]):
            disaster_type = DisasterType.LANDSLIDE
            conf_disaster = 0.85
            observations.append("Video indicates mass earth movement")
        else:
            disaster_type = DisasterType.FLOOD
            conf_disaster = 0.94 if any(w in combined_text for w in ["flood", "water", "river", "overflow", "levee"]) else 0.80
            observations.append("Video depicts water flow inundation")

        # 2. Access Status
        if any(w in combined_text for w in ["road-blocked", "blocked", "cannot pass", "impassable", "stranded"]):
            access_status = AccessStatus.BLOCKED
            observations.append("Vehicles unable to pass through roadway")
        elif any(w in combined_text for w in ["submerged", "under water", "bridge"]):
            access_status = AccessStatus.SUBMERGED
            observations.append("Infrastructure or roadway submerged")
        elif any(w in combined_text for w in ["partially", "slow"]):
            access_status = AccessStatus.PARTIALLY_BLOCKED
            observations.append("Traffic severely restricted")
        elif any(w in combined_text for w in ["clear", "passable"]):
            access_status = AccessStatus.OPEN
            observations.append("Route appears navigable")
        else:
            access_status = AccessStatus.UNKNOWN

        # 3. Severity
        if any(w in combined_text for w in ["critical", "raging", "overflow", "breached", "submerged"]):
            severity = SeverityLevel.HIGH
            conf_severity = 0.88
        elif any(w in combined_text for w in ["receding", "shallow"]):
            severity = SeverityLevel.LOW
            conf_severity = 0.80
        else:
            severity = SeverityLevel.MEDIUM
            conf_severity = 0.82

        return {
            "media_id": media_item.media_id,
            "media_type": media_item.media_type,
            "url": media_item.url,
            "disaster_type": disaster_type,
            "severity": severity,
            "access_status": access_status,
            "observations": observations,
            "confidence": {
                "disaster_type": conf_disaster,
                "severity": conf_severity,
                "access_status": 0.85 if access_status != AccessStatus.UNKNOWN else 0.40,
            },
            "analyzer": "mock_video_analyzer",
        }
