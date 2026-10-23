"""Deterministic offline tests for image digital forensics and ELA (Developer 3 Phase 3).

Covers:
- Image properties and metadata extraction
- EXIF metadata handling (present vs missing)
- Error Level Analysis (ELA) recompression and separate visualization generation
- Verification that original evidence is never altered
- Statistical consistency checks (near-uniform regions, extreme aspect ratios)
- Missing file and non-JPEG format handling
"""

from pathlib import Path
import pytest
from PIL import Image, ImageDraw

from media.image_forensics import (
    check_image_consistency,
    compute_jpeg_ela,
    extract_image_metadata,
    run_image_forensic_screening,
)


@pytest.fixture
def forensic_test_images(tmp_path: Path):
    """Generate diverse test images for forensic analysis."""
    # 1. Standard JPEG with textured patterns
    p_textured = tmp_path / "textured.jpg"
    im1 = Image.new("RGB", (200, 200), color=(255, 255, 255))
    draw1 = ImageDraw.Draw(im1)
    for x in range(0, 200, 10):
        draw1.line([(x, 0), (x, 200)], fill=(x % 255, 100, 150))
    im1.save(p_textured, format="JPEG", quality=95)

    # 2. Solid color banner (near-uniform canvas)
    p_uniform = tmp_path / "solid_canvas.png"
    im_uniform = Image.new("RGB", (300, 100), color=(50, 50, 50))
    im_uniform.save(p_uniform, format="PNG")

    # 3. Extreme aspect ratio image (e.g. 500x50 -> 10:1 ratio)
    p_extreme = tmp_path / "extreme_aspect.jpg"
    im_extreme = Image.new("RGB", (500, 50), color=(180, 180, 180))
    im_extreme.save(p_extreme, format="JPEG", quality=90)

    return {
        "p_textured": p_textured,
        "p_uniform": p_uniform,
        "p_extreme": p_extreme,
    }


def test_metadata_extraction_properties(forensic_test_images):
    files = forensic_test_images
    with Image.open(files["p_textured"]) as img:
        meta = extract_image_metadata(img)

    assert meta["width"] == 200
    assert meta["height"] == 200
    assert meta["format"] == "JPEG"
    assert meta["mode"] == "RGB"
    assert "aspect_ratio" in meta
    # Missing EXIF on generated image should be False
    assert meta["has_exif"] is False


def test_jpeg_ela_creates_separate_visualization(forensic_test_images, tmp_path: Path):
    files = forensic_test_images
    vis_dir = tmp_path / "derived_ela"

    orig_bytes = files["p_textured"].read_bytes()

    metrics, vis_path = compute_jpeg_ela(
        files["p_textured"],
        output_dir=vis_dir,
        artifact_id="TEST_ART_10",
        quality=90,
    )

    # Original evidence remains completely untouched
    assert files["p_textured"].read_bytes() == orig_bytes

    # Derived visualization saved in separate directory
    assert vis_path is not None
    assert vis_path.exists()
    assert vis_path.name == "TEST_ART_10_ela.png"
    assert vis_dir in vis_path.parents

    # Check metrics
    assert "mean_error_level" in metrics
    assert "max_error_level" in metrics
    assert metrics["quality_tested"] == 90
    assert len(metrics["limitations"]) > 0


def test_uniform_canvas_consistency_check(forensic_test_images):
    files = forensic_test_images
    with Image.open(files["p_uniform"]) as img:
        findings = check_image_consistency(img)

    labels = [f["label"] for f in findings]
    assert "near_uniform_image" in labels


def test_extreme_aspect_ratio_check(forensic_test_images):
    files = forensic_test_images
    with Image.open(files["p_extreme"]) as img:
        findings = check_image_consistency(img)

    labels = [f["label"] for f in findings]
    assert "extreme_aspect_ratio" in labels


def test_run_image_forensic_screening_contract(forensic_test_images, tmp_path: Path):
    files = forensic_test_images
    vis_dir = tmp_path / "screening_vis"

    report = run_image_forensic_screening(
        files["p_textured"],
        artifact_id="SCREEN_001",
        output_dir=vis_dir,
    )

    assert report["artifact_id"] == "SCREEN_001"
    assert len(report["forensic_findings"]) >= 2

    # Check finding fields conform to contract
    types = [ff.finding_type for ff in report["forensic_findings"]]
    assert "metadata_extraction" in types
    assert "ela_variation" in types

    for ff in report["forensic_findings"]:
        assert len(ff.explanation) > 0
        assert len(ff.limitations) > 0


def test_missing_image_forensic_screening():
    missing = Path("missing_image_9999.jpg")
    with pytest.raises(FileNotFoundError):
        run_image_forensic_screening(missing)
