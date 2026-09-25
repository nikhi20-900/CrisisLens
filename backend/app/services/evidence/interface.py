"""
Evidence Analysis Interfaces
============================
Defines the abstract contracts for Evidence Analysis, Image Analysis,
and Video Analysis, isolating AI and extraction logic from business workflows.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Protocol, runtime_checkable
from app.schemas.domain import Evidence, MediaItem, Report


@runtime_checkable
class EvidenceAnalysisInterface(Protocol):
    """
    Main evidence analysis interface.
    Converts raw incoming Report objects into structured, confidence-aware Evidence.
    """

    async def analyze_report(self, report: Report) -> Evidence:
        """Analyzes a raw report and extracts structured, confidence-aware evidence."""
        ...

    async def analyze(self, report: Report) -> Evidence:
        """Alias for analyze_report for ergonomic calling."""
        ...


@runtime_checkable
class ImageAnalysisInterface(Protocol):
    """
    Interface for image evidence analysis adapters.
    Extracts visual observations from supplied image media.
    """

    async def analyze_image(
        self,
        media_item: MediaItem,
        context_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyzes an image media item and returns structured observations."""
        ...


@runtime_checkable
class VideoAnalysisInterface(Protocol):
    """
    Interface for video evidence analysis adapters.
    Extracts observations from supplied video media.
    """

    async def analyze_video(
        self,
        media_item: MediaItem,
        context_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyzes a video media item and returns structured observations."""
        ...
