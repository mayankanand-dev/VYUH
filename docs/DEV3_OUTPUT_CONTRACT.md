# VYUH — Developer 3 Output Contracts & Integration Specification

**Specification Version**: 1.0  
**Data Standards**: ISO/IEC 27037 & BSA Section 63  
**Target Consumers**:
1. **Developer 1**: Investigation Dashboard, Case Export, Evidence Package & Timeline integration.
2. **Frontend UI**: Social Signal Lab (Graph visualizer, account profile cards, risk alerts).

---

## 1. Primary Analysis Result Schema (`AnalysisResult`)

All scoring outputs (`coordination_scores.jsonl`, `account_anomalies.jsonl`) conform strictly to the standard Developer 1 `AnalysisResult` contract:

```json
{
  "entity_id": "twitter:1015969769760096384",
  "task": "coordination_campaign_screening",
  "model_or_algorithm": "vyuh_heuristic_coordination_scorer",
  "version": "1.0.0",
  "label": "needs_review",
  "score": 0.40,
  "score_type": "heuristic",
  "explanation": [
    "Combined heuristic coordination score: 0.4 (thresholds: review>=0.35, elevated>=0.65)",
    "Signal contributions: sync_post=1.0, text_repeat=0.0, shared_url=0.0, shared_media=0.0, burst/density=1.0",
    "Observed network connections: 6 distinct accounts via 6 incident edges (6 synchronized)"
  ],
  "evidence_record_ids": [
    "fp_1376739399593910273",
    "fp_1376738155110395904"
  ],
  "source_urls": [],
  "threshold": 0.65,
  "created_at": "2026-10-23T16:07:28.278759+00:00",
  "limitations": [
    "Score is an uncalibrated investigative heuristic, not a statistical probability.",
    "Historical sample data: does not establish real-world intent or automated bot status."
  ]
}
```

---

## 2. Coordination & Interaction Edge Schema (`coordination_edges.jsonl`)

```json
{
  "source_account_id": "twitter:1015969769760096384",
  "target_account_id": "twitter:1332937272581263360",
  "edge_type": "synchronized_post",
  "weight": 0.50,
  "evidence_record_ids": [
    "fp_1376739399593910273",
    "fp_1376739306287427584"
  ],
  "method": "temporal_proximity_window",
  "threshold": 300.0,
  "observed_or_inferred": "inferred",
  "explanation": [
    "Posts occurred within 23.0 seconds (threshold: 300s)"
  ],
  "created_at": "2026-10-23T16:07:27.123456+00:00"
}
```

### Edge Types Catalog
- **Observed (`observed_or_inferred: "observed"`)**:
  - `reply`: Native reply to parent tweet.
  - `repost`: Retweet or share of another author's content.
  - `mention`: Explicit handle mention within tweet body.
- **Inferred (`observed_or_inferred: "inferred"`)**:
  - `synchronized_post`: Temporal proximity within configured window.
  - `similar_content`: Identical normalized text statement.
  - `shared_url`: Both accounts shared the same clean URL destination.
  - `shared_media`: Matching perceptual hash or exact SHA-256 byte digest.
  - `candidate_identity_link`: Candidate cross-platform handle linkage.

---

## 3. Account Features Schema (`account_features.jsonl`)

```json
{
  "account_id": "twitter:1015969769760096384",
  "platform": "twitter",
  "author_name": "ShashiRajbhar6",
  "record_count": 14,
  "first_observed_at": "2021-03-30T03:30:12+00:00",
  "last_observed_at": "2021-03-30T03:33:46+00:00",
  "observation_window_seconds": 214.0,
  "post_rate_per_hour": 235.51,
  "inter_post_intervals_sec": {
    "min": 10.0,
    "max": 45.0,
    "mean": 16.46,
    "median": 14.0,
    "p25": 11.0,
    "p75": 20.0
  },
  "max_burst_count": 14,
  "original_ratio": 1.0,
  "reply_ratio": 0.0,
  "repost_ratio": 0.0,
  "quote_ratio": 0.0,
  "exact_text_repetition_ratio": 0.2857,
  "repeated_url_ratio": 0.0,
  "media_attachment_ratio": 0.0,
  "engagement_stats": {
    "mean_likes": 0.0,
    "max_likes": 0,
    "mean_retweets": 0.0,
    "max_retweets": 0,
    "mean_replies": 0.0,
    "max_replies": 0
  },
  "missing_data_indicators": {
    "missing_timestamps": 0,
    "missing_text": 0,
    "missing_author_id": 0,
    "is_author_handle_fallback": 0
  },
  "evidence_record_ids": ["fp_1376739399593910273"]
}
```

---

## 4. Graph Summary Schema (`graph_summary.json`)

