"""Phase 2 Dedicated Validation Tests for Coordination Synchronization and Graph Contracts.

Strictly verifies the 8 specific test cases required by Phase 2:
1. Two distinct accounts publish identical normalized text within 5 min (300s).
2. Identical posts published outside configured window.
3. Two accounts publish unrelated text at nearly identical times.
4. One account repeats its own content (verifying zero self-edges).
5. Two accounts share a URL within configured window.
6. Timestamps are missing or malformed.
7. A large group publishes the same text (scalability limits and truncation).
8. Text or account identifiers are empty.

Also validates:
- Graph construction for 0-node and 1-node graphs
- Strict separation of observed vs inferred edges
- Unresolved targets not linked to arbitrary accounts
- Preservation of evidence record IDs.
"""

import pytest
from analytics.synchronization import detect_coordination_edges
from analytics.account_features import extract_account_features, resolve_account_key
from analytics.graph_builder import AccountGraph, build_account_graph
from analytics.community_detection import detect_communities
from analytics.influence import calculate_influence_metrics
from analytics.campaign_score import compute_account_coordination_scores
from dev3.config import Dev3Config


def test_case_1_distinct_accounts_identical_text_within_5min():
    """Case 1: Two distinct accounts publish identical normalized text within 5 min."""
    records = [
        {
            "record_id": "r1",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "2021-03-01T12:00:00Z",
            "text": "Coordinated campaign announcement text #Alert",
        },
        {
            "record_id": "r2",
            "platform": "twitter",
            "author_id": "user_beta",
            "created_at": "2021-03-01T12:03:30Z",  # 210 seconds later (<= 300s)
            "text": "Coordinated campaign announcement text #Alert",
        },
    ]
    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    matching = [e for e in edges if e.edge_type == "similar_content"]
    assert len(matching) == 1
    edge = matching[0]
    assert edge.observed_or_inferred == "inferred"
    assert edge.weight == 0.9  # synchronized weight
    assert set(edge.evidence_record_ids) == {"r1", "r2"}
    assert "210.0s" in edge.explanation[1]


def test_case_2_identical_posts_outside_configured_window():
    """Case 2: Identical posts published outside configured window."""
    records = [
        {
            "record_id": "r1",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "2021-03-01T12:00:00Z",
            "text": "Statement published days apart #Notice",
        },
        {
            "record_id": "r2",
            "platform": "twitter",
            "author_id": "user_beta",
            "created_at": "2021-03-04T12:00:00Z",  # 3 days later
            "text": "Statement published days apart #Notice",
        },
    ]
    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    matching = [e for e in edges if e.edge_type == "similar_content"]
    assert len(matching) == 1
    edge = matching[0]
    assert edge.observed_or_inferred == "inferred"
    assert edge.weight == 0.6  # relaxed async weight
    assert "259200.0s" in edge.explanation[1]


def test_case_3_unrelated_text_at_nearly_identical_times():
    """Case 3: Two accounts publish unrelated text at nearly identical times."""
    records = [
        {
            "record_id": "r1",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "2021-03-01T12:00:00Z",
            "text": "Discussing agricultural harvest yields and weather updates.",
        },
        {
            "record_id": "r2",
            "platform": "twitter",
            "author_id": "user_beta",
            "created_at": "2021-03-01T12:00:15Z",  # 15s later, completely distinct text
            "text": "Reviewing soccer tournament qualification results.",
        },
    ]
    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    # Must NOT produce similar_content edge
    assert len([e for e in edges if e.edge_type == "similar_content"]) == 0
    # Must produce temporal synchronization edge
    sync_edges = [e for e in edges if e.edge_type == "synchronized_post"]
    assert len(sync_edges) == 1
    assert sync_edges[0].method == "temporal_proximity_window"
    assert "15.0 seconds" in sync_edges[0].explanation[0]


def test_case_4_one_account_repeats_its_own_content_no_self_edges():
    """Case 4: One account repeats its own content (verify ZERO self-edges)."""
    records = [
        {
            "record_id": "r1",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "2021-03-01T12:00:00Z",
            "text": "Repeated post broadcast by user alpha multiple times.",
            "urls": ["https://example.com/same-url"],
            "media_reference": [{"fullUrl": "https://example.com/same-media.jpg"}],
        },
        {
            "record_id": "r2",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "2021-03-01T12:01:00Z",
            "text": "Repeated post broadcast by user alpha multiple times.",
            "urls": ["https://example.com/same-url"],
            "media_reference": [{"fullUrl": "https://example.com/same-media.jpg"}],
        },
    ]
    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    # Self edges must be strictly ZERO
    for e in edges:
        assert e.source_account_id != e.target_account_id
    assert len(edges) == 0


