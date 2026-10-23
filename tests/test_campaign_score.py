"""Unit tests for Transparent Coordination Scoring (Module C).

Covers:
- Explainable heuristic score calculation
- Provisional screening labels: low_evidence, needs_review, elevated_coordination_signals, inconclusive
- Preserving evidence record IDs and limitations
- Uncalibrated heuristic type guarantee
"""

import pytest
from analytics.campaign_score import compute_account_coordination_scores
from dev3.schemas import AccountFeatures, CoordinationEdge
from dev3.config import Dev3Config


def test_coordination_scoring_inconclusive_empty():
    features = {
        "twitter:empty_user": AccountFeatures(
            account_id="twitter:empty_user",
            platform="twitter",
            author_name="empty",
            record_count=0,
        )
    }
    scores = compute_account_coordination_scores(features, [])
    res = scores["twitter:empty_user"]
    assert res.label == "inconclusive"
    assert res.score is None
    assert res.score_type == "heuristic"
    assert len(res.limitations) > 0


def test_coordination_scoring_elevated_signals():
    # Account with high repetition, synchronized edges, and bursts
    feat = AccountFeatures(
        account_id="twitter:coordinated_botnet_node",
        platform="twitter",
        author_name="botnet_node",
        record_count=10,
        max_burst_count=10,
        exact_text_repetition_ratio=0.8,
        repeated_url_ratio=0.7,
        media_attachment_ratio=0.5,
        evidence_record_ids=["ev_1", "ev_2", "ev_3"],
    )

    edges = [
        CoordinationEdge(
            source_account_id="twitter:coordinated_botnet_node",
            target_account_id=f"twitter:peer_{i}",
            edge_type="synchronized_post",
            evidence_record_ids=[f"ev_sync_{i}"],
            method="temporal_proximity_window",
            observed_or_inferred="inferred",
        )
        for i in range(5)
    ]

    scores = compute_account_coordination_scores({"twitter:coordinated_botnet_node": feat}, edges)
    res = scores["twitter:coordinated_botnet_node"]

    assert res.label == "elevated_coordination_signals"
    assert res.score is not None
    assert res.score >= 0.65
    assert res.score_type == "heuristic"
    assert "ev_1" in res.evidence_record_ids
    assert "ev_sync_0" in res.evidence_record_ids
    assert len(res.limitations) > 0


def test_coordination_scoring_low_evidence():
    feat = AccountFeatures(
        account_id="twitter:normal_user",
        platform="twitter",
        author_name="normal",
        record_count=10,
        max_burst_count=1,
        exact_text_repetition_ratio=0.0,
        repeated_url_ratio=0.0,
        media_attachment_ratio=0.1,
        evidence_record_ids=["norm_1"],
    )

    scores = compute_account_coordination_scores({"twitter:normal_user": feat}, [])
    res = scores["twitter:normal_user"]

    assert res.label == "low_evidence"
    assert res.score < 0.35
    assert res.score_type == "heuristic"
