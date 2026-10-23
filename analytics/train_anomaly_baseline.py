"""Train and calibrate the unsupervised behavioural anomaly model on historical canonical streams.

Trains an Isolation Forest on account cadence, repetition, and burst features
derived from the normalized historical datasets (Russian IRA & Farmers Protest).
Saves the serialized model artifact for inference in production pipelines.
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from analytics.account_features import extract_account_features
from dev3.pipeline import stream_canonical_records
from dev3.schemas import current_utc_iso


FEATURE_NAMES = [
    "post_rate_per_hour",
    "max_burst_count",
    "exact_text_repetition_ratio",
    "repeated_url_ratio",
    "repost_ratio",
    "median_inter_post_interval",
]


def extract_feature_matrix(
    features_by_account: Dict[str, Any],
    min_posts: int = 2,
) -> tuple[List[str], np.ndarray]:
    """Extract numerical feature vectors from account profiles."""
    account_ids: List[str] = []
    matrix: List[List[float]] = []

    for acct_id, feat in features_by_account.items():
        if feat.record_count < min_posts:
            continue

        rate = float(feat.post_rate_per_hour)
        burst = float(feat.max_burst_count)
        text_rep = float(feat.exact_text_repetition_ratio)
        url_rep = float(feat.repeated_url_ratio)
        repost = float(feat.repost_ratio)
        median_int = float(feat.inter_post_intervals_sec.get("median") or 0.0)

        matrix.append([rate, burst, text_rep, url_rep, repost, median_int])
        account_ids.append(acct_id)

    if not matrix:
        return [], np.empty((0, len(FEATURE_NAMES)))

    X = np.array(matrix, dtype=float)
    X = np.nan_to_num(X, nan=0.0, posinf=1e5, neginf=0.0)
    return account_ids, X


def train_anomaly_model(
    canonical_files: List[Path],
    records_per_file: Optional[int] = 100000,
    contamination: float = 0.08,
    n_estimators: int = 200,
    output_model_path: Path = Path("models/anomaly_detector_baseline.joblib"),
) -> Dict[str, Any]:
    """Train Isolation Forest on accounts sampled from canonical files."""
    print("[INFO] Starting Anomaly Model Training...")
    total_records = 0

    def stream_all_records():
        nonlocal total_records
        for p in canonical_files:
            if not p.exists():
                print(f"[WARN] File not found: {p}; skipping.")
                continue
            print(f"[INFO] Ingesting up to {records_per_file} records from {p.name}...")
            count = 0
            for rec in stream_canonical_records(p, limit=records_per_file):
                yield rec
                count += 1
                total_records += 1
                if count % 25000 == 0:
                    print(f"       ... streamed {count:,} records from {p.name}")
            print(f"       Completed {count:,} records from {p.name}.")

    print("[INFO] Extracting account features across input streams...")
    features = extract_account_features(stream_all_records())

    if total_records == 0:
        raise ValueError("No records found to train on.")

    print(f"[INFO] Total training records loaded: {total_records:,}")
    print(f"[INFO] Extracted features for {len(features):,} unique accounts.")

    account_ids, X = extract_feature_matrix(features, min_posts=2)
    print(f"[INFO] Eligible multi-post accounts for baseline training: {len(account_ids)}")

    if len(account_ids) < 10:
        raise ValueError(f"Insufficient eligible accounts ({len(account_ids)}) to fit Isolation Forest.")

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Isolation Forest
    print(f"[INFO] Fitting IsolationForest (n_estimators={n_estimators}, contamination={contamination})...")
    iso = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=42,
    )
    iso.fit(X_scaled)

    # Compute baseline score distribution
    raw_scores = -iso.score_samples(X_scaled)
    min_score, max_score = float(raw_scores.min()), float(raw_scores.max())

    output_model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": iso,
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "trained_at": current_utc_iso(),
        "total_records_ingested": total_records,
        "total_accounts_trained": len(account_ids),
        "source_files": [str(p) for p in canonical_files if p.exists()],
        "min_raw_score": min_score,
        "max_raw_score": max_score,
        "contamination": contamination,
        "n_estimators": n_estimators,
    }
    joblib.dump(artifact, output_model_path)
    print(f"[SUCCESS] Model artifact persisted to {output_model_path}")

    # Write human-readable metadata
    meta_path = output_model_path.parent / "anomaly_model_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        meta_json = {k: v for k, v in artifact.items() if k not in ("model", "scaler")}
        json.dump(meta_json, f, indent=2)

    return meta_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Train VYUH Behavioural Anomaly Baseline")
    parser.add_argument(
        "--files",
        nargs="+",
        default=[
            "data/normalized/farmers_protest_normalized.jsonl",
            "data/normalized/russian_ira_normalized.jsonl",
        ],
        help="Canonical JSONL files to ingest",
    )
    parser.add_argument("--limit-per-file", type=int, default=15000, help="Max records per file")
    parser.add_argument("--contamination", type=float, default=0.08, help="Outlier contamination rate")
    parser.add_argument("--output", type=Path, default=Path("models/anomaly_detector_baseline.joblib"))

    args = parser.parse_args()
    paths = [Path(f) for f in args.files]

    train_anomaly_model(
        canonical_files=paths,
        records_per_file=args.limit_per_file,
        contamination=args.contamination,
        output_model_path=args.output,
    )


if __name__ == "__main__":
    main()
