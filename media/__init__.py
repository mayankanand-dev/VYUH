"""VYUH Multimedia Forensics and Media Intelligence Subsystem (Developer 3).

Adheres strictly to Phase 3 requirements:
- Media inventory and safe asset loading (Stage 1)
- Exact SHA-256 byte matching (Stage 2)
- Perceptual image hashing: pHash, dHash, aHash (Stage 3)
- Explainable image forensics and JPEG Error Level Analysis (Stage 4)
- Video frame analysis and temporal discontinuity detection (Stage 5)
- Optional pretrained AI/deepfake model adapters (Stage 6)
- Cross-historical media matching linking posts and accounts (Stage 7)
- Unified media output contract and Developer 1 schema mappings
"""

from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.schemas import (
    CrossPostMediaMatch,
    ExactMediaMatchItem,
    ForensicFindingItem,
    MediaAnalysisResult,
    MediaInventoryItem,
    PerceptualMatchItem,
    VideoFrameFindingItem,
)
from media.asset_loader import inventory_canonical_media, resolve_local_asset
from media.perceptual_hash import (
    are_perceptually_similar,
    compute_hamming_distance,
    compute_perceptual_hashes,
    evaluate_perceptual_match,
)
from media.image_similarity import (
    ImageAsset,
    compute_media_sha256,
    cross_match_historical_media,
    find_image_matches,
)
from media.image_forensics import (
    compute_jpeg_ela,
    extract_image_metadata,
    run_image_forensic_screening,
)
from media.video_analysis import (
    analyze_video_frames,
    is_ffmpeg_installed,
    is_ffprobe_installed,
)
from media.model_adapters import (
    AIGeneratedImageScreeningAdapter,
    PretrainedForensicModelAdapter,
    VideoDeepfakeScreeningAdapter,
)
from media.pipeline import analyze_media_asset, run_multimedia_pipeline

__version__ = "2.0.0"

__all__ = [
    "DEFAULT_MEDIA_CONFIG",
    "MediaConfig",
    "MediaInventoryItem",
    "PerceptualMatchItem",
    "ExactMediaMatchItem",
    "ForensicFindingItem",
    "VideoFrameFindingItem",
    "CrossPostMediaMatch",
    "MediaAnalysisResult",
    "inventory_canonical_media",
    "resolve_local_asset",
    "compute_perceptual_hashes",
    "compute_hamming_distance",
    "are_perceptually_similar",
    "evaluate_perceptual_match",
    "compute_media_sha256",
    "ImageAsset",
    "find_image_matches",
    "cross_match_historical_media",
    "compute_jpeg_ela",
    "extract_image_metadata",
    "run_image_forensic_screening",
    "analyze_video_frames",
    "is_ffmpeg_installed",
    "is_ffprobe_installed",
    "PretrainedForensicModelAdapter",
    "AIGeneratedImageScreeningAdapter",
    "VideoDeepfakeScreeningAdapter",
    "analyze_media_asset",
    "run_multimedia_pipeline",
]
