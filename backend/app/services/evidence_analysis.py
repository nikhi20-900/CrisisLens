"""Backward compatibility bridge for Member 1 evidence service."""
from app.services.evidence import (
    DeterministicDemoAnalyzer,
    EvidenceAnalysisInterface,
    EvidenceAnalysisService,
    ImageAnalysisInterface,
    MockEvidenceAnalysisService,
    MockImageAnalyzer,
    MockVideoAnalyzer,
    VideoAnalysisInterface,
    evidence_analyzer,
    get_evidence_analyzer,
)

__all__ = [
    "EvidenceAnalysisInterface",
    "ImageAnalysisInterface",
    "VideoAnalysisInterface",
    "EvidenceAnalysisService",
    "DeterministicDemoAnalyzer",
    "MockEvidenceAnalysisService",
    "MockImageAnalyzer",
    "MockVideoAnalyzer",
    "evidence_analyzer",
    "get_evidence_analyzer",
]
