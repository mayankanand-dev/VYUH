"""Transparent coordination scoring module.

Calculates an explainable multi-signal coordination heuristic across accounts
based on temporal synchronization, content repetition, shared URLs, shared media,
and network density.

Adheres strictly to Section 3.C and Section 4 of Master Prompt:
- Returns AnalysisResult schema conforming to Developer 1 interface
- Purely heuristic, never called a probability
- Configurable weights and provisional screening labels:
    * low_evidence
    * needs_review
    * elevated_coordination_signals
    * inconclusive
"""

from typing import Dict, List, Optional
from dev3.schemas import AnalysisResult, AccountFeatures, CoordinationEdge
from dev3.config import DEFAULT_CONFIG, Dev3Config


def compute_account_coordination_scores(
    features_by_account: Dict[str, AccountFeatures],
    edges: List[CoordinationEdge],
    config: Dev3Config = DEFAULT_CONFIG,
) -> Dict[str, AnalysisResult]:
    """Compute transparent multi-signal coordination scores for each observed account.
    
    Args:
        features_by_account: Dict mapping account_id -> AccountFeatures
        edges: All detected observed and inferred coordination edges
        config: Scoring configuration parameters
        
    Returns:
        Dict mapping account_id -> AnalysisResult
    """
    # Index incident edges by account
    edges_by_account: Dict[str, List[CoordinationEdge]] = {
        acct: [] for acct in features_by_account
    }
    for e in edges:
        if e.source_account_id in edges_by_account:
            edges_by_account[e.source_account_id].append(e)
        if e.target_account_id in edges_by_account:
            edges_by_account[e.target_account_id].append(e)

    results: Dict[str, AnalysisResult] = {}
    weights = config.coordination_weights

    for acct_id, feat in features_by_account.items():
        evidence_ids = list(feat.evidence_record_ids)
        incident_edges = edges_by_account.get(acct_id, [])

        # If account has very few records and zero edges, return inconclusive / low_evidence
        if feat.record_count == 0:
            results[acct_id] = AnalysisResult(
                entity_id=acct_id,
                task="coordination_campaign_screening",
                model_or_algorithm="vyuh_heuristic_coordination_scorer",
                version="1.0.0",
                label="inconclusive",
                score=None,
                score_type="heuristic",
                explanation=["Zero records observed for account."],
                evidence_record_ids=[],
                threshold=config.threshold_elevated,
                limitations=["Insufficient post coverage for statistical screening."],
            )
            continue

        # Collect distinct connected accounts from incident edges
        connected_accounts = set()
        for e in incident_edges:
            other = e.target_account_id if e.source_account_id == acct_id else e.source_account_id
            connected_accounts.add(other)
            for eid in e.evidence_record_ids:
                if eid not in evidence_ids:
                    evidence_ids.append(eid)

        # Signal 1: Synchronized posting score (0.0 to 1.0)
        sync_edges = [e for e in incident_edges if e.edge_type == "synchronized_post"]
        # Normalize by log of count or ratio
        sync_score = min(1.0, len(sync_edges) / max(3, feat.record_count))

        # Signal 2: Content repetition score
        content_rep_score = feat.exact_text_repetition_ratio

        # Signal 3: Shared URL score
        shared_url_score = feat.repeated_url_ratio

        # Signal 4: Shared media score
        media_edges = [e for e in incident_edges if e.edge_type == "shared_media"]
        shared_media_score = min(1.0, (len(media_edges) * 0.5) + (feat.media_attachment_ratio * 0.5))

        # Signal 5: Interaction density / burst score
        burst_ratio = (feat.max_burst_count / feat.record_count) if feat.record_count > 0 else 0.0
        interaction_density_score = min(1.0, burst_ratio)

        # Weighted combination
        raw_score = (
            weights.get("synchronized_posting", 0.25) * sync_score +
            weights.get("exact_repeated_content", 0.25) * content_rep_score +
            weights.get("shared_url", 0.20) * shared_url_score +
            weights.get("shared_media", 0.15) * shared_media_score +
            weights.get("interaction_density", 0.15) * interaction_density_score
        )
        combined_score = round(min(1.0, max(0.0, raw_score)), 4)

        # Cross-signal agreement check: count active signals (> 0.2)
        active_signals = sum([
            1 if sync_score > 0.2 else 0,
            1 if content_rep_score > 0.2 else 0,
            1 if shared_url_score > 0.2 else 0,
            1 if shared_media_score > 0.2 else 0,
            1 if interaction_density_score > 0.3 else 0,
        ])

        # Assign explainable label
        if combined_score >= config.threshold_elevated and active_signals >= 2:
            label = "elevated_coordination_signals"
        elif combined_score >= config.threshold_review:
            label = "needs_review"
        elif feat.record_count <= 1:
            label = "inconclusive"
        else:
            label = "low_evidence"

        explanations = [
            f"Combined heuristic coordination score: {combined_score} (thresholds: review>={config.threshold_review}, elevated>={config.threshold_elevated})",
            f"Signal contributions: sync_post={round(sync_score, 3)} (wt={weights.get('synchronized_posting')}), text_repeat={round(content_rep_score, 3)} (wt={weights.get('exact_repeated_content')}), shared_url={round(shared_url_score, 3)} (wt={weights.get('shared_url')}), shared_media={round(shared_media_score, 3)} (wt={weights.get('shared_media')}), burst/density={round(interaction_density_score, 3)} (wt={weights.get('interaction_density')})",
            f"Observed network connections: {len(connected_accounts)} distinct accounts via {len(incident_edges)} incident edges ({len(sync_edges)} synchronized)",
        ]

        limitations = [
            "Score is an uncalibrated investigative heuristic, not a statistical probability.",
            "High content repetition or burst posting can occur organically during breaking news or public campaigns.",
            "Historical sample data: does not establish real-world intent or automated bot status without human forensic verification.",
        ]

        results[acct_id] = AnalysisResult(
            entity_id=acct_id,
            task="coordination_campaign_screening",
            model_or_algorithm="vyuh_heuristic_coordination_scorer",
            version="1.0.0",
            label=label,
            score=combined_score,
            score_type="heuristic",
            explanation=explanations,
            evidence_record_ids=evidence_ids[:30],
            source_urls=[],
            threshold=config.threshold_elevated,
            limitations=limitations,
        )

    return results
