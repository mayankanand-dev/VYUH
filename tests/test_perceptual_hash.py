"""Deterministic offline tests for perceptual image hashing (Developer 3 Phase 3).

Covers:
- pHash, dHash, aHash calculation across PIL instances and file paths
- Hamming distance computation
- Identical visual content with different encodings (PNG vs JPEG)
- Perceptually similar resized and compressed images
- Structurally distinct images producing high Hamming distance
- Corrupted image handling
"""

import io
from pathlib import Path
import pytest
from PIL import Image, ImageDraw

from media.perceptual_hash import (
    are_perceptually_similar,
    compute_hamming_distance,
    compute_perceptual_hashes,
    evaluate_perceptual_match,
)


@pytest.fixture
def sample_generated_images(tmp_path: Path):
    """Generate synthetic test images in memory with no external downloads."""
    # Base Image A: Red square with blue circle
    img_a = Image.new("RGB", (200, 200), color=(255, 255, 255))
    draw_a = ImageDraw.Draw(img_a)
    draw_a.rectangle([20, 20, 100, 100], fill=(220, 20, 20))
    draw_a.ellipse([110, 110, 180, 180], fill=(20, 20, 220))

    path_a_png = tmp_path / "img_a.png"
    path_a_jpg = tmp_path / "img_a.jpg"
    img_a.save(path_a_png, format="PNG")
    img_a.save(path_a_jpg, format="JPEG", quality=90)

    # Image A resized to 100x100 (candidate near-duplicate)
    img_a_resized = img_a.resize((100, 100))
    path_a_resized = tmp_path / "img_a_resized.jpg"
    img_a_resized.save(path_a_resized, format="JPEG", quality=75)

    # Image B: Distinct content (Green cross on dark background)
    img_b = Image.new("RGB", (200, 200), color=(10, 10, 10))
    draw_b = ImageDraw.Draw(img_b)
    draw_b.rectangle([90, 10, 110, 190], fill=(0, 255, 0))
    draw_b.rectangle([10, 90, 190, 110], fill=(0, 255, 0))
    path_b = tmp_path / "img_b.jpg"
    img_b.save(path_b, format="JPEG", quality=90)

    # Corrupted image file (invalid header/truncated bytes)
    corrupted_path = tmp_path / "corrupted.jpg"
    corrupted_path.write_bytes(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00brokenbytesgarbage")

    return {
        "path_a_png": path_a_png,
        "path_a_jpg": path_a_jpg,
        "path_a_resized": path_a_resized,
        "path_b": path_b,
        "corrupted_path": corrupted_path,
    }


def test_perceptual_hash_computation(sample_generated_images):
    files = sample_generated_images
    res = compute_perceptual_hashes(files["path_a_png"])

    assert "phash" in res
    assert "dhash" in res
    assert "ahash" in res
    assert len(res["phash"]) == 16  # 64-bit hex representation
    assert res["format"] == "PNG"
    assert res["dimensions"] == (200, 200)


def test_identical_images_different_encodings(sample_generated_images):
    """PNG vs JPEG versions of the same visual scene should have very low Hamming distance."""
    files = sample_generated_images
    h_png = compute_perceptual_hashes(files["path_a_png"])
    h_jpg = compute_perceptual_hashes(files["path_a_jpg"])

    dist = compute_hamming_distance(h_png["phash"], h_jpg["phash"])
    # JPEG compression might flip 0-2 bits, but distance remains <= 4
    assert dist <= 4
    assert are_perceptually_similar(h_png["phash"], h_jpg["phash"], threshold=10)


def test_resized_recompressed_similarity(sample_generated_images):
    """Resized and recompressed image should match within threshold=10."""
    files = sample_generated_images
    h_orig = compute_perceptual_hashes(files["path_a_png"])
    h_resized = compute_perceptual_hashes(files["path_a_resized"])

    dist = compute_hamming_distance(h_orig["phash"], h_resized["phash"])
    assert dist <= 8
    assert are_perceptually_similar(h_orig["phash"], h_resized["phash"], threshold=10)


def test_distinct_images_have_large_distance(sample_generated_images):
    """Completely different images should exceed similarity threshold."""
    files = sample_generated_images
    h_a = compute_perceptual_hashes(files["path_a_jpg"])
    h_b = compute_perceptual_hashes(files["path_b"])

    dist = compute_hamming_distance(h_a["phash"], h_b["phash"])
    assert dist > 15
    assert not are_perceptually_similar(h_a["phash"], h_b["phash"], threshold=10)


def test_evaluate_perceptual_match_contract(sample_generated_images):
    files = sample_generated_images
    h_a = compute_perceptual_hashes(files["path_a_png"])["phash"]
    h_resized = compute_perceptual_hashes(files["path_a_resized"])["phash"]

    match_item = evaluate_perceptual_match(
        target_hash=h_a,
        ref_hash=h_resized,
        ref_artifact_id="MEDIA-002",
        threshold=10,
        source_record_ids=["rec_100"],
    )

    assert match_item is not None
    assert match_item.matched_artifact_id == "MEDIA-002"
    assert match_item.hamming_distance <= 10
    assert 0.0 <= match_item.similarity_score <= 1.0
    assert match_item.interpretation == "candidate_visual_similarity"
    assert len(match_item.limitations) > 0


def test_corrupted_image_handling(sample_generated_images):
    files = sample_generated_images
    with pytest.raises(Exception):
        compute_perceptual_hashes(files["corrupted_path"])


def test_missing_image_file_handling():
    missing = Path("non_existent_image_12345.png")
    with pytest.raises(FileNotFoundError):
        compute_perceptual_hashes(missing)
