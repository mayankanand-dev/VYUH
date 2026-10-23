# VYUH — Developer 3 Subsystem: OSINT, Coordination, Graph Intelligence, Geospatial & Multimedia Forensics

**Owner**: Developer 3  
**Status**: Production-Ready / Fully Integrated  
**Specification Version**: 1.0  
**Compliance Standard**: ISO/IEC 27037 & BSA 2023 Section 63  

---

## 1. Overview and Architecture

Developer 3 owns the analytical detection, network graph, OSINT investigation, and multimedia forensics modules for the VYUH platform.

All modules consume **strictly from Developer 1's immutable canonical JSONL stream** (`data/normalized/canonical_fixture_1000.jsonl` or full normalized streams). They never mutate source records, never fabricate missing data, and distinguish observed facts from analytical hypotheses.

```
                          Canonical Records (Dev 1 JSONL)
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    Account Features & Cadence                           Coordination Detector
  (analytics/account_features.py)                      (analytics/synchronization.py)
             │                                                     │
             │     ┌───────────────────────────────────────────────┘
             ▼     ▼
    Account Graph Engine (Observed vs Inferred)
    (analytics/graph_builder.py)
             │
             ├──► Modularity Communities (analytics/community_detection.py)
             ├──► PageRank & Originators (analytics/influence.py)
             ├──► Anomaly Screening (analytics/anomaly_detection.py)
             └──► Multi-Signal Coordination Scoring (analytics/campaign_score.py)
             │
    ┌────────┴────────┐
    ▼                 ▼
Geospatial         Multimedia Forensics            OSINT & Account Linkage
Activity Screening (media/unified_pipeline.py)     (osint/username_search.py,
(geospatial.py)    - SHA-256 byte identity        account_linkage.py)
                   - Perceptual hash (pHash/dHash)- Public username probes
                   - JPEG ELA recompression       - Candidate identity links
                   - Video temporal cuts          - Strict human-review policy
```

---

## 2. Directory Layout

```
alpha/VYUH/
├── analytics/
│   ├── account_features.py      # Account cadence, intervals, burst windows & repetition
│   ├── synchronization.py       # Multi-signal temporal & content coordination detection
│   ├── campaign_score.py        # Explainable heuristic coordination scoring
│   ├── graph_builder.py         # Network graph separating observed & inferred edges
│   ├── community_detection.py   # Modularity & Louvain network community partitioning
│   ├── influence.py             # PageRank, betweenness & candidate earliest originators
│   ├── anomaly_detection.py     # Unsupervised cadence & repetition anomaly screening
│   └── geospatial.py            # Coordinate-backed geographic clustering & spike screening
├── osint/
│   ├── username_search.py       # Adapter-based public username probes (offline/mock-first)
│   ├── profile_enrichment.py    # Public profile metadata enrichment with provenance
│   └── account_linkage.py       # Cautious candidate cross-platform linkage hypotheses
├── media/
│   ├── perceptual_hash.py       # pHash, dHash, aHash & bit-level Hamming distance
│   ├── image_similarity.py     # Catalog indexing & exact/near-duplicate visual matching
│   ├── image_forensics.py       # EXIF extraction, JPEG Error Level Analysis (ELA)
│   ├── video_analysis.py        # Video frame sampling & cut detection (FFmpeg graceful fallback)
│   └── unified_pipeline.py      # Unified multimedia forensics contract orchestrator
├── dev3/
│   ├── config.py                # Configurable defaults, weights & thresholds
│   ├── schemas.py               # Shared Pydantic output schemas (AnalysisResult, etc.)
│   ├── reporting.py             # Structured JSON/JSONL serialization utilities
│   └── pipeline.py              # CLI & batch analysis orchestrator
├── tests/                       # Deterministic test suite (30 offline tests)
├── docs/
│   ├── DEV3_README.md           # This guide
│   ├── DEV3_METHODOLOGY.md      # Mathematical models, thresholds, and caveats
│   └── DEV3_OUTPUT_CONTRACT.md  # Detailed schema definitions for Dev 1 consumers
└── requirements.txt             # Clean dependencies
```

---

## 3. Installation & Requirements

Ensure Python 3.10+ (tested on Python 3.11):

```bash
# From repository root (alpha/VYUH):
pip install -r requirements.txt
```

