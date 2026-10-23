# OSINT & Coordinated Disinformation Investigation Platform

## Final Team README and Implementation Contract

## 1. Project objective

Build an investigation platform that uses OSINT, NLP, AI/ML, computer
vision, graph analytics and geospatial analysis to help analysts examine
coordinated disinformation campaigns. The system should surface
evidence-backed leads, explain its findings, and support human-led
investigations. It must not automatically accuse people, infer private
identity from weak signals, or execute content takedowns.

### Required capabilities

-   Analyse posts, comments, public account metadata and interactions
    from supported sources.
-   Detect emerging narratives, related content, repeated media and
    claims requiring verification.
-   Identify suspicious synchronization, coordinated amplification and
    account clusters.
-   Screen images, memes and videos for reuse, manipulation indicators
    and possible AI-generation/deepfake indicators.
-   Map observed and inferred relationships, potential amplifiers and
    propagation patterns.
-   Analyse locations only when supported by available
    public/location-bearing data.
-   Provide an investigation dashboard with timelines, account graphs,
    geographic views, detector results, evidence and risk-ranked alerts.
-   Preserve evidence, calculate evidence-integrity hashes, prepare a
    Section 63 Bharatiya Sakshya Adhiniyam (BSA) certificate draft, and
    prepare a manual Sahyog/I4C notice package.

## 2. Data architecture: one historical source, multiple consumers

Live platform access is not assumed. The baseline demonstration uses
historical social-media datasets (for example, selected IRA/Twitter,
CAA-related and farmers' protest datasets, where access and licensing
permit). These datasets are used to populate the Twitter-style clone and
to feed model analysis. They are not to be represented as live
social-media activity.

``` text
Historical datasets (CSV / JSON / JSONL / other supported formats)
                         |
                         v
            Dev 1: import + normalization
                         |
             Canonical normalized records
                   /             \
                  v               v
      Twitter-style clone     Model/analysis pipeline
      (render/search/filter)  (Dev 2 + Dev 3)
                  \               /
                   \             /
                    v           v
                Dev 1: investigation dashboard
                + evidence/case workflow
```

-   Import each source dataset once. Convert it into the shared
    canonical JSON/JSONL schema.
-   The clone and analysis modules consume the same normalized records;
    they must not independently recollect or independently re-normalize
    the same source.
-   Model-specific cleaning/features may be derived separately, but
    preserve the original record and provenance.
-   Clearly label historical/replayed records and their original
    collection period.
-   Platform connectors (YouTube, X, Reddit, Telegram) are modular
    future/optional ingestion sources and must be enabled only when the
    relevant access, platform terms, credentials and intended use permit
    it. Do not bypass restrictions or claim live coverage if it is not
    active.
-   For each dataset, retain its name, source URL/reference,
    licence/terms review, collection period, known limitations and
    transformation version.

### Data Custody Boundary: Who Manages What?

To avoid duplication of effort and contradictory data wrangling:
- **Developer 1 (Data Custodian & Pipeline Owner)**:
  - Exclusively owns and maintains the multi-gigabyte raw datasets (`tweets.csv` [1.81 GB], `users.csv` [85 MB], `IRAhandle_tweets_*.csv` [1.2 GB]).
  - Resolves raw storage anomalies (e.g. 64-bit integer ID scientific notation float truncation in raw CSVs).
  - Performs user profile caching and metadata joins.
  - Produces and maintains the canonical `.jsonl` streams and test fixtures.
  - Manages on-demand Section 63 BSA evidence manifests and audit logs.
- **Developer 2 (Content Intelligence Consumer)**:
  - **Does NOT touch, parse, or maintain raw CSV files.**
  - Consumes exclusively from the clean canonical `.jsonl` stream (`CanonicalRecord`).
  - Preprocessing for Dev 2 means NLP-specific feature engineering (tokenization, stopwords, language identification, embeddings) derived from `record.text` without mutating canonical provenance.
- **Developer 3 (Forensic & Graph Intelligence Consumer)**:
  - **Does NOT touch, parse, or maintain raw CSV files.**
  - Consumes exclusively from the clean canonical `.jsonl` stream (`CanonicalRecord`).
  - Extracts network edges, synchronization timestamps, and media URLs directly from canonical fields (`record.author_name`, `record.created_at`, `record.media_reference`).

