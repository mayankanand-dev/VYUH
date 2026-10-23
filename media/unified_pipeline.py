"""Unified multimedia analysis orchestrator.

Integrates exact SHA-256 byte hashing, perceptual matching, image manipulation indicators,
and video frame screening into a single structured output contract.

Adheres strictly to Section 3.I (Stage 6) of Master Prompt.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
from dev3.schemas import MediaAnalysisResult
from dev3.config import DEFAULT_CONFIG
from media.image_similarity import ImageAsset, find_image_matches
from media.image_forensics import run_image_forensic_screening
from media.video_analysis import analyze_video_frames


def analyze_media_asset(
    asset_path: Path,
    artifact_id: Optional[str] = None,
    source_record_ids: Optional[List[str]] = None,
    catalog: Optional[List[ImageAsset]] = None,
    ocr_result_id: Optional[str] = None,
) -> MediaAnalysisResult:
    """Run full multimedia forensics pipeline on a local asset.
    
    Args:
        asset_path: Path to target image or video
        artifact_id: Identifier for this artifact
        source_record_ids: Associated canonical record IDs
        catalog: Optional reference catalog of existing assets for similarity matching
        ocr_result_id: Optional reference to Developer 2 OCR result
        
    Returns:
        Unified MediaAnalysisResult
    """
    art_id = artifact_id or asset_path.stem
    rec_ids = source_record_ids or []
    ext = asset_path.suffix.lower()

    # Video dispatch
    if ext in (".mp4", ".avi", ".mov", ".mkv", ".webm"):
        video_res = analyze_video_frames(asset_path)
        return MediaAnalysisResult(
            artifact_id=art_id,
            source_record_ids=rec_ids,
            sha256_exact_match=False,
            sha256=None,
            perceptual_matches=[],
            ocr_result_id=ocr_result_id,
            forensic_findings=[],
            video_frame_findings=[video_res.to_dict()],
            ai_generated_screening=video_res.deepfake_screening,
            method_versions={"video_module": "1.0.0"},
            thresholds={},
            limitations=video_res.limitations,
            requires_human_review=True,
        )

    # Image dispatch
    if not asset_path.exists():
        return MediaAnalysisResult(
            artifact_id=art_id,
            source_record_ids=rec_ids,
            sha256_exact_match=False,
            sha256=None,
            perceptual_matches=[],
            ocr_result_id=ocr_result_id,
            forensic_findings=[{"status": "file_not_found", "path": str(asset_path)}],
            limitations=[f"Media file not found at {asset_path}"],
            requires_human_review=True,
        )

    # 1. Build ImageAsset & check similarity against catalog
    target_asset = ImageAsset(art_id, asset_path, source_record_ids=rec_ids)
    sim_results = find_image_matches(target_asset, catalog or [])

    # 2. Run forensic screening
    forensics = run_image_forensic_screening(asset_path)

    return MediaAnalysisResult(
        artifact_id=art_id,
        source_record_ids=rec_ids,
        sha256_exact_match=sim_results["sha256_exact_match"],
        sha256=target_asset.sha256,
        perceptual_matches=sim_results["perceptual_matches"],
        ocr_result_id=ocr_result_id,
        forensic_findings=forensics["forensic_findings"],
        video_frame_findings=[],
        ai_generated_screening=forensics["ai_generated_screening"],
        method_versions={
            "image_forensics": "1.0.0",
            "perceptual_hash": "imagehash_4.3.2",
            "sha256": "hashlib_sha256",
        },
        thresholds={"hamming_distance_max": DEFAULT_CONFIG.phash_hamming_threshold},
        limitations=forensics["limitations"] + [
            "Perceptual matches indicate candidate visual similarity, not common ownership or malicious provenance."
        ],
        requires_human_review=True,
    )
