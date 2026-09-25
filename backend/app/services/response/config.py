"""
Centralized Priority Configuration for Response Intelligence Layer.
===================================================================
Contains tunable weights, scaling parameters, and versioning for deterministic priority scoring.
"""

from dataclasses import dataclass


@dataclass
class PriorityConfig:
    """Tunable priority scoring configuration."""
    configuration_version: str = "v1.0.0"

    # Priority Factor Weights
    severity_weight: float = 20.0
    people_weight: float = 30.0
    critical_need_weight: float = 30.0
    accessibility_weight: float = 15.0
    time_weight: float = 5.0
    confidence_weight: float = 5.0
    trend_weight: float = 10.0

    # Normalization Caps / Multipliers
    max_people_affected_cap: int = 5
    score_min_bound: float = 0.0
    score_max_bound: float = 100.0


default_priority_config = PriorityConfig()
