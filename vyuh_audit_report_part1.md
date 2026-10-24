# VYUH Platform — Ruthless Technical Audit Report (Part 1: Parts 0–2)

> **Audit Date**: 2026-10-24 | **Auditor**: Principal Engineer / Hackathon Judge Perspective  
> **Repo Root**: `e:\VS code\Bihar Cyber Hackathon\`  
> **Stack**: Next.js 15 (TypeScript) frontend + Python analytics back-end + SQLite data layer

---

## PART 0: REALITY CHECK

### a) What the project actually does end-to-end today vs what the README claims

The README claims a full OSINT/disinformation platform with live coordination detection, geospatial heat maps, multimedia deepfake detection, and court-admissible evidence exports. **In reality:** Dev 1 successfully normalized ~4M records into canonical JSONL, committed the analysis outputs (35 narrative clusters, 2,406 graph edges) to pre-computed JSON files, and built a Next.js dashboard that reads those static JSON files plus a **SQLite database (`data/vyuh.db`) that does not exist on disk**. The dashboard renders hardcoded TypeScript arrays for geo hotspots and community clusters as fallbacks. Dev 2 ran the intelligence pipeline on the 1,000-record fixture, produced `data/intelligence/` output files that are **never read by the dashboard**. The sandbox (`/api/sandbox`) is entirely simulated — ELA scores come from `(fileBytes.length % 37) / 100`, OCR text is hardcoded based on filename keywords, and the bot score is a regex-on-username heuristic. Dev 3's Python modules (coordination, anomaly, graph) exist as solid code but produce no output files consumed by the dashboard — the network graph `data/integrated/network_graph.json` shows 2,406 edges computed from the 1,000 fixture (real), but it is unclear how it was generated (no run script committed). The multimedia pipeline (`media/pipeline.py`) runs correctly on local image files but there are **zero local media files in the canonical datasets**, so it always returns `bytes_unavailable` in practice.

### b) README Claim vs Actual State

| README Claim | Actual State | Evidence (file:line) |
|---|---|---|
| 1,019,102 farmers + 2,944,815 IRA records normalized | **Working** — JSONL files exist locally (not in git) | `logs/audit_log.jsonl:2` VERIFIED |
| Canonical fixture 1,000 records for Dev 2/3 | **Working** — `data/normalized/canonical_fixture_1000.jsonl` (1.25 MB) | File on disk VERIFIED |
| SQLite DB at `data/vyuh.db` backing the social feed | **Broken / Missing** — DB does not exist on disk | `app/api/posts/route.ts:7`; `dir data\vyuh.db` → not found VERIFIED |
| HDBSCAN narrative clustering | **Partial/False** — `narrative_clusterer.joblib` is K-Means (loaded via `fitted_clusterer.predict()`; HDBSCAN only invoked when saved model absent) | `intelligence/run_intelligence.py:126-128` VERIFIED |
| Sentence-transformer multilingual embeddings | **Partial/False** — `multilingual_embedder.joblib` (53 MB) is TF-IDF + TruncatedSVD LSA, NOT sentence-transformer | `intelligence/embeddings.py:38-100` VERIFIED |
| Isolation Forest bot/anomaly detection | **Partial** — Model exists and loads correctly. But outputs not wired to dashboard | `analytics/anomaly_detection.py:87-110` VERIFIED |
| Coordination graph (160 nodes, 2406 edges) | **Working** — `data/integrated/network_graph.json` exists, real data | `data/integrated/network_graph.json:2-9` VERIFIED |
| Geospatial heat map | **Fake / Hardcoded** — 6 GeoHotspot objects hardcoded in `page.tsx` with fabricated counts and SHA-256 hashes | `app/page.tsx:139-260` VERIFIED |
| Sandbox 8-stage ELA, OCR, WORM, HSM | **Fake / Simulated** — All stages heuristic or hardcoded TypeScript | `app/api/sandbox/route.ts:37-85` VERIFIED |
| Real-time / near-real-time detection | **Missing** — No streaming, no replay engine, no live feed | Entire codebase VERIFIED |
| Media deepfake/AI detection | **Missing** — `model_adapters.py` always returns `not_configured` | `media/model_adapters.py:38-53` VERIFIED |
| BSA Section 63 evidence package | **Partial** — `evidence/integrity.py:83-141` implements correct SHA-256 manifest. No API endpoint calls it from frontend | `evidence/integrity.py` VERIFIED |
| WORM / HSM vault | **Fake / Theatrical** — README mentions `SYNTH-INFER-04` RAM partition, `SEC-NORTH-PROD-01` WORM manifest; zero backing code | `OSINT_Disinfo_Team_README_Final.md:610-612` VERIFIED |
| Dashboard reads Dev 2 `data/intelligence/` outputs | **Broken** — `analysis_results.jsonl` (2.8 MB), `similarity_matches.jsonl` (845 KB) never imported by any Next.js route | No import in `app/` VERIFIED |
| `Section 63 BSA`-certified bundle | **Misleading** — `legal_declaration` claims "SHA-256 hashes certify records have not been tampered with" — overstatement; SHA-256 proves byte integrity since capture, not external non-tampering | `docs/CANONICAL_DATA_SCHEMA.md:142` VERIFIED |

### c) Top 5 Root Causes (ranked by severity)

1. **`data/vyuh.db` does not exist on disk.** Every `/api/posts` and `/api/clusters` call crashes with a SQLite not-found error. The entire social feed tab, the cluster enrichment, and the account drill-down are broken at runtime. P0 blocker.

2. **Dev 2 intelligence pipeline outputs are completely disconnected from the dashboard.** `data/intelligence/analysis_results.jsonl`, `similarity_matches.jsonl`, `narrative_clusters.jsonl`, and `verified_claims.jsonl` are never read by any Next.js API route. Dev 2 ran and produced real outputs; they are invisible to the demo.

3. **The sandbox is a pure simulation, not a module lab.** `app/api/sandbox/route.ts` computes ELA from `fileBytes.length % 37`, OCR from filename keywords, bot probability from regex on username. It calls NO real Dev 2 or Dev 3 Python modules. It is labelled as testing "the 8-stage pipeline" but is a theatrical frontend script.

4. **Embedder is LSA, not the claimed sentence-transformer.** `models/multilingual_embedder.joblib` is TF-IDF + TruncatedSVD. The model attribution shown in the dashboard ("Multilingual Sentence Transformer - 53.2 MB") is false. Sentence-Transformer weights are ~400 MB; 53 MB is clearly LSA.

5. **Geospatial heat map is hardcoded fabrication.** The six GeoHotspot entries have fabricated `+240%` spike values, invented `postsCount`, and the SHA-256 of empty string (`e3b0c44298fc...`) hardcoded as the Delhi NCR BSA integrity hash. This value is the most famous SHA-256 hash in the field and will be immediately recognized.

### d) Data-Flow Truth: Tracing `canonical_fixture_1000.jsonl` to Dashboard

```
canonical_fixture_1000.jsonl
    |
    v
