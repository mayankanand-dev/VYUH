"""Unit tests for Account Graph Construction (Module D).

Covers:
- Graphs with no edges or one node
- Separation of observed versus inferred edges
- Unresolved target diagnostics
- Degree and connected component summaries
- NetworkX conversion
"""

import pytest
from analytics.graph_builder import AccountGraph, build_account_graph
from dev3.schemas import AccountFeatures, CoordinationEdge


def test_empty_and_single_node_graph():
    g = AccountGraph()
    summary = g.get_summary()
    assert summary["total_nodes"] == 0
    assert summary["total_edges"] == 0
    assert summary["connected_components_count"] == 0

    g.add_node("twitter:lonely_node", author_name="lonely")
    summary1 = g.get_summary()
    assert summary1["total_nodes"] == 1
    assert summary1["total_edges"] == 0
    assert summary1["connected_components_count"] == 1
    assert summary1["average_degree"] == 0.0


def test_observed_vs_inferred_edge_separation():
    g = AccountGraph()
    g.add_node("twitter:acct_A")
    g.add_node("twitter:acct_B")

    # Observed edge
    e_obs = CoordinationEdge(
        source_account_id="twitter:acct_A",
        target_account_id="twitter:acct_B",
        edge_type="reply",
        weight=1.0,
        observed_or_inferred="observed",
        method="canonical_reply_to_id",
    )
    g.add_edge(e_obs)

    # Inferred edge
    e_inf = CoordinationEdge(
        source_account_id="twitter:acct_A",
        target_account_id="twitter:acct_B",
        edge_type="similar_content",
        weight=0.8,
        observed_or_inferred="inferred",
        method="exact_text_repetition",
    )
    g.add_edge(e_inf)

    assert len(g.observed_edges) == 1
    assert len(g.inferred_edges) == 1
    assert len(g.all_edges) == 2

    summary = g.get_summary()
    assert summary["observed_edge_count"] == 1
    assert summary["inferred_edge_count"] == 1
    assert summary["edge_breakdown_by_type"]["reply"] == 1
    assert summary["edge_breakdown_by_type"]["similar_content"] == 1


def test_unresolved_target_diagnostic():
    g = AccountGraph()
    g.record_unresolved_target(
        source_account_id="twitter:acct_A",
        target_ref="post_9999_missing_from_archive",
        relationship_type="reply_to_id",
        evidence_record_id="rec_broken_reply",
    )

    summary = g.get_summary()
    assert summary["unresolved_target_count"] == 1
    assert g.unresolved_targets[0]["target_ref"] == "post_9999_missing_from_archive"


def test_networkx_conversion():
    g = AccountGraph()
    g.add_edge(CoordinationEdge(
        source_account_id="twitter:u1",
        target_account_id="twitter:u2",
        edge_type="repost",
        observed_or_inferred="observed",
        method="retweet",
    ))

    # Test directed conversion
    di_g = g.to_networkx(directed=True)
    assert di_g.has_edge("twitter:u1", "twitter:u2")
    assert not di_g.has_edge("twitter:u2", "twitter:u1")

    # Test undirected conversion
    undir_g = g.to_networkx(directed=False)
    assert undir_g.has_edge("twitter:u2", "twitter:u1")
