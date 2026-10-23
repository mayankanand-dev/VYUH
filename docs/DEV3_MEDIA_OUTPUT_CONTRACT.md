# VYUH — Developer 3 Multimedia Forensics Output Contract & Integration Guide

## 1. Overview & Integration Boundaries

This document defines the output schemas produced by Developer 3's Multimedia Forensics and Media Intelligence Subsystem (`media/`).

- **Producer**: Developer 3 (`media/pipeline.py`, `media/asset_loader.py`, `media/image_similarity.py`, `media/image_forensics.py`, `media/video_analysis.py`).
- **Consumers**: Developer 1 (Investigation Dashboard, Evidence Package Exporter, Case File Storage) and Developer 2 (Meme OCR narrative clustering integration).
- **Core Principle**: All outputs are JSON/JSONL serializable, preserve canonical `record_id` and artifact provenance, and separate derived visualizations into dedicated artifact paths.

---

## 2. Output Stream Files

A full pipeline run writes the following multimedia streams into the designated run directory (`runs/<run_id>/` or `runs/media_analysis/`):

| File Name | Schema Object | Description |
|---|---|---|
| `media_inventory.jsonl` | `MediaInventoryItem` | Inventory of all media references extracted from canonical records, local asset resolution status, and missing-data reasons. |
| `media_analysis.jsonl` | `MediaAnalysisResult` | Primary comprehensive multimedia analysis report for each artifact (exact SHA-256, perceptual matches, ELA metrics, video findings). |
| `cross_post_media_matches.jsonl` | `CrossPostMediaMatch` | Multi-account links where identical or perceptually similar media was published across different canonical posts. |
| `analysis_results_media.jsonl` | `AnalysisResult` (Dev 1 contract) | Flattened forensic and similarity findings strictly conforming to Developer 1's standard analysis result schema for direct UI ingestion. |
| `ela_visualizations/*.png` | PNG image files | Derived visual difference images generated during Error Level Analysis, referenced by path. |
| `media_run_summary.json` | JSON audit summary | Execution metadata, asset counts, status counts, and error tallies. |

---

## 3. Schema Definitions & Real Examples

### A. Media Inventory (`media_inventory.jsonl`)

```json
{
  "artifact_id": "MEDIA_rec_fp_1001_0",
  "source_record_id": "rec_fp_1001",
  "source_post_id": "1356972589045370881",
  "source_author_id": "1015969769760096384",
  "source_dataset": "farmers_protest_tweets",
  "media_type": "photo",
  "source_media_reference": {
    "type": "photo",
    "fullUrl": "https://pbs.twimg.com/media/EtE5m3KVkAEoM2e.jpg",
    "previewUrl": "https://pbs.twimg.com/media/EtE5m3KVkAEoM2e.jpg"
  },
  "local_asset_path": "C:\\Users\\OMEN\\OneDrive\\Desktop\\Alpha\\VYUH\\data\\media\\EtE5m3KVkAEoM2e.jpg",
  "analysis_status": "available",
  "missing_data_reason": null,
  "file_size_bytes": 142850,
  "mime_type": "image/jpeg"
}
```

When local bytes are not downloaded (historical remote references):
```json
{
  "artifact_id": "MEDIA_rec_ira_2004_0",
  "source_record_id": "rec_ira_2004",
  "source_post_id": "9082736451",
  "source_author_id": "28374619",
  "source_dataset": "russian_ira_tweets",
  "media_type": "photo",
  "source_media_reference": {
    "type": "photo",
    "fullUrl": "https://twitter.com/DailySanJose/status/9082736451/photo/1"
  },
  "local_asset_path": null,
  "analysis_status": "bytes_unavailable",
  "missing_data_reason": "Historical remote media bytes are not present in local media directory",
  "file_size_bytes": null,
  "mime_type": null
}
```

---

### B. Primary Media Analysis Result (`media_analysis.jsonl`)

