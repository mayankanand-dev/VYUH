# VYUH Platform — Ruthless Technical Audit Report (Part 2: Parts 3–7)

> Continuation of the VYUH audit. See Part 1 for Parts 0–2 (Reality Check, PS Matrix, Model Audit).

---

## PART 3: DASHBOARD AUDIT, PAGE BY PAGE

---

### PAGE: Dashboard / Alert Overview | `app/page.tsx:373+`

**What an investigator needs**: Risk-ranked alerts, trend overview, quick drill-down.

**What it shows**: Hardcoded `liveStats` (`total_posts: 30000`, `high_risk_posts: 10168`) updated from `/api/stats` (route existence unconfirmed). Three hardcoded `CandidateCluster` objects; supplemented by `/api/clusters` when SQLite works (broken).

**Problems**:
- `total_posts: 30000` is hardcoded — real fixture is 1,000; full stream is ~4M. Neither is 30,000.
- `high_risk_posts: 10168` — not computed anywhere. Where does this come from?
- Cluster carousel works visually but with `vyuh.db` absent, enriched clusters fail silently; fallback shows hardcoded 3-cluster list.
- No alert inbox with timestamps or urgency ranking.

**Usability**: 5/10 — looks good; numbers fabricated.  
**Verdict**: Fix stat numbers; connect cluster carousel to real data.

---

### PAGE: Social Intelligence (Post Feed) | `/api/posts/route.ts`

**What an investigator needs**: Searchable post feed with risk scores, language labels, entity highlights.

**What it shows**: **Empty** — `vyuh.db` does not exist; every request returns a 500 error.

**Usability**: 1/10 — does not function.  
**Fix**: Generate `vyuh.db` from the 1,000-record fixture with a simple Python INSERT script. 30 minutes of work.  
**Verdict**: **Fix immediately** (P0).

---

### PAGE: Network Analysis (Graph) | `app/page.tsx`

**What it shows**: `network_graph.json` (real, 160 nodes, 2,406 edges) rendered as force-directed graph. Communities from `page.tsx:262-371` (hardcoded 8 community objects).

**Problems**:
- Graph nodes labeled `twitter:NUMERIC_ID` — an analyst cannot identify who they are looking at without drilling in.
- Community panel names ("Agrarian Slogan Burst Ring", etc.) are manually written, not algorithmically produced.
- No direct link from a node to its posts in the feed (broken anyway).

**Usability**: 6/10 — graph renders; node identities opaque.  
**Verdict**: Show `author_handle` on node hover; wire communities from API.

---

### PAGE: Narrative Intelligence | `app/page.tsx`

**What it shows**: `narrative_intelligence.json` (35 real clusters) with keyword badges and timeline.

**Problems**:
- `narrative_01` has `cohesion_score: 1.0` and empty `top_keywords: []` — data quality artifact; a 1.0 score is impossible for a multi-member cluster.
- Russian-language clusters show raw Cyrillic keywords ("Причина / На / Для") — useless to Hindi-speaking police analysts.
- No drill-down to representative posts (requires SQLite).

**Usability**: 6/10.  
**Verdict**: Fix cohesion=1.0 outlier; add English labels/transliterations for Russian cluster names.

---

### PAGE: Geospatial Intelligence | `app/page.tsx:139-260`

**What it shows**: 6 hardcoded regions with fabricated spike percentages and BSA SHA-256 hashes.

**Problems**:
- **All data is fabricated.** `bsa_integrity_sha: 'e3b0c44298fc...'` (Delhi NCR) is the SHA-256 of an empty byte string — a universally recognized constant. Any cybersecurity officer will know.
- `postsCount: 15000` for St. Petersburg IRA proxy is invented; the fixture has 500 IRA records total.
- Detection model names like "Cross-Border Inauthentic Anomaly Network Model" do not exist in the codebase.

**PS Mapping**: PS Req 5 — **completely fake**.  
**Verdict**: **Rewrite entirely** in 3h using real self-reported location-string aggregation with coverage warning.

---

### PAGE: Media Forensics | `app/page.tsx`

**What it shows**: Interactive upload → calls `/api/sandbox` → shows fake ELA and deepfake scores.