[Dev 2] intelligence/run_intelligence.py  — RUNS, produces:
    - data/intelligence/analysis_results.jsonl   (2.9 MB, 39,000+ records)
    - data/intelligence/narrative_clusters.jsonl  (35 clusters)
    - data/intelligence/similarity_matches.jsonl  (845 KB)
    |
    v  ← CHAIN BREAKS HERE — no Next.js route reads these files

[Dashboard] reads:
    - data/integrated/narrative_intelligence.json  (static precomputed, 35 clusters) ✅
    - data/integrated/network_graph.json           (static precomputed, 2406 edges) ✅
    - data/vyuh.db                                 — DOES NOT EXIST → 500 errors ❌
    - page.tsx hardcoded arrays                    — geo hotspots, communities (fake) ❌
```

**What actually writes `data/integrated/` files?** Unknown — no committed script. These are manually prepared JSON exports. They are real data (the cluster IDs match fixture IDs) but the generation pipeline is not committed.

---

## PART 1: PS COMPLIANCE MATRIX

| PS Requirement | Status | What Exists | What's Wrong | Severity | Owner |
|---|---|---|---|---|---|
| **1. OSINT & Content Analysis** — posts, comments, accounts, narratives | **Partial** | `narrative_intelligence.json` (35 real clusters); `/api/clusters` enriches with SQLite posts | Social feed broken (no vyuh.db); no comment/interaction OSINT beyond repost edges | P0 | Dev 1 |
| **2. Coordinated Account Detection** — synchronization, bot networks, amplification | **Partial** | `analytics/synchronization.py` (real, 5-signal), `anomaly_detection.py` (real IF), `network_graph.json` (real edges) | Dev 3 outputs not wired; bot score in posts route is a username-regex heuristic, not IF model; no real-time detection | P0 | Dev 1 (wire), Dev 3 (outputs) |
| **3. Multimedia Verification** — deepfakes, manipulated images, confidence scores | **Fake** | `media/pipeline.py` (real ELA logic); `media/model_adapters.py` | No pretrained deepfake model; sandbox ELA = `fileBytes.length % 37`; 0 local media files | P0 | Dev 3 |
| **4. Network & Narrative Analysis** — originators, influencers, propagation | **Partial** | `network_graph.json` (real); narrative clusters (real); `analytics/community_detection.py` | No organic baseline comparison; community data in dashboard hardcoded, not from API | P1 | Dev 1, Dev 3 |
| **5. Geospatial Anomaly Detection** | **Fake** | `analytics/geospatial.py` (real algorithm) | Always returns `insufficient_location_data` on both datasets (zero numeric geotags); dashboard shows fabricated hotspots with empty-string SHA-256 | P0 | Dev 3, Dev 1 |
| **6. Investigation Dashboard & Early Warnings** | **Partial** | Network graph tab (real); narrative tab (real); evidence repo (partially real) | No early-warning alerts; no replay engine; no risk-score per campaign; social feed broken | P1 | Dev 1 |

---

## PART 2: MODEL-BY-MODEL AUDIT

---

### MODEL: Language Detector | OWNER: Dev 2 | FILE: `intelligence/language.py`

**Actual algorithm**: Unicode script range detection (Devanagari/Cyrillic/Gurmukhi/Latin). For Latin text, checks against 90-word Hinglish vocabulary list and English stopwords.

**Problems**:
- `models/language_detector.joblib` is **193 bytes** — empty stub. `language.py` does not import or use it; pure regex. VERIFIED.
- No Urdu, no Punjabi Shahmukhi support.
- False positive risk for Hinglish: words like `to`, `na`, `the` match HINGLISH_VOCABULARY (`language.py:31-32`).
- 195,401 `hi-Latn` detections from 3.17M records is plausible but **unvalidated** — no precision/recall.
- `summary_manifest.json:28` shows `"hi-Latn": 195401` — VERIFIED.

**PS Alignment**: Weak — produces labels, no evaluation metrics.  
**Verdict**: **Freeze** — delete false `language_detector.joblib` claim from model registry.

---

### MODEL: Multilingual Embedder | OWNER: Dev 2 | FILE: `intelligence/embeddings.py`

**Actual algorithm**: TF-IDF (char n-gram 3-5, sublinear) + TruncatedSVD (128 components). `models/multilingual_embedder.joblib` (53 MB) is a serialized `{vectorizer, svd}` dict. **NOT sentence-transformer.** VERIFIED via `embeddings.py:38-100`.

**Problems**:
- Dashboard label "Multilingual Sentence Transformer (multilingual_embedder.joblib - 53.2 MB)" is **FALSE**. Sentence-BERT weights are ~400 MB; 53 MB is clearly LSA. An ML-literate judge will know immediately.
- LSA char n-grams have no cross-language semantic alignment — identical meaning in Hindi vs English will not share embedding space.
- `auto` engine always falls back to LSA because sentence-transformers is not installed. VERIFIED: `embeddings.py:142-152`.
- No evaluation of embedding quality (no nearest-neighbor retrieval test).

**PS Alignment**: Moderate — produces vectors; enables clustering; but multilingual claim is false.  
**Better approach**: Install sentence-transformers, download `paraphrase-multilingual-MiniLM-L12-v2` (~400 MB). On 1,000 fixture records, inference takes <30s on CPU.  
**Verdict**: **Fix label immediately** (30 min). Download real transformer if time permits (2h).

---

### MODEL: Narrative Clusterer | OWNER: Dev 2 | FILE: `intelligence/clustering.py`

**Actual algorithm**: `models/narrative_clusterer.joblib` (12.9 MB) is a fitted **K-Means** object. VERIFIED: `run_intelligence.py:126-128` calls `fitted_clusterer.predict(embeddings)` — K-Means prediction. HDBSCAN is only invoked when the saved model is absent.

**Problems**:
- Dashboard claims "BERTopic + HDBSCAN" — **neither is true**. BERTopic is not imported anywhere in the codebase.
- K-Means forces every post into a cluster — no noise class. Every post gets a narrative label.
- `summary_manifest.json:12` reports `"clusters_discovered": 500` — K-Means k=500 on 3.17M records produces low-quality, uninterpretable clusters.
- `cohesion_score: 1.0` for `narrative_01` in `narrative_intelligence.json:47` — impossible for a real multi-member cluster.
- `clustering.py:97` uses `stop_words="english"` only — Russian and Hindi stop words not removed; Cyrillic keywords ("на", "для", "от") pollute cluster names. VERIFIED.

**PS Alignment**: Weak-to-moderate — clusters real data; mislabelled model is a critical honesty issue.  
**Better approach**: HDBSCAN with `min_cluster_size=5` on 1,000 fixture records runs in <5 seconds. Add `nltk.stopwords` for Russian (`'russian'` is supported). Multilingual stop lists are a 10-line fix.  
**Validation**: Silhouette score currently 0.296. HDBSCAN produces genuine noise class — metric is DBCV.  
**Verdict**: **Fix** — change dashboard label to "K-Means" (30 min); switch to HDBSCAN for demo quality (2h); add multilingual stop words (30 min).

---

### MODEL: Similarity Engine | OWNER: Dev 2 | FILE: `intelligence/similarity.py`

**Actual algorithm**: Three-tier — (a) MD5 exact match, (b) Jaccard on token n-grams (threshold 0.80), (c) cosine on LSA embeddings (threshold 0.88, top-k=3).

**Problems**:
- `similarity_matches.jsonl` (845 KB, ~8,500 pairs from 1,000 records) produced but **never read by dashboard or any API route**. VERIFIED — no import in `app/`.
- Threshold 0.88 on LSA embeddings will miss paraphrase matches. Real sentence-transformers use 0.75–0.80.
- Organic retweets dominate exact matches — no filter to distinguish organic RT amplification from coordinated copypasta.

**PS Alignment**: Moderate — real matches detected, completely invisible to analysts.  
**Verdict**: **Wire to dashboard** (P1). Data exists; Dev 1 needs a `/api/similarity` route.

---

### MODEL: Claim Verifier | OWNER: Dev 2 | FILE: `intelligence/claim_verification.py`

**Actual algorithm**: Regex + heuristic sentence scoring for claim extraction; `NLIVerifier` with `use_neural_nli=False` default.

**Problems**:
- `models/claim_verifier.joblib` is **86 KB** — far too small for any real NLI cross-encoder (mDeBERTa is ~800 MB). This is a stub wrapper. VERIFIED.
- When `use_neural_nli=True`, it loads `typeform/distilbert-base-uncased-mnli` — **English-only**, wrong for Hindi/multilingual claims. VERIFIED: `claim_verification.py:57-59`.
- `EvidenceRetriever` uses a static 16 KB debunk knowledge base (~150 entries) — not a real retrieval system.
- Claims are never shown in dashboard.

**PS Alignment**: Weak — architecture exists; no real NLI model backing it.  
**Verdict**: **Freeze** — honest about limitations. Don't showcase claim verification in demo.

---

### MODEL: OCR Engine | OWNER: Dev 2 | FILE: `intelligence/media_text/`

**Actual algorithm**: `MemeOCREngine` with `preferred_engine="auto"` — attempts PaddleOCR → EasyOCR → Tesseract stub.

**Problems**:
- `models/media_ocr.joblib` is **172 bytes** — stub object. VERIFIED.
- PaddleOCR and EasyOCR are commented out in `requirements.txt:39-41`. VERIFIED.
- Canonical datasets have Twitter CDN URLs (`pbs.twimg.com`) — inaccessible; no local image files. OCR always produces 0 results. VERIFIED: `run_intelligence.py:194-202`.

**PS Alignment**: Missing effectively.  
**Verdict**: **Freeze** — add dashboard note: "OCR requires local media files; Twitter CDN is inaccessible."

---

### MODEL: Isolation Forest (Behavioural Anomaly) | OWNER: Dev 3 | FILE: `analytics/anomaly_detection.py`

**Actual algorithm**: `models/anomaly_detector_baseline.joblib` (1.02 MB) — real sklearn `IsolationForest` + `StandardScaler` bundle. Features: post rate/hour, max burst count, text repetition ratio, URL repetition ratio, repost ratio, median inter-post interval. VERIFIED: `anomaly_detection.py:87-110` loads, scales, and scores correctly.

**Problems**:
- **Model exists and works**. But its output is **not wired to any API or dashboard**. VERIFIED.
- The bot score shown per-post in the dashboard is `computeDynamicBotRisk()` in `app/api/posts/route.ts:125-184` — a 7-rule heuristic: username digits, `dataset_source === 'russian_ira'` (+0.45), hashtag count, etc.
- Setting IRA base risk = +0.45 purely from `dataset_source` is **circular** — the dataset label becomes the score.
- What was the IF model trained on? `anomaly_model_metadata.json` (597 bytes) exists but what are the training positives/negatives? No documentation. UNVERIFIED.

**PS Alignment**: Moderate (real model, correct methodology). **Disconnected from user-facing score**.  
**Better approach**: Run `screen_account_anomalies()` on all 160 graph accounts offline; export to `data/integrated/account_scores.json`; wire to `/api/network` and display per-account.  
**Validation**: IRA `account_category` column (`RightTroll`, `LeftTroll`, etc.) is available as positive labels. Farmers-protest accounts as negatives. Compute precision/recall at threshold 0.6.  
**Verdict**: **Wire to dashboard** (P0 — 3h to precompute + wire).

---

### MODEL: Synchronization / Coordination Detector | OWNER: Dev 3 | FILE: `analytics/synchronization.py`

**Actual algorithm**: 5 signals — observed interactions (reply/repost/mention), exact text repetition, shared URLs (within 2x sync window), shared media URLs, temporal proximity sliding window.

**Assessment**: **This is the best-written module in the codebase.** Multi-signal, properly labels observed vs inferred edges, deduplicates, caps pairwise comparisons at O(n) approximation. VERIFIED as architecturally sound.

**Problems**:
- Temporal sync (Signal 5) triggers on ALL pairs of posts within the window regardless of content. On 1.8M+ farmers-protest tweets during active protest week, this generates massive false positives — every organic tweet burst during breaking news flags as coordinated.
- No organic baseline comparison.
- `network_graph.json` was pre-computed by an uncommitted script — generating the 2,406 edges without a documented process creates reproducibility issues.

**PS Alignment**: Good algorithm; wiring unclear.  
**Verdict**: **Keep + document generation script** (P1). Add baseline comparison for demo narrative.

---

### MODEL: Campaign Score | OWNER: Dev 3 | FILE: `analytics/campaign_score.py`

**Actual algorithm**: Weighted sum of 5 signals (sync, text repetition, URL sharing, media, burst density). Labels: `low_evidence | needs_review | elevated_coordination_signals | inconclusive`. `score_type: "heuristic"`. VERIFIED.

**Problems**:
- Correctly labelled as heuristic — this is good.
- **Not wired to dashboard.** Dashboard shows `computeDynamicBotRisk()` instead.
- Weights (`sync=0.25, text_rep=0.25, url=0.20, media=0.15, burst=0.15`) are undocumented — no sensitivity analysis.

**Verdict**: **Wire to dashboard** (P1).

---

### MODEL: Graph Builder + Community Detection | OWNER: Dev 3 | FILE: `analytics/graph_builder.py`, `analytics/community_detection.py`

**Actual algorithm**: NetworkX typed-edge graph (`CoordinationEdge`). Louvain community detection. PageRank + betweenness centrality for influence scoring.

**Problems**:
- `network_graph.json` (160 nodes, 2,406 edges) is real and structurally correct. VERIFIED.
- Average degree = 30.07 on 160 nodes is unusually high — indicates temporal sync signal producing many inferred edges between accounts that happened to post within the same 60-second window during peak protest activity. This is expected behavior for trending events, not specific to coordination.
- **8 community objects in `page.tsx:262-371` are manually hardcoded** with hand-written names like "Agrarian Slogan Burst Ring" — these are not algorithmically produced. The `/api/network` route returns API communities but the fallback shows hardcoded data by default. VERIFIED.

**Verdict**: **Fix** — wire API communities reliably; add loading state.

---

### MODEL: Geospatial Analysis | OWNER: Dev 3 | FILE: `analytics/geospatial.py`

**Actual algorithm**: Extracts explicit numeric coordinates (lat/lon) from record/metadata. Snaps to grid cells. Computes z-score vs mean.

**Problems**:
- Both datasets have **zero numeric geotags**. The farmers-protest dataset uses `metadata.user_location` (free-text "Punjab", "Delhi") — not parsed into coordinates anywhere. VERIFIED: `geospatial.py:96` calls `extract_coordinates()` which only reads numeric fields; returns `None` for string locations.
- The function always fires `insufficient_location_data` path. VERIFIED: `geospatial.py:120-140`.
- Dashboard shows 6 hardcoded hotspots with fabricated `+240%` to `+410%` spikes. VERIFIED: `page.tsx:139-260`.
- **`bsa_integrity_sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'`** for Delhi NCR — this is the SHA-256 of an empty byte string (`hashlib.sha256(b"").hexdigest()`). A well-known constant. VERIFIED: `page.tsx:157`.
- `postsCount: 15000` for St. Petersburg IRA proxy is invented — the 1,000 fixture has 500 IRA records total. VERIFIED.