```json
{
  "artifact_id": "MEDIA_rec_fp_1001_0",
  "source_record_ids": ["rec_fp_1001"],
  "media_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "sha256_exact_match": true,
  "exact_matches": [
    {
      "matched_artifact_id": "MEDIA_rec_fp_1089_0",
      "media_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "source_record_ids": ["rec_fp_1089"],
      "match_type": "exact_media_sha256_match",
      "limitations": [
        "Exact byte match confirms byte-level identity. It does not establish where the media originated."
      ]
    }
  ],
  "perceptual_matches": [
    {
      "matched_artifact_id": "MEDIA_rec_fp_1250_0",
      "hamming_distance": 4,
      "threshold": 10,
      "similarity_score": 0.9375,
      "method": "phash",
      "interpretation": "candidate_visual_similarity",
      "source_record_ids": ["rec_fp_1250"],
      "limitations": [
        "Perceptual similarity is an indicator of visual resemblance, NOT proof of common origin or manipulation."
      ]
    }
  ],
  "ocr_result_id": "OCR_rec_fp_1001",
  "forensic_findings": [
    {
      "finding_type": "metadata_extraction",
      "label": "no_exif_metadata",
      "score": 0.0,
      "score_type": "qualitative_indicator",
      "explanation": [
        "Image dimensions: 1200x800, format: JPEG, mode: RGB.",
        "No EXIF metadata present in image file (standard for social media re-compressed uploads)."
      ],
      "derived_artifact_path": null,
      "parameters": {"dimensions": "1200x800", "format": "JPEG"},
      "limitations": [
        "Missing EXIF metadata is standard on platforms like Twitter/X, which strip metadata for user privacy."
      ],
      "requires_human_review": false
    },
    {
      "finding_type": "ela_variation",
      "label": "potential_recompression_inconsistency",
      "score": 48.2,
      "score_type": "qualitative_indicator",
      "explanation": [
        "Regional compression discrepancy observed; manual visual inspection recommended.",
        "Mean error level: 4.12, Max error level: 48.2."
      ],
      "derived_artifact_path": "runs/media_analysis/ela_visualizations/MEDIA_rec_fp_1001_0_ela.png",
      "parameters": {"jpeg_quality": 90, "scale": 10.0},
      "limitations": [
        "ELA highlights differences in recompression behavior, which can occur naturally along high-contrast edges.",
        "ELA cannot prove manipulation on its own; human review of original provenance is essential."
      ],
      "requires_human_review": true
    }
  ],
  "video_frame_findings": [],
  "ai_generated_screening": {
    "status": "not_configured",
    "score": null,
    "model_or_algorithm": "optional_deepfake_detector",
    "limitations": ["No compatible, configured and evaluated detector is available."]
  },
  "method_versions": {
    "image_forensics": "1.0.0",
    "perceptual_hash": "imagehash_4.3.2",
    "media_sha256": "hashlib_sha256"
  },
  "thresholds": {"phash_hamming_threshold": 10},
  "limitations": [
    "Forensic screening indicators are investigative leads, NOT definitive legal proof of manipulation.",
    "Perceptual matches indicate candidate visual resemblance, not common ownership or malicious provenance."
  ],
  "requires_human_review": true
}
```

---

### C. Developer 1 UI Analysis Result Interface (`analysis_results_media.jsonl`)

Conforms strictly to Section 5 of the VYUH Master Architecture (`intelligence/models.py:AnalysisResult`). Developer 1's dashboard can ingest this stream directly without custom adapters:

```json
{
  "entity_id": "MEDIA_rec_fp_1001_0",
  "task": "image_forensics",
  "model_or_algorithm": "ela_variation",
  "version": "1.0.0",
  "label": "potential_recompression_inconsistency",
  "score": 48.2,
  "score_type": "qualitative_indicator",
  "explanation": [
    "Regional compression discrepancy observed; manual visual inspection recommended.",
    "Mean error level: 4.12, Max error level: 48.2."
  ],
  "evidence_record_ids": ["rec_fp_1001"],
  "source_urls": [],
  "threshold": null,
  "created_at": "2026-10-23T18:25:00.000000+00:00",
  "limitations": [
    "ELA highlights differences in recompression behavior, which can occur naturally along high-contrast edges.",
    "ELA cannot prove manipulation on its own; human review of original provenance is essential."
  ]
}
```

---

### D. Cross-Post Historical Media Matches (`cross_post_media_matches.jsonl`)

Links multiple accounts and posts that shared exact or candidate visual content across historical datasets:

```json
{
  "primary_artifact_id": "MEDIA_rec_fp_1001_0",
  "matched_artifact_id": "MEDIA_rec_fp_1089_0",
  "match_type": "exact_byte_match",
  "source_record_ids": ["rec_fp_1001", "rec_fp_1089"],
  "account_ids": ["1015969769760096384", "1028374619283746123"],
  "post_timestamps": ["2021-02-04T12:00:00Z", "2021-02-04T12:03:15Z"],
  "source_datasets": ["farmers_protest_tweets"],
  "explanation": [
    "Artifacts 'MEDIA_rec_fp_1001_0' and 'MEDIA_rec_fp_1089_0' have identical SHA-256 byte digest: e3b0c44298fc1c14...",
    "Published across 2 accounts and 2 canonical posts."
  ],
  "limitations": [
    "A shared image alone does not establish coordinated activity; temporal proximity and other evidence are required."
  ]
}
```

---

## 4. Execution Commands

### Run Full Dev 3 Pipeline (Including Multimedia Stage 9):
```powershell
py -3.11 -m dev3.pipeline -i data/normalized/canonical_fixture_1000.jsonl -o runs/test_run
```

### Run Media-Only Analysis (Quick Debugging Mode):
```powershell
py -3.11 -m dev3.pipeline -i data/normalized/canonical_fixture_1000.jsonl -o runs/media_test --media-only
```

### Run All Multimedia Test Suites (Deterministic Offline):
```powershell
py -3.11 -m pytest -v tests/test_perceptual_hash.py tests/test_image_similarity.py tests/test_image_forensics.py tests/test_video_analysis.py tests/test_media_pipeline.py tests/test_media_output_contract.py
```
