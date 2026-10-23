"""Full-scale streaming normalization orchestrator for VYUH (Dev 1).

Processes FULL Farmers Protest tweets (1.08M rows) and Russian IRA tweets (2.94M rows)
into shared CanonicalRecord JSONL files with zero artificial limits.

NOTE: Evidence manifests are strictly on-demand (BSA Section 63) and are NEVER
dumped automatically during batch normalization; they are only produced when explicitly
requested through the application.
"""

import argparse
import csv
import json
import logging
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Set, Optional

# Increase CSV field size limit for large tweet payloads
csv.field_size_limit(20_000_000)

from ingestion.models import CanonicalRecord, AuditLogEntry
from ingestion.normalizers.farmers_protest_normalizer import normalize_farmers_protest_row
from ingestion.normalizers.russian_ira_normalizer import normalize_russian_ira_row

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("vyuh.ingestion")


def load_user_metadata_cache(users_csv_path: Path) -> Dict[str, Dict[str, Any]]:
    """Load complete user metadata cache keyed by lowercase username without arbitrary caps."""
    user_cache = {}
    if not users_csv_path.exists():
        logger.warning(f"Users file not found: {users_csv_path}")
        return user_cache

    logger.info(f"Loading full user metadata cache from {users_csv_path.name}...")
    t0 = time.time()
    with open(users_csv_path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uname = (row.get("username") or "").strip()
            if uname:
                user_cache[uname.lower()] = {
                    "username": uname,
                    "displayname": row.get("displayname"),
                    "followersCount": row.get("followersCount"),
                    "friendsCount": row.get("friendsCount"),
                    "verified": row.get("verified"),
                    "location": row.get("location"),
                }
    elapsed = time.time() - t0
    logger.info(f"Loaded {len(user_cache):,} total user profiles in {elapsed:.2f}s.")
    return user_cache


def log_audit_event(audit_log_path: Path, action: str, target: str, details: Dict[str, Any]):
    """Append event to audit log JSONL."""
    audit_log_path.parent.mkdir(parents=True, exist_ok=True)
    entry = AuditLogEntry(
        event_id=f"AUD_{uuid.uuid4().hex[:12]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        action=action,
        target=target,
        details=details,
        sha256_checkpoint=None,
    )
    with open(audit_log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry.model_dump(mode="json")) + "\n")


def process_farmers_protest(
    tweets_csv_path: Path,
    users_csv_path: Path,
    output_jsonl_path: Path,
    limit: int = 0,
    run_id: str = "run_fp_full",
) -> int:
    """Normalize full Farmers Protest dataset with high-throughput streaming."""
    target_desc = f"limit: {limit:,}" if limit > 0 else "FULL DATASET (all 1.08M rows)"
    logger.info(f"Starting Farmers Protest normalization ({target_desc})...")
    output_jsonl_path.parent.mkdir(parents=True, exist_ok=True)

    user_cache = load_user_metadata_cache(users_csv_path)

    saved_count = 0
    t0 = time.time()
    seen_ids: Set[str] = set()

    with open(tweets_csv_path, "r", encoding="utf-8", errors="ignore", newline="") as in_f, \
         open(output_jsonl_path, "w", encoding="utf-8") as out_f:

        reader = csv.DictReader(in_f)
        for idx, row in enumerate(reader):
            if limit > 0 and saved_count >= limit:
                break

            # Fast author extraction from tweetUrl for user cache lookup
            url_author = None
            raw_url = row.get("tweetUrl")
            if raw_url:
                parts = raw_url.split("/")
                if len(parts) >= 4 and parts[2] in ("twitter.com", "x.com"):
                    url_author = parts[3].lower()

            user_meta = user_cache.get(url_author) if url_author else None

            rec = normalize_farmers_protest_row(row, idx + 1, run_id, user_meta)
            if not rec:
                continue

            # Deduplication by post_id
            if rec.post_id in seen_ids:
                continue
            seen_ids.add(rec.post_id)

            out_f.write(json.dumps(rec.model_dump(mode="json"), ensure_ascii=False) + "\n")
            saved_count += 1

            if saved_count % 100000 == 0:
                elapsed = time.time() - t0
                rate = saved_count / elapsed if elapsed > 0 else 0
                logger.info(f"  -> Farmers Protest: {saved_count:,} records written ({rate:.0f} rec/s)...")

    elapsed = time.time() - t0
    rate = saved_count / elapsed if elapsed > 0 else 0
    logger.info(f"Farmers Protest normalization complete: {saved_count:,} records in {elapsed:.1f}s ({rate:.0f} rec/s).")
    return saved_count