def test_case_5_two_accounts_share_url_within_window():
    """Case 5: Two accounts share a URL within the configured window."""
    records = [
        {
            "record_id": "r1",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "2021-03-01T12:00:00Z",
            "urls": ["https://news.example.com/article?id=123&utm_source=twitter"],
        },
        {
            "record_id": "r2",
            "platform": "twitter",
            "author_id": "user_beta",
            "created_at": "2021-03-01T12:04:00Z",  # 240 seconds later
            "urls": ["https://news.example.com/article?id=123&utm_campaign=winter"],
        },
    ]
    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    url_edges = [e for e in edges if e.edge_type == "shared_url"]
    assert len(url_edges) == 1
    edge = url_edges[0]
    assert edge.observed_or_inferred == "inferred"
    assert "article?id=123" in edge.explanation[0]
    assert "240.0s" in edge.explanation[1]


def test_case_6_timestamps_missing_or_malformed():
    """Case 6: Timestamps are missing or malformed."""
    records = [
        {
            "record_id": "r1",
            "platform": "twitter",
            "author_id": "user_alpha",
            "created_at": "malformed_timestamp_string",
            "text": "Identical text content with broken timestamps.",
        },
        {
            "record_id": "r2",
            "platform": "twitter",
            "author_id": "user_beta",
            "created_at": None,
            "text": "Identical text content with broken timestamps.",
        },
    ]
    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    # Should safely create content match without crashing on None timedelta
    matching = [e for e in edges if e.edge_type == "similar_content"]
    assert len(matching) == 1
    edge = matching[0]
    assert "No timestamp available" in edge.explanation[1]


def test_case_7_large_group_same_text_truncation():
    """Case 7: A large group publishes the same text (scalability limit enforced)."""
    # 40 accounts posting identical text
    records = [
        {
            "record_id": f"large_rec_{i}",
            "platform": "twitter",
            "author_id": f"user_batch_{i}",
            "created_at": "2021-03-01T12:00:00Z",
            "text": "Viral meme copypasta statement distributed across many accounts.",
        }
        for i in range(40)
    ]
    # Cap comparisons to 25
    edges, diag = detect_coordination_edges(records, max_comparisons_per_bucket=25)
    assert len(diag["truncated_buckets"]) == 1
    assert diag["truncated_buckets"][0]["max_comparisons_allowed"] == 25
    assert diag["truncated_buckets"][0]["total_items"] == 40
    # Edges produced should not exceed pairwise limit
    assert len([e for e in edges if e.edge_type == "similar_content"]) <= 26


def test_case_8_empty_text_and_empty_author_identifiers():
    """Case 8: Text or account identifiers are empty."""
    records = [
        {
            "record_id": "r_empty_1",
            "platform": "twitter",
            "author_id": "",
            "author_name": None,
            "created_at": "2021-03-01T12:00:00Z",
            "text": "",  # Empty text
        },
        {
            "record_id": "r_empty_2",
            "platform": "twitter",
            "author_id": None,
            "author_name": "unknown",
            "created_at": "2021-03-01T12:00:00Z",
            "text": "   ",  # Whitespace only
        },
    ]
    # Must not crash, must not generate content edges
    edges, _ = detect_coordination_edges(records)
    content_edges = [e for e in edges if e.edge_type == "similar_content"]
    assert len(content_edges) == 0

    # Ensure accounts were not grouped together under "unknown"
    features = extract_account_features(records)
    assert len(features) == 2
    keys = list(features.keys())
    assert keys[0] != keys[1]
    assert "unresolved:r_empty_1" in keys[0]
    assert "unresolved:r_empty_2" in keys[1]


def test_isolated_and_single_node_graphs():
    """Graph construction on empty and 1-node graphs."""
    g0 = AccountGraph()
    comm0 = detect_communities(g0)
    assert comm0["total_communities"] == 0

    inf0 = calculate_influence_metrics(g0, {})
    assert inf0["total_nodes"] == 0

    # 1-node graph with no edges
    g1 = AccountGraph()
    g1.add_node("twitter:solo", author_name="solo")
    comm1 = detect_communities(g1)
    assert comm1["total_communities"] == 1
    assert "twitter:solo" in comm1["account_to_community"]

    inf1 = calculate_influence_metrics(g1, {})
    assert inf1["total_nodes"] == 1
    assert inf1["account_metrics"]["twitter:solo"]["pagerank"] == 1.0
