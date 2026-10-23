"""Deterministic tests for multimedia schema contracts and Developer 1 interoperability (Developer 3 Phase 3).

Covers:
- Media inventory under missing, empty, and malformed media_reference inputs
- JSON serialization of MediaAnalysisResult and individual findings
- Developer 1 standard AnalysisResult mapping and schema adherence
- Model adapters returning 'not_configured'
- CrossPostMediaMatch schema compliance
- Preservation of canonical record IDs throughout all findings
"""

import json
from pathlib import Path
import pytest
from PIL import Image

from media.asset_loader import inventory_canonical_media, parse_media_reference
from media.model_adapters import AIGeneratedImageScreeningAdapter, VideoDeepfakeScreeningAdapter
from media.pipeline import analyze_media_asset, run_multimedia_pipeline
from media.schemas import CrossPostMediaMatch, MediaAnalysisResult, MediaInventoryItem


@pytest.fixture
def test_image_asset(tmp_path: Path) -> Path:
    img_path = tmp_path / "contract_sample.png"
    im = Image.new("RGB", (100, 100), color=(120, 140, 160))
    im.save(img_path)
    return img_path


def test_inventory_missing_and_empty_media_reference():
    records = [
        {"record_id": "rec_none", "media_reference": None},
        {"record_id": "rec_empty", "media_reference": []},
        {"record_id": "rec_empty_str", "media_reference": ""},
        {"record_id": "rec_empty_json", "media_reference": "[]"},
    ]
    inventory = inventory_canonical_media(records)
    # None of these should generate active inventory entries
    assert len(inventory) == 0


def test_inventory_malformed_media_reference():
    records = [
        {"record_id": "rec_bad", "media_reference": "{invalid_json_garbage}"},
    ]
    inventory = inventory_canonical_media(records)
    assert len(inventory) == 1
    assert inventory[0].analysis_status == "malformed_reference"
    assert inventory[0].source_record_id == "rec_bad"
    assert inventory[0].missing_data_reason is not None


def test_inventory_stringified_and_valid_references(tmp_path: Path):
    # Create matching local asset
    img_file = tmp_path / "pic1.jpg"
    img_file.write_bytes(b"\xFF\xD8\xFF\xE0" + b"\x00" * 50)

    records = [
        {
            "record_id": "rec_001",
            "post_id": "post_1001",
            "author_id": "user_alpha",
            "source_dataset": "farmers_protest_tweets",
            "media_reference": '[{"type": "photo", "fullUrl": "https://pbs.twimg.com/media/pic1.jpg"}]',
        },
        {
            "record_id": "rec_002",
            "post_id": "post_1002",
            "author_id": "user_beta",
            "source_dataset": "russian_ira_tweets",
            "media_reference": [{"type": "photo", "fullUrl": "https://pbs.twimg.com/media/remote_only.jpg"}],
        },
    ]

    inventory = inventory_canonical_media(records, media_dir=tmp_path)
    assert len(inventory) == 2

    # First record resolves local file pic1.jpg
    item1 = inventory[0]
    assert item1.source_record_id == "rec_001"
    assert item1.analysis_status == "available"
    assert item1.local_asset_path is not None
    assert item1.mime_type == "image/jpeg"

    # Second record has no local bytes
    item2 = inventory[1]
    assert item2.source_record_id == "rec_002"
    assert item2.analysis_status == "bytes_unavailable"
    assert item2.missing_data_reason is not None


def test_media_analysis_result_schema_and_serialization(test_image_asset: Path, tmp_path: Path):
    res = analyze_media_asset(
        asset_path=test_image_asset,
        artifact_id="CONTRACT_ART_1",
        source_record_ids=["rec_sample_999"],
        ocr_result_id="OCR_001",
        output_dir=tmp_path / "ela_dir",
    )

    # Validate schema fields
    assert res.artifact_id == "CONTRACT_ART_1"
    assert "rec_sample_999" in res.source_record_ids
    assert res.ocr_result_id == "OCR_001"
    assert res.media_sha256 is not None
    assert len(res.media_sha256) == 64
    assert res.requires_human_review is True
    assert len(res.limitations) > 0

    # Ensure JSON serializability
    dumped = res.model_dump()
    json_str = json.dumps(dumped)
    assert "CONTRACT_ART_1" in json_str
    assert "rec_sample_999" in json_str


def test_developer1_analysis_result_contract_mapping(test_image_asset: Path):
    res = analyze_media_asset(
        asset_path=test_image_asset,
        artifact_id="DEV1_TEST_ART",
        source_record_ids=["rec_orig_42"],
    )

    dev1_results = res.to_developer1_analysis_results()
    assert len(dev1_results) >= 1

    # Check each finding satisfies Developer 1 contract
    for f in dev1_results:
        assert f["entity_id"] == "DEV1_TEST_ART"
        assert f["task"] in ("image_forensics", "exact_media_matching", "perceptual_image_similarity")
        assert "model_or_algorithm" in f
        assert "version" in f
        assert "label" in f
        assert "score_type" in f
        assert isinstance(f["explanation"], list)
        assert len(f["explanation"]) > 0
        assert f["evidence_record_ids"] == ["rec_orig_42"]
        assert isinstance(f["limitations"], list)
        assert len(f["limitations"]) > 0
        assert "created_at" in f


def test_pretrained_model_adapters_not_configured():
    img_adapter = AIGeneratedImageScreeningAdapter()
    vid_adapter = VideoDeepfakeScreeningAdapter()

    img_res = img_adapter.screen_image(Path("dummy.png"))
    vid_res = vid_adapter.screen_video(Path("dummy.mp4"))

    assert img_res["status"] == "not_configured"
    assert img_res["score"] is None
    assert len(img_res["limitations"]) > 0

    assert vid_res["status"] == "not_configured"
    assert vid_res["score"] is None
    assert len(vid_res["limitations"]) > 0


def test_cross_post_media_match_schema():
    match = CrossPostMediaMatch(
        primary_artifact_id="ART_10",
        matched_artifact_id="ART_20",
        match_type="exact_byte_match",
        source_record_ids=["rec_1", "rec_2"],
        account_ids=["user_a", "user_b"],
        post_timestamps=["2021-04-01T12:00:00Z", "2021-04-01T12:02:00Z"],
        source_datasets=["farmers_protest_tweets", "russian_ira_tweets"],
        explanation=["Exact SHA-256 match found across posts"],
    )

    d = match.model_dump()
    assert d["primary_artifact_id"] == "ART_10"
    assert d["matched_artifact_id"] == "ART_20"
    assert len(d["account_ids"]) == 2
    assert len(d["limitations"]) > 0
