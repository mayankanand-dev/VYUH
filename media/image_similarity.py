"""Image similarity, exact byte matching, and cross-historical post linking.

Stages 2 and 7 of Multimedia Forensics:
- Computes cryptographic SHA-256 for exact media matching (distinct from Developer 1 evidence manifest)
- Indexes perceptual hashes for candidate visual similarity
- Links shared media across historical posts and accounts without conflating with coordination
"""

import hashlib
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from PIL import Image

from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.perceptual_hash import compute_perceptual_hashes, evaluate_perceptual_match
from media.schemas import CrossPostMediaMatch, ExactMediaMatchItem, PerceptualMatchItem


def compute_media_sha256(file_path: Path, block_size: int = 65536) -> str:
    """Compute exact file-byte SHA-256 digest for media matching.
    
    NOTE: This is Developer 3's media-matching digest, used to discover exact duplicate
    media files across posts. It is separate from Developer 1's chain-of-custody evidence
    integrity manifest.
    """
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"Media file not found for hashing: {file_path}")

    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(block_size), b""):
            h.update(chunk)
    return h.hexdigest()


class ImageAsset:
    """Represents an indexed local media artifact with derived fingerprints."""

    def __init__(
        self,
        artifact_id: str,
        file_path: Path,
        source_record_ids: Optional[List[str]] = None,
        author_ids: Optional[List[str]] = None,
        source_datasets: Optional[List[str]] = None,
        post_timestamps: Optional[List[str]] = None,
    ) -> None:
        self.artifact_id = artifact_id
        self.file_path = Path(file_path)
        self.source_record_ids = source_record_ids or []
        self.author_ids = author_ids or []
        self.source_datasets = source_datasets or []
        self.post_timestamps = post_timestamps or []

        self.byte_size = self.file_path.stat().st_size if self.file_path.exists() else 0
        self.media_sha256: Optional[str] = None
        self.perceptual_hashes: Dict[str, str] = {}
        self.dimensions: Optional[Tuple[int, int]] = None
        self.format: Optional[str] = None
        self.mode: Optional[str] = None
        self.is_valid_image: bool = False

        if self.file_path.exists() and self.byte_size > 0:
            try:
                self.media_sha256 = compute_media_sha256(self.file_path)
            except Exception:
                pass

            try:
                h_res = compute_perceptual_hashes(self.file_path)
                self.perceptual_hashes = {
                    "phash": h_res["phash"],
                    "dhash": h_res["dhash"],
                    "ahash": h_res["ahash"],
                }
                self.dimensions = h_res.get("dimensions")
                self.format = h_res.get("format")
                self.mode = h_res.get("mode")
                self.is_valid_image = True
            except Exception:
                self.is_valid_image = False


def find_image_matches(
    target_asset: ImageAsset,
    catalog: List[ImageAsset],
    hamming_threshold: int = DEFAULT_MEDIA_CONFIG.phash_hamming_threshold,
) -> Dict[str, Any]:
    """Compare a target image asset against a catalog of reference assets.
    
    Returns:
        Dict with 'sha256_exact_match', 'exact_matches', 'perceptual_matches'
    """
    exact_matches: List[Dict[str, Any]] = []
    perceptual_matches: List[Dict[str, Any]] = []

    target_phash = target_asset.perceptual_hashes.get("phash")

    for ref in catalog:
        if ref.artifact_id == target_asset.artifact_id:
            continue

        # 1. Exact media SHA-256 check
        if (
            target_asset.media_sha256
            and ref.media_sha256
            and target_asset.media_sha256 == ref.media_sha256
        ):
            exact_matches.append(
                ExactMediaMatchItem(
                    matched_artifact_id=ref.artifact_id,
                    media_sha256=ref.media_sha256,
                    source_record_ids=ref.source_record_ids,
                    match_type="exact_media_sha256_match",
                    limitations=[
                        "Exact byte match confirms byte-level identity. It does not establish where the media originated."
                    ],
                ).model_dump()
            )

        # 2. Perceptual hash check
        ref_phash = ref.perceptual_hashes.get("phash")
        if target_phash and ref_phash:
            match_item = evaluate_perceptual_match(
                target_hash=target_phash,
                ref_hash=ref_phash,
                ref_artifact_id=ref.artifact_id,
                threshold=hamming_threshold,
                method="phash",
                source_record_ids=ref.source_record_ids,
            )
            if match_item:
                perceptual_matches.append(match_item.model_dump())

    return {
        "target_artifact_id": target_asset.artifact_id,
        "media_sha256": target_asset.media_sha256,
        "sha256_exact_match": len(exact_matches) > 0,
        "exact_matches": exact_matches,
        "perceptual_matches": perceptual_matches,
    }


