"""Unit tests for Synchronization and Coordination Detection (Module B).

Covers:
- Two different accounts posting identical normalized text inside the configured window
- Identical posts outside the configured window
- Similar timestamps but distinct text
- Shared URL relationships (safe normalization)
- Shared media relationships
- Observed reply/repost edges versus inferred synchronization edges
- Truncation diagnostic on large groups
"""

import pytest
from analytics.synchronization import (
    detect_coordination_edges,
    normalize_text_conservative,
    normalize_url_safely,
)


def test_text_normalization_conservative():
    # Retains key statement while removing links and mentions
    raw = "RT @someone: Urgent Protest Alert! Check details https://t.co/xyz123"
    norm = normalize_text_conservative(raw)
    assert norm == "urgent protest alert check details"

    # Empty or punctuation-only text
    assert normalize_text_conservative("   ") == ""
    assert normalize_text_conservative("??? !!!") == ""


def test_url_normalization_safely():
    # Strips utm_ params but keeps critical YouTube 'v' param
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&utm_medium=social"
    clean = normalize_url_safely(url)
    assert "youtube.com/watch?v=dQw4w9WgXcQ" in clean
    assert "utm_source" not in clean

    # Leaves regular URLs clean
    url2 = "http://example.com/reports/statement.pdf?id=42&ref=tw"
    clean2 = normalize_url_safely(url2)
    assert "example.com/reports/statement.pdf?id=42" in clean2
    assert "ref=tw" not in clean2


def test_identical_text_inside_and_outside_window():
    records = [
        # Account 1
        {
            "record_id": "rec_sync_1",
            "platform": "twitter",
            "author_id": "acct_1",
            "author_name": "one",
            "created_at": "2021-02-01T12:00:00Z",
            "text": "Coordinated statement for widespread distribution across networks #Alert",
        },
        # Account 2: identical text, 60 seconds later (INSIDE 300s window)
        {
            "record_id": "rec_sync_2",
            "platform": "twitter",
            "author_id": "acct_2",
            "author_name": "two",
            "created_at": "2021-02-01T12:01:00Z",
            "text": "Coordinated statement for widespread distribution across networks #Alert",
        },
        # Account 3: identical text, 2 days later (OUTSIDE 300s window)
        {
            "record_id": "rec_sync_3",
            "platform": "twitter",
            "author_id": "acct_3",
            "author_name": "three",
            "created_at": "2021-02-03T12:00:00Z",
            "text": "Coordinated statement for widespread distribution across networks #Alert",
        },
    ]

    edges, diag = detect_coordination_edges(records, sync_window_seconds=300)
    
    # Check edges between acct_1 and acct_2 (inside window)
    sync_edges = [
        e for e in edges
        if set([e.source_account_id, e.target_account_id]) == {"twitter:acct_1", "twitter:acct_2"}
        and e.edge_type == "similar_content"
    ]
    assert len(sync_edges) == 1
    edge_1_2 = sync_edges[0]
    assert edge_1_2.observed_or_inferred == "inferred"
    assert edge_1_2.weight == 0.9  # Higher weight for synchronized content
    assert "60.0s" in edge_1_2.explanation[1]

    # Check edges between acct_1 and acct_3 (outside window)
    outside_edges = [
        e for e in edges
        if set([e.source_account_id, e.target_account_id]) == {"twitter:acct_1", "twitter:acct_3"}
        and e.edge_type == "similar_content"
    ]
    assert len(outside_edges) == 1
    edge_1_3 = outside_edges[0]
    assert edge_1_3.weight == 0.6  # Lower weight due to long time difference (172800s)


def test_similar_timestamps_distinct_text():
    records = [
        {
            "record_id": "rec_time_1",
            "platform": "twitter",
            "author_id": "acct_A",
            "created_at": "2021-02-01T15:00:00Z",
            "text": "Completely unique text statement about local rainfall.",
        },
        {
            "record_id": "rec_time_2",
            "platform": "twitter",
            "author_id": "acct_B",
            "created_at": "2021-02-01T15:00:45Z",  # 45s later
            "text": "Unrelated discussion concerning sports championship results.",
        },
    ]

    edges, _ = detect_coordination_edges(records, sync_window_seconds=300)
    
    # Should only create a 'synchronized_post' temporal edge, NOT a 'similar_content' edge
    content_edges = [e for e in edges if e.edge_type == "similar_content"]
    assert len(content_edges) == 0

    time_edges = [e for e in edges if e.edge_type == "synchronized_post"]
    assert len(time_edges) == 1
    assert time_edges[0].method == "temporal_proximity_window"
    assert "45.0 seconds" in time_edges[0].explanation[0]


def test_observed_interactions_vs_inferred():
    records = [
        {
            "record_id": "rec_post_parent",
            "platform": "twitter",
            "post_id": "post_1001",
            "author_id": "author_X",
            "author_name": "alice_x",
            "created_at": "2021-02-01T10:00:00Z",
            "text": "Root announcement post",
        },
        {
            "record_id": "rec_reply_child",
            "platform": "twitter",
            "post_id": "post_1002",
            "author_id": "author_Y",
            "author_name": "bob_y",
            "created_at": "2021-02-01T10:05:00Z",
            "text": "Direct reply comment",
            "reply_to_id": "post_1001",
            "mentions": ["alice_x"],
        },
    ]

    edges, _ = detect_coordination_edges(records)

    observed = [e for e in edges if e.observed_or_inferred == "observed"]
    assert len(observed) >= 1

    reply_edge = next(e for e in observed if e.edge_type == "reply")
    assert reply_edge.source_account_id == "twitter:author_Y"
    assert reply_edge.target_account_id == "twitter:author_X"
    assert "rec_reply_child" in reply_edge.evidence_record_ids
    assert "rec_post_parent" in reply_edge.evidence_record_ids


def test_truncation_limit_on_large_group():
    # 50 accounts posting the exact same text
    records = [
        {
            "record_id": f"flood_rec_{i}",
            "platform": "twitter",
            "author_id": f"flood_user_{i}",
            "created_at": "2021-05-01T10:00:00Z",
            "text": "Identical copypasta message broadcast by fifty accounts simultaneously.",
        }
        for i in range(50)
    ]

    # Cap max comparisons at 10
    edges, diag = detect_coordination_edges(records, max_comparisons_per_bucket=10)
    assert len(diag["truncated_buckets"]) == 1
    assert diag["truncated_buckets"][0]["total_items"] == 50
    assert diag["truncated_buckets"][0]["max_comparisons_allowed"] == 10
