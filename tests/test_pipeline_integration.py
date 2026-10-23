"""End-to-end integration tests for Developer 3 Pipeline.

Covers:
- Full pipeline execution against synthetic and fixture JSONL
- Stable reproducible serialization of all output files
- Audit trail in run_summary.json
- Verifying source record IDs retained across all findings
"""

import json
from pathlib import Path
import pytest
from dev3.pipeline import run_dev3_pipeline


@pytest.fixture
def synthetic_canonical_file(tmp_path: Path) -> Path:
    """Create a temporary synthetic canonical JSONL dataset."""
    file_path = tmp_path / "synthetic_canonical.jsonl"
    records = [
        {
            "record_id": f"syn_{i}",
            "platform": "twitter",
            "record_type": "post",
            "post_id": f"1000{i}",
            "author_id": f"syn_user_{i % 3}",
            "author_name": f"user_{i % 3}",
            "author_display_name": f"User {i % 3}",
            "text": "Universal shared campaign announcement message." if i < 4 else f"Unique text post {i}",
            "language": "en",
            "created_at": f"2021-04-01T12:0{i % 5}:00Z",
            "collected_at": "2026-10-23T12:00:00Z",
            "hashtags": ["TestCampaign"],
            "mentions": [],
            "urls": ["https://example.org/alert?id=1"],
            "media_reference": [],
            "engagement": {"likes": 5, "retweets": 2},
            "source_dataset": "synthetic_test_stream",
            "collection_run_id": "SYN_RUN_001",
            "raw_record_reference": f"synthetic.csv#{i}",
            "schema_version": "1.0",
            "data_mode": "historical",
            "metadata": {"user_location": "New Delhi, India"},
        }
        for i in range(10)
    ]

    with open(file_path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")

    return file_path


def test_full_dev3_pipeline_execution(synthetic_canonical_file: Path, tmp_path: Path):
    output_base = tmp_path / "test_runs"
    run_dir = run_dev3_pipeline(
        canonical_input_path=synthetic_canonical_file,
        output_dir=output_base,
        sync_window_seconds=300,
        enable_osint=True,
        osint_offline_mode=True,
    )

    assert run_dir.exists()
    assert (run_dir / "run_summary.json").exists()
    assert (run_dir / "account_features.jsonl").exists()
    assert (run_dir / "coordination_edges.jsonl").exists()
    assert (run_dir / "coordination_scores.jsonl").exists()
    assert (run_dir / "graph_summary.json").exists()
    assert (run_dir / "communities_and_influence.json").exists()
    assert (run_dir / "account_anomalies.jsonl").exists()
    assert (run_dir / "geospatial_analysis.json").exists()
    assert (run_dir / "osint_findings.jsonl").exists()

    # Verify run_summary content
    with open(run_dir / "run_summary.json", "r", encoding="utf-8") as f:
        summary = json.load(f)
        assert summary["input_records_count"] == 10
        assert summary["output_counts"]["account_features"] == 3
        assert summary["output_counts"]["coordination_scores"] == 3

    # Verify evidence IDs retained in coordination scores
    with open(run_dir / "coordination_scores.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            item = json.loads(line)
            assert "evidence_record_ids" in item
            assert len(item["evidence_record_ids"]) > 0
            assert "syn_" in item["evidence_record_ids"][0]
