"""Community detection module for account networks.

Partitions account graphs into structural communities using modularity optimization.
Adheres to Section 3.E of Master Prompt:
- Provides reproducible community partitions
- Identifies component structures
- Accompanied by analytical limitations and data-coverage notes
"""

from typing import Any, Dict, List, Set
import networkx as nx
from analytics.graph_builder import AccountGraph


def detect_communities(
    graph: AccountGraph,
    include_inferred: bool = True,
    method: str = "greedy_modularity",
) -> Dict[str, Any]:
    """Detect structural communities across the account network.
    
    Args:
        graph: AccountGraph instance
        include_inferred: Whether to include inferred edges in community clustering
        method: 'greedy_modularity' or 'louvain'
        
    Returns:
        Dict with community partitions, sizes, top accounts, and limitations
    """
    if len(graph.nodes) == 0:
        return {
            "method": method,
            "version": "1.0.0",
            "total_communities": 0,
            "communities": [],
            "account_to_community": {},
            "limitations": ["Graph contains zero nodes; community detection skipped."],
        }

    # Convert to undirected graph for modularity optimization
    undirected_g = graph.to_networkx(
        include_observed=True,
        include_inferred=include_inferred,
        directed=False,
    )

    # Isolated nodes or graphs with no edges
    if undirected_g.number_of_edges() == 0:
        # Every node is its own community
        acct_map = {n: f"comm_{i}" for i, n in enumerate(undirected_g.nodes())}
        return {
            "method": "isolated_nodes_fallback",
            "version": "1.0.0",
            "total_communities": len(undirected_g.nodes()),
            "communities": [{"community_id": f"comm_{i}", "size": 1, "top_accounts": [n]} for i, n in enumerate(undirected_g.nodes())],
            "account_to_community": acct_map,
            "limitations": ["Graph has no active edges. Each node forms an isolated single-member partition."],
        }

    # Choose modularity algorithm
    community_sets: List[Set[str]] = []
    try:
        if method == "louvain" and hasattr(nx.community, "louvain_communities"):
            community_sets = list(nx.community.louvain_communities(undirected_g, weight="weight", seed=42))
        else:
            community_sets = list(nx.community.greedy_modularity_communities(undirected_g, weight="weight"))
    except Exception:
        # Fallback to connected components if modularity fails on unusual topology
        community_sets = list(nx.connected_components(undirected_g))

    account_to_community: Dict[str, str] = {}
    communities_summary: List[Dict[str, Any]] = []

    # Sort communities by size descending
    community_sets.sort(key=len, reverse=True)

    for idx, cset in enumerate(community_sets):
        comm_id = f"community_{idx + 1}"
        for node in cset:
            account_to_community[node] = comm_id

        # Rank top accounts in community by degree within the subgraph
        sub = undirected_g.subgraph(cset)
        degrees = dict(sub.degree())
        top_nodes = sorted(degrees.keys(), key=lambda n: degrees[n], reverse=True)[:5]

        communities_summary.append({
            "community_id": comm_id,
            "size": len(cset),
            "internal_edge_count": sub.number_of_edges(),
            "top_accounts": top_nodes,
        })

    return {
        "method": method,
        "version": "1.0.0",
        "total_communities": len(community_sets),
        "communities": communities_summary,
        "account_to_community": account_to_community,
        "limitations": [
            "Communities represent topological clustering in sampled data, not proof of offline coordination or ideological identity.",
            "Inferred edges (e.g. shared URLs or text) may link accounts across disparate groups discussing the same external event.",
        ],
    }
