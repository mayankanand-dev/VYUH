# VYUH Platform: Canonical Data Schema & Normalization Contract

**Specification Version**: 1.0  
**Data Architecture Standard**: ISO/IEC 27037 (Digital Evidence Preservation) & Section 63 BSA  
**Role Ownership**: Developer 1 (Ingestion, Normalization, Evidence Integrity & Clone Integration)  
**Target Consumers**:
1. **Twitter/X Clone Interface** (Feed rendering, thread expansion, user profiles, search & filter)
2. **Content & Narrative Intelligence Pipeline** (Dev 2: Multilingual embeddings, clustering, claims, NLI)
3. **OSINT, Graph & Multimedia Pipeline** (Dev 3: Username enumeration, coordination scoring, network graph)

---

## 1. Architectural Principles

1. **Ingest Once, Normalize Once**: Raw source files are ingested and transformed into immutable canonical JSONL records. Downstream consumers (frontend clone and AI/ML analysis models) consume the exact same normalized records without diverging.
2. **Strict Provenance**: Every normalized record retains its originating dataset name (`source_dataset`), collection batch ID (`collection_run_id`), and raw row pointer (`raw_record_reference`).
3. **No Data Fabrication**: Missing attributes remain `null` or empty lists. The pipeline never invents engagement numbers, geographic coordinates, or relationship links.
4. **Explicit Historical Labelling**: All imported records carry `"data_mode": "historical"`. Replayed or archived data is never represented as live social media activity.

---

## 2. Canonical Record Schema Definition

Each normalized record represents a discrete post, reply, retweet, or comment serialized as a JSON object within JSONL streams.

### Complete Field Specification

| Field Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `record_id` | `string` | **No** | *Required* | Globally unique, stable identifier. Formatted as `<dataset_prefix>_<native_id>` (e.g. `fp_1376739399593910273` or `ira_914580356430536707`). |
| `platform` | `string` | **No** | `"twitter"` | Target social platform identifier (`twitter`, `x`, `youtube`, `telegram`, `reddit`). |
| `record_type` | `string` | **No** | `"post"` | Post classification: `post`, `reply`, `repost`, `quote`, `comment`, `message`. |
| `post_id` | `string` | **No** | *Required* | Source-native platform identifier as a string (avoids float precision loss). |
| `author_id` | `string` | Yes | `null` | Platform-native unique author/user identifier. |
| `author_name` | `string` | **No** | `"unknown"` | Author handle or username (without `@` prefix). |
| `author_display_name` | `string` | Yes | `null` | Human-readable public display name or pseudonym. |
| `text` | `string` | Yes | `null` | Original, unedited text content of the post. |
| `language` | `string` | Yes | `null` | ISO 639-1 language code or declared language name (e.g., `en`, `hi`, `und`, `english`). |
| `created_at` | `string` | Yes | `null` | Original publication timestamp formatted in strict ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`). |
| `collected_at` | `string` | **No** | *Auto UTC* | Timestamp when this record was ingested and normalized by the pipeline. |
| `parent_id` | `string` | Yes | `null` | Native post ID of the root conversation or parent submission. |
| `reply_to_id` | `string` | Yes | `null` | Native post ID of the direct message being replied to (for conversational threads). |
| `repost_of_id` | `string` | Yes | `null` | Native post ID or original author of the retweeted/reposted content. |
| `hashtags` | `array[str]` | **No** | `[]` | List of extracted hashtags (normalized without leading `#`). |
| `mentions` | `array[str]` | **No** | `[]` | List of mentioned user handles (normalized without leading `@`). |
| `urls` | `array[str]` | **No** | `[]` | List of external URLs and expanded `t.co` hyperlinks embedded in the post. |
| `media_reference` | `array[obj]` | **No** | `[]` | List of media objects: `[{"type": "photo|video", "fullUrl": "...", "previewUrl": "..."}]`. |
| `engagement` | `object` | **No** | `{}` | Key-value dictionary of public engagement metrics (`likes`, `retweets`, `replies`, `quotes`). |
| `source_url` | `string` | Yes | `null` | Canonical public permalink to the original post (e.g. `https://x.com/...`). |
| `source_dataset` | `string` | **No** | *Required* | Originating dataset label: `farmers_protest_tweets` or `russian_ira_tweets`. |
| `collection_run_id` | `string` | **No** | *Required* | Unique batch execution ID (e.g. `NORM_RUN_20261023_105859`). |
| `raw_record_reference` | `string` | **No** | *Required* | Pointer to raw source file and row offset (e.g. `farmers_protest_tweets/tweets.csv#142`). |
| `schema_version` | `string` | **No** | `"1.0"` | Canonical schema specification version. |
| `data_mode` | `string` | **No** | `"historical"` | Execution mode: `historical`, `live`, or `replay`. |
| `metadata` | `object` | **No** | `{}` | Preserved platform/source-specific attributes that do not map into universal fields. |