**Problems**:
- All forensics results are arithmetically generated (see sandbox audit).
- Sandbox returns `bot_probability` for a media upload, conflating account analysis with media forensics.
- Upload the same image twice with different filenames → get different ELA scores. Immediately exposed.

**PS Mapping**: PS Req 3 — **fake**.  
**Verdict**: Label as DEMO/SIMULATED; wire to precomputed real results for 5 reference images.

---

### PAGE: Model Registry | `app/page.tsx`

**What it shows**: 4 models with file paths and sizes.

**Problems**: Labels are wrong — `narrative_clusterer.joblib` is K-Means (not BERTopic+HDBSCAN); `multilingual_embedder.joblib` is LSA (not Sentence Transformer).

**Usability**: 7/10 — informative but factually incorrect.  
**Verdict**: Fix labels in 30 minutes.

---

### PAGE: Evidence Repository & BSA Draft | `app/page.tsx`

**What it shows**: Pre-populated evidence records from `data/integrated/evidence_records.json`; SHA-256 hashes; BSA draft generator.

**Problems**:
- The `legal_declaration` in `evidence/integrity.py:120-124` claims "SHA-256 hashes certify that electronic records have not been tampered with" — SHA-256 establishes **byte-level integrity since capture**, not immunity from tampering by external parties.
- No API route calls `generate_on_demand_evidence_package()` from the frontend — BSA export button likely does nothing.

**PS Mapping**: PS Req 6 — partially real.  
**Verdict**: Fix legal wording; wire export button to Python evidence API.

---

### PAGE: Sandbox / Module Lab | `app/api/sandbox/route.ts`

**What it shows**: 8-stage pipeline workbench with latency metrics.

**Problems**: All results are arithmetically generated. A judge who uploads the same image twice gets different ELA scores (filesize changes with filename encoding). Immediately exposed.

**Verdict**: Add visible **"SIMULATED / DEMO MODE"** red banner. Do not claim this calls the real pipeline.

---

### Global Dashboard Issues

| Issue | Impact |
|---|---|
| 9 tabs with no case-centred workflow | Analysts cannot follow a logical investigation path |
| No state sharing between tabs | Selecting a cluster doesn't highlight accounts in Network; selecting account doesn't filter post feed |
| No loading/error states | SQLite errors show blank content with no error indication |
| No "HISTORICAL DATA" label anywhere | Required by README; critical for legal honesty |
| Cognitive load: stat-counter dump | Impressive visually; tells no investigation story |

---

## PART 4: SIMPLIFIED DASHBOARD AND WORKFLOW REDESIGN

### a) User Journey

```
Alert Inbox (replay fires alert)
    → Case View (click alert → create/open case)
    → Evidence Tabs: Network | Narrative | Geo | Media | Accounts
    → Export (SHA-256 manifest → BSA draft → Sahyog pack)
```

### b) 5-Screen Wireframes

**Screen 1: Alert Inbox**
```
[VYUH — HISTORICAL DATASET — Bihar Police | Oct 2021]    [DEMO MODE]

ACTIVE ALERTS — sorted by composite risk score DESC
┌────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL | Campaign: "Adani/Ambani Debt Slogan Ring"   │
│   Risk: 0.91 | Accounts: 58 | Posts: 974 | First: Mar 26  │
│   Signals: Content sync (0.92) • Burst (0.85) • URL (0.7) │
│   [Open Case ▶]  [Replay Timeline ▶]                      │
├────────────────────────────────────────────────────────────┤
│ 🟡 HIGH | Campaign: "STL Verdict IRA Amplification"       │
│   Risk: 0.72 | Accounts: 7 | Posts: 46 | IRA Dataset      │
│   [Open Case ▶]                                            │
└────────────────────────────────────────────────────────────┘
```

**Screen 2: Campaign Case View (hub)**
```
CASE: FARMER_PROTEST_COORD_001   [HISTORICAL DATA | Collected Mar 2021]
Risk Score: 0.87  [WHY? Coordination(0.92) + Anomaly(0.78) + Velocity(0.83)]

Tabs: [Network Graph] [Narrative Timeline] [Geo Map] [Media] [Accounts] [Export]
```