def process_russian_ira(
    ira_dir_path: Path,
    output_jsonl_path: Path,
    limit: int = 0,
    run_id: str = "run_ira_full",
) -> int:
    """Normalize full Russian IRA troll dataset across all CSV parts with streaming."""
    target_desc = f"limit: {limit:,}" if limit > 0 else "FULL DATASET (all 13 CSVs, 2.94M rows)"
    logger.info(f"Starting Russian IRA normalization ({target_desc})...")
    output_jsonl_path.parent.mkdir(parents=True, exist_ok=True)

    csv_files = sorted(list(ira_dir_path.rglob("IRAhandle_tweets_*.csv")))
    logger.info(f"Found {len(csv_files)} IRA CSV files to ingest.")

    saved_count = 0
    t0 = time.time()
    seen_ids: Set[str] = set()

    with open(output_jsonl_path, "w", encoding="utf-8") as out_f:
        for file_p in csv_files:
            if limit > 0 and saved_count >= limit:
                break

            logger.info(f"  Reading from {file_p.name} (progress: {saved_count:,} written so far)...")
            with open(file_p, "r", encoding="utf-8", errors="ignore", newline="") as in_f:
                reader = csv.DictReader(in_f)
                for idx, row in enumerate(reader):
                    if limit > 0 and saved_count >= limit:
                        break

                    rec = normalize_russian_ira_row(row, file_p.name, idx + 1, run_id)
                    if not rec:
                        continue

                    # Deduplication
                    if rec.post_id in seen_ids:
                        continue
                    seen_ids.add(rec.post_id)

                    out_f.write(json.dumps(rec.model_dump(mode="json"), ensure_ascii=False) + "\n")
                    saved_count += 1

                    if saved_count % 100000 == 0:
                        elapsed = time.time() - t0
                        rate = saved_count / elapsed if elapsed > 0 else 0
                        logger.info(f"  -> Russian IRA: {saved_count:,} records written ({rate:.0f} rec/s)...")

    elapsed = time.time() - t0
    rate = saved_count / elapsed if elapsed > 0 else 0
    logger.info(f"Russian IRA normalization complete: {saved_count:,} records in {elapsed:.1f}s ({rate:.0f} rec/s).")
    return saved_count


def create_combined_fixture(
    fp_jsonl: Path,
    ira_jsonl: Path,
    combined_fixture_path: Path,
    samples_per_dataset: int = 500,
) -> int:
    """Create a balanced combined sample fixture for rapid UI testing and NLP/graph prototyping."""
    logger.info(f"Extracting balanced fixture ({samples_per_dataset} from each dataset)...")
    combined_fixture_path.parent.mkdir(parents=True, exist_ok=True)

    total = 0
    with open(combined_fixture_path, "w", encoding="utf-8") as out_f:
        # Farmers Protest
        if fp_jsonl.exists():
            with open(fp_jsonl, "r", encoding="utf-8") as in_f:
                for i, line in enumerate(in_f):
                    if i >= samples_per_dataset:
                        break
                    out_f.write(line)
                    total += 1

        # Russian IRA
        if ira_jsonl.exists():
            with open(ira_jsonl, "r", encoding="utf-8") as in_f:
                for i, line in enumerate(in_f):
                    if i >= samples_per_dataset:
                        break
                    out_f.write(line)
                    total += 1

    logger.info(f"Fixture created with {total} records at {combined_fixture_path.name}")
    return total


def main():
    parser = argparse.ArgumentParser(description="VYUH Ingestion & Normalization Runner (Dev 1)")
    parser.add_argument("--fp-limit", type=int, default=0, help="Max records for Farmers Protest (0 for full dataset)")
    parser.add_argument("--ira-limit", type=int, default=0, help="Max records for Russian IRA (0 for full dataset)")
    parser.add_argument("--fixture-size", type=int, default=500, help="Records per source in combined fixture")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent
    fp_tweets_csv = base_dir / "farmers protest tweets" / "tweets.csv"
    fp_users_csv = base_dir / "farmers protest tweets" / "users.csv"
    ira_dir = base_dir / "russian-troll-tweets-master"

    norm_dir = base_dir / "data" / "normalized"
    logs_dir = base_dir / "logs"

    fp_out = norm_dir / "farmers_protest_normalized.jsonl"
    ira_out = norm_dir / "russian_ira_normalized.jsonl"
    fixture_out = norm_dir / "canonical_fixture_1000.jsonl"
    audit_log = logs_dir / "audit_log.jsonl"

    run_id = f"NORM_RUN_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

    print("\n" + "=" * 65)
    print("  VYUH DEV 1: DATA INGESTION & CANONICAL NORMALIZATION PIPELINE")
    print("=" * 65)
    print(f"Run ID        : {run_id}")
    print(f"Output Dir    : {norm_dir}")
    print(f"FP Limit      : {'FULL DATASET (all 1.08M rows)' if args.fp_limit <= 0 else f'{args.fp_limit:,}'}")
    print(f"IRA Limit     : {'FULL DATASET (all 2.94M rows)' if args.ira_limit <= 0 else f'{args.ira_limit:,}'}")
    print("-" * 65)

    # 1. Process Farmers Protest
    fp_count = process_farmers_protest(
        fp_tweets_csv, fp_users_csv, fp_out, limit=args.fp_limit, run_id=run_id
    )

    # 2. Process Russian IRA
    ira_count = process_russian_ira(
        ira_dir, ira_out, limit=args.ira_limit, run_id=run_id
    )

    # 3. Create combined fixture
    fixture_count = create_combined_fixture(
        fp_out, ira_out, fixture_out, samples_per_dataset=args.fixture_size
    )

    # 4. Audit Logging
    log_audit_event(
        audit_log,
        action="FULL_CANONICAL_NORMALIZATION_COMPLETED",
        target="data/normalized",
        details={
            "run_id": run_id,
            "farmers_protest_records": fp_count,
            "russian_ira_records": ira_count,
            "fixture_records": fixture_count,
        },
    )

    print("\n" + "=" * 65)
    print("  NORMALIZATION PIPELINE EXECUTION SUMMARY")
    print("=" * 65)
    print(f"Farmers Protest Normalized Records : {fp_count:,}")
    print(f"Russian IRA Normalized Records     : {ira_count:,}")
    print(f"Total Normalized Records           : {fp_count + ira_count:,}")
    print(f"Combined Fixture Records           : {fixture_count:,}")
    print(f"Audit Log Updated                  : {audit_log}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
