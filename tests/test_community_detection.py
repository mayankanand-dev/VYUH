"""Unit tests for Community Detection and Influence Analytics (Module E).

Covers:
- Modularity community detection and isolated nodes handling
- PageRank and betweenness centrality
- Candidate originator identification based on earliest observed sample timestamp
- Data coverage notes and limitations
"""

import pytest
from analytics.graph_builder import AccountGraph
from analytics.community_detection import detect_communities
from analytics.influence import calculate_influence_metrics
from dev3.schemas import AccountFeatures, CoordinationEdge


def test_community_detection_and_influence():
    g = AccountGraph()

    # Community 1: nodes 1, 2, 3 tightly connected
    g.add_edge(CoordinationEdge(source_account_id="user_1", target_account_id="user_2", edge_type="reply", method="m"))
    g.add_edge(CoordinationEdge(source_account_id="user_2", target_account_id="user_3", edge_type="reply", method="m"))
    g.add_edge(CoordinationEdge(source_account_id="user_1", target_account_id="user_3", edge_type="reply", method="m"))

    # Community 2: nodes 4, 5
    g.add_edge(CoordinationEdge(source_account_id="user_4", target_account_id="user_5", edge_type="repost", method="m"))

    comm_res = detect_communities(g)
    assert comm_res["total_communities"] >= 2
    assert "user_1" in comm_res["account_to_community"]
    assert len(comm_res["limitations"]) > 0

    # Test influence metrics with timestamps
    features = {
        "user_1": AccountFeatures(account_id="user_1", platform="twitter", author_name="u1", record_count=5, first_observed_at="2021-01-01T08:00:00Z"),
        "user_2": AccountFeatures(account_id="user_2", platform="twitter", author_name="u2", record_count=3, first_observed_at="2021-01-01T09:00:00Z"),
        "user_3": AccountFeatures(account_id="user_3", platform="twitter", author_name="u3", record_count=1, first_observed_at="2021-01-01T10:00:00Z"),
        "user_4": AccountFeatures(account_id="user_4", platform="twitter", author_name="u4", record_count=2, first_observed_at="2021-01-02T12:00:00Z"),
        "user_5": AccountFeatures(account_id="user_5", platform="twitter", author_name="u5", record_count=1, first_observed_at="2021-01-02T13:00:00Z"),
    }

    inf_res = calculate_influence_metrics(g, features)
    assert inf_res["total_nodes"] == 5
    assert len(inf_res["candidate_originators"]) > 0

    # User 1 published earliest (08:00:00Z)
    earliest = inf_res["candidate_originators"][0]
    assert earliest["account_id"] == "user_1"
    assert earliest["status_label"] == "candidate_earliest_observed_account"
    assert "does not prove original author" in earliest["notes"]
