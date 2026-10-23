"""Master multimedia analysis pipeline orchestrator for VYUH (Developer 3).

Integrates all 7 stages of multimedia forensics:
1. Media inventory and input validation from canonical records
2. Exact-byte SHA-256 media matching
3. Perceptual image hashing (pHash, dHash, aHash) and Hamming comparisons
4. Explainable image forensics (metadata, ELA visualizations, consistency)
5. Video frame analysis and temporal discontinuity detection
6. Optional pretrained AI/deepfake model adapters (strict offline graceful fallback)
7. Cross-historical media matching linking posts and accounts
8. Developer 2 OCR result linkage
9. Derived outputs in Developer 3 and Developer 1 analysis result contracts
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from media.asset_loader import inventory_canonical_media
from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.image_forensics import run_image_forensic_screening
from media.image_similarity import ImageAsset, cross_match_historical_media, find_image_matches
from media.model_adapters import AIGeneratedImageScreeningAdapter, VideoDeepfakeScreeningAdapter
from media.schemas import CrossPostMediaMatch, MediaAnalysisResult, current_utc_iso
from media.video_analysis import analyze_video_frames


def analyze_media_asset(
    asset_path: Path,
    artifact_id: Optional[str] = None,
    source_record_ids: Optional[List[str]] = None,
    catalog: Optional[List[ImageAsset]] = None,
    ocr_result_id: Optional[str] = None,
    output_dir: Optional[Path] = None,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> MediaAnalysisResult:
    """Run full multimedia forensics pipeline on an individual local asset.
    
    Args:
        asset_path: Path to target image or video
        artifact_id: Identifier for this artifact
        source_record_ids: Associated canonical record IDs
        catalog: Optional reference catalog of existing assets for similarity matching
        ocr_result_id: Optional reference to Developer 2 OCR result
        output_dir: Directory where derived visualizations (e.g. ELA) can be stored
        config: MediaConfig instance
        
    Returns:
        Unified MediaAnalysisResult
    """
    p = Path(asset_path)
    art_id = artifact_id or p.stem
    rec_ids = source_record_ids or []
    ext = p.suffix.lower()

    # Video dispatch
    if ext in (".mp4", ".mov", ".avi", ".mkv", ".webm"):
        video_res = analyze_video_frames(p, artifact_id=art_id, config=config)
        return MediaAnalysisResult(
            artifact_id=art_id,
            source_record_ids=rec_ids,
            media_sha256=None,
            sha256_exact_match=False,
            exact_matches=[],
            perceptual_matches=[],
            ocr_result_id=ocr_result_id,
            forensic_findings=[],
            video_frame_findings=[video_res.to_dict()],
            ai_generated_screening=video_res.deepfake_screening,
            method_versions={
                "video_module": "1.0.0",
                "ffmpeg_available": str(video_res.status != "not_configured"),
            },
            thresholds={"max_duration_sec": config.max_video_duration_sec},
            limitations=video_res.limitations,
            requires_human_review=True,
        )

    # Missing file dispatch
    if not p.exists():
        return MediaAnalysisResult(
            artifact_id=art_id,
            source_record_ids=rec_ids,
            media_sha256=None,
            sha256_exact_match=False,
            exact_matches=[],
            perceptual_matches=[],
            ocr_result_id=ocr_result_id,
            forensic_findings=[{"status": "file_not_found", "path": str(p)}],
            video_frame_findings=[],
            ai_generated_screening={
                "status": "file_not_found",
                "score": None,
                "model_or_algorithm": "optional_deepfake_detector",
                "limitations": [f"File not found on disk: {p}"],
            },
            method_versions={"media_pipeline": "1.0.0"},
            thresholds={},
            limitations=[f"Media file not found at {p}"],
            requires_human_review=True,
        )

    # 1. Build ImageAsset & check similarity against catalog
    target_asset = ImageAsset(art_id, p, source_record_ids=rec_ids)
    sim_results = find_image_matches(
        target_asset,
        catalog or [],
        hamming_threshold=config.phash_hamming_threshold,
    )

    # 2. Run forensic screening (metadata, ELA, consistency)
    forensics = run_image_forensic_screening(
        p,
        artifact_id=art_id,
        output_dir=output_dir,
        config=config,
    )

    # 3. Screen with AI detector adapter (returns not_configured by default)
    ai_adapter = AIGeneratedImageScreeningAdapter()
    ai_screening = ai_adapter.screen_image(p)

    return MediaAnalysisResult(
        artifact_id=art_id,
        source_record_ids=rec_ids,
        media_sha256=target_asset.media_sha256,
        sha256_exact_match=sim_results["sha256_exact_match"],
        exact_matches=sim_results["exact_matches"],
        perceptual_matches=sim_results["perceptual_matches"],
        ocr_result_id=ocr_result_id,
        forensic_findings=forensics["forensic_findings"],
        video_frame_findings=[],
        ai_generated_screening=ai_screening,
        method_versions={
            "image_forensics": "1.0.0",
            "perceptual_hash": "imagehash_4.3.2",
            "media_sha256": "hashlib_sha256",
        },
        thresholds={"phash_hamming_threshold": config.phash_hamming_threshold},
        limitations=forensics["limitations"] + [
            "Perceptual matches indicate candidate visual resemblance, not common ownership or malicious provenance."
        ],
        requires_human_review=True,
    )


def run_multimedia_pipeline(
    records: Optional[List[Dict[str, Any]]] = None,
    media_dir: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    ocr_results: Optional[Dict[str, str]] = None,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> Dict[str, Any]:
    """Execute end-to-end multimedia forensics pipeline across canonical records or asset folder.
    
    Returns:
        Summary dict containing counts, output file paths, and execution status.
    """
    out_dir = output_dir or Path("runs/media_analysis")
    out_dir.mkdir(parents=True, exist_ok=True)
    vis_dir = out_dir / "ela_visualizations"

    print(f"[INFO] Initializing VYUH Multimedia Forensics Pipeline...")
    print(f"[INFO] Output Directory: {out_dir}")

    # Stage 1: Media Inventory
    inventory_items = []
    if records:
        print(f"[INFO] Inventorying media references across {len(records)} canonical records...")
        inventory_items = inventory_canonical_media(records, media_dir=media_dir, config=config)
    elif media_dir and media_dir.exists():
        # Build inventory from raw directory files
        print(f"[INFO] Inventorying local files in media directory {media_dir}...")
        for idx, f in enumerate(media_dir.iterdir()):
            if f.is_file():
                ext = f.suffix.lower()
                m_type = "video" if ext in (".mp4", ".mov", ".avi") else "photo"
                inventory_items.append(
                    inventory_canonical_media(
                        [{"record_id": f"LOCAL_{f.stem}", "media_reference": [{"type": m_type, "path": str(f)}]}],
                        media_dir=media_dir,
                        config=config,
                    )[0]
                )

    print(f"       Total inventory items: {len(inventory_items)}")

    # Stage 2: Index catalog of available local assets
    catalog: List[ImageAsset] = []
    for item in inventory_items:
        if item.analysis_status == "available" and item.local_asset_path:
            p = Path(item.local_asset_path)
            if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                catalog.append(
                    ImageAsset(
                        artifact_id=item.artifact_id,
                        file_path=p,
                        source_record_ids=[item.source_record_id],
                        author_ids=[item.source_author_id] if item.source_author_id else [],
                        source_datasets=[item.source_dataset] if item.source_dataset else [],
                    )
                )

    print(f"       Indexed {len(catalog)} local image assets for catalog matching.")

    # Stage 3: Analyze each available asset
    media_analysis_results: List[MediaAnalysisResult] = []
    dev1_analysis_results: List[Dict[str, Any]] = []

    for item in inventory_items:
        ocr_id = (ocr_results or {}).get(item.artifact_id) or (ocr_results or {}).get(item.source_record_id)
        if item.analysis_status == "available" and item.local_asset_path:
            res = analyze_media_asset(
                asset_path=Path(item.local_asset_path),
                artifact_id=item.artifact_id,
                source_record_ids=[item.source_record_id],
                catalog=catalog,
                ocr_result_id=ocr_id,
                output_dir=vis_dir,
                config=config,
            )
            media_analysis_results.append(res)
            dev1_analysis_results.extend(res.to_developer1_analysis_results())
        else:
            # Asset bytes unavailable or unsupported
            res = MediaAnalysisResult(
                artifact_id=item.artifact_id,
                source_record_ids=[item.source_record_id],
                media_sha256=None,
                sha256_exact_match=False,
                exact_matches=[],
                perceptual_matches=[],
                ocr_result_id=ocr_id,
                forensic_findings=[],
                video_frame_findings=[],
                ai_generated_screening={
                    "status": item.analysis_status,
                    "score": None,
                    "model_or_algorithm": "optional_deepfake_detector",
                    "limitations": [item.missing_data_reason or "Asset bytes unavailable"],
                },
                method_versions={"media_pipeline": "1.0.0"},
                thresholds={},
                limitations=[item.missing_data_reason or f"Media status: {item.analysis_status}"],
                requires_human_review=False,
            )
            media_analysis_results.append(res)

    # Stage 4: Cross-post historical media matching
    cross_matches = cross_match_historical_media(
        catalog, hamming_threshold=config.phash_hamming_threshold
    )
    print(f"       Discovered {len(cross_matches)} cross-post media match links.")

    # Stage 5: Serialize outputs
    def dump_jsonl(file_path: Path, items: List[Any]) -> None:
        with open(file_path, "w", encoding="utf-8") as f:
            for item in items:
                if hasattr(item, "model_dump"):
                    f.write(json.dumps(item.model_dump()) + "\n")
                elif hasattr(item, "to_dict"):
                    f.write(json.dumps(item.to_dict()) + "\n")
                elif isinstance(item, dict):
                    f.write(json.dumps(item) + "\n")

    dump_jsonl(out_dir / "media_inventory.jsonl", inventory_items)
    dump_jsonl(out_dir / "media_analysis.jsonl", media_analysis_results)
    dump_jsonl(out_dir / "cross_post_media_matches.jsonl", cross_matches)
    dump_jsonl(out_dir / "analysis_results_media.jsonl", dev1_analysis_results)

    # Run summary
    summary = {
        "executed_at": current_utc_iso(),
        "total_inventory_items": len(inventory_items),
        "available_local_assets": len(catalog),
        "bytes_unavailable_items": sum(1 for i in inventory_items if i.analysis_status == "bytes_unavailable"),
        "analyzed_results_count": len(media_analysis_results),
        "cross_post_matches_count": len(cross_matches),
        "dev1_analysis_findings_count": len(dev1_analysis_results),
        "output_directory": str(out_dir),
    }

    with open(out_dir / "media_run_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"[INFO] Multimedia Forensics Pipeline complete. Results written to {out_dir}")
    return summary