**PS Alignment**: **Fake**.  
**Better approach**: Use a lookup table of Indian city name → approximate centroid. Count `metadata.user_location` strings by region. Compute volume per region. Show as a bar chart with explicit `coverage_warning`. This is honest, real data, and takes 3h.  
**Verdict**: **Rewrite geo display entirely** — delete fabricated coordinates; use real location-string aggregation with coverage warning.

---

### MODEL: Multimedia Pipeline | OWNER: Dev 3 | FILE: `media/pipeline.py`, `media/image_forensics.py`

**Actual algorithm**: Real PIL-based ELA (`image_forensics.py:74+`), imagehash pHash/dHash, `AIGeneratedImageScreeningAdapter` returning `not_configured`.

**Problems**:
- **No local media files exist** on disk. Both datasets have Twitter CDN URLs — inaccessible. VERIFIED.
- ELA code (`image_forensics.py:74+`) is real, correct PIL logic that would work on actual JPEG files.
- Sandbox ELA score = `0.45 + (fileBytes.length % 37) / 100` — arithmetic on file size, not image analysis. VERIFIED: `app/api/sandbox/route.ts:37`.
- `AIGeneratedImageScreeningAdapter.screen_image()` always returns `not_configured` because no model path is set. VERIFIED: `media/model_adapters.py:38-53`.
- `sampled_frames_count: 24` in sandbox video analysis is hardcoded. VERIFIED.

