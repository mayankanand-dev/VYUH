"""Account graph construction module.

Constructs typed, platform-scoped account graphs separating observed interactions
(replies, retweets, mentions) from inferred analytical edges (synchronization, shared URLs,
shared media, content similarity).

Adheres strictly to Section 3.D of Master Prompt:
- Distinguishes observed graph relationships from inferred similarities
- Preserves unresolved target diagnostics
- Provides reusable graph summaries (degree distributions, components)
- Converts to NetworkX MultiDiGraph for downstream analytics
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx

from dev3.schemas import CoordinationEdge, AccountFeatures


class AccountGraph:
    """Multi-edge platform-scoped account network graph."""

    def __init__(self) -> None:
        self.nodes: Dict[str, Dict[str, Any]] = {}  # account_id -> node attributes
        self.observed_edges: List[CoordinationEdge] = []
        self.inferred_edges: List[CoordinationEdge] = []
        self.unresolved_targets: List[Dict[str, Any]] = []

    def add_node(self, account_id: str, **attributes: Any) -> None:
        """Register an account node with platform attributes."""
        if account_id not in self.nodes:
            self.nodes[account_id] = {
                "account_id": account_id,
                "platform": attributes.get("platform", "twitter"),
                "author_name": attributes.get("author_name", account_id),
                "record_count": attributes.get("record_count", 0),
            }
        else:
            self.nodes[account_id].update(attributes)

    def add_edge(self, edge: CoordinationEdge) -> None:
        """Add a typed coordination edge, ensuring nodes exist."""
        # Ensure source and target nodes are in the graph
        if edge.source_account_id not in self.nodes:
            self.add_node(edge.source_account_id)
        if edge.target_account_id not in self.nodes:
            self.add_node(edge.target_account_id)

        if edge.observed_or_inferred == "observed":
            self.observed_edges.append(edge)
        else:
            self.inferred_edges.append(edge)

    def record_unresolved_target(
        self,
        source_account_id: str,
        target_ref: str,
        relationship_type: str,
        evidence_record_id: str,
    ) -> None:
        """Record an explicit diagnostic when a reply/repost target cannot be resolved."""
        self.unresolved_targets.append({
            "source_account_id": source_account_id,
            "target_ref": target_ref,
            "relationship_type": relationship_type,
            "evidence_record_id": evidence_record_id,
        })

    @property
    def all_edges(self) -> List[CoordinationEdge]:
        """Return combined list of observed and inferred edges."""
        return self.observed_edges + self.inferred_edges

    def get_summary(self) -> Dict[str, Any]:
        """Compute structured topological graph summaries."""
        total_nodes = len(self.nodes)
        total_observed = len(self.observed_edges)
        total_inferred = len(self.inferred_edges)

        # Build in-memory degree maps
        in_degrees: Dict[str, int] = defaultdict(int)
        out_degrees: Dict[str, int] = defaultdict(int)
        weighted_degrees: Dict[str, float] = defaultdict(float)

        # For connected components, use an undirected projection
        nx_proj = nx.Graph()
        for nid in self.nodes:
            nx_proj.add_node(nid)

        for e in self.observed_edges:
            out_degrees[e.source_account_id] += 1
            in_degrees[e.target_account_id] += 1
            weighted_degrees[e.source_account_id] += e.weight
            weighted_degrees[e.target_account_id] += e.weight
            nx_proj.add_edge(e.source_account_id, e.target_account_id)

        for e in self.inferred_edges:
            out_degrees[e.source_account_id] += 1
            in_degrees[e.target_account_id] += 1
            weighted_degrees[e.source_account_id] += e.weight
            weighted_degrees[e.target_account_id] += e.weight
            nx_proj.add_edge(e.source_account_id, e.target_account_id)

        # Connected components on overall graph
        components = list(nx.connected_components(nx_proj))
        component_sizes = [len(c) for c in components]
        component_sizes.sort(reverse=True)

        # Degree statistics
        all_degrees = [in_degrees[n] + out_degrees[n] for n in self.nodes]
        avg_degree = round(sum(all_degrees) / total_nodes, 2) if total_nodes > 0 else 0.0
        max_degree = max(all_degrees) if all_degrees else 0

        # Top 10 accounts by weighted degree
        top_accounts = sorted(
            [{"account_id": n, "weighted_degree": round(weighted_degrees[n], 2), "total_degree": in_degrees[n] + out_degrees[n]} for n in self.nodes],
            key=lambda x: x["weighted_degree"],
            reverse=True
        )[:10]

        return {
            "total_nodes": total_nodes,
            "total_edges": total_observed + total_inferred,
            "observed_edge_count": total_observed,
            "inferred_edge_count": total_inferred,
            "unresolved_target_count": len(self.unresolved_targets),
            "connected_components_count": len(components),
            "largest_component_size": component_sizes[0] if component_sizes else 0,
            "average_degree": avg_degree,
            "max_degree": max_degree,
            "top_connected_accounts": top_accounts,
            "edge_breakdown_by_type": self._get_edge_type_breakdown(),
        }

    def _get_edge_type_breakdown(self) -> Dict[str, int]:
        counts: Dict[str, int] = defaultdict(int)
        for e in self.all_edges:
            counts[e.edge_type] += 1
        return dict(counts)

    def to_networkx(
        self,
        include_observed: bool = True,
        include_inferred: bool = True,
        directed: bool = True,
    ) -> nx.Graph:
        """Convert account graph to a NetworkX Graph or DiGraph.
        
        Args:
            include_observed: Include observed interaction edges
            include_inferred: Include inferred analytical edges
            directed: Return DiGraph if True, else Graph
        """
        g = nx.DiGraph() if directed else nx.Graph()

        # Add nodes with metadata
        for nid, attrs in self.nodes.items():
            g.add_node(nid, **attrs)

        edges_to_add: List[CoordinationEdge] = []
        if include_observed:
            edges_to_add.extend(self.observed_edges)
        if include_inferred:
            edges_to_add.extend(self.inferred_edges)

        for e in edges_to_add:
            if g.has_edge(e.source_account_id, e.target_account_id):
                # Accumulate weight
                g[e.source_account_id][e.target_account_id]["weight"] += e.weight
            else:
                g.add_edge(
                    e.source_account_id,
                    e.target_account_id,
                    weight=e.weight,
                    edge_type=e.edge_type,
                    observed_or_inferred=e.observed_or_inferred,
                    evidence_record_ids=e.evidence_record_ids,
                )

        return g


def build_account_graph(
    features_by_account: Dict[str, AccountFeatures],
    coordination_edges: List[CoordinationEdge],
) -> AccountGraph:
    """Build an AccountGraph instance from precomputed features and detected edges."""
    graph = AccountGraph()

    for acct_id, feat in features_by_account.items():
        graph.add_node(
            acct_id,
            platform=feat.platform,
            author_name=feat.author_name,
            record_count=feat.record_count,
        )

    for edge in coordination_edges:
        graph.add_edge(edge)

    return graph