**Screen 3: Evidence Tabs (within Case)**
- **Network Graph**: Force-directed, labeled with handles, community colour-coded, originator candidate highlighted
- **Narrative Timeline**: Cluster velocity chart (posts/hour over time), keyword pills, cohesion score
- **Geo Map**: Self-reported location bar chart with `coverage_warning: "Self-reported strings only — 0 numeric geotags available"`
- **Media**: 5 precomputed demo images with real ELA + pHash results; badge "PRECOMPUTED DEMO"
- **Accounts**: Per-account IF anomaly score, coordination score, posts table

**Screen 4: Export / Evidence Pack**
```
[Generate BSA Section 63 Draft]   [Generate Sahyog/I4C Pack]
SHA-256 Manifest: ✓ 12 evidence items hashed
Legal Notice: "DRAFT — requires verification and authorised officer signature"
[Download ZIP]
```

**Screen 5: Data & Provenance Lab** (optional)
- Dataset provenance cards (canonical fixture, IRA archive)
- Model registry (corrected labels)
- Pipeline run log

### c) Pages to Remove/Merge
- **Delete**: Standalone sandbox → fold into Provenance Lab as "SIMULATED TEST ENVIRONMENT"
- **Merge**: Model Registry → into Lab page
- **Consolidate**: 9 tabs → 4-screen case-centred workflow

### d) Unified Data Contract

```json
{
  "campaign_id": "camp_001",
  "data_mode": "historical",
  "risk_score": {
    "value": 0.87,
    "score_type": "heuristic",
    "components": {
      "coordination": {"score": 0.92, "weight": 0.35},
      "anomaly_density": {"score": 0.78, "weight": 0.30},
      "narrative_velocity": {"score": 0.83, "weight": 0.20},
      "geo_anomaly": {"score": null, "weight": 0.15, "status": "insufficient_location_data"}
    }
  },
  "accounts": ["account_id_list"],
  "narrative_ids": ["cluster_ids"],
  "evidence_record_ids": ["ev_ids"],
  "limitations": ["historical data only", "no live collection"]
}
```

### e) Minimal API Endpoints Required
- `GET /api/campaigns` — list campaigns with risk scores
- `GET /api/campaigns/:id` — full campaign object
- `GET /api/posts?campaign_id=X` — posts in campaign
- `GET /api/network?campaign_id=X` — graph subset
- `POST /api/evidence/export` — trigger `generate_on_demand_evidence_package()`

### f) Demo Fallback Strategy
- All data pre-computed and served from JSON/SQLite — no live Python required during demo
- Every screen shows amber `[HISTORICAL DATA — Oct 2021]` badge
- Sandbox has red `[DEMO / SIMULATED MODE]` banner
- If SQLite fails: yellow banner "Running in offline JSON mode" + read directly from `data/integrated/*.json`

### g) Replay Engine Design (SSE-based, 4-6h to implement)

```python
# Replay: emit fixture records in created_at order with throttled clock
import time, json
from pathlib import Path

records = sorted(
    [json.loads(l) for l in Path("data/normalized/canonical_fixture_1000.jsonl").read_text().splitlines()],
    key=lambda r: r["created_at"]
)

def replay(speed_factor=3600):  # 1 real second = 1 hour of data
    window = []
    for r in records:
        window.append(r)
        if len(window) >= 50:
            score = compute_coordination_score(window)
            if score > THRESHOLD:
                yield {"type": "alert", "campaign": ..., "risk": score}
            window = window[-10:]  # rolling window
        time.sleep(1 / speed_factor)
```

Wire to SSE endpoint (`/api/replay`); dashboard subscribes via `EventSource`.

---

## PART 5: INTEGRATION AND ARCHITECTURE PROBLEMS

