"""Configuration constants for VYUH Multimedia Forensics Pipeline (Developer 3).

Specifies explainable defaults, safety limits, timeouts, and thresholds.
Adheres strictly to Phase 3 requirements:
- Maximum file sizes for image (25MB) and video (50MB)
- Duration and frame limits
- Subprocess timeouts without shell execution
- Perceptual hashing Hamming distance thresholds
- Error Level Analysis (ELA) parameters
- Strict offline defaults preventing unauthorized remote fetches or weight downloads
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple


@dataclass
class MediaConfig:
    """Configuration settings for multimedia forensics and asset matching."""

    # Safety and resource limits
    max_image_size_bytes: int = 25 * 1024 * 1024       # 25 MB max image file size
    max_video_size_bytes: int = 50 * 1024 * 1024       # 50 MB max video file size
    max_video_duration_sec: float = 120.0              # 2 minutes max video duration
    max_sampled_frames: int = 120                      # Cap total extracted frames
    video_sample_interval_sec: float = 1.0             # Sample 1 frame every N seconds
    video_subprocess_timeout_sec: float = 15.0         # 15s subprocess timeout for ffmpeg/ffprobe

    # Perceptual hash matching thresholds (ImageHash 64-bit hashes)
    phash_hamming_threshold: int = 10                  # <= 10 indicates candidate visual similarity
    dhash_hamming_threshold: int = 10
    ahash_hamming_threshold: int = 10
    exact_frame_hash_threshold: int = 0                # 0 indicates bit-identical perceptual frame

    # Error Level Analysis (ELA) parameters
    ela_jpeg_quality: int = 90                         # Standard analysis recompression quality
    ela_scale: float = 10.0                            # Multiplier for visual difference enhancement
    ela_elevated_max_threshold: float = 40.0           # Max pixel discrepancy trigger
    ela_elevated_ratio_threshold: float = 8.0          # Max-to-mean discrepancy ratio trigger

    # Image consistency checks
    uniform_region_std_threshold: float = 3.0          # Low std indicates flat/uniform fill region

    # Acquisition and network security guards
    allow_remote_acquisition: bool = False             # Offline by default; no automatic URL scraping
    allowed_schemes: Tuple[str, ...] = ("http", "https")
    disallowed_hosts: Tuple[str, ...] = (
        "localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"
    )

    # Optional model screening
    enable_model_screening: bool = False               # Requires explicit opt-in and validated model

    # Storage paths
    derived_visualizations_dir: Optional[Path] = None


DEFAULT_MEDIA_CONFIG = MediaConfig()