## 3. Team ownership at a glance

### Developer 1 --- Data ingestion, evidence, main application and integration

Owns: - Dataset import, canonical schema, provenance, stable IDs,
deduplication and storage. - Optional platform collectors and
collection-run/checkpoint handling, subject to approved access. -
Twitter-style clone data feed and main dashboard/backend integration. -
Evidence capture/preservation, evidence manifest, evidence-integrity
SHA-256, audit/chain-of-custody events and evidence export. - Section 63
BSA certificate draft workflow; prefill only verified facts and leave
declarations, device/system details, required signatures and expert
details for responsible verification. - Sahyog/I4C notice-pack
generation for manual review/download/upload. - Integrating Dev 2 and
Dev 3 outputs, case workspace, report export, integration tests and
deployment.

Does **not** independently implement Dev 3's multimedia forensics or Dev
2's NLP algorithms. It consumes their versioned outputs and owns the
application's evidence and workflow layer.

### Developer 2 --- Content and narrative intelligence

**Input Contract**: Consumes exclusively from the canonical normalized records (`CanonicalRecord`) published by Developer 1 (e.g. `data/normalized/canonical_fixture_1000.jsonl` or full streams). **Developer 2 does NOT touch, manage, or parse raw CSVs.**

Owns: - Language detection and text preprocessing for supported
languages; test English, Hindi and Hinglish where possible. -
Multilingual embeddings, narrative clustering, duplicate/near-duplicate
text detection and semantic similarity. - Narrative summaries,
timelines, growth measurements and related-post retrieval. - Claim
extraction using a pretrained instruction-following model with schema
validation. - Evidence retrieval from an approved source set/search
interface and claim assessment using a pretrained NLI model. - OCR for
meme/screenshot text and passing extracted text into the content
pipeline with OCR provenance. - Model/algorithm evaluation, threshold
documentation and structured output contract.

Suggested components: `intelligence/language.py`, `preprocessing.py`,
`embeddings.py`, `clustering.py`, `similarity.py`,
`narrative_metrics.py`, `claim_extraction.py`, `evidence_retrieval.py`,
`claim_verification.py`, `media_text/ocr.py`.

### Developer 3 --- Account OSINT, behaviour, networks, location and multimedia intelligence

**Input Contract**: Consumes exclusively from the canonical normalized records (`CanonicalRecord`) published by Developer 1. **Developer 3 does NOT touch, manage, or parse raw CSVs.**

Owns: - Sherlock-style username enumeration across supported public
websites, using a maintained tool or a compliant equivalent. - Public
profile enrichment and candidate account-linkage findings with source
URLs and matched fields. - Account behaviour features and bot/anomaly
screening. - Coordination scoring based on synchronized posting, similar
content, repeated URLs/media and interaction patterns. - Relationship
and propagation graphs, communities, centrality/influence metrics and
observed-vs-inferred edge labels. - Location intelligence from
explicitly public profile locations, reliable geotags and
location-bearing posts; geographic anomaly analysis only where data
coverage supports it. - The **single multimedia analysis pipeline**:
exact/visual media matching, perceptual hashes,
image-manipulation/AI-generation indicators, and video/deepfake
screening using compatible pretrained models. - Structured analysis
results and evaluation reports consumed by Dev 1's application.

Suggested components: `osint/username_search.py`,
`osint/profile_enrichment.py`, `osint/account_linkage.py`,
`analytics/account_features.py`, `analytics/anomaly_detection.py`,
`analytics/synchronization.py`, `analytics/campaign_score.py`,
`analytics/graph_builder.py`, `analytics/community_detection.py`,
`analytics/influence.py`, `analytics/geospatial.py`,
`media/perceptual_hash.py`, `media/image_similarity.py`,
`media/image_forensics.py`, `media/video_analysis.py`.

## 4. Specific functionality and acceptance criteria

### A. Developer 1 --- ingestion, evidence and application

1.  **Dataset import:** support the selected source formats; validate
    required fields; record rejected rows and reasons; retain original
    source files.
