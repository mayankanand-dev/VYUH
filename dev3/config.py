"""Configuration constants and dataclasses for Developer 3 analysis modules.

All thresholds and parameters are explainable defaults, strictly uncalibrated heuristics
unless formally evaluated against labeled ground-truth datasets.
"""

from dataclasses import dataclass, field
from typing import Dict, Any


@dataclass
class Dev3Config:
    # Burst and synchronization time windows
    burst_window_seconds: int = 600          # 10 minutes default for account burst detection
    sync_window_seconds: int = 300           # 5 minutes default for temporal synchronization
    
    # Comparison and memory protection limits
    max_pairwise_comparisons_per_bucket: int = 500  # Cap O(N^2) explosion per shared key
    min_normalized_text_length: int = 10     # Exclude very short phrases from repetition matching
    
    # Perceptual hash Hamming distance matching threshold (ImageHash 64-bit hash)
    phash_hamming_threshold: int = 10        # <=10 indicates close visual similarity
    
    # Campaign heuristic weights (must sum to ~1.0)
    coordination_weights: Dict[str, float] = field(default_factory=lambda: {
        "synchronized_posting": 0.25,
        "exact_repeated_content": 0.25,
        "shared_url": 0.20,
        "shared_media": 0.15,
        "interaction_density": 0.15,
    })
    
    # Campaign heuristic screening classification thresholds
    threshold_elevated: float = 0.65
    threshold_review: float = 0.35
    
    # Anomaly detection configuration
    anomaly_contamination: float = 0.05      # 5% baseline assumption for Isolation Forest
    min_posts_for_anomaly: int = 2           # Single post accounts cannot yield interval statistics
    
    # Geospatial analysis configuration
    geo_grid_precision_degrees: float = 0.1  # ~11km grid cell
    geo_min_records_for_analysis: int = 10   # Minimum records with coordinates to perform spatial test
    geo_spike_sigma_threshold: float = 2.5   # Standard deviations above spatial baseline
    
    # OSINT mock and safety
    osint_timeout_seconds: int = 10
    osint_offline_mode: bool = True          # Default offline mode for safety and hackathon tests


DEFAULT_CONFIG = Dev3Config()
