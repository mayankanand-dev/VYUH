# VYUH — Developer 3 Multimedia Forensics & Media Intelligence Methodology

## 1. Executive Summary & Architecture

The VYUH Multimedia Forensics Pipeline (Developer 3) is a modular, evidence-linked digital media analysis subsystem. It provides automated screening across seven core forensic stages:

```
Canonical Records (media_reference) / Local Media Folder
                      │
                      ▼
       [Stage 1: Media Inventory & Validation]
        - Safe path resolution & traversal guards
        - SSRF prevention & scheme checks
        - Format validation (.jpg, .png, .mp4, etc.)
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[Images / Photos]           [Videos / Streams]
  │                           │
  ├─► [Stage 2: Exact Byte    ├─► [Stage 5: Video Analysis]
  │    SHA-256 Digest]        │    - FFprobe container metadata
  │                           │    - FFmpeg frame sampling
  ├─► [Stage 3: Perceptual    │    - Duplicate frame sequences
  │    Hashing (pHash/dHash)] │    - Temporal discontinuity / cuts
  │                           │    - Subprocess safety & timeouts
  ├─► [Stage 4: Image         │
  │    Forensics & ELA]       ├─► [Stage 6: Pretrained Adapters]
  │    - EXIF metadata        │    - Offline fallback: 'not_configured'
  │    - Error Level Analysis │    - Zero fabricated scores
  │    - Uniform canvas check │
  │    - Consistency metrics  │
  │                           │
  └─────────────┬─────────────┘
                │
                ▼
  [Stage 7: Cross-Historical Media Matching]
   - SHA-256 byte cluster indexation
   - Perceptual Hamming cluster matching
   - Correlating accounts, timestamps, & datasets
                │
                ▼
  [Developer 1 & 3 Output Serialization]
   - media_inventory.jsonl
   - media_analysis.jsonl
   - cross_post_media_matches.jsonl
   - analysis_results_media.jsonl (Developer 1 contract)
   - ela_visualizations/ (derived PNG artifacts)
```

---

## 2. Core Methodology & Stage Breakdown

### Stage 1: Media Inventory & Input Validation (`media/asset_loader.py`)
- **Canonical Input**: Consumes `media_reference` arrays (`[{"type": "photo", "fullUrl": "...", "previewUrl": "..."}]`) or stringified representations.
- **Distinguished Conditions**:
  - `available`: Media reference exists and local asset bytes exist on disk.
  - `bytes_unavailable`: Historical remote URL cited, but local bytes are not downloaded.
  - `malformed_reference`: Media reference cannot be parsed or has corrupt schema.
  - `unsupported_format`: Media file extension or container is unsupported.
  - `not_configured`: Tool/subsystem unavailable for asset.
