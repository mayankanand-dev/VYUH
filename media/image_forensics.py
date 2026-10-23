"""Image digital forensics, metadata analysis, and Error Level Analysis (ELA).

Stage 4 of Multimedia Forensics:
- Basic image properties and EXIF metadata extraction
- Explainable Error Level Analysis (ELA) with separate derived visualization artifacts
- Image consistency checks (uniform regions, compression discrepancies)
- Strict non-accusatory reporting adhering to forensic and legal standards
"""

import io
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS, GPSTAGS

from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.schemas import ForensicFindingItem


def extract_image_metadata(img: Image.Image) -> Dict[str, Any]:
    """Extract format, dimension, mode, and EXIF attributes from a PIL Image.
    
    Guarantees:
    - Never equates missing EXIF with tampering (social media uploads strip EXIF)
    - Never equates software editing tags with malicious fabrication
    """
    meta: Dict[str, Any] = {
        "format": img.format or "UNKNOWN",
        "mode": img.mode,
        "width": img.width,
        "height": img.height,
        "has_exif": False,
        "exif_tags": {},
        "software": None,
        "datetime_original": None,
        "camera_make_model": None,
        "gps_info_present": False,
        "aspect_ratio": round(img.width / max(1, img.height), 3),
    }

    try:
        exif = img.getexif()
        if exif:
            meta["has_exif"] = True
            for tag_id, value in exif.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                # Safe conversion of bytes or non-string tags
                if isinstance(value, bytes):
                    try:
                        clean_val = value.decode("utf-8", errors="ignore").strip()
                    except Exception:
                        clean_val = f"<bytes length {len(value)}>"
                else:
                    clean_val = str(value)

                meta["exif_tags"][tag_name] = clean_val

                tag_lower = tag_name.lower()
                if tag_lower == "software":
                    meta["software"] = clean_val
                elif tag_lower in ("datetimeoriginal", "datetime"):
                    meta["datetime_original"] = clean_val
                elif tag_lower in ("make", "model"):
                    meta["camera_make_model"] = clean_val
                elif tag_lower == "gpsinfo":
                    meta["gps_info_present"] = True
    except Exception:
        pass

    return meta


def compute_jpeg_ela(
    image_input: Union[Path, str, Image.Image],
    output_dir: Optional[Path] = None,
    artifact_id: Optional[str] = None,
    quality: int = DEFAULT_MEDIA_CONFIG.ela_jpeg_quality,
    scale: float = DEFAULT_MEDIA_CONFIG.ela_scale,
) -> Tuple[Dict[str, Any], Optional[Path]]:
    """Compute JPEG Error Level Analysis (ELA) statistics and optional derived visualization.
    
    Compares the original decoded image with an analysis copy re-encoded at a fixed JPEG quality.
    Higher localized differences may indicate regions with differing compression histories.
    
    Guarantees:
    - Preserves source image completely untouched
    - Saves derived visualization to a separate artifact file
    - Never claims bright regions definitively prove manipulation
    
    Returns:
        (metrics_dict, derived_visualization_path)
    """
    img: Optional[Image.Image] = None
    should_close = False

    try:
        if isinstance(image_input, Image.Image):
            img = image_input
            src_name = artifact_id or "image"
        else:
            p = Path(image_input)
            if not p.exists():
                raise FileNotFoundError(f"Image not found for ELA: {image_input}")
            img = Image.open(p)
            should_close = True
            src_name = artifact_id or p.stem

        # Convert to RGB for JPEG recompression
        rgb_img = img.convert("RGB")

        # In-memory recompression
        buf = io.BytesIO()
        rgb_img.save(buf, format="JPEG", quality=quality)
        buf.seek(0)
        recompressed = Image.open(buf)

        # Difference computation
        diff = ImageChops.difference(rgb_img, recompressed)
        diff_arr = np.array(diff, dtype=float)

        mean_err = float(np.mean(diff_arr))
        max_err = float(np.max(diff_arr))
        std_err = float(np.std(diff_arr))

        # Discrepancy indicator (ratio of max to mean error)
        elevated_discrepancy = (
            max_err > DEFAULT_MEDIA_CONFIG.ela_elevated_max_threshold
            and (max_err / max(1.0, mean_err)) > DEFAULT_MEDIA_CONFIG.ela_elevated_ratio_threshold
        )

        # Generate and save derived visualization if output_dir is provided
        derived_path: Optional[Path] = None
        if output_dir:
            output_dir.mkdir(parents=True, exist_ok=True)
            derived_path = output_dir / f"{src_name}_ela.png"

            # Enhance difference for visual review
            extrema = diff.getextrema()
            max_diff = max([ex[1] for ex in extrema]) if extrema else 1
            scale_factor = 255.0 / max(1, max_diff) if max_diff > 0 else 1.0
            enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale_factor)
            enhanced_diff.save(derived_path, format="PNG")

        metrics = {
            "method": "jpeg_error_level_analysis",
            "quality_tested": quality,
            "mean_error_level": round(mean_err, 3),
            "max_error_level": round(max_err, 3),
            "std_error_level": round(std_err, 3),
            "elevated_discrepancy_detected": elevated_discrepancy,
            "derived_visualization_path": str(derived_path) if derived_path else None,
            "interpretation": (
                "Regional compression discrepancy observed; manual visual inspection recommended."
                if elevated_discrepancy
                else "Uniform compression error distribution; no regional anomalies observed."
            ),
            "limitations": [
                "ELA highlights differences in recompression behavior, which can occur naturally along high-contrast edges or textures.",
                "ELA cannot prove manipulation on its own; human review of original provenance is essential.",
            ],
        }

        return metrics, derived_path
    finally:
        if should_close and img:
            img.close()


