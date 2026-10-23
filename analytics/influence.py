"""Influence and centrality analytics module.

Calculates degree centrality, directed in/out degrees, PageRank, and betweenness
centrality with performance-safe approximations on large graphs.
Identifies candidate earliest observed originators within the available sample.

Adheres strictly to Section 3.E of Master Prompt:
- Distinguishes sample influence from real-world platform influence
- Never asserts originators as proven culprits; labels them as candidate earliest observed sources
"""

from typing import Any, Dict, List, Optional
import networkx as nx
from analytics.graph_builder import AccountGraph
from dev3.schemas import AccountFeatures


def calculate_influence_metrics(
    graph: AccountGraph,
    features_by_account: Dict[str, AccountFeatures],
    max_betweenness_nodes: int = 150,
) -> Dict[str, Any]:
    """Calculate comprehensive influence, centrality, and candidate originators.
    
    Args:
        graph: AccountGraph instance
        features_by_account: Precomputed account features (for publication dates)
        max_betweenness_nodes: Threshold above which to approximate betweenness centrality
        
    Returns:
        Structured metrics report per account and across network
    """
    total_nodes = len(graph.nodes)
    if total_nodes == 0:
        return {
            "total_nodes": 0,
            "account_metrics": {},
            "candidate_originators": [],
            "limitations": ["Graph contains zero nodes."],
        }

    # 1. Build directed graph for direction-sensitive metrics (PageRank, in-degree, out-degree)
    di_g = graph.to_networkx(include_observed=True, include_inferred=True, directed=True)
    undirected_g = graph.to_networkx(include_observed=True, include_inferred=True, directed=False)

    # In-degree, out-degree, total degree
    in_deg = dict(di_g.in_degree())
    out_deg = dict(di_g.out_degree())
    weighted_deg = dict(undirected_g.degree(weight="weight"))

    # 2. PageRank
    pagerank_scores: Dict[str, float] = {}
    if di_g.number_of_edges() > 0:
        try:
            pagerank_scores = nx.pagerank(di_g, weight="weight", alpha=0.85, max_iter=200)
        except Exception:
            # Fallback uniform
            pagerank_scores = {n: 1.0 / total_nodes for n in di_g.nodes()}
    else:
        pagerank_scores = {n: 1.0 / total_nodes for n in di_g.nodes()}

    # 3. Betweenness Centrality (Approximation if graph is large)
    betweenness_scores: Dict[str, float] = {}
    approx_used = False
    if di_g.number_of_edges() > 0:
        try:
            if total_nodes > max_betweenness_nodes:
                approx_used = True
                k_sample = min(50, total_nodes)
                betweenness_scores = nx.betweenness_centrality(
                    undirected_g,
                    k=k_sample,
                    weight="weight",
                    seed=42
                )
            else:
                betweenness_scores = nx.betweenness_centrality(undirected_g, weight="weight")
        except Exception:
            betweenness_scores = {n: 0.0 for n in undirected_g.nodes()}
    else:
        betweenness_scores = {n: 0.0 for n in undirected_g.nodes()}

    # Compile account metrics
    account_metrics: Dict[str, Dict[str, Any]] = {}
    for node_id in graph.nodes:
        account_metrics[node_id] = {
            "in_degree": in_deg.get(node_id, 0),
            "out_degree": out_deg.get(node_id, 0),
            "total_degree": in_deg.get(node_id, 0) + out_deg.get(node_id, 0),
            "weighted_degree": round(weighted_deg.get(node_id, 0.0), 3),
            "pagerank": round(pagerank_scores.get(node_id, 0.0), 6),
            "betweenness_centrality": round(betweenness_scores.get(node_id, 0.0), 6),
        }

    # 4. Candidate originators identification
    # Find accounts that published earliest in the observation window
    candidate_originators: List[Dict[str, Any]] = []
    accounts_with_timestamps = [
        (acct_id, feat.first_observed_at, feat.record_count)
        for acct_id, feat in features_by_account.items()
        if feat.first_observed_at
    ]
    accounts_with_timestamps.sort(key=lambda x: x[1])

    for acct_id, first_ts, rec_count in accounts_with_timestamps[:5]:
        candidate_originators.append({
            "account_id": acct_id,
            "earliest_observed_timestamp": first_ts,
            "observed_record_count": rec_count,
            "network_total_degree": account_metrics.get(acct_id, {}).get("total_degree", 0),
            "pagerank": account_metrics.get(acct_id, {}).get("pagerank", 0.0),
            "status_label": "candidate_earliest_observed_account",
            "notes": "Earliest observed post in the sampled stream; does not prove original author or campaign instigation.",
        })

    # Rank top influencers by PageRank and weighted degree
    top_by_pagerank = sorted(
        [{"account_id": n, "pagerank": m["pagerank"], "degree": m["total_degree"]} for n, m in account_metrics.items()],
        key=lambda x: x["pagerank"],
        reverse=True
    )[:10]

    return {
        "total_nodes": total_nodes,
        "betweenness_approximation_used": approx_used,
        "top_by_pagerank": top_by_pagerank,
        "candidate_originators": candidate_originators,
        "account_metrics": account_metrics,
        "limitations": [
            "Centrality values reflect only the sampled historical dataset, not full platform topology.",
            "High PageRank or betweenness does not imply malicious activity, endorsement, or coordination.",
            "Candidate originators are strictly the earliest seen in this archive; earlier posts on live platforms may be uncaptured.",
        ],
    }
