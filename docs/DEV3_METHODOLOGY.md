# VYUH — Developer 3 Methodology and Analytical Reference

**Document Version**: 1.0  
**Scope**: Algorithmic definitions, coordination scoring heuristics, graph topology semantics, and forensic screening indicators.

---

## 1. Ethical Principles & Anti-Accusation Safeguards

The VYUH platform operates as an investigative lead-generation platform for human analysts. It is not an autonomous attribution system.

1. **No Bot Accusations**: A high posting cadence, repetitive text, or burst activity is not proof of automation or malicious intent. Legitimate accounts (news aggregators, emergency services, passionate grassroots activists) exhibit these characteristics.
2. **No Identity Inferences from Weak Signals**: A matching username across different services (e.g. `alex` or `news_daily`) does NOT establish that both accounts are operated by the same physical person.
3. **No Geographic Speculation**: Physical location is NEVER inferred from language, dialect, ideology, hashtags, display names, or community membership.
4. **Uncalibrated Heuristics vs. Calibrated Probabilities**: Scores produced by this subsystem are distance heuristics and weighted indicators. They are never labeled as probabilities unless evaluated against ground-truth datasets.
5. **Historical Replay Awareness**: Historical archival streams are strictly treated as historical evidence and never presented as live platform activity.

---

## 2. Multi-Signal Coordination Detection (`analytics/synchronization.py`)

Coordination detection evaluates whether multiple accounts exhibit coordinated amplification or synchronized dissemination across five independent signals:

| Signal | Mechanism | Default Window | Edge Type | Default Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Signal 1: Temporal Proximity** | Sliding window over timestamps of sorted posts across distinct accounts. | $\Delta t \le 300\text{s}$ (5 min) | `synchronized_post` | 0.50 |
| **Signal 2: Exact Text Repetition** | Conservative text normalization (stripping URLs, mentions, punctuation, lowercase, min length 10). | Unconstrained (or $\le 300\text{s}$ for sync) | `similar_content` | 0.90 (sync) / 0.60 (async) |
| **Signal 3: Shared URLs** | Normalized URL destination matching (stripping tracking query parameters like `utm_*`, `fbclid`). | $\Delta t \le 600\text{s}$ | `shared_url` | 0.70 |
| **Signal 4: Shared Media** | Byte hash or perceptual media reference matching. | Unconstrained | `shared_media` | 0.80 |
| **Signal 5: Observed Interactions** | Direct replies (`reply_to_id`), retweets (`repost_of_id`), and direct `@mentions`. | Canonical stream | `reply` / `repost` / `mention` | 1.00 / 0.50 |

### $O(N^2)$ Memory & Combinatorial Protection
When a breaking news link or viral phrase is shared by thousands of accounts, full pairwise comparison would generate $\frac{N(N-1)}{2}$ edges.
The pipeline caps comparisons per shared key bucket (`max_pairwise_comparisons_per_bucket = 500`). When a bucket exceeds this threshold:
1. Pairwise edge generation halts for that key.
2. A formal diagnostic entry is appended to `run_summary.json` and edge metadata, documenting the truncated bucket and total items.

---

## 3. Explainable Coordination Scoring (`analytics/campaign_score.py`)

The account-level coordination score is computed as an explainable linear combination of normalized signal contributions:

$$S_{\text{coord}} = w_1 \cdot C_{\text{sync}} + w_2 \cdot C_{\text{text}} + w_3 \cdot C_{\text{url}} + w_4 \cdot C_{\text{media}} + w_5 \cdot C_{\text{burst}}$$

### Default Heuristic Weights:
- $w_1$ (Synchronized Posting): `0.25`
- $w_2$ (Exact Repeated Content): `0.25`
- $w_3$ (Shared External URLs): `0.20`
- $w_4$ (Shared Media References): `0.15`
- $w_5$ (Burst & Interaction Density): `0.15`