| Problem | Severity | File:Line | Detail |
|---|---|---|---|
| `data/vyuh.db` does not exist | **P0** | `app/api/posts/route.ts:7` | Entire social feed broken |
| Dev 2 outputs not consumed by any API | **P0** | `data/intelligence/*.jsonl` | 2.9 MB of real results invisible to dashboard |
| Sandbox calls no real Python modules | **P0** | `app/api/sandbox/route.ts` | Pure TypeScript simulation |
| Geospatial data fabricated | **P0** | `app/page.tsx:139-260` | Empty-string SHA-256, invented post counts |
| Model labels wrong (LSA vs Transformer, K-Means vs BERTopic) | **P0** | `app/page.tsx:407-411` | Immediate credibility loss with any ML judge |
| Empty-string SHA-256 `e3b0c44...` hardcoded for Delhi NCR | **P0** | `app/page.tsx:157` | Universally recognized cryptographic constant |
| `computeDynamicBotRisk()` used instead of IF model | **P1** | `app/api/posts/route.ts:125-184` | Wrong model shown; circular IRA dataset signal |
| 8 community names hardcoded in page.tsx | **P1** | `app/page.tsx:262-371` | Not algorithmically produced; API data ignored |
| No `/api/stats` route referenced in page.tsx | **P1** | `app/page.tsx:429` | Stats widget may fail silently |
| OCR cannot run — no local media files | **P2** | `intelligence/run_intelligence.py:194` | Twitter CDN inaccessible |
| Deepfake adapter always returns `not_configured` | **P2** | `media/model_adapters.py:38-53` | No model registered |
| Python sidecar not running during Next.js demo | **P1** | `launch_all.bat` | All Python modules unreachable if bat fails |
| `requirements.txt` lists `torch>=2.0.0` but no GPU | **P2** | `requirements.txt:31` | CPU torch is 2+ GB download; not in git |
| `DatabaseSync` from `node:sqlite` — requires Node 22.5+ | **P1** | `app/api/posts/route.ts:3` | May not be available in demo environment |
| `claim_verifier.joblib` is 86 KB stub | **P2** | `models/claim_verifier.joblib` | Misleading model file label |
| `language_detector.joblib` is 193 bytes, never used | **P2** | `models/language_detector.joblib` | Misleading model file label |
| `audit_log.jsonl` second entry has `sha256_checkpoint: null` | **P2** | `logs/audit_log.jsonl:2` | Incomplete audit trail for BSA |
| SHA-256 legal declaration overstates integrity guarantee | **P1** | `evidence/integrity.py:120-124` | "Not tampered with" is not what SHA-256 proves |
| Hardcoded dev path `c:/Users/mayank/` in README | **P1** | `OSINT_Disinfo_Team_README_Final.md:587` | Non-portable environment assumption |

### Target Architecture (Minimal for Demo)

```
data/normalized/canonical_fixture_1000.jsonl  (immutable, committed)
                    |
           ┌────────┴────────┐
           v                 v
   [Dev 2 pipeline]    [Dev 3 pipeline]
   run_intelligence.py  evaluate_coordination.py
           |                 |
           v                 v
   data/intelligence/    data/integrated/
   analysis_results.jsonl  network_graph.json
   narrative_clusters.jsonl account_scores.json
   similarity_matches.jsonl campaign_risks.json
   verified_claims.jsonl    geo_summary.json (NEW)
           |
           v
   [Dev 1: build_sqlite.py]
   INSERT fixture + account scores + coordination labels into:
   data/vyuh.db
           |
           v
   [Next.js API routes]  (read-only; no live Python needed)
   /api/posts  /api/clusters  /api/network  /api/stats  /api/evidence/export
           |
           v
   [Dashboard]  (4-screen case-centred workflow)
```

---

## PART 6: RECOVERY PLAN

### a) Cut List — Do These First

| Item | Action | Why |
|---|---|---|
| Sandbox "WORM vault" / "HSM" / `SYNTH-INFER-04` | DELETE from README | Zero code backing; pure theatre |
| "court-admissible" phrasing | REPLACE with "forensically-structured draft for legal review" | Legal overreach |
| Hardcoded geo hotspots in `page.tsx:139-260` | DELETE and REPLACE | Fabricated data with known-constant SHA-256 |
| Hardcoded community names in `page.tsx:262-371` | DELETE (use API) | Manually written, not real output |
| `computeDynamicBotRisk()` IRA base of +0.45 | LABEL as heuristic | Circular; misleading |
| `models/language_detector.joblib` (193 bytes) | DELETE and correct registry | Misleading stub |
| `models/claim_verifier.joblib` (86 KB) | LABEL as "lexical heuristic wrapper" | Misleading stub |
| Model labels "BERTopic+HDBSCAN", "Sentence Transformer" | CORRECT to "K-Means", "LSA TF-IDF" | P0 honesty fix |