---

## 3. Dataset Mapping Matrices

### A. Farmers Protest Dataset Mapping (`farmers protest tweets/`)

Raw sources: `tweets.csv` (1.81 GB) and `users.csv` (85.1 MB).

| Raw Source Column | Canonical Field | Transformation & Extraction Logic |
| :--- | :--- | :--- |
| `tweetUrl` | `source_url`, `post_id`, `author_name` | Parsed via regex `twitter\.com/([^/]+)/status/(\d+)`. Resolves uncorrupted integer `post_id` and authoritative username. |
| `renderedContent` | `text`, `hashtags`, `mentions`, `urls` | Text content preserved as-is. Regex extraction populates `hashtags`, `mentions`, and `urls`. |
| `date` | `created_at` | Converted from `2021-03-30 03:33:46+00:00` into ISO 8601 UTC. |
| `userId` | `author_id` | Cast from float/string to clean integer string (e.g. `1015969769760096384`). |
| `replyCount` | `engagement.replies` | Parsed as integer. |
| `retweetCount` | `engagement.retweets` | Parsed as integer. |
| `likeCount` | `engagement.likes` | Parsed as integer. |
| `quoteCount` | `engagement.quotes` | Parsed as integer. |
| `media` | `media_reference` | Parsed using safe `ast.literal_eval`. Standardized into `[{"type": "photo", "fullUrl": "...", "previewUrl": "..."}]`. |
| `retweetedTweet` | `record_type`, `repost_of_id` | If present or if text starts with `RT @`, `record_type` is set to `"repost"` and target handle is stored in `repost_of_id`. |
| `quotedTweet` | `record_type` | If present, `record_type` is set to `"quote"`. |
| `users.csv:displayname` | `author_display_name` | Joined via cached user index on `author_name.lower()`. |
| `users.csv:followersCount` | `metadata.user_followers` | Enriched author audience size. |
| `users.csv:verified` | `metadata.user_verified` | Boolean verified badge flag. |
| `users.csv:location` | `metadata.user_location` | Self-reported user location string (never inferred). |

---

### B. Russian Troll / IRA Dataset Mapping (`russian-troll-tweets-master/`)

Raw sources: `IRAhandle_tweets_1.csv` through `IRAhandle_tweets_13.csv`.

| Raw Source Column | Canonical Field | Transformation & Extraction Logic |
| :--- | :--- | :--- |
| `tweet_id` | `post_id`, `record_id` | Native string ID. Prefixed to generate `record_id: "ira_<tweet_id>"`. |
| `author` | `author_name`, `author_display_name` | Author screen name (e.g. `10_GOP`). |
| `external_author_id` | `author_id` | Native Twitter user ID string. |
| `content` | `text`, `hashtags`, `mentions`, `urls` | Tweet body text. Regex extraction for hashtags, mentions, and links. |
| `language` | `language` | Standardized to lowercase (e.g. `english`, `russian`). |
| `publish_date` | `created_at` | Parsed from `%m/%d/%Y %H:%M` into ISO 8601 UTC. |
| `retweet`, `post_type` | `record_type`, `repost_of_id` | If `retweet == 1` or `post_type == 'RETWEET'`, `record_type` becomes `"repost"`. Target author extracted from `RT @<user>:`. |
| `followers` | `engagement.followers` | Account audience size at harvest time. |
| `following` | `engagement.following` | Account following count. |
| `updates` | `engagement.updates` | Total historical post count for the account. |
| `tco1_step1` ... `tco3` | `urls`, `media_reference` | Expanded links parsed; video/photo URLs categorized into `media_reference`. |
| `article_url` | `source_url` | Canonical link to post. |
| `account_category` | `metadata.account_category` | Troll campaign persona (`RightTroll`, `LeftTroll`, `NewsFeed`, `Commercial`). |
| `account_type` | `metadata.account_type` | Political/regional persona orientation. |
| `region` | `metadata.region` | Targeted region profile (e.g. `United States`, `Unknown`). |

---

## 4. Evidence Manifest & Cryptographic Integrity (BSA Section 63)

In accordance with Section 63 Bharatiya Sakshya Adhiniyam (BSA) and digital forensics best practices, all raw inputs and normalized artifacts are hashed using SHA-256 upon generation.

### Evidence Manifest Record Schema