def check_image_consistency(img: Image.Image) -> List[Dict[str, Any]]:
    """Check image for basic statistical consistency and uniform fill regions."""
    findings: List[Dict[str, Any]] = []

    try:
        rgb_img = img.convert("RGB")
        arr = np.array(rgb_img, dtype=float)

        # 1. Overall luminance statistics
        mean_r, mean_g, mean_b = np.mean(arr, axis=(0, 1))
        std_r, std_g, std_b = np.std(arr, axis=(0, 1))

        # Check for near-uniform / flat image (e.g. solid color canvas)
        if (
            std_r < DEFAULT_MEDIA_CONFIG.uniform_region_std_threshold
            and std_g < DEFAULT_MEDIA_CONFIG.uniform_region_std_threshold
            and std_b < DEFAULT_MEDIA_CONFIG.uniform_region_std_threshold
        ):
            findings.append({
                "check": "uniform_canvas_detection",
                "label": "near_uniform_image",
                "explanation": [
                    f"Image has exceptionally low color variance across all channels (R_std: {std_r:.1f}, G_std: {std_g:.1f}, B_std: {std_b:.1f}).",
                    "Indicates a solid color banner, synthetic placeholder, or blank canvas.",
                ],
                "score": round(float(np.mean([std_r, std_g, std_b])), 2),
                "score_type": "heuristic",
                "requires_human_review": False,
            })

        # 2. Extreme aspect ratios
        aspect_ratio = img.width / max(1, img.height)
        if aspect_ratio > 4.0 or aspect_ratio < 0.25:
            findings.append({
                "check": "aspect_ratio_consistency",
                "label": "extreme_aspect_ratio",
                "explanation": [
                    f"Extreme image aspect ratio detected ({aspect_ratio:.2f}:1, dimensions: {img.width}x{img.height})."
                ],
                "score": round(aspect_ratio, 2),
                "score_type": "heuristic",
                "requires_human_review": True,
            })
    except Exception:
        pass

    return findings