### Provisional Screening Categorization:
- **`elevated_coordination_signals`**: $S_{\text{coord}} \ge 0.65$ AND at least 2 independent signals are active ($>0.20$).
- **`needs_review`**: $0.35 \le S_{\text{coord}} < 0.65$.
- **`low_evidence`**: $S_{\text{coord}} < 0.35$.
- **`inconclusive`**: Account has $\le 1$ observed post or lacks sufficient temporal baseline.

---

## 4. Graph Construction and Network Semantics (`analytics/graph_builder.py`)

### Node Scoping
Every node represents a platform-scoped entity formatted as:
- Verified author ID: `<platform>:<author_id>` (e.g. `twitter:1015969769760096384`)
- Handle fallback: `<platform>:handle:<username_lowercase>` (when `author_id` is missing)
- Unresolved: `<platform>:unresolved:<record_id>` (isolated; never merged under a collective "unknown" bucket)

### Observed vs. Inferred Edge Dichotomy
- **Observed Edges**: Direct evidence derived from the canonical record schema (`record.reply_to_id`, `record.repost_of_id`, `record.mentions`). These represent recorded platform interactions.
- **Inferred Edges**: Analytical hypotheses derived by detection algorithms (`similar_content`, `synchronized_post`, `shared_url`, `candidate_identity_link`).

### Unresolved Relationship Diagnostics
When a post contains a `reply_to_id` or `repost_of_id` referencing a target post that does NOT exist in the ingested archive, the pipeline does NOT guess or link to a random account. Instead, it records an explicit diagnostic in `unresolved_targets`.

---

## 5. Community Detection & Influence (`analytics/community_detection.py`, `influence.py`)

1. **Community Partitioning**:
   - Uses NetworkX modularity optimization (`greedy_modularity_communities` or `louvain_communities`).
   - Evaluated on the undirected projection with weighted edges.
2. **PageRank Influence**:
   - Directed graph with damping factor $\alpha = 0.85$, weighted by interaction and coordination scores.
3. **Betweenness Centrality Safe Approximation**:
   - Naive betweenness has $O(V \cdot E)$ complexity. On graphs with $> 150$ nodes, the pipeline automatically switches to an approximation sampling $k = 50$ pivot nodes.
4. **Candidate Originator Identification**:
   - Identified strictly as the account with the **earliest observed timestamp in the sampled archive**.
   - Must be documented as a *candidate sample source*, not as proven creator or conspirator.

---

## 6. Multimedia Forensics (`media/`)

| Stage | Method | Tool / Engine | Purpose | Output Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Exact Byte Match** | SHA-256 Digest | `hashlib.sha256` | Byte-level file identity | Absolute bitwise match of local files. |
| **Perceptual Match** | 64-bit pHash, dHash, aHash | `ImageHash 4.3.2` + `Pillow` | Near-duplicate visual reuse | Hamming distance $\le 10$ flags candidate visual similarity. |
| **JPEG ELA** | Error Level Analysis | `Pillow.ImageChops` (90% quality) | Recompression artifact screening | Highlights regions with disparate compression levels. |
| **EXIF Extraction** | Tag Parsing | `Pillow.ExifTags` | Metadata capture | Device, software, and timestamp verification. |
| **AI Screening** | Modular Adapter | `AIGeneratedImageScreeningAdapter` | Synthetic image detection | Returns `not_configured` by default until validated model is supplied. |
| **Video Frames** | Sampling & Cuts | `FFmpeg` / `ImageHash` | Temporal duplicate / cut detection | Reports frame-level perceptual hashes and cut discontinuities. |

---

## 7. False-Positive and False-Negative Risks

1. **Shared Breaking News**: Multiple independent journalists or citizens quoting a breaking news statement will trigger high text repetition and temporal synchronization. The cross-signal filter and human review workflow prevent false accusations.
2. **Common Public Usernames**: Simple handles like `admin`, `alex`, or `media` exist independently across hundreds of platforms. Candidate account linkage assigns lower confidence and documents alternative explanations.
3. **EXIF Stripping by Social Media**: Almost all commercial social platforms (X, Facebook, Instagram) strip EXIF metadata and recompress images upon upload. The absence of metadata is normal, not an indicator of malice.