2.  **Canonical record IDs:** create stable IDs and prevent accidental
    duplicate imports. Preserve source-specific IDs.
3.  **Shared normalized records:** produce documented JSON/JSONL and a
    schema version. Both clone and analysis consume the same records.
4.  **Provenance:** retain source dataset, source URL/native ID when
    available, original timestamp, import time, transformation version
    and raw-record reference.
5.  **Evidence preservation:** preserve captured/original bytes when
    lawfully available; store filename, MIME type, byte size, capture
    time, source URL/native ID, case ID, tool/version and limitations.
6.  **Evidence integrity:** calculate SHA-256 over exact bytes and
    verify it later by recomputation. Record originals and derivatives
    as separate artifacts with separate hashes. Do not treat a hash as
    proof that content is true.
7.  **Audit trail:** append events for capture, access, verification,
    export and reviewer decisions; restrict destructive edits.
8.  **Section 63 BSA:** generate a fillable certificate draft from
    verified metadata. Do not auto-sign or claim the draft is legally
    sufficient; the responsible person must verify current statutory
    requirements and complete applicable declarations/signatures.
9.  **Sahyog/I4C pack:** export a reviewed bundle (PDF/JSON and optional
    ZIP) with URLs/content IDs, neutral content description,
    reviewer-selected legal basis, evidence IDs, SHA-256 manifest,
    screenshots/artifact references, limitations and approval/submission
    tracking.
10. **Dashboard:** show data provenance and historical-data labels,
    narrative timelines, account graph, coordination score and
    explanations, location view with coverage warnings, media results,
    evidence workspace, certificate draft and notice pack.
11. **Sahyog boundary:** current version supports manual
    download/review/sign/upload by an authorized person. Direct Sahyog
    2.0 integration is future scope unless official specifications,
    authorization and an approved integration are available.
12. **Acceptance:** a sample dataset imports reproducibly; the clone and
    model pipeline can refer to the same record IDs; evidence hashes
    verify; exports include provenance; tests cover failed imports,
    duplicate imports and missing fields.

### B. Developer 2 --- content intelligence

1.  **Language and NLP preprocessing:** Treat canonical `record.text`
    as the unmutated ground truth. **Developer 2 does NOT maintain or parse
    raw CSV files.** Perform language detection and generate a separate
    NLP-cleaned text field (e.g. `nlp_cleaned_text` with lowercasing, tokenization,
    or stopword cleaning) as a derived feature while keeping canonical
    `record.text` untouched; document language limitations.
2.  **Narrative clustering:** use pretrained multilingual sentence
    embeddings (for example,
    `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`) with
    a clustering approach such as HDBSCAN. Do not assume every cluster
    is meaningful; provide representative posts and analyst-readable
    keywords.
3.  **Similarity:** distinguish exact normalized-text matches,
    lexical/near-duplicate matches and semantic similarity. Store
    method, threshold and matched record IDs.
4.  **Narrative metrics:** count records over time and compare against a
    stated baseline/window. Show dataset coverage and avoid implying
    live activity.
5.  **Claim extraction:** return validated structured claims with source
    record IDs and confidence/limitations.
6.  **Claim assessment:** retrieve relevant sources and use a pretrained
    multilingual NLI model (for example,
    `MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`) to produce `supported`,
    `contradicted`, `mixed` or `insufficient_evidence`. NLI scores are
    not proof of truth; display source URLs, publisher/date when
    available and why evidence was considered relevant.
7.  **OCR:** use a compatible OCR engine such as PaddleOCR; preserve the
    image reference, extracted text, language/confidence when available
    and OCR method/version. Feed OCR text into narrative analysis as
    OCR-derived text, not original post text.
8.  **Evaluation:** test on labelled/reviewed examples where available;
    report precision, recall, F1 and confusion matrix for classification
    tasks. For clustering, report suitable cluster-quality measures plus
    human review. Include examples of errors and language-specific
    limitations.
9.  **Acceptance:** fixture data produces reproducible clusters and
    similarity matches; every result points back to source records;
    no-evidence claims return `insufficient_evidence`;
    model/version/threshold metadata is included.

### C. Developer 3 --- Sherlock-style OSINT, coordination, graph, geospatial and media