def run_image_forensic_screening(
    image_path: Path,
    artifact_id: Optional[str] = None,
    output_dir: Optional[Path] = None,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> Dict[str, Any]:
    """Execute full lightweight explainable forensic screening on a local image asset.
    
    Returns:
        Structured findings dict with metadata, ELA, and consistency checks.
    """
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found for forensics: {image_path}")

    art_id = artifact_id or image_path.stem
    findings: List[ForensicFindingItem] = []

    # 1. Properties and Metadata
    with Image.open(image_path) as img:
        meta = extract_image_metadata(img)
        consistency_checks = check_image_consistency(img)

    meta_finding = ForensicFindingItem(
        finding_type="metadata_extraction",
        label="exif_metadata_present" if meta["has_exif"] else "no_exif_metadata",
        score=1.0 if meta["has_exif"] else 0.0,
        score_type="qualitative_indicator",
        explanation=[
            f"Image dimensions: {meta['width']}x{meta['height']}, format: {meta['format']}, mode: {meta['mode']}.",
            (
                f"EXIF metadata present. Camera: {meta['camera_make_model']}, Software: {meta['software']}, Capture Date: {meta['datetime_original']}."
                if meta["has_exif"]
                else "No EXIF metadata present in image file (standard for social media re-compressed uploads)."
            ),
        ],
        parameters={"dimensions": f"{meta['width']}x{meta['height']}", "format": meta["format"]},
        limitations=[
            "Missing EXIF metadata is standard on platforms like Twitter/X and Instagram, which strip metadata for privacy.",
            "Presence of editing software (e.g. Photoshop) is common for legitimate cropping or resizing.",
        ],
        requires_human_review=False,
    )
    findings.append(meta_finding)

    # 2. Consistency Findings
    for cc in consistency_checks:
        findings.append(
            ForensicFindingItem(
                finding_type=cc["check"],
                label=cc["label"],
                score=cc.get("score"),
                score_type=cc.get("score_type", "heuristic"),
                explanation=cc.get("explanation", []),
                limitations=["Statistical anomalies describe image layout, not malicious intent."],
                requires_human_review=cc.get("requires_human_review", True),
            )
        )

    # 3. ELA Check (for JPEG or convertable images)
    try:
        ela_metrics, ela_vis_path = compute_jpeg_ela(
            image_path,
            output_dir=output_dir,
            artifact_id=art_id,
            quality=config.ela_jpeg_quality,
            scale=config.ela_scale,
        )

        ela_finding = ForensicFindingItem(
            finding_type="ela_variation",
            label=(
                "potential_recompression_inconsistency"
                if ela_metrics["elevated_discrepancy_detected"]
                else "uniform_compression_distribution"
            ),
            score=ela_metrics["max_error_level"],
            score_type="qualitative_indicator",
            explanation=[
                ela_metrics["interpretation"],
                f"Mean error level: {ela_metrics['mean_error_level']}, Max error level: {ela_metrics['max_error_level']}.",
            ],
            derived_artifact_path=str(ela_vis_path) if ela_vis_path else None,
            parameters={"jpeg_quality": config.ela_jpeg_quality, "scale": config.ela_scale},
            limitations=ela_metrics["limitations"],
            requires_human_review=ela_metrics["elevated_discrepancy_detected"],
        )
        findings.append(ela_finding)
    except Exception as ex:
        findings.append(
            ForensicFindingItem(
                finding_type="ela_variation",
                label="ela_processing_skipped",
                score=None,
                score_type="qualitative_indicator",
                explanation=[f"Error Level Analysis could not be computed: {ex}"],
                limitations=["Non-JPEG or malformed images cannot be evaluated with JPEG ELA."],
                requires_human_review=False,
            )
        )

    # 4. Optional AI detector screening
    from media.model_adapters import AIGeneratedImageScreeningAdapter
    ai_adapter = AIGeneratedImageScreeningAdapter()
    ai_res = ai_adapter.screen_image(image_path)

    return {
        "artifact_id": art_id,
        "image_path": str(image_path),
        "forensic_findings": findings,
        "ai_generated_screening": ai_res,
        "limitations": [
            "Forensic screening indicators are investigative leads, NOT definitive legal proof of manipulation.",
            "Platform re-encoding naturally introduces compression artifacts.",
        ],
    }