```json
{
  "total_nodes": 160,
  "total_edges": 2406,
  "observed_edge_count": 12,
  "inferred_edge_count": 2394,
  "unresolved_target_count": 0,
  "connected_components_count": 8,
  "largest_component_size": 142,
  "average_degree": 30.08,
  "max_degree": 68,
  "top_connected_accounts": [
    {
      "account_id": "twitter:1015969769760096384",
      "weighted_degree": 14.5,
      "total_degree": 29
    }
  ],
  "edge_breakdown_by_type": {
    "synchronized_post": 2382,
    "similar_content": 12,
    "repost": 8,
    "reply": 4
  }
}
```

---

## 5. Communities and Influence Schema (`communities_and_influence.json`)

```json
{
  "communities": {
    "method": "greedy_modularity",
    "version": "1.0.0",
    "total_communities": 8,
    "communities": [
      {
        "community_id": "community_1",
        "size": 45,
        "internal_edge_count": 312,
        "top_accounts": ["twitter:1015969769760096384"]
      }
    ],
    "account_to_community": {
      "twitter:1015969769760096384": "community_1"
    },
    "limitations": [
      "Communities represent topological clustering in sampled data."
    ]
  },
  "influence": {
    "total_nodes": 160,
    "top_by_pagerank": [
      {
        "account_id": "twitter:1015969769760096384",
        "pagerank": 0.0142,
        "degree": 29
      }
    ],
    "candidate_originators": [
      {
        "account_id": "twitter:1015969769760096384",
        "earliest_observed_timestamp": "2021-03-30T03:30:12+00:00",
        "observed_record_count": 14,
        "status_label": "candidate_earliest_observed_account",
        "notes": "Earliest observed post in the sampled stream; does not prove original author."
      }
    ],
    "account_metrics": {
      "twitter:1015969769760096384": {
        "in_degree": 15,
        "out_degree": 14,
        "total_degree": 29,
        "weighted_degree": 14.5,
        "pagerank": 0.0142,
        "betweenness_centrality": 0.0031
      }
    }
  }
}
```

---

## 6. Geospatial Activity Schema (`geospatial_analysis.json`)

```json
{
  "task": "geospatial_activity_screening",
  "status": "insufficient_location_data",
  "total_records_evaluated": 1000,
  "records_with_coordinates": 0,
  "unique_accounts_with_location": 0,
  "coverage_ratio": 0.0,
  "hotspots": [],
  "anomalous_spikes": [],
  "baseline_description": "No baseline established due to absence of numeric coordinates in historical records.",
  "limitations": [
    "Analysis strictly utilizes explicit, numeric coordinates.",
    "Only 0 records have verifiable numeric coordinates (minimum required: 10)."
  ]
}
```

---

## 7. Unified Multimedia Result Schema (`media_analysis.jsonl`)

```json
{
  "artifact_id": "evidence_image_001",
  "source_record_ids": ["fp_1376739306287427584"],
  "sha256_exact_match": true,
  "sha256": "4ca5cea3e1c3e99ff18a7a1ce58c2975f3e8c02bf6650bb9db6c0a7210038ed4",
  "perceptual_matches": [
    {
      "matched_artifact_id": "reference_meme_04",
      "hamming_distance": 2,
      "similarity_score": 0.9688,
      "threshold": 10,
      "match_type": "candidate_near_duplicate_visual"
    }
  ],
  "ocr_result_id": null,
  "forensic_findings": [
    {
      "check": "metadata_extraction",
      "has_exif": false,
      "dimensions": "1200x800",
      "notes": "No EXIF metadata present in image file."
    },
    {
      "method": "jpeg_error_level_analysis",
      "quality_tested": 90,
      "mean_error_level": 4.12,
      "max_error_level": 28.5,
      "elevated_discrepancy_detected": false
    }
  ],
  "video_frame_findings": [],
  "ai_generated_screening": {
    "status": "not_configured",
    "score": null,
    "model": null
  },
  "method_versions": {
    "image_forensics": "1.0.0",
    "perceptual_hash": "imagehash_4.3.2",
    "sha256": "hashlib_sha256"
  },
  "thresholds": {
    "hamming_distance_max": 10
  },
  "limitations": [
    "Perceptual matches indicate candidate visual similarity, not common ownership."
  ],
  "requires_human_review": true
}
```

---

## 8. Integration Guidance for Developer 1

- **No Schema Conflicts**: Dev 3 consumes Dev 1's `CanonicalRecord` without modifying any input files.
- **Traceability**: All output edges, features, and scores reference valid canonical `record_id`s in `evidence_record_ids`.
- **Frontend Dashboard Visualizer**:
  - The network graph can ingest `coordination_edges.jsonl` and `graph_summary.json`.
  - Filter by `observed_or_inferred == "observed"` to display ground-truth interactions.
  - Enable inferred edge layers with an investigative disclaimer badge.
- **BSA Section 63 Evidence Packages**:
  - When an investigator exports a case via Developer 1's `evidence/integrity.py`, Dev 3's output files and referenced record IDs can be bundled directly into the cryptographic evidence manifest.