1.  **Username enumeration:** search only supported public sites through
    a maintained tool or compliant implementation. Return site, profile
    URL, observed username, check time, status and tool/version.
    Distinguish `found`, `not_found` and `error/blocked`; a failed
    lookup is not proof that an account does not exist.
2.  **Public profile enrichment:** extract only relevant publicly
    available fields. Keep each field linked to its source URL and
    retrieval timestamp.
3.  **Account linkage:** generate candidate links based on evidence such
    as exact public username reuse, explicitly shared public
    identifiers, profile similarity and observed interaction patterns.
    Give each link a method, evidence references and
    confidence/strength. Do not infer real-world identity from a
    username match alone.
4.  **Location intelligence:** accept explicit profile location as
    self-reported, and use reliable post geotags or other public
    location evidence when present. Record source and precision. Do not
    infer physical location from name, language, political opinion or
    community membership. Return `insufficient_location_data` when
    appropriate.
5.  **Behavioural anomaly screening:** calculate explainable features
    such as posting rate, time gaps, repeated-content ratio,
    original/reply/repost mix and account metadata where available. Use
    an unsupervised baseline such as Isolation Forest if useful. Label
    the output `anomaly_score` or `bot_likelihood_estimate`, not proof
    that an account is a bot.
6.  **Coordination score:** calculate an explainable
    campaign/coordination score from documented signals: synchronized
    timing, content similarity, shared URLs/media, repeated patterns and
    observed interaction evidence. Store per-signal contributions,
    thresholds, time window, record IDs and coverage. Calibrate only
    when suitable labels exist; otherwise clearly call it a heuristic
    score, not a probability.
7.  **Organic vs coordinated:** compare suspicious patterns against
    available dataset baselines and known legitimate surges. Output
    categories such as `low_evidence`, `needs_review`,
    `elevated_coordination_signals` or `inconclusive`; final
    determinations remain human-reviewed.
8.  **Graph analytics:** use typed edges: observed reply/repost/mention
    versus inferred similarity/synchronization/linkage. Compute
    communities and appropriate centrality metrics. Any proposed
    originator is a candidate based on earliest observed records in the
    available dataset, not a proven originator.
9.  **Multimedia pipeline (single owner):**
    -   SHA-256 for exact byte matching where reference hashes are
        available.
    -   Perceptual hashes (e.g. pHash) and optional visual embeddings
        for candidate near-duplicate matching.
    -   Keep content-matching hashes separate from Dev 1's
        evidence-integrity hash manifest.
    -   Screen images/videos with compatible pretrained forensic models
        only after checking licence, model card and suitability.
    -   For video, sample frames, record timestamps and return
        frame-level indicators where supported.
    -   Return score/label, method, model/version, threshold, source
        artifact ID, matched reference if any, supporting indicators and
        limitations.
    -   Do not claim a detector can reliably identify every AI-generated
        image or deepfake. Similarity matches and detector scores are
        leads for review, not proof.
10. **Geospatial anomaly detection:** where sample counts and location
    precision support it, aggregate by appropriate geographic cells/time
    windows and compare with a stated baseline. Include coverage and
    uncertainty; do not manufacture location data.
11. **Evaluation:** report precision/recall/F1 for labelled
    classification tasks where labels exist; evaluate coordination
    against reviewed examples; measure false positives; test known media
    variants; document limitations where no reliable ground truth
    exists.
12. **Acceptance:** fixture data demonstrates username-search results
    with provenance, cautious candidate account links, typed graph
    edges, explainable coordination scores, media match/forensic outputs
    and location coverage warnings.

## 5. Shared interfaces

### Canonical normalized record

``` json
{
  "record_id": "stable-id",
  "platform": "dataset_or_platform_name",
  "record_type": "post",
  "post_id": "source-native-id-or-null",
  "author_id": "source-author-id-or-null",
  "author_name": "public-name-or-null",
  "text": "original text",
  "language": "detected-or-source-language",
  "created_at": "source timestamp or null",
  "collected_at": "import/capture timestamp",
  "parent_id": null,
  "reply_to_id": null,
  "repost_of_id": null,
  "hashtags": [],
  "mentions": [],
  "urls": [],
  "media_reference": [],
  "engagement": {},
  "source_url": null,
  "source_dataset": "dataset name",
  "collection_run_id": "import-run-id",
  "raw_record_reference": "reference to original row/object",
  "schema_version": "1.0",
  "data_mode": "historical"
}
```

