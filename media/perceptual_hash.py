"""Perceptual image hashing module.

Computes visual fingerprints (pHash, dHash, aHash) using ImageHash and Pillow.
Adheres to Section 3.I (Stage 2) of Master Prompt:
- Distinguishes cryptographic SHA-256 byte hashes from perceptual visual similarity
- Hamming distance comparison with configurable threshold
- Safe error handling for corrupted image bytes
"""

from pathlib import Path
from typing import Dict, Optional, Union
import imagehash
from PIL import Image


def compute_perceptual_hashes(image_input: Union[Path, str, Image.Image]) -> Dict[str, str]:
    """Compute perceptual hashes (pHash, dHash, aHash) for an image.
    
    Args:
        image_input: Path to image file, string path, or PIL Image instance
        
    Returns:
        Dict with 'phash', 'dhash', 'ahash' hex string values
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

        # Ensure image is in RGB or L
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        p_hash = str(imagehash.phash(img))
        d_hash = str(imagehash.dhash(img))
        a_hash = str(imagehash.average_hash(img))

        return {
            "phash": p_hash,
            "dhash": d_hash,
            "ahash": a_hash,
        }
    finally:
        if should_close and img:
            img.close()


def compute_hamming_distance(hash_a: str, hash_b: str) -> int:
    """Calculate the bit-level Hamming distance between two hex hash strings."""
    ha = imagehash.hex_to_hash(hash_a)
    hb = imagehash.hex_to_hash(hash_b)
    return ha - hb


def are_perceptually_similar(
    hash_a: str,
    hash_b: str,
    threshold: int = 10,
) -> bool:
    """Check if two hashes have Hamming distance <= threshold.
    
    A threshold of 10 on a 64-bit perceptual hash indicates candidate visual similarity.
    """
    dist = compute_hamming_distance(hash_a, hash_b)
    return dist <= threshold