def cross_match_historical_media(
    assets: List[ImageAsset],
    hamming_threshold: int = DEFAULT_MEDIA_CONFIG.phash_hamming_threshold,
) -> List[CrossPostMediaMatch]:
    """Index media assets and discover shared exact or candidate perceptual media across historical records.
    
    Answers Stage 7 questions:
    - Which records reference the same exact media bytes?
    - Which artifacts are perceptually similar?
    - Which accounts published them?
    - When were they published in historical datasets?
    """
    cross_matches: List[CrossPostMediaMatch] = []
    seen_pairs: Set[Tuple[str, str]] = set()

    # 1. Exact SHA-256 clustering
    sha_index: Dict[str, List[ImageAsset]] = defaultdict(list)
    for asset in assets:
        if asset.media_sha256:
            sha_index[asset.media_sha256].append(asset)

    for sha_val, cluster in sha_index.items():
        if len(cluster) > 1:
            for i in range(len(cluster)):
                for j in range(i + 1, len(cluster)):
                    a1 = cluster[i]
                    a2 = cluster[j]
                    pair_key = tuple(sorted([a1.artifact_id, a2.artifact_id]))
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    all_records = list(set(a1.source_record_ids + a2.source_record_ids))
                    all_accounts = list(set([acc for acc in (a1.author_ids + a2.author_ids) if acc]))
                    all_timestamps = list(set([ts for ts in (a1.post_timestamps + a2.post_timestamps) if ts]))
                    all_datasets = list(set([ds for ds in (a1.source_datasets + a2.source_datasets) if ds]))

                    cross_matches.append(
                        CrossPostMediaMatch(
                            primary_artifact_id=a1.artifact_id,
                            matched_artifact_id=a2.artifact_id,
                            match_type="exact_byte_match",
                            source_record_ids=all_records,
                            account_ids=all_accounts,
                            post_timestamps=all_timestamps,
                            source_datasets=all_datasets,
                            explanation=[
                                f"Artifacts '{a1.artifact_id}' and '{a2.artifact_id}' have identical SHA-256 byte digest: {sha_val}.",
                                f"Published across {len(all_accounts)} accounts and {len(all_records)} canonical posts.",
                            ],
                            limitations=[
                                "Exact byte match alone does not establish coordination; shared memes and news images are common organically.",
                            ],
                        )
                    )

    # 2. Perceptual candidate matching
    valid_assets = [a for a in assets if a.perceptual_hashes.get("phash")]
    for i in range(len(valid_assets)):
        for j in range(i + 1, len(valid_assets)):
            a1 = valid_assets[i]
            a2 = valid_assets[j]
            pair_key = tuple(sorted([a1.artifact_id, a2.artifact_id]))
            if pair_key in seen_pairs:
                continue

            h1 = a1.perceptual_hashes["phash"]
            h2 = a2.perceptual_hashes["phash"]
            match_item = evaluate_perceptual_match(
                target_hash=h1,
                ref_hash=h2,
                ref_artifact_id=a2.artifact_id,
                threshold=hamming_threshold,
                method="phash",
            )
            if match_item:
                seen_pairs.add(pair_key)
                all_records = list(set(a1.source_record_ids + a2.source_record_ids))
                all_accounts = list(set([acc for acc in (a1.author_ids + a2.author_ids) if acc]))
                all_timestamps = list(set([ts for ts in (a1.post_timestamps + a2.post_timestamps) if ts]))
                all_datasets = list(set([ds for ds in (a1.source_datasets + a2.source_datasets) if ds]))

                cross_matches.append(
                    CrossPostMediaMatch(
                        primary_artifact_id=a1.artifact_id,
                        matched_artifact_id=a2.artifact_id,
                        match_type="candidate_perceptual_match",
                        source_record_ids=all_records,
                        account_ids=all_accounts,
                        post_timestamps=all_timestamps,
                        source_datasets=all_datasets,
                        explanation=[
                            f"Artifacts '{a1.artifact_id}' and '{a2.artifact_id}' have candidate visual similarity "
                            f"(Hamming distance: {match_item.hamming_distance}, threshold: {hamming_threshold}).",
                            f"Published across {len(all_accounts)} accounts and {len(all_records)} canonical posts.",
                        ],
                        limitations=[
                            "Candidate perceptual match is an investigative lead; images may be resized, compressed, or cropped versions.",
                            "Does not establish coordinated activity without corroborating temporal or conversational evidence.",
                        ],
                    )
                )

    return cross_matches