```json
{
  "evidence_id": "EV_09e5837b56e7",
  "case_id": "CASE_DISINFO_HISTORICAL",
  "source_url": "data/normalized/farmers_protest_normalized.jsonl",
---

## 4. On-Demand Evidence Manifest & Integrity Architecture (BSA Section 63)

### On-Demand Architecture
Per operational security and Bharatiya Sakshya Adhiniyam (BSA), 2023 Section 63 standards:
- **No automatic manifest dump**: The data ingestion and normalization pipeline **never** dumps automated manifests across internal ETL files.
- **On-Demand Generation**: An official evidence manifest package is produced **strictly on-demand** when an investigator or user explicitly requests evidence export through the application UI or API (e.g. for a specific case, flagged post, or forensic dossier).
- **Cryptographic Guarantee**: When generated, the manifest bundles SHA-256 byte-level digests, file sizes, capture timestamps, and chain-of-custody metadata to establish non-repudiation in court.

### On-Demand Manifest Format

When requested by the application, the manifest is generated in the following canonical format:

```json
{
  "bsa_section_63_certificate": {
    "certificate_id": "CERT_BSA63_8F2A1C09",
    "generated_at": "2026-10-23T11:30:00.000000+00:00",
    "case_id": "CASE_DISINFO_042",
    "requested_by_officer_id": "OFFICER_PATNA_CYBER_104",
    "purpose": "Forensic evidence submission for disinformation investigation",
    "legal_declaration": "Produced pursuant to Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023. Cryptographic SHA-256 hashes certify that electronic records have not been tampered with, altered, or modified since capture."
  },
  "manifest_id": "MANIFEST_4E79B2D19A0C",
  "total_evidence_items": 1,
  "items": [
    {
      "evidence_id": "EV_09e5837b56e7",
      "case_id": "CASE_DISINFO_042",
      "source_url": "https://x.com/example/status/1376739399593910273",
      "captured_at": "2026-10-23T11:30:00.000000+00:00",
      "filename": "canonical_evidence_record.json",
      "mime_type": "application/json",
      "byte_size": 1420,
      "sha256": "bb6c4ab7915ac741052ebbc4943a760b5051c8a6c26e1a319dbdea8b0572ec0f",
      "perceptual_hash": null,
      "artifact_type": "case_export",
      "tool_version": "vyuh_evidence_v1.0",
      "limitations": [
        "Explicitly requested forensic case evidence export"
      ]
    }
  ]
}
```

---

## 5. Twitter / X Clone Integration Interface Contract

When integrating the previously created Twitter/X clone frontend:

### Data Feed Loading
The clone should ingest lines from `canonical_fixture_1000.jsonl` or `farmers_protest_normalized.jsonl` / `russian_ira_normalized.jsonl`.

### UI Component Field Mapping

| Twitter Clone UI Element | CanonicalRecord JSON Property | Fallback / Behavior |
| :--- | :--- | :--- |
| **Author Name** | `author_display_name` | Fallback to `@author_name` |
| **Handle / Username** | `author_name` | Display as `@${author_name}` |
| **Verified Badge** | `metadata.user_verified` | Show blue badge if `true`, hide if `false` / `null` |
| **Post Body** | `text` | Display plain text with clickable `#hashtags` and `@mentions` |
| **Timestamp** | `created_at` | Format relative time (e.g. `Mar 30, 2021`) |
| **Reply Target** | `reply_to_id` | If present, show `Replying to @...` thread link |
| **Retweet Badge** | `record_type == 'repost'` | Show `Retweeted` indicator with `repost_of_id` |
| **Likes Counter** | `engagement.likes` | Display numeric counter (default `0`) |
| **Retweets Counter** | `engagement.retweets` | Display numeric counter (default `0`) |
| **Replies Counter** | `engagement.replies` | Display numeric counter (default `0`) |
| **Quotes Counter** | `engagement.quotes` | Display numeric counter (default `0`) |
| **Media Attachments** | `media_reference` | Iterate `[{previewUrl, fullUrl, type}]` and render image grid or video card |
| **Historical Badge** | `data_mode == 'historical'` | Render an amber/subtle `ARCHIVED DATASET` badge so analysts know it is simulated historical replay |
| **Source Dataset Tag** | `source_dataset` | Tooltip or pill displaying `Farmers Protest` or `Russian IRA Troll` |

---

## 6. Execution Instructions for Regeneration

To regenerate or scale the normalized datasets:

```bash
# From alpha/VYUH directory:
python -m ingestion.run_normalization --fp-limit 10000 --ira-limit 10000 --fixture-size 1000
```

All processed records will be deduplicated on `record_id`, verified against the SHA-256 evidence manifest, and logged in `logs/audit_log.jsonl`.
