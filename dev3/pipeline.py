"""Developer 3 End-to-End Analysis Pipeline and CLI Entry Point.

Executes:
1. Canonical stream ingestion and field validation
2. Account behavioural feature extraction
3. Multi-signal synchronization and coordination edge discovery
4. Account graph construction (observed vs inferred)
5. Modularity community detection and influence metrics
6. Behavioural anomaly screening
7. Transparent coordination campaign scoring
8. Evidence-supported geospatial analysis
9. Multimedia forensics for local assets
10. Optional OSINT username enumeration and candidate linkage
11. Standard contract JSONL outputs (graph_nodes, graph_edges, graph_degrees, coordination_findings)
12. Audit and reproducibility run summary

Adheres strictly to Sections 4, 5, and 10 of Master Prompt.
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import uuid
from typing import Any, Dict, Generator, List, Optional

from dev3.schemas import RunSummary, current_utc_iso
from dev3.config import DEFAULT_CONFIG, Dev3Config
from dev3.reporting import write_json, write_jsonl

from analytics.account_features import extract_account_features
from analytics.synchronization import detect_coordination_edges
from analytics.graph_builder import build_account_graph
from analytics.community_detection import detect_communities
from analytics.influence import calculate_influence_metrics
from analytics.anomaly_detection import screen_account_anomalies
from analytics.campaign_score import compute_account_coordination_scores
from analytics.geospatial import analyze_geospatial_activity
from media.unified_pipeline import analyze_media_asset
from osint.username_search import search_username_across_platforms
from osint.account_linkage import generate_candidate_account_links


def stream_canonical_records(
    file_path: Path,
    limit: Optional[int] = None,
) -> Generator[Dict[str, Any], None, None]:
    """Incrementally yield canonical JSONL records without loading entire stream into memory."""
    if not file_path.exists():
        raise FileNotFoundError(f"Canonical data file not found: {file_path}")

    yielded = 0
    with open(file_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, start=1):
            line_str = line.strip()
            if not line_str:
                continue
            try:
                record = json.loads(line_str)
            except Exception as ex:
                sys.stderr.write(f"[WARN] Malformed JSON on line {line_num}: {ex}\n")
                continue

            # Validate non-negotiable minimal contract
            if "record_id" not in record or not record["record_id"]:
                sys.stderr.write(f"[WARN] Missing record_id on line {line_num}; skipping.\n")
                continue

            yield record
            yielded += 1
            if limit and yielded >= limit:
                break


def run_dev3_pipeline(
    canonical_input_path: Path,
    output_dir: Path,
    limit: Optional[int] = None,
    sync_window_seconds: int = DEFAULT_CONFIG.sync_window_seconds,
    burst_window_seconds: int = DEFAULT_CONFIG.burst_window_seconds,
    media_dir: Optional[Path] = None,
    enable_osint: bool = False,
    osint_offline_mode: bool = True,
    dry_run: bool = False,
) -> Path:
    """Execute Dev 3 forensic and intelligence pipeline.
    
    Returns:
        Path to generated run directory
    """
    run_id = f"RUN_DEV3_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    run_dir = output_dir / run_id

    print(f"[INFO] Initializing VYUH Dev 3 Analysis Pipeline [{run_id}]")
    print(f"[INFO] Input: {canonical_input_path}")
    print(f"[INFO] Target run directory: {run_dir}")

    # Stage 1: Ingest & validate stream
    records = list(stream_canonical_records(canonical_input_path, limit=limit))
    total_records = len(records)
    print(f"[INFO] Successfully loaded and validated {total_records} canonical records.")

    if dry_run:
        print("[INFO] Dry run complete. Validated records without writing outputs.")
        return run_dir

    run_dir.mkdir(parents=True, exist_ok=True)

    # Stage 2: Account feature extraction
    print("[INFO] Extracting account behavioural features...")
    features = extract_account_features(records, burst_window_seconds=burst_window_seconds)
    features_list = list(features.values())
    write_jsonl(run_dir / "account_features.jsonl", features_list)
    print(f"       Extracted features for {len(features_list)} unique accounts.")

    # Stage 3: Coordination and synchronization edge discovery
    print("[INFO] Discovering coordination and synchronization edges...")
    edges, sync_diagnostics = detect_coordination_edges(
        records,
        sync_window_seconds=sync_window_seconds,
    )
    # Write both standard edge names for complete contract interoperability
    write_jsonl(run_dir / "coordination_edges.jsonl", edges)
    write_jsonl(run_dir / "graph_edges.jsonl", edges)
    print(f"       Found {len(edges)} total edges ({sync_diagnostics['observed_edge_count']} observed, {sync_diagnostics['inferred_edge_count']} inferred).")

    # Stage 4: Account graph construction
    print("[INFO] Building platform-scoped account network graph...")
    graph = build_account_graph(features, edges)
    graph_summary = graph.get_summary()
    write_json(run_dir / "graph_summary.json", graph_summary)

    # Stage 5: Community detection and influence analytics
    print("[INFO] Computing modularity communities and centrality influence...")
    communities_res = detect_communities(graph)
    influence_res = calculate_influence_metrics(graph, features)
    combined_network_analytics = {
        "communities": communities_res,
        "influence": influence_res,
    }
    write_json(run_dir / "communities_and_influence.json", combined_network_analytics)

    # Export graph_nodes.jsonl and graph_degrees.jsonl
    acct_to_comm = communities_res.get("account_to_community", {})
    acct_metrics = influence_res.get("account_metrics", {})

    graph_nodes = []
    graph_degrees = []
    for node_id, attrs in graph.nodes.items():
        metrics = acct_metrics.get(node_id, {})
        graph_nodes.append({
            "account_id": node_id,
            "platform": attrs.get("platform", "twitter"),
            "author_name": attrs.get("author_name", node_id),
            "record_count": attrs.get("record_count", 0),
            "community_id": acct_to_comm.get(node_id, "comm_unassigned"),
            "total_degree": metrics.get("total_degree", 0),
            "in_degree": metrics.get("in_degree", 0),
            "out_degree": metrics.get("out_degree", 0),
            "weighted_degree": metrics.get("weighted_degree", 0.0),
            "pagerank": metrics.get("pagerank", 0.0),
            "betweenness_centrality": metrics.get("betweenness_centrality", 0.0),
        })
        graph_degrees.append({
            "account_id": node_id,
            "in_degree": metrics.get("in_degree", 0),
            "out_degree": metrics.get("out_degree", 0),
            "total_degree": metrics.get("total_degree", 0),
            "weighted_degree": metrics.get("weighted_degree", 0.0),
        })

    write_jsonl(run_dir / "graph_nodes.jsonl", graph_nodes)
    write_jsonl(run_dir / "graph_degrees.jsonl", graph_degrees)

    # Stage 6: Behavioural anomaly screening
    print("[INFO] Screening behavioural cadence and content anomalies...")
    anomaly_results = screen_account_anomalies(features)
    anomaly_list = list(anomaly_results.values())
    write_jsonl(run_dir / "account_anomalies.jsonl", anomaly_list)

    # Stage 7: Coordination campaign scoring
    print("[INFO] Computing transparent multi-signal campaign scores...")
    coordination_scores = compute_account_coordination_scores(features, edges)
    score_list = list(coordination_scores.values())
    # Write both coordination_scores.jsonl and coordination_findings.jsonl
    write_jsonl(run_dir / "coordination_scores.jsonl", score_list)
    write_jsonl(run_dir / "coordination_findings.jsonl", score_list)

    # Stage 8: Geospatial analysis
    print("[INFO] Performing evidence-supported geospatial activity screening...")
    geo_results = analyze_geospatial_activity(records)
    write_json(run_dir / "geospatial_analysis.json", geo_results)
    print(f"       Spatial status: {geo_results.status} (coverage: {geo_results.coverage_ratio * 100:.2f}%)")

    # Stage 9: Multimedia pipeline (for local assets)
    media_results = []
    if media_dir and media_dir.exists():
        print(f"[INFO] Screening local multimedia assets in {media_dir}...")
        media_files = [p for p in media_dir.iterdir() if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".mp4")]
        for mf in media_files:
            m_res = analyze_media_asset(mf)
            media_results.append(m_res)
    write_jsonl(run_dir / "media_analysis.jsonl", media_results)

    # Stage 10: OSINT username enumeration (optional)
    osint_findings = []
    account_links = []
    if enable_osint:
        print("[INFO] Executing OSINT username search and linkage (offline mode: %s)..." % osint_offline_mode)
        # Select top 5 active accounts
        top_accounts = sorted(features.values(), key=lambda a: a.record_count, reverse=True)[:5]
        for acct in top_accounts:
            findings = search_username_across_platforms(
                acct.author_name,
                offline_mode=osint_offline_mode,
            )
            osint_findings.extend(findings)
        account_links = generate_candidate_account_links(osint_findings)
    write_jsonl(run_dir / "osint_findings.jsonl", osint_findings)
    write_jsonl(run_dir / "candidate_account_links.jsonl", account_links)

    # Compile Run Summary
    output_counts = {
        "input_records": total_records,
        "account_nodes": len(graph_nodes),
        "graph_nodes": len(graph_nodes),
        "graph_edges": len(edges),
        "graph_degrees": len(graph_degrees),
        "account_features": len(features_list),
        "coordination_edges": len(edges),
        "coordination_scores": len(score_list),
        "coordination_findings": len(score_list),
        "observed_edges": sync_diagnostics["observed_edge_count"],
        "inferred_edges": sync_diagnostics["inferred_edge_count"],
        "unresolved_targets": graph_summary.get("unresolved_target_count", 0),
        "communities": communities_res.get("total_communities", 0),
        "anomalous_accounts_screened": len(anomaly_list),
        "media_assets_analyzed": len(media_results),
        "osint_findings": len(osint_findings),
        "candidate_account_links": len(account_links),
    }

    run_summary = RunSummary(
        run_id=run_id,
        executed_at=current_utc_iso(),
        parameters={
            "input_file": str(canonical_input_path),
            "record_limit": limit,
            "sync_window_seconds": sync_window_seconds,
            "burst_window_seconds": burst_window_seconds,
            "media_dir": str(media_dir) if media_dir else None,
            "enable_osint": enable_osint,
            "osint_offline_mode": osint_offline_mode,
        },
        versions={
            "pipeline": "1.0.0",
            "schema_contract": "1.0",
            "networkx": "3.x",
            "imagehash": "4.3.2",
            "scikit_learn": "1.5.2",
        },
        input_records_count=total_records,
        output_counts=output_counts,
        limitations=[
            "All coordination and anomaly scores are uncalibrated investigative heuristics, not statistical probabilities.",
            "Historical archive data: represents a discrete temporal sample, not live platform activity.",
            "Absence of external OSINT or media findings does not prove negative presence on unprobed services.",
            "All findings require manual human validation prior to operational or regulatory escalation.",
        ],
    )
    write_json(run_dir / "run_summary.json", run_summary)
    print(f"[SUCCESS] Run completed successfully. Outputs written to {run_dir}")
    return run_dir


def main() -> None:
    """CLI Entry Point."""
    parser = argparse.ArgumentParser(
        description="VYUH Developer 3: OSINT, Graph Intelligence, Coordination and Multimedia Forensics"
    )
    parser.add_argument(
        "-i", "--input",
        type=Path,
        default=Path("data/normalized/canonical_fixture_1000.jsonl"),
        help="Path to canonical JSONL input file",
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("runs"),
        help="Base directory to store run outputs",
    )
    parser.add_argument(
        "-l", "--limit",
        type=int,
        default=None,
        help="Maximum records to process from input file",
    )
    parser.add_argument(
        "-w", "--window-seconds",
        type=int,
        default=DEFAULT_CONFIG.sync_window_seconds,
        help="Temporal synchronization window in seconds (default: 300)",
    )
    parser.add_argument(
        "-b", "--burst-window",
        type=int,
        default=DEFAULT_CONFIG.burst_window_seconds,
        help="Burst activity window in seconds (default: 600)",
    )
    parser.add_argument(
        "-m", "--media-dir",
        type=Path,
        default=None,
        help="Optional directory containing local media assets to analyze",
    )
    parser.add_argument(
        "--enable-osint",
        action="store_true",
        help="Enable OSINT username search and candidate account linkage",
    )
    parser.add_argument(
        "--live-osint",
        action="store_true",
        help="Enable live HTTP OSINT probes (default is safe offline mock)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate canonical input records without generating output files",
    )

    args = parser.parse_args()

    try:
        run_dev3_pipeline(
            canonical_input_path=args.input,
            output_dir=args.output_dir,
            limit=args.limit,
            sync_window_seconds=args.window_seconds,
            burst_window_seconds=args.burst_window,
            media_dir=args.media_dir,
            enable_osint=args.enable_osint,
            osint_offline_mode=not args.live_osint,
            dry_run=args.dry_run,
        )
    except Exception as ex:
        sys.stderr.write(f"\n[ERROR] Pipeline execution failed: {ex}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