Use null/unknown when fields are unavailable. Do not fabricate IDs,
timestamps, geotags, URLs, engagement counts or account metadata.

### Analysis result

``` json
{
  "entity_id": "record-or-account-or-campaign-id",
  "task": "task-name",
  "model_or_algorithm": "name",
  "version": "version",
  "label": "result-label",
  "score": 0.0,
  "score_type": "heuristic|anomaly|similarity|calibrated_probability",
  "explanation": ["signal or reason"],
  "evidence_record_ids": [],
  "source_urls": [],
  "threshold": null,
  "created_at": "timestamp",
  "limitations": []
}
```

Do not label a score as a probability unless it has been appropriately
calibrated and validated.

### Account-link/coordination edge

``` json
{
  "source_account_id": "account-A",
  "target_account_id": "account-B",
  "edge_type": "reply|repost|mention|similar_content|synchronized_post|candidate_identity_link",
  "weight": 0.0,
  "evidence_record_ids": [],
  "method": "method-name",
  "threshold": null,
  "observed_or_inferred": "observed|inferred",
  "explanation": [],
  "created_at": "timestamp"
}
```

### Evidence manifest item

``` json
{
  "evidence_id": "evidence-id",
  "case_id": "case-id",
  "source_url": "url-or-null",
  "captured_at": "timestamp",
  "filename": "file-name",
  "mime_type": "type",
  "byte_size": 0,
  "sha256": "hex-digest",
  "perceptual_hash": "optional-separate-value",
  "artifact_type": "original|derivative|screenshot|export",
  "tool_version": "version",
  "limitations": []
}
```

### Media analysis result

``` json
{
  "artifact_id": "evidence-or-media-id",
  "sha256_exact_match": false,
  "perceptual_matches": [],
  "ocr_result_id": "optional-result-id",
  "forensic_findings": [],
  "video_frame_findings": [],
  "method_versions": {},
  "thresholds": {},
  "limitations": [],
  "requires_human_review": true
}
```

## 6. Pretrained models and evaluation policy

-   Prefer suitable pretrained models and established algorithms. Do not
    train or fine-tune a model from scratch unless the team later
    demonstrates a specific need.
-   "Pretrained" does not mean "no evaluation required." Test that the
    model works with the actual data, languages, media formats and use
    case.
-   Record model/library version, licence, threshold and runtime
    dependencies.
-   Use manually reviewed/labelled test samples where feasible; report
    false positives and false negatives.
-   Treat confidence scores carefully: similarity scores, anomaly
    scores, NLI outputs, heuristic risk scores and calibrated
    probabilities are different quantities.
-   Keep a human-review path and an `insufficient_data`/`inconclusive`
    state for every capability that can lack evidence.

## 7. Suggested repository structure

``` text
project/
  ingestion/
    importers/
    normalization.py
    validation.py
    provenance.py
  clone/
  intelligence/
    language.py
    preprocessing.py
    embeddings.py
    clustering.py
    similarity.py
    narrative_metrics.py
    claim_extraction.py
    evidence_retrieval.py
    claim_verification.py
  osint/
    username_search.py
    profile_enrichment.py
    account_linkage.py
  analytics/
    account_features.py
    anomaly_detection.py
    synchronization.py
    campaign_score.py
    graph_builder.py
    community_detection.py
    influence.py
    geospatial.py
  media/
    perceptual_hash.py
    image_similarity.py
    image_forensics.py
    video_analysis.py
  evidence/
    manifest.py
    integrity.py
    audit_log.py
    bsa_section63_draft.py
    sahyog_notice_pack.py
  backend/
  frontend/
  tests/
  docs/
```

Adapt names to the existing repository rather than creating duplicate
modules or parallel implementations.

## 8. Milestones

1.  **Shared data contract:** agree schema, provenance fields, record
    IDs, fixture dataset and repository interfaces.
2.  **Dataset + clone:** import historical data, validate/normalize it,
    populate the clone and verify shared IDs.
