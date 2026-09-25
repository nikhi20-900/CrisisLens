"""
Image Analysis Module
=====================
Defines ImageAnalysisInterface and MockImageAnalyzer for deterministic
image evidence interpretation without requiring external vision APIs.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from app.schemas.domain import AccessStatus, DisasterType, MediaItem, SeverityLevel
from app.services.evidence.interface import ImageAnalysisInterface


class MockImageAnalyzer(ImageAnalysisInterface):
    """
    Deterministic mock image analyzer for MVP and demo operations.
    Extracts structured visual observations using deterministic rules,
    metadata, media caption, and filename keywords.
    """

    async def analyze_image(
        self,
        media_item: MediaItem,
        context_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes supplied image media deterministically.
        Extracts disaster type, severity, access status, observations, and confidence.
        """
        # Aggregate text signals from caption, URL filename, and contextual report text
        url_lower = (media_item.url or "").lower()
        caption_lower = (media_item.caption or "").lower()
        context_lower = (context_text or "").lower()
        combined_text = f"{url_lower} {caption_lower} {context_lower}"

        observations = []

        # 1. Disaster Type
        if any(w in combined_text for w in ["fire", "blaze", "smoke"]):
            disaster_type = DisasterType.FIRE
            confidence_disaster = 0.88
            observations.append("Visible fire and smoke plume")
        elif any(w in combined_text for w in ["earthquake", "quake", "rubble", "collapse"]):
            disaster_type = DisasterType.EARTHQUAKE
            confidence_disaster = 0.85
            observations.append("Visible structural rubble")
        elif any(w in combined_text for w in ["landslide", "mudslide"]):
            disaster_type = DisasterType.LANDSLIDE
            confidence_disaster = 0.85
            observations.append("Visible debris flow/landslide")
        else:
            # Default flood domain for CrisisLens MVP
            disaster_type = DisasterType.FLOOD
            confidence_disaster = 0.92 if any(w in combined_text for w in ["flood", "water", "submerged", "river"]) else 0.80
            observations.append("Visible floodwater inundation")

        # 2. Access Status
        if any(w in combined_text for w in ["blocked", "cannot pass", "impassable"]):
            access_status = AccessStatus.BLOCKED
            observations.append("Roadway visibly blocked")
        elif any(w in combined_text for w in ["submerged", "under water", "bridge"]):
            access_status = AccessStatus.BLOCKED
            observations.append("Infrastructure or roadway submerged under water")
        elif any(w in combined_text for w in ["partially", "single lane"]):
            access_status = AccessStatus.PARTIALLY_BLOCKED
            observations.append("Roadway partially obstructed")
        elif any(w in combined_text for w in ["clear", "open"]):
            access_status = AccessStatus.OPEN
            observations.append("Route appears clear")
        else:
            access_status = AccessStatus.UNKNOWN

        # 3. Severity
        if any(w in combined_text for w in ["critical", "raging", "severe", "submerged"]):
            severity = SeverityLevel.HIGH
            confidence_severity = 0.85
        elif any(w in combined_text for w in ["receding", "minor", "puddle"]):
            severity = SeverityLevel.LOW
            confidence_severity = 0.80
        else:
            severity = SeverityLevel.MEDIUM
            confidence_severity = 0.82

        return {
            "media_id": media_item.media_id,
            "media_type": media_item.media_type,
            "url": media_item.url,
            "disaster_type": disaster_type,
            "severity": severity,
            "access_status": access_status,
            "observations": observations,
            "confidence": {
                "disaster_type": confidence_disaster,
                "severity": confidence_severity,
                "access_status": 0.85 if access_status != AccessStatus.UNKNOWN else 0.40,
            },
            "analyzer": "mock_image_analyzer",
        }
