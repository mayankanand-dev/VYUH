"""Unit tests for Multimedia Analysis and Forensics Pipeline (Module I).

Covers:
- Perceptual hash extraction (pHash, dHash, aHash) and Hamming distance
- Exact SHA-256 byte matching vs near-duplicate visual matching
- Missing local media files
- JPEG Error Level Analysis (ELA) and EXIF metadata extraction
- AI-generated image models 'not_configured' status
- Video analysis graceful degradation
"""

from pathlib import Path
import pytest
from PIL import Image, ImageDraw

from media.perceptual_hash import (
    compute_perceptual_hashes,
    compute_hamming_distance,
    are_perceptually_similar,
)
from media.image_similarity import ImageAsset, find_image_matches
from media.image_forensics import compute_jpeg_ela, extract_image_metadata, run_image_forensic_screening
from media.video_analysis import analyze_video_frames
from media.unified_pipeline import analyze_media_asset


@pytest.fixture
def sample_test_images(tmp_path: Path):
    """Generate temporary in-memory test images."""
    img1_path = tmp_path / "original.jpg"
    img2_path = tmp_path / "exact_copy.jpg"
    img3_path = tmp_path / "different.jpg"

    # Image 1: White background with black rectangle in upper-left
    base = Image.new("RGB", (200, 200), color=(255, 255, 255))
    draw1 = ImageDraw.Draw(base)
    draw1.rectangle([10, 10, 80, 80], fill=(0, 0, 0))
    base.save(img1_path, format="JPEG", quality=95)

    # Image 2: Exact byte duplicate
    with open(img1_path, "rb") as f_in, open(img2_path, "wb") as f_out:
        f_out.write(f_in.read())

    # Image 3: Structurally different image with alternating diagonal lines
    diff = Image.new("RGB", (200, 200), color=(0, 0, 0))
    draw3 = ImageDraw.Draw(diff)
    for i in range(0, 200, 15):
        draw3.line([(0, i), (i, 0)], fill=(255, 255, 255), width=3)
    diff.save(img3_path, format="JPEG", quality=95)

    return img1_path, img2_path, img3_path


def test_perceptual_hashes_and_hamming(sample_test_images):
    img1, img2, img3 = sample_test_images

    h1 = compute_perceptual_hashes(img1)
    h2 = compute_perceptual_hashes(img2)
    h3 = compute_perceptual_hashes(img3)

    assert "phash" in h1
    assert "dhash" in h1
    assert "ahash" in h1

    # Exact duplicates have Hamming distance 0
    dist_exact = compute_hamming_distance(h1["phash"], h2["phash"])
    assert dist_exact == 0
    assert are_perceptually_similar(h1["phash"], h2["phash"], threshold=10)

    # Structurally distinct images should have positive Hamming distance
    dist_diff = compute_hamming_distance(h1["phash"], h3["phash"])
    assert dist_diff > 0


def test_image_catalog_matching(sample_test_images):
    img1, img2, img3 = sample_test_images

    asset1 = ImageAsset("asset_1", img1, source_record_ids=["rec_orig"])
    asset2 = ImageAsset("asset_2", img2, source_record_ids=["rec_copy"])
    asset3 = ImageAsset("asset_3", img3, source_record_ids=["rec_diff"])

    catalog = [asset2, asset3]
    matches = find_image_matches(asset1, catalog)

    assert matches["sha256_exact_match"] is True
    assert len(matches["exact_matches"]) == 1
    assert matches["exact_matches"][0]["matched_artifact_id"] == "asset_2"


def test_jpeg_ela_and_forensic_screening(sample_test_images):
    img1, _, _ = sample_test_images
    forensics = run_image_forensic_screening(img1)

    assert len(forensics["forensic_findings"]) >= 2
    assert forensics["ai_generated_screening"]["status"] == "not_configured"
    assert len(forensics["limitations"]) > 0


def test_missing_media_file():
    missing_path = Path("non_existent_folder/missing_image.png")
    res = analyze_media_asset(missing_path)

    assert res.sha256_exact_match is False
    assert len(res.forensic_findings) == 1
    assert res.forensic_findings[0]["status"] == "file_not_found"
    assert res.requires_human_review is True


def test_video_analysis_fallback():
    dummy_video = Path("non_existent_video.mp4")
    res = analyze_video_frames(dummy_video)
    assert res.status == "file_not_found"
    assert res.deepfake_screening["status"] == "not_configured"