3.  **Core intelligence:** Dev 2 delivers narratives, similarity, claim
    outputs and OCR; Dev 3 delivers account OSINT,
    behavioural/coordination scores, graph, location and media outputs.
4.  **Application integration:** Dev 1 integrates results into the
    dashboard, evidence workspace, report export, certificate draft and
    manual notice pack.
5.  **Evaluation and hardening:** run fixture-based integration tests,
    model evaluations, false-positive review, evidence-hash verification
    and reproducible demo walkthrough.

## 9. Non-negotiable safeguards

-   Historical/replayed data must be visibly labelled; do not imply it
    is live.
-   Follow platform terms, dataset licences, privacy requirements and
    access restrictions. Do not bypass access controls.
-   Username matches and public-profile similarities are leads, not
    proof that accounts belong to the same person.
-   Do not infer private physical location from names, language,
    opinions or community affiliation.
-   Do not call every anomaly a bot or every synchronized conversation a
    disinformation campaign.
-   Do not automatically remove content or submit legal notices based
    solely on model output.
-   Preserve source references, methods, versions, uncertainty and
    evidence IDs for findings.
-   Hashes establish byte-level integrity or aid matching; they do not
    establish truth, authorship or legal admissibility by themselves.
-   Section 63 BSA documents are drafts for verification and completion
    by responsible people, not automatically certified legal documents.
-   Sahyog/I4C workflow is manual export and authorized human submission
    in this version; direct portal integration is future scope unless
    officially supported and authorized.

## 10. Definition of done

A feature is not "complete" merely because a model or library has been
installed. It is complete when: 1. It accepts the agreed input contract.
2. It returns the agreed output schema. 3. It links results to source
records/artifacts. 4. It handles missing or invalid data without
fabricating information. 5. It has tests and a documented
evaluation/limitation statement. 6. Its result is integrated into the
dashboard or documented API. 7. The team can reproduce its output on the
fixture dataset.

**Project principle:** ingest once, normalize once, reuse canonical
records, assign one owner per analysis pipeline, preserve provenance,
and present evidence-backed leads for human investigation.

---

## 11. Developer 1 Ingestion & Normalization Status (Completed)

Developer 1 has completed the ingestion, streaming normalization, and evidence architecture for both baseline datasets without arbitrary caps.

### Canonical Normalized Data Streams (Single Source of Truth)

All modules—including **Dev 2** (Content & Narrative Intelligence), **Dev 3** (Graph & Forensic Intelligence), and the **Social Signal Lab** (Twitter/X Clone)—must consume from these canonical datasets located in `alpha/VYUH/data/normalized/`:

| Dataset Artifact | Record Count | Purpose / Consumer |
| :--- | :--- | :--- |
| `farmers_protest_normalized.jsonl` | **1,019,102** | Farmers protest campaign tweets with uncorrupted 64-bit IDs, parsed media, entities, and joined user metadata. |
| `russian_ira_normalized.jsonl` | **2,944,815** | Russian IRA troll tweets across all 13 CSV parts with ISO-8601 UTC timestamps, retweet parsing, and troll account categories. |
| `canonical_fixture_1000.jsonl` | **1,000** | High-throughput balanced test fixture (500 from each dataset) for fast unit testing, local dev servers, and UI feeds. |