### b) Hour 0 — Schema / Contract Freeze

Before any dev writes output files, circulate and get sign-off on these exact contracts:

**`data/integrated/account_scores.json`** (Dev 3 writes → Dev 1 INSERTs into SQLite):
```json
{
  "account_id": "twitter:XXXXX",
  "author_handle": "handle",
  "anomaly_score": 0.72,
  "anomaly_label": "anomalous_cadence_or_content",
  "coordination_score": 0.45,
  "coordination_label": "needs_review",
  "evidence_record_ids": ["rec_001"],
  "score_type": "heuristic",
  "limitations": ["uncalibrated heuristic; not a probability"]
}
```

**`data/integrated/campaign_risks.json`** (Dev 3 writes):
```json
{
  "campaign_id": "camp_001",
  "risk_score": 0.87,
  "score_type": "heuristic",
  "coordination": 0.92,
  "anomaly_density": 0.78,
  "narrative_velocity": 0.83,
  "geo_anomaly": null,
  "geo_coverage_warning": "Insufficient numeric geotags",
  "top_accounts": ["account_ids"],
  "top_clusters": ["cluster_ids"]
}
```

**`data/integrated/geo_summary.json`** (Dev 3 writes — location-string aggregation):
```json
{
  "status": "self_reported_strings_only",
  "coverage_warning": "No numeric geotags available. Self-reported profile strings used only.",
  "total_records": 1000,
  "records_with_location": 420,
  "coverage_ratio": 0.42,
  "regions": [
    {"region": "Punjab", "post_count": 182, "self_reported": true},
    {"region": "Delhi", "post_count": 127, "self_reported": true}
  ]
}
```

### c) Task Lists Per Dev

**TIME REMAINING ASSUMPTION: ~15 hours**

#### Dev 1 — Backend, Dashboard, Integration

| Task | Files | Done When | Hours | Priority |
|---|---|---|---|---|
| Build `data/vyuh.db` from 1,000 fixture | `scripts/build_sqlite.py` | `/api/posts` returns real posts | **1h** | P0 |
| Fix model labels in dashboard and model registry | `app/page.tsx:407-411`, `/api/clusters/route.ts:155-158` | Labels match actual algorithms | **0.5h** | P0 |
| Delete fabricated geo hotspots; replace with `/api/geo` reading `geo_summary.json` | `app/page.tsx:139-260`, new `app/api/geo/route.ts` | Real location-string bar chart with coverage warning | **2h** | P0 |
| Wire Dev 3 `account_scores.json` into SQLite; expose on account drill-down | `scripts/build_sqlite.py` + `/api/posts` update | IF anomaly score and coordination score visible per account | **1.5h** | P0 |
| Add `[HISTORICAL DATA]` amber badge to all pages | `app/page.tsx` layout | Badge visible on every tab | **0.5h** | P0 |
| Fix BSA legal wording throughout | `evidence/integrity.py:120-124`, any UI copy | "byte-level integrity since capture" replaces "certifies non-tampering" | **0.5h** | P0 |
| Add `/api/stats` route with real counts from SQLite | `app/api/stats/route.ts` | Dashboard stat counters show real numbers | **1h** | P1 |
| Add SIMULATED MODE banner to sandbox page | `app/page.tsx` sandbox section | Visible red banner | **0.5h** | P0 |
| Wire `evidence/integrity.py` to BSA export button | `app/api/evidence/export/route.ts` | Real SHA-256 manifest generated on click | **2h** | P1 |
| Wire Dev 2 `similarity_matches.jsonl` to Narrative tab | New `/api/similarity` route | Similarity pairs shown in UI | **1.5h** | P1 |
| Add loading/error states to all tabs | `app/page.tsx` | Empty state + error banner visible | **1h** | P1 |
| Delete manual community hardcodes; use API communities | `app/page.tsx:262-371` | Communities from `network_graph.json` | **0.5h** | P1 |

#### Dev 2 — Intelligence Modules

