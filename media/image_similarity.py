"""Image similarity and catalog matching module.

Indexes image assets, computes exact SHA-256 byte matches, and evaluates
near-duplicate perceptual visual similarity across images.
Adheres strictly to Section 3.I (Stages 1 and 2) of Master Prompt.
"""

import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from media.perceptual_hash import compute_perceptual_hashes, compute_hamming_distance
from dev3.config import DEFAULT_CONFIG


def compute_file_sha256(file_path: Path) -> str:
    """Compute SHA-256 byte digest of local file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


class ImageAsset:
    """Represents a local or indexed media artifact."""

    def __init__(
        self,
        artifact_id: str,
        file_path: Path,
        source_record_ids: Optional[List[str]] = None,
    ) -> None:
        self.artifact_id = artifact_id
        self.file_path = file_path
        self.source_record_ids = source_record_ids or []
        self.byte_size = file_path.stat().st_size if file_path.exists() else 0
        self.sha256: Optional[str] = None
        self.perceptual_hashes: Dict[str, str] = {}
        self.dimensions: Optional[Tuple[int, int]] = None
        self.format: Optional[str] = None

        if file_path.exists():
            self.sha256 = compute_file_sha256(file_path)
            try:
                with Image.open(file_path) as img:
                    self.dimensions = img.size
                    self.format = img.format
                self.perceptual_hashes = compute_perceptual_hashes(file_path)
            except Exception:
                pass


def find_image_matches(
    target_asset: ImageAsset,
    catalog: List[ImageAsset],
    hamming_threshold: int = DEFAULT_CONFIG.phash_hamming_threshold,
) -> Dict[str, Any]:
    """Compare a target image asset against a catalog of reference assets.
    
    Returns:
        Dict with 'sha256_exact_matches' and 'perceptual_matches'
    """
    exact_matches: List[Dict[str, Any]] = []
    perceptual_matches: List[Dict[str, Any]] = []

    target_phash = target_asset.perceptual_hashes.get("phash")

    for ref in catalog:
        if ref.artifact_id == target_asset.artifact_id:
            continue

        # Exact SHA-256 byte match
        if target_asset.sha256 and ref.sha256 and target_asset.sha256 == ref.sha256:
            exact_matches.append({
                "matched_artifact_id": ref.artifact_id,
                "sha256": ref.sha256,
                "source_record_ids": ref.source_record_ids,
                "match_type": "exact_sha256_byte_identity",
            })

        # Perceptual hash match
        ref_phash = ref.perceptual_hashes.get("phash")
        if target_phash and ref_phash:
            try:
                dist = compute_hamming_distance(target_phash, ref_phash)
                if dist <= hamming_threshold:
                    # Similarity score between 0.0 and 1.0 (64 max distance)
                    sim_score = round(max(0.0, 1.0 - (dist / 64.0)), 4)
                    perceptual_matches.append({
                        "matched_artifact_id": ref.artifact_id,
                        "hamming_distance": dist,
                        "similarity_score": sim_score,
                        "threshold": hamming_threshold,
                        "source_record_ids": ref.source_record_ids,
                        "match_type": "candidate_near_duplicate_visual",
                    })
            except Exception:
                pass

    return {
        "target_artifact_id": target_asset.artifact_id,
        "sha256_exact_match": len(exact_matches) > 0,
        "exact_matches": exact_matches,
        "perceptual_matches": perceptual_matches,
    }
