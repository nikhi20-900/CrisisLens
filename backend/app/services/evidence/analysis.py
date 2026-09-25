"""
Member 1: AI / Multimodal Evidence Analysis Service
===================================================
Converts raw disaster reports (text, media, location) into structured,
confidence-aware Evidence using the shared domain contract.

Supports:
- EvidenceAnalysisInterface
- EvidenceAnalysisService
- DeterministicDemoAnalyzer (Fast, deterministic rule-based demonstration analyzer)
- MockEvidenceAnalysisService (Backward-compatible alias)
"""

from __future__ import annotations

import logging
from typing import Optional

from app.schemas.domain import Evidence, Report
from app.services.evidence.interface import (
    EvidenceAnalysisInterface,
    ImageAnalysisInterface,
    VideoAnalysisInterface,
)
from app.services.evidence.service import EvidenceAnalysisService

logger = logging.getLogger(__name__)


class DeterministicDemoAnalyzer(EvidenceAnalysisService):
    """
    Deterministic rule-based analyzer for demonstrations and resilient fallback.
    Extracts structured evidence using deterministic rule matching and keywords.
    """
    pass


# Backward-compatible alias for existing imports and tests
MockEvidenceAnalysisService = DeterministicDemoAnalyzer


def get_evidence_analyzer(
    analyzer_type: Optional[str] = None,
) -> EvidenceAnalysisInterface:
    """
    Factory function returning an EvidenceAnalysisInterface implementation.
    Defaults to the deterministic demo analyzer.
    """
    return DeterministicDemoAnalyzer()


# Default singleton instance used by API endpoints
evidence_analyzer: EvidenceAnalysisInterface = get_evidence_analyzer()