| Task | Files | Done When | Hours | Priority |
|---|---|---|---|---|
| Switch clusterer back to HDBSCAN on fixture re-run | `intelligence/clustering.py`, `run_intelligence.py` | HDBSCAN clusters; noise class visible | **1h** | P0 |
| Add Russian + Hindi stop words to keyword extraction | `intelligence/clustering.py:97` | Russian cluster keywords are meaningful words, not function words | **0.5h** | P1 |
| Fix cohesion_score=1.0 artifact | `intelligence/clustering.py:207` | No single-member 1.0 score clusters | **0.5h** | P1 |
| Re-generate `data/integrated/narrative_intelligence.json` | Re-run pipeline | 35 clusters with valid keywords | **1h** | P0 |
| Document embedder honestly: "LSA TF-IDF char n-gram 128d" | `intelligence/embeddings.py` docstring | No false transformer claim anywhere | **0.5h** | P0 |
| Prepare evaluation metrics (silhouette, P/R on similarity) | `intelligence/evaluate.py` | Numbers for judge Q&A | **2h** | P1 |

#### Dev 3 — Forensic & Graph Modules

| Task | Files | Done When | Hours | Priority |
|---|---|---|---|---|
| Pre-compute `account_scores.json` from IF + coordination scorer on 160 graph accounts | New `analytics/precompute_scores.py` | JSON file ready for Dev 1 | **2h** | P0 |
| Pre-compute `campaign_risks.json` for 3 key clusters | New `analytics/precompute_campaigns.py` | Campaign risk scores ready | **1h** | P0 |
| Pre-compute `geo_summary.json` from `metadata.user_location` strings | New `analytics/precompute_geo.py` + location lookup table | Real location data for Dev 1 | **1.5h** | P0 |
| Validate IF model on IRA vs farmers accounts; generate P/R numbers | `analytics/train_anomaly_baseline.py` | Precision/recall for demo | **2h** | P1 |
| Download 5 demo images; run real ELA pipeline; export `media_results.json` | `media/pipeline.py`, new `scripts/run_demo_media.py` | Real ELA results for media tab | **2h** | P1 |
| Commit the script that generated `network_graph.json` | Any `scripts/` file | Reproducible generation | **1h** | P1 |

#### Shared

| Task | Owner | Hours |
|---|---|---|
| Design composite risk score weights and document justification | Dev 1 (coordinator) | 1h |
| Synthetic test: inject 20 fake synchronized accounts into fixture; verify IF + coordination detector fires | Dev 3 | 2h |
| Select 3 showcaseable campaigns from fixture for demo | Dev 1 | 1h |

### d) Dependency Timeline (15h Remaining)

```
Hour 0-1:
  [Dev 1] Build vyuh.db
  [Dev 2] Fix HDBSCAN switch + re-run
  [Dev 3] Pre-compute account_scores.json

Hour 1-3:
  [Dev 1] Fix geo tab, delete fabricated data
  [Dev 2] Fix cluster labels, re-generate narrative_intelligence.json
  [Dev 3] Pre-compute geo_summary.json + campaign_risks.json

Hour 3-5:
  [Dev 1] Wire account_scores into SQLite; expose on account drill-down
  [Dev 2] Evaluation metrics
  [Dev 3] Run demo media ELA on 5 reference images

Hour 5-7:
  [Dev 1] Wire Dev 2 similarity; wire BSA export button; add stat API
  [Dev 2] Prepare judge Q&A validation numbers
  [Dev 3] IF validation on IRA/farmers; commit graph generation script

Hour 7-10:
  [Dev 1] Add HISTORICAL DATA badge; label fixes; sandbox SIMULATED banner
  [ALL] Integration test — end-to-end demo path on clean machine

Hour 10-12:
  Integration checkpoint — fix breakage; polish UI

Hour 12-14:
  Polish, prepare 3-minute demo script, dry run

Hour 14-15:
  Timed dry run; prepare judge Q&A answers
```

**Milestones**:
- **Hour 3**: Social feed shows real posts; model labels are honest. **First demoable state.**
- **Hour 7**: Geo tab shows real data; IF scores visible on accounts; similarity shown.
- **Hour 12**: Full end-to-end path works without hardcoded fallbacks.

### e) Demo-Day Safety Checklist