Core libraries used:
- `pydantic>=2.0` (Type contracts and schema validation)
- `networkx>=3.0` (Graph topology, communities, PageRank)
- `pillow>=10.0` (Image manipulation, EXIF, ELA)
- `imagehash>=4.3` (Discrete Cosine Transform perceptual hashing)
- `scikit-learn>=1.3` (Isolation Forest anomaly baseline)
- `numpy`, `scipy` (Numerical intervals, spatial statistics)
- `pytest>=7.0` (Unit and integration testing)

---

## 4. Execution Guide

### Run on Canonical 1,000-Record Fixture

```bash
# Run pipeline with OSINT enabled (offline mock mode by default):
python -m dev3.pipeline -i data/normalized/canonical_fixture_1000.jsonl -o runs --enable-osint
```

### Command Line Options

| Argument | Flag | Default | Description |
| :--- | :--- | :--- | :--- |
| `--input` | `-i` | `data/normalized/canonical_fixture_1000.jsonl` | Input canonical JSONL path |
| `--output-dir`| `-o` | `runs` | Directory where timestamped run folders are created |
| `--limit` | `-l` | `None` (all) | Cap number of records to process |
| `--window-seconds` | `-w` | `300` | Temporal synchronization window in seconds |
| `--burst-window` | `-b` | `600` | Account burst detection window in seconds |
| `--media-dir` | `-m` | `None` | Optional local folder of images/videos to screen |
| `--enable-osint` | | `False` | Run public username search and candidate linkage |
| `--live-osint` | | `False` | Run live HTTP probes (default is safe offline mock) |
| `--dry-run` | | `False` | Validate canonical input without writing outputs |

---

## 5. Output Artifacts

Each pipeline run creates an isolated directory `runs/RUN_DEV3_<timestamp>_<uuid>/` containing:

1. **`run_summary.json`**: Execution audit trail, input record count, parameter checkpoints, software versions, and global limitations.
2. **`account_features.jsonl`**: Statistical behavioural profiles per account (rates, intervals, ratios, burst counts, missing data indicators).
3. **`coordination_findings.jsonl`** / **`coordination_scores.jsonl`**: Standard `AnalysisResult` objects with provisional screening labels (`low_evidence`, `needs_review`, `elevated_coordination_signals`, `inconclusive`).
4. **`graph_nodes.jsonl`**: Individual platform-scoped account node records with community IDs, degree stats, and PageRank.
5. **`graph_edges.jsonl`** / **`coordination_edges.jsonl`**: Typed observed interaction edges (`reply`, `repost`, `mention`) and inferred coordination edges (`synchronized_post`, `similar_content`, `shared_url`, `shared_media`).
6. **`graph_degrees.jsonl`**: Per-account directed in-degree, out-degree, total degree, and weighted degree.
7. **`graph_summary.json`**: Node/edge counts, observed vs inferred breakdown, degree distributions, top connected accounts, and unresolved target diagnostics.
8. **`communities_and_influence.json`**: Modularity-derived community clusters, PageRank rankings, betweenness centrality, and candidate earliest observed originators.
9. **`account_anomalies.jsonl`**: Unsupervised cadence and repetition outlier screening results (`score_type="anomaly"`).
10. **`geospatial_analysis.json`**: Numeric coordinate coverage, geographic cell hotspots, and spatial activity spike z-scores.
11. **`media_analysis.jsonl`**: SHA-256 byte matches, perceptual pHash near-duplicates, JPEG ELA forensic indicators, and video frame findings.
12. **`osint_findings.jsonl`**: Platform username search findings with provenance, status (`found`, `not_found`, `blocked`, `error`), and timestamps.
13. **`candidate_account_links.jsonl`**: Cautious cross-platform linkage hypotheses with alternative explanations and mandatory human-review flags.

---

## 6. How to Inspect Inferred vs. Observed Graph Edges

In `coordination_edges.jsonl` (and `graph_edges.jsonl`):
- **Observed Edges** have `"observed_or_inferred": "observed"` and correspond directly to platform mechanics (`reply`, `repost`, `mention`).
- **Inferred Edges** have `"observed_or_inferred": "inferred"` and represent algorithmic hypotheses (`synchronized_post`, `similar_content`, `shared_url`, `shared_media`).

Dashboard integration can toggle inferred layers on and off to maintain clear forensic boundaries between verifiable interactions and analytical hypotheses.

---

## 7. Running Tests

The test suite runs 100% offline with zero external network dependencies:

```bash
pytest -v
```

All 39 unit and integration tests execute deterministically in ~4 seconds.