**PS Alignment**: Fake for demo. Real code exists with no data.  
**Better approach**: Download 5-10 reference images (one known IRA meme, one clean protest photo). Run `media/pipeline.py` on them offline. Export results to `data/integrated/media_results.json`. Dashboard reads the static JSON — showing real ELA output.  
**Verdict**: **Prepare 5 demo images + run pipeline offline** (2h). Label sandbox as SIMULATED.

---

### MODULE: Sandbox 8-Stage Pipeline | OWNER: Dev 1 | FILE: `app/api/sandbox/route.ts`

**Claims**: Tests the real 8-stage analysis pipeline.

**What it actually does**:
- **Stage 03 (NLP)**: Language via Unicode regex; bot probability via username regex. No Python called. VERIFIED.
- **Stage 04 (MEDIA)**: ELA = `0.45 + (fileBytes.length % 37) / 100`. AI score = `0.22` unless filename contains "ai". VERIFIED: `route.ts:37-85`.
- **Stage 05 (CLUSTER)**: Keyword overlap against `narrative_intelligence.json`. No Python called.
- **Stage 06 (WORM)**: References "ephemeral mock-HSM vault seal" in README — zero code backing this.
- **Stage 08 (EXPORT)**: Returns SHA-256 of the input text string, not of an evidence artifact.

**Verdict**: **Honestly label as SIMULATED/DEMO MODE** — add visible red banner. Consider wiring the real language detector and cluster matching (already partially done via JSON).
