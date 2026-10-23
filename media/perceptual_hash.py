"""Perceptual image hashing module for VYUH (Developer 3).

Stage 3 of Multimedia Forensics:
- Computes visual fingerprints (pHash, dHash, aHash) using ImageHash and Pillow
- Safely decodes and validates image dimensions and formats
- Bit-level Hamming distance comparison with configurable threshold
- Generates structured match candidates with explicit investigative limitations
- Handles corrupted images and unsupported modes gracefully
"""

import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
import imagehash
from PIL import Image

from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.schemas import PerceptualMatchItem


def get_imagehash_version() -> str:
    """Return runtime version of ImageHash library."""
    return getattr(imagehash, "__version__", "4.3.x")


def compute_perceptual_hashes(
    image_input: Union[Path, str, Image.Image],
) -> Dict[str, Any]:
    """Compute perceptual hashes (pHash, dHash, aHash) and properties for an image.
    
    Args:
        image_input: Path to image file, string path, or PIL Image instance
        
    Returns:
        Dict with 'phash', 'dhash', 'ahash', 'dimensions', 'format', 'mode'
    """
    img: Optional[Image.Image] = None
    should_close = False

    try:
        if isinstance(image_input, Image.Image):
            img = image_input
        else:
            path_obj = Path(image_input)
            if not path_obj.exists():
                raise FileNotFoundError(f"Image file does not exist: {image_input}")
            img = Image.open(path_obj)
            should_close = True

        img_format = img.format or "UNKNOWN"
        img_mode = img.mode
        img_dimensions = img.size

        # Convert to RGB or L for robust hashing
        hashable_img = img
        if img.mode not in ("RGB", "L"):
            hashable_img = img.convert("RGB")

        p_hash = str(imagehash.phash(hashable_img))
        d_hash = str(imagehash.dhash(hashable_img))
        a_hash = str(imagehash.average_hash(hashable_img))

        return {
            "phash": p_hash,
            "dhash": d_hash,
            "ahash": a_hash,
            "dimensions": img_dimensions,
            "format": img_format,
            "mode": img_mode,
            "algorithm_version": get_imagehash_version(),
        }
    finally:
        if should_close and img:
            img.close()


def compute_hamming_distance(hash_a: str, hash_b: str) -> int:
    """Calculate the bit-level Hamming distance between two hex hash strings."""
    ha = imagehash.hex_to_hash(hash_a)
    hb = imagehash.hex_to_hash(hash_b)
    return int(ha - hb)


def evaluate_perceptual_match(
    target_hash: str,
    ref_hash: str,
    ref_artifact_id: str,
    threshold: int = DEFAULT_MEDIA_CONFIG.phash_hamming_threshold,
    method: str = "phash",
    source_record_ids: Optional[list] = None,
) -> Optional[PerceptualMatchItem]:
    """Evaluate whether two perceptual hashes indicate candidate visual similarity.
    
    Returns:
        PerceptualMatchItem if distance <= threshold, else None.
    """
    try:
        dist = compute_hamming_distance(target_hash, ref_hash)
        if dist <= threshold:
            # Normalized similarity score [0.0 to 1.0] assuming 64-bit hash
            similarity = round(max(0.0, 1.0 - (dist / 64.0)), 4)
            return PerceptualMatchItem(
                matched_artifact_id=ref_artifact_id,
                hamming_distance=dist,
                threshold=threshold,
                similarity_score=similarity,
                method=method,
                interpretation="candidate_visual_similarity",
                source_record_ids=source_record_ids or [],
                limitations=[
                    "Perceptual similarity is an indicator of visual resemblance, NOT proof of common origin or manipulation.",
                    "Compression, cropping, or platform re-encoding naturally shifts perceptual distance.",
                ],
            )
        return None
    except Exception:
        return None


def are_perceptually_similar(
    hash_a: str,
    hash_b: str,
    threshold: int = DEFAULT_MEDIA_CONFIG.phash_hamming_threshold,
) -> bool:
    """Convenience boolean check for perceptual similarity within threshold."""
    dist = compute_hamming_distance(hash_a, hash_b)
    return dist <= threshold