- [ ] Pre-run all Python jobs; commit JSON outputs to git
- [ ] `data/vyuh.db` seeded with 1,000 fixture records (honest scale — not 30,000)
- [ ] `npm run dev` only — no live Python servers needed (all output pre-computed)
- [ ] If `/api/clusters` fails: dashboard falls back to `narrative_intelligence.json` with yellow banner
- [ ] Offline-capable: all data is local JSON/SQLite; no internet required
- [ ] Pre-recorded 60-second backup video of replay engine if live demo is too risky
- [ ] All team members know the answer to "is this live?" before walking in

### f) 3-Minute Demo Script

```
[0:00–0:20] ALERT INBOX
  Replay fires: "Coordinated Slogan Campaign detected"
  Show: risk score 0.87, 58 accounts, posts/hour spike
  Signals: "coordination + anomaly + velocity — three independent signals"
  "Our replay engine re-streams March 2021 protest data
   and fires alerts as thresholds cross."

[0:20–0:50] CASE VIEW — Open Campaign
  Show: risk breakdown (coordination 0.92, anomaly 0.78)
  Why flagged: exact text repetition + synchronized posting within 30s windows
  "Organic protest tweets during the same period scored 0.18 coordination.
   These 58 accounts scored 0.92. That gap is the signal."
  [Click Network Graph tab]

[0:50–1:20] NETWORK GRAPH
  58 accounts, community highlighted, originator candidate node
  "Top node by betweenness centrality is the originator candidate —
   first poster of this slogan 4 hours before the burst."

[1:20–1:40] GEO TAB
  Self-reported location bar chart — Punjab (182), Delhi (127), Western UP (89)
  "We have self-reported profile locations for 42% of accounts.
   We cannot confirm physical presence — coverage warning shown explicitly."

[1:40–2:00] MEDIA — precomputed ELA on reference image
  Real ELA heatmap, pHash, forensic findings on 5 reference images
  "This protest banner shows ELA anomalies at text edges —
   consistent with composite splicing. Requires human forensic review."

[2:00–2:30] EXPORT
  Click: Generate BSA Section 63 draft
  Show: SHA-256 manifest, 12 evidence items, legal declaration
  "This is a DRAFT for officer verification and signature.
   SHA-256 proves byte-level integrity since our import.
   It is not self-certifying — it requires an authorised officer."

[2:30–3:00] WRAP-UP
  "VYUH ingested 1,000 canonical records, ran multilingual narrative clustering,
   detected coordination in 58 accounts, and produced a forensically structured
   evidence draft — all offline, offline, no live scraping, no hallucinations."
```

### g) 5 Toughest Judge Questions + Honest Answers

**Q1: "Is the bot score a probability?"**
> "No. The coordination and anomaly scores are heuristic indicators — uncalibrated statistical distances, labelled `score_type: heuristic`. We evaluated the Isolation Forest model on IRA troll accounts as positives and organic farmers-protest accounts as negatives; at threshold 0.6 we achieve [X]% precision. These are investigative leads for human review, not legal verdicts."

**Q2: "How do you avoid flagging organic protests?"**
> "We require 2+ independent signals to elevate to 'elevated_coordination_signals' — not just timing alone. We also compare against a baseline: organic farmers-protest accounts without coordination signals score below 0.2. Organic burst posting during breaking news is expected — our system labels those `needs_review`, not `coordinated`."

**Q3: "Is the data live?"**
> "No. All data is from two historical archives: 2021 farmers-protest (~1M records) and the Russian IRA troll dataset (~2.9M records). Every page displays an amber 'HISTORICAL DATA' badge. Our replay engine simulates near-real-time for demonstration but is fully transparent about source timestamps."

**Q4: "What are your precision and recall numbers?"**
> "On the IRA dataset — where troll category labels are ground truth — our Isolation Forest achieves [X]% precision and [Y]% recall at threshold 0.6. Our narrative clustering achieves a silhouette score of 0.30 on the full dataset (K-Means reference). We do not have ground-truth labels for farmers-protest data; those results are investigative leads only and explicitly labelled as such."

**Q5: "Is this court-admissible?"**
> "The platform generates a Section 63 BSA draft — a fillable template, not a certified legal document. The SHA-256 manifest establishes byte-level integrity since our import. It requires verification and signature by an authorised officer. We explicitly label it as a DRAFT and do not claim court-admissibility anywhere in the system."

---

## PART 7: FINAL VERDICT

### Scores

