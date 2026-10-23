"""Image digital forensics and manipulation screening module.

Provides lightweight digital forensic checks:
- Dimension and format validation
- EXIF metadata extraction and presence checks
- JPEG Error Level Analysis (ELA) for recompression artifact anomalies
- Optional AI-generated image screening adapter

Adheres strictly to Section 3.I (Stages 3 and 4) of Master Prompt:
- ELA and metadata checks are described as investigative indicators, NOT proof of tampering
- AI screening returns 'not_configured' unless a tested model is explicitly registered
- Never fabricates model predictions
"""

import io
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS, GPSTAGS


def extract_image_metadata(img: Image.Image) -> Dict[str, Any]:
    """Extract format, dimension, and EXIF attributes from a PIL Image."""
    meta: Dict[str, Any] = {
        "format": img.format,
        "mode": img.mode,
        "width": img.width,
        "height": img.height,
        "has_exif": False,
        "exif_tags": {},
        "software": None,
        "datetime_original": None,
        "camera_make_model": None,
        "gps_info_present": False,
    }

    try:
        exif = img.getexif()
        if exif:
            meta["has_exif"] = True
            for tag_id, value in exif.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                # Convert bytes or large unprintable structures to strings
                if isinstance(value, bytes):
                    try:
                        clean_val = value.decode("utf-8", errors="ignore").strip()
                    except Exception:
                        clean_val = f"<bytes length {len(value)}>"
                else:
                    clean_val = str(value)

                meta["exif_tags"][tag_name] = clean_val

                if tag_name.lower() == "software":
                    meta["software"] = clean_val
                elif tag_name.lower() in ("datetimeoriginal", "datetime"):
                    meta["datetime_original"] = clean_val
                elif tag_name.lower() in ("make", "model"):
                    meta["camera_make_model"] = clean_val
                elif tag_name.lower() == "gpsinfo":
                    meta["gps_info_present"] = True
    except Exception:
        pass

    return meta


def compute_jpeg_ela(
    image_input: Union[Path, str, Image.Image],
    quality: int = 90,
    scale: float = 10.0,
) -> Dict[str, Any]:
    """Compute JPEG Error Level Analysis (ELA) statistics.
    
    Compares the original image with an image recompressed at a fixed JPEG quality.
    Higher localized differences may indicate regions spliced or modified at differing
    compression levels.
    """
    img: Optional[Image.Image] = None
    should_close = False

    try:
        if isinstance(image_input, Image.Image):
            img = image_input
        else:
            p = Path(image_input)
            if not p.exists():
                raise FileNotFoundError(f"Image not found: {image_input}")
            img = Image.open(p)
            should_close = True

        # Convert to RGB
        rgb_img = img.convert("RGB")

        # Save to in-memory JPEG at specified quality
        buf = io.BytesIO()
        rgb_img.save(buf, format="JPEG", quality=quality)
        buf.seek(0)
        recompressed = Image.open(buf)

        # Compute difference
        diff = ImageChops.difference(rgb_img, recompressed)
        diff_arr = np.array(diff, dtype=float)

        mean_err = float(np.mean(diff_arr))
        max_err = float(np.max(diff_arr))
        std_err = float(np.std(diff_arr))

        # Check for extreme regional anomalies (high ratio of max to mean error)
        elevated_discrepancy = (max_err > 40.0 and (max_err / max(1.0, mean_err)) > 8.0)

        return {
            "method": "jpeg_error_level_analysis",
            "quality_tested": quality,
            "mean_error_level": round(mean_err, 3),
            "max_error_level": round(max_err, 3),
            "std_error_level": round(std_err, 3),
            "elevated_discrepancy_detected": elevated_discrepancy,
            "interpretation": (
                "Elevated regional recompression discrepancy detected; manual visual inspection recommended."
                if elevated_discrepancy else
                "Uniform compression error distribution; no obvious regional recompression anomalies observed."
            ),
        }
    finally:
        if should_close and img:
            img.close()


class AIGeneratedImageScreeningAdapter:
    """Adapter for optional pretrained AI image detection models.
    
    By default returns 'not_configured' to satisfy strict environment integrity rules
    without crashing or downloading unauthorized weights.
    """

    def __init__(self, model_path: Optional[str] = None) -> None:
        self.model_path = model_path
        self.is_configured = False  # Disabled by default until validated model is supplied

    def screen_image(self, image_path: Path) -> Dict[str, Any]:
        """Screen image for synthetic/AI-generated indicators."""
        if not self.is_configured:
            return {
                "status": "not_configured",
                "score": None,
                "model_name": None,
                "version": None,
                "notes": "No pretrained AI image classification model registered or enabled in environment.",
            }

        # If a model were configured, inference logic would execute here
        return {
            "status": "inconclusive",
            "score": None,
            "model_name": "placeholder",
            "version": "1.0.0",
            "notes": "Model evaluation requires calibrated ground-truth dataset.",
        }


def run_image_forensic_screening(
    image_path: Path,
    ai_adapter: Optional[AIGeneratedImageScreeningAdapter] = None,
) -> Dict[str, Any]:
    """Perform end-to-end forensic screening on an image file.
    
    Returns:
        Structured forensic findings dict
    """
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found for forensics: {image_path}")

    findings: List[Dict[str, Any]] = []

    # 1. Metadata check
    with Image.open(image_path) as img:
        meta = extract_image_metadata(img)

    meta_summary = {
        "check": "metadata_extraction",
        "has_exif": meta["has_exif"],
        "dimensions": f"{meta['width']}x{meta['height']}",
        "software": meta["software"],
        "camera": meta["camera_make_model"],
        "datetime": meta["datetime_original"],
        "notes": "Metadata present." if meta["has_exif"] else "No EXIF metadata present in image file (common for social-media compressed uploads).",
    }
    findings.append(meta_summary)

    # 2. ELA check
    try:
        ela_res = compute_jpeg_ela(image_path)
        findings.append(ela_res)
    except Exception as ex:
        findings.append({
            "check": "jpeg_error_level_analysis",
            "status": "error",
            "error_detail": str(ex),
        })

    # 3. AI screening check
    ai_detector = ai_adapter or AIGeneratedImageScreeningAdapter()
    ai_res = ai_detector.screen_image(image_path)

    return {
        "image_path": str(image_path),
        "forensic_findings": findings,
        "ai_generated_screening": ai_res,
        "limitations": [
            "Forensic screening indicators are investigative leads, NOT definitive legal proof of manipulation.",
            "Social platforms routinely strip EXIF metadata and re-encode JPEGs during normal uploading.",
            "No automated tool can reliably identify 100% of digital alterations.",
        ],
    }
