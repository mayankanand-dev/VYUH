"""Deterministic offline tests for exact media SHA-256 and cross-post similarity matching (Developer 3 Phase 3).

Covers:
- Exact SHA-256 byte matching
- Non-matching bytes yielding distinct hashes
- Verifying file immutability during hashing
- ImageAsset indexing and metadata extraction
- Catalog matching for exact and perceptual duplicates
- Cross-historical post linking across multiple accounts
"""

from pathlib import Path
import pytest
from PIL import Image, ImageDraw

from media.image_similarity import (
    ImageAsset,
    compute_media_sha256,
    cross_match_historical_media,
    find_image_matches,
)


@pytest.fixture
def test_image_set(tmp_path: Path):
    """Generate deterministic image fixtures."""
    # Image 1 (Original)
    p1 = tmp_path / "img1.png"
    im1 = Image.new("RGB", (120, 120), color=(100, 150, 200))
    draw = ImageDraw.Draw(im1)
    draw.rectangle([10, 10, 60, 60], fill=(255, 0, 0))
    im1.save(p1)

    # Image 2 (Exact duplicate file copy of Image 1)
    p2 = tmp_path / "img2_exact_copy.png"
    p2.write_bytes(p1.read_bytes())

    # Image 3 (Perceptually similar: resized copy saved as JPEG)
    p3 = tmp_path / "img3_resized.jpg"
    im1.resize((80, 80)).save(p3, format="JPEG", quality=85)

    # Image 4 (Distinct content: Yellow star on black)
    p4 = tmp_path / "img4_distinct.png"
    im4 = Image.new("RGB", (120, 120), color=(0, 0, 0))
    draw4 = ImageDraw.Draw(im4)
    draw4.ellipse([30, 30, 90, 90], fill=(255, 255, 0))
    im4.save(p4)

    return {"p1": p1, "p2": p2, "p3": p3, "p4": p4}


def test_exact_byte_sha256_matching(test_image_set):
    files = test_image_set
    sha1 = compute_media_sha256(files["p1"])
    sha2 = compute_media_sha256(files["p2"])
    sha4 = compute_media_sha256(files["p4"])

    # Identical bytes -> identical hash
    assert sha1 == sha2
    assert len(sha1) == 64

    # Different bytes -> distinct hash
    assert sha1 != sha4


def test_hashing_preserves_original_file(test_image_set):
    files = test_image_set
    orig_bytes = files["p1"].read_bytes()
    orig_mtime = files["p1"].stat().st_mtime_ns

    # Compute hash multiple times
    _ = compute_media_sha256(files["p1"])
    _ = compute_media_sha256(files["p1"])

    # Verify bytes and modification time remain untouched
    assert files["p1"].read_bytes() == orig_bytes
    assert files["p1"].stat().st_mtime_ns == orig_mtime


def test_image_asset_indexing(test_image_set):
    files = test_image_set
    asset = ImageAsset(
        artifact_id="ART_001",
        file_path=files["p1"],
        source_record_ids=["rec_alpha"],
        author_ids=["author_alpha"],
        source_datasets=["farmers_protest_tweets"],
    )

    assert asset.artifact_id == "ART_001"
    assert asset.byte_size > 0
    assert asset.media_sha256 is not None
    assert "phash" in asset.perceptual_hashes
    assert asset.is_valid_image is True
    assert asset.dimensions == (120, 120)


def test_find_image_matches_exact_and_perceptual(test_image_set):
    files = test_image_set
    asset1 = ImageAsset("ART_1", files["p1"], source_record_ids=["rec_1"])
    asset2 = ImageAsset("ART_2", files["p2"], source_record_ids=["rec_2"])
    asset3 = ImageAsset("ART_3", files["p3"], source_record_ids=["rec_3"])
    asset4 = ImageAsset("ART_4", files["p4"], source_record_ids=["rec_4"])

    catalog = [asset2, asset3, asset4]
    matches = find_image_matches(asset1, catalog, hamming_threshold=10)

    # Should detect exact byte match with ART_2
    assert matches["sha256_exact_match"] is True
    assert len(matches["exact_matches"]) == 1
    assert matches["exact_matches"][0]["matched_artifact_id"] == "ART_2"

    # Should detect perceptual match with ART_3 (resized copy)
    p_matched_ids = [pm["matched_artifact_id"] for pm in matches["perceptual_matches"]]
    assert "ART_3" in p_matched_ids
    # Should NOT match ART_4 (distinct content)
    assert "ART_4" not in p_matched_ids


def test_cross_match_historical_media(test_image_set):
    files = test_image_set
    asset1 = ImageAsset(
        "ART_1",
        files["p1"],
        source_record_ids=["rec_101"],
        author_ids=["user_alice"],
        source_datasets=["stream_a"],
        post_timestamps=["2021-04-01T12:00:00Z"],
    )
    asset2 = ImageAsset(
        "ART_2",
        files["p2"],
        source_record_ids=["rec_102"],
        author_ids=["user_bob"],
        source_datasets=["stream_b"],
        post_timestamps=["2021-04-01T12:03:00Z"],
    )
    asset3 = ImageAsset(
        "ART_3",
        files["p3"],
        source_record_ids=["rec_103"],
        author_ids=["user_charlie"],
        source_datasets=["stream_a"],
        post_timestamps=["2021-04-01T12:05:00Z"],
    )

    all_assets = [asset1, asset2, asset3]
    cross_links = cross_match_historical_media(all_assets, hamming_threshold=10)

    assert len(cross_links) >= 1
    # Check that exact match links user_alice and user_bob
    exact_links = [cl for cl in cross_links if cl.match_type == "exact_byte_match"]
    assert len(exact_links) == 1
    assert set(exact_links[0].account_ids) == {"user_alice", "user_bob"}
    assert set(exact_links[0].source_record_ids) == {"rec_101", "rec_102"}
    assert len(exact_links[0].limitations) > 0


def test_missing_file_sha256():
    with pytest.raises(FileNotFoundError):
        compute_media_sha256(Path("missing_file_xyz.png"))