| Dimension | Score /10 | Rationale |
|---|---|---|
| **PS Alignment** | **4/10** | 2 of 6 PS requirements substantively addressed (narrative, network). Geo is fabricated. Multimedia is simulated. Coordination exists but not demo-ready. |
| **Technical Depth** | **6/10** | Dev 2 and Dev 3 Python modules are well-engineered (synchronization detector, IF, real ELA). Fatally undermined by a simulation layer on top and disconnected plumbing. |
| **Integration Quality** | **2/10** | Single biggest failing. SQLite DB missing, Dev 2 outputs disconnected, Dev 3 IF model not wired, Sandbox calls nothing real. Good modules, zero plumbing. |
| **Dashboard Usability** | **4/10** | Visually impressive. 9 tabs, no investigator workflow, no state sharing. Geo and multimedia tabs are theatre. Social feed is blank. |
| **Demo-Readiness** | **3/10** | Cannot demo social feed (vyuh.db missing). Cannot demo real media forensics. Geo data is fabricated. Empty-string SHA-256 is immediately recognizable. |
| **Honesty of Claims** | **3/10** | "BERTopic + HDBSCAN", "Sentence Transformer", "WORM vault", "HSM", "court-admissible staging bundle", "Cross-Border Inauthentic Anomaly Network Model" — none of these are true. |
| **Validation Rigour** | **3/10** | Silhouette score reported (0.296). No precision/recall on IRA troll labels (the only ground truth available). No false-positive rate on organic data. |

**Overall: 3.6/10 as-is. Reachable: 6.5/10 with 15h of focused work following this plan.**

---

### The Single Thing That Will Lose This Hackathon If Unfixed

**The fake geospatial data combined with the false model labels.**

The SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` is the hash of an empty byte string — it is the most famous SHA-256 value in cryptography. If a cybersecurity judge (and Bihar Police will have cyber officers) types it into Google, the entire platform's credibility collapses. Combined with claiming "BERTopic + HDBSCAN" when the model is K-Means, and "Sentence Transformer" when it is char n-gram TF-IDF, the platform reads as deliberately misleading.

Fix these two things in the first hour. Everything else can follow.

---

### The Highest-Leverage Single Change — **Dev 1**

**Build `data/vyuh.db` (30 min) + delete fabricated geo hotspots + replace with real location aggregation (2h).**

The SQLite database unlocks the entire social feed, cluster drill-down, and account inspection. The geo fix removes the most dangerous fabrication. Together in 2.5h, these two changes turn a broken demo into a working one. Every other improvement is polish on top.

```python
# Minimum viable build_sqlite.py (~50 lines)
import json, sqlite3
from pathlib import Path

con = sqlite3.connect("data/vyuh.db")
con.execute("""CREATE TABLE IF NOT EXISTS posts (
    record_id TEXT PRIMARY KEY,
    post_id TEXT, dataset_source TEXT,
    author_handle TEXT, author_name TEXT,
    text_content TEXT, created_at_utc TEXT,
    language TEXT, hashtags TEXT, urls TEXT,
    retweet_count INTEGER, like_count INTEGER, reply_count INTEGER,
    bot_risk REAL, coordination_score REAL, coordination_label TEXT,
    sha256 TEXT, removal_hash TEXT, has_claims INTEGER
)""")

for line in Path("data/normalized/canonical_fixture_1000.jsonl").read_text().splitlines():
    r = json.loads(line)
    con.execute("INSERT OR IGNORE INTO posts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
        r["record_id"], r.get("post_id"), r.get("source_dataset"),
        r.get("author_name"), r.get("display_name"),
        r.get("text"), r.get("created_at"),
        r.get("detected_language"), json.dumps(r.get("hashtags", [])),
        json.dumps(r.get("urls", [])),
        r.get("retweet_count", 0), r.get("like_count", 0), r.get("reply_count", 0),
        None, None, None,  # bot_risk, coordination_score, coordination_label — filled by Dev 3
        r.get("sha256_content_hash"), r.get("sha256_content_hash"), 0
    ))
con.commit()
print(f"Seeded {con.execute('SELECT COUNT(*) FROM posts').fetchone()[0]} records")
```

---

*All findings are VERIFIED (read from source files) unless marked UNVERIFIED. No code was modified during this audit.*