### Canonical Schema & Evidence Architecture
- **Canonical Schema Specification**: Detailed field definitions, mapping matrices, and integration contracts are documented in [`alpha/VYUH/docs/CANONICAL_DATA_SCHEMA.md`](file:///c:/Users/mayank/Desktop/bihar%20police%20hackathon/alpha/VYUH/docs/CANONICAL_DATA_SCHEMA.md).
- **BSA Section 63 Evidence Manifest**: Strictly on-demand. Automated manifest dumping across internal ETL files is disabled; official legal certificates with SHA-256 digests are generated via `generate_on_demand_evidence_package()` in [`alpha/VYUH/evidence/integrity.py`](file:///c:/Users/mayank/Desktop/bihar%20police%20hackathon/alpha/VYUH/evidence/integrity.py) when an investigator explicitly exports a case or finding.
- **Audit Trail**: Every transformation and run is logged in [`alpha/VYUH/logs/audit_log.jsonl`](file:///c:/Users/mayank/Desktop/bihar%20police%20hackathon/alpha/VYUH/logs/audit_log.jsonl) and [`alpha/VYUH/logs/DEV1_CHANGELOG.md`](file:///c:/Users/mayank/Desktop/bihar%20police%20hackathon/alpha/VYUH/logs/DEV1_CHANGELOG.md).

### Handover Instructions for Developer 2 and Developer 3

1. **What Developer 1 Provides to Dev 2 and Dev 3**:
   - Primary testbed: `alpha/VYUH/data/normalized/canonical_fixture_1000.jsonl` (1,000 pre-validated records with 500 Farmers Protest and 500 Russian IRA troll posts).
   - Full scale streams: `alpha/VYUH/data/normalized/farmers_protest_normalized.jsonl` and `alpha/VYUH/data/normalized/russian_ira_normalized.jsonl`.
2. **What Dev 2 and Dev 3 Do NOT Do**:
   - **DO NOT** import, parse, clean, or maintain raw CSV files (`tweets.csv` [1.81 GB] or IRA CSV parts). Developer 1 has already solved raw CSV scientific-notation float ID loss, encoding mismatches, and user joins.
   - **DO NOT** create a parallel ingestion pipeline or independently re-normalize raw data.
3. **What Dev 2 and Dev 3 DO**:
   - Treat `record.text` as the unmutated ground-truth content.
   - Attach model findings (e.g. narrative clusters, claim NLI assessments, coordination scores, graph edges) to the stable canonical `record_id` (or `post_id`).
   - Derive NLP features (tokens, embeddings, language codes) in memory or in model output tables, preserving canonical provenance.

---

## 12. Sandboxing & Algorithmic Module Lab (Zero-Write Testing Enclave)

To allow safe testing, heuristic scoring, model tuning, and stress tests without tainting production evidence registers or judicial chain of custody, the platform includes an isolated **Algorithmic Module Lab & Pipeline Workbench** (`data-view="sandbox"`).

### Core Enclave Guarantees & Safeguards
- **Zero Write Privileges to Production HSM**: All synthetic data injections, mock ELA image scans, and pipeline test runs execute strictly within an isolated ephemeral RAM partition (`SYNTH-INFER-04`).
- **No Automatic Evidence Poisoning**: Artifacts processed in the sandbox generate temporary mock tokens and cannot alter live case ledgers (`INV-*`) or production WORM manifests (`SEC-NORTH-PROD-01`).
- **Audit Traceability**: All benchmark runs, smoke tests, and heuristic evaluations are logged to `alpha/VYUH/logs/audit_log.jsonl` under the operator identity `operator: "sandbox_test_runner"`.

### The 8-Stage Extraction Pipeline Progression Sequence
The workbench provides an interactive verification ribbon testing the full lifecycle of a ingested social post:
1. `01. INGEST`: Synthetic payload parsing, header sanity check, and streaming integrity.
2. `02. NORM`: Validation against the 26 mandatory canonical schema fields defined in `CANONICAL_DATA_SCHEMA.md`.
3. `03. NLP`: Multilingual sentiment classification (Hindi/English/Punjabi), provocative phrase matching, and bot probability scoring.
4. `04. MEDIA`: Forensic Error Level Analysis (ELA) simulation, artifact hash inspection, and EXIF integrity checks.
5. `05. CLUSTER`: Louvain modularity clustering, co-occurrence temporal burst isolation, and sockpuppet coordination calculation.
6. `06. WORM`: Ephemeral mock-HSM vault seal simulation with zero write to persistent custody.
7. `07. NOTICE`: Rule evaluation against Section 79(3)(b) IT Act and Section 94 BNSS preservation parameters.
8. `08. EXPORT`: Court-admissible staging bundle generation.

### Module Lab APIs
- `POST /api/sandbox/smoke-test`: Executes the 8-stage sequence, measuring real-time latency (ms) per stage and validating compliance.
- `POST /api/sandbox/evaluate-text`: Isolated heuristic scanner allowing investigators to test raw slogan text, hashtags, or suspicious shortlinks against the disinformation ruleset without committing to evidence.