- **Security & Safety Guardrails**:
  - Strict path traversal prevention: Candidate file paths must resolve within the designated base directory.
  - SSRF protection: Rejects `localhost`, private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`).
  - Strict offline operation: Does NOT automatically scrape or download arbitrary internet URLs during ETL.

### Stage 2: Exact-Byte Media Matching (`media/image_similarity.py`)
- Computes cryptographic SHA-256 over exact file bytes using streaming 64 KB blocks.
- **Evidence Ownership Boundary**: Developer 1 owns the official evidence-integrity manifest and legal chain of custody (BSA Section 63). Developer 3 computes `media_sha256` solely for identifying identical byte duplicates across posts.
- **Immutability**: Original media files are opened in read-only binary mode (`rb`) and are never modified or rewritten.

### Stage 3: Perceptual Image Hashing (`media/perceptual_hash.py`)
- Decodes images via Pillow into RGB/L modes and computes 64-bit visual fingerprints:
  - **pHash (DCT-based)**: High resistance to minor re-encoding, color shifts, and watermark insertions.
  - **dHash (Gradient Difference)**: Efficient structural gradient comparison.
  - **aHash (Average Luminance)**: Low-frequency average threshold comparison.
- **Hamming Distance Comparison**:
  - Distance $d \in [0, 64]$ measures bit flips.
  - Normalized similarity score: $S = \max(0.0, 1.0 - \frac{d}{64})$.
  - Configurable threshold: $\text{threshold} \le 10$ identifies candidate near-duplicates (e.g. resized, cropped, or JPEG-compressed variants).
- **Investigative Limitation**: Perceptual hash similarity demonstrates visual resemblance; it does not prove identical author, single camera capture, or coordinated campaign intent.

### Stage 4: Image Digital Forensics & ELA (`media/image_forensics.py`)
- **Metadata Extraction**: Decodes format, dimensions, color mode, aspect ratio, and EXIF tags.
  - *Standard Disclosure*: Social media platforms (Twitter/X, Instagram, Facebook) routinely strip EXIF metadata upon upload for privacy. Missing EXIF is therefore standard and does not indicate tampering.
  - *Software Tag*: Presence of editing software (e.g., Photoshop) indicates post-processing, which is common in professional graphic design or legitimate cropping.
- **JPEG Error Level Analysis (ELA)**:
  - Re-encodes an analysis copy in-memory at a fixed quality (default: `quality=90`).
  - Computes pixel-wise difference: $\Delta = |I_{\text{original}} - I_{\text{recompressed}}|$.
  - Evaluates regional discrepancy: $\frac{\text{max\_error}}{\max(1.0, \text{mean\_error})} > 8.0$ and $\text{max\_error} > 40.0$.
  - Saves enhanced derived difference visualization to a separate derived artifact path (`ela_visualizations/<artifact_id>_ela.png`).
  - *Evidentiary Limitation*: High-contrast edges and high-frequency textures naturally produce higher recompression errors. ELA is an investigative indicator, not definitive proof of image splicing.
- **Consistency Checks**: Detects near-uniform canvas blocks (solid background banners) and extreme aspect ratios ($>4.0$ or $<0.25$).

### Stage 5: Video Frame Analysis (`media/video_analysis.py`)
- **Container & Stream Metadata**: Uses `ffprobe` to inspect duration, container format, dimensions, codec, frame rate, and audio/video stream presence.
- **Frame Sampling**: Uses `ffmpeg` to extract frames at configurable intervals (default: $1.0\text{s}$) up to a safety cap (default: 120 frames).
- **Duplicate Frame Detection**: Compares consecutive sampled frames using pHash. Distance $d = 0$ detects repeated frame sequences (e.g., static video slides or frozen streams).
- **Temporal Discontinuity (Cuts)**: Identifies large perceptual jumps ($d > 35$) between adjacent frames as candidate scene cuts or transitions.
- **Safety & Subprocess Guards**:
  - All commands passed as structured argument lists (`shell=False`, no string interpolation).
  - Subprocess timeouts (default: 15s) prevent hanging on corrupted video containers.
  - Enforces `max_video_size_bytes` (50MB) and `max_video_duration_sec` (120s).
  - Graceful degradation: When FFmpeg/ffprobe is absent, returns `not_configured` without throwing unhandled exceptions.

### Stage 6: Pretrained AI / Deepfake Model Adapters (`media/model_adapters.py`)
- Extensible adapter interface for optional external deepfake / AI-generated detectors.
- **Offline Protocol**: Operates without GPU access, API credentials, or auto-downloading large weights.
- When an evaluated model is unconfigured, returns clean `not_configured` status with explicit limitations.
- Zero fabricated scores or synthetic confidence ratings.

### Stage 7: Cross-Historical Media Matching (`media/image_similarity.py`)
- Evaluates media assets across all ingested canonical records:
  - Answers which accounts published identical media bytes across time.
  - Answers which posts shared perceptually similar imagery.
  - Retains source record IDs, publication timestamps, and originating datasets.
  - Explicitly states that shared media alone is an investigative lead, requiring temporal proximity and conversational patterns to establish coordination.

---

## 3. Configuration & Tunable Parameters

All thresholds are defined in `media/config.py`:

| Parameter | Default Value | Description |
|---|---|---|
| `max_image_size_bytes` | `26,214,400` (25 MB) | Image file size safety ceiling |
| `max_video_size_bytes` | `52,428,800` (50 MB) | Video file size safety ceiling |
| `max_video_duration_sec` | `120.0` | Video container duration limit |
| `max_sampled_frames` | `120` | Maximum frames extracted per video |
| `video_sample_interval_sec`| `1.0` | Frame extraction cadence (1 frame / sec) |
| `video_subprocess_timeout_sec` | `15.0` | Subprocess timeout for ffmpeg/ffprobe |
| `phash_hamming_threshold` | `10` | Candidate near-duplicate visual threshold |
| `ela_jpeg_quality` | `90` | Analysis recompression quality for ELA |
| `ela_scale` | `10.0` | Display brightness enhancement multiplier |
| `uniform_region_std_threshold`| `3.0` | Standard deviation threshold for flat canvas |

---

## 4. Evidentiary Boundaries & False Positive Mitigation

1. **Exact-Match vs. Perceptual-Match Separation**:
   - Exact-match indicates identical file byte digests (SHA-256).
   - Perceptual-match indicates visual similarity after re-encoding, cropping, or resizing.
   - Both are reported with separate schema fields (`media_sha256` vs `perceptual_matches`).
2. **Organic Media Diffusion vs. Coordination**:
   - Viral news photos and popular memes naturally disperse across hundreds of unrelated accounts.
   - The media pipeline flags visual identity, while the coordination scoring module (`analytics/campaign_score.py`) weighs temporal burst synchronization and interaction density to avoid false positives on viral content.
3. **Derived Artifacts**:
   - All ELA visualizations and extracted frames are saved in separate derived output folders (`ela_visualizations/`).
   - Original evidence bytes are never overwritten.
