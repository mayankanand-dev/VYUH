"""Evaluation and benchmarking module for coordination detection and anomaly models.

Benchmarks performance on ground-truth labeled historical campaign data
(Russian IRA troll personas vs Farmers Protest public discussion).
Computes Precision, Recall, F1, False Positive Rate (FPR), and score distributions.

Adheres strictly to Section 9 of Master Prompt.
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

from analytics.account_features import extract_account_features, resolve_account_key
from analytics.synchronization import detect_coordination_edges
from analytics.campaign_score import compute_account_coordination_scores
from analytics.anomaly_detection import screen_account_anomalies
from dev3.pipeline import stream_canonical_records
from dev3.config import DEFAULT_CONFIG


def run_evaluation_benchmark(
    farmers_path: Path = Path("data/normalized/farmers_protest_normalized.jsonl"),
    ira_path: Path = Path("data/normalized/russian_ira_normalized.jsonl"),
    sample_records_per_dataset: int = 5000,
    output_report_path: Path = Path("docs/DEV3_EVALUATION_REPORT.md"),
) -> Dict[str, Any]:
    """Run empirical benchmark and generate markdown evaluation report."""
    print("[EVAL] Loading evaluation datasets...")
    farmers_records = list(stream_canonical_records(farmers_path, limit=sample_records_per_dataset))
    ira_records = list(stream_canonical_records(ira_path, limit=sample_records_per_dataset))

    print(f"[EVAL] Loaded {len(farmers_records)} Farmers Protest (organic/protest) records.")
    print(f"[EVAL] Loaded {len(ira_records)} Russian IRA (state-sponsored troll) records.")

    combined_records = farmers_records + ira_records

    # Track ground-truth labels for evaluation:
    # 1 = Ground-truth state-sponsored disinformation persona (IRA)
    # 0 = Organic public protest / citizen discussion
    ground_truth_by_account: Dict[str, int] = {}
    persona_categories: Dict[str, str] = {}

    for r in ira_records:
        key, _, _ = resolve_account_key(r)
        ground_truth_by_account[key] = 1
        meta = r.get("metadata") or {}
        if "account_category" in meta:
            persona_categories[key] = meta["account_category"]

    for r in farmers_records:
        key, _, _ = resolve_account_key(r)
        if key not in ground_truth_by_account:
            ground_truth_by_account[key] = 0

    print("[EVAL] Extracting account features...")
    features = extract_account_features(combined_records)
    print(f"[EVAL] Profiling {len(features)} total accounts.")

    print("[EVAL] Detecting coordination edges...")
    edges, _ = detect_coordination_edges(combined_records, sync_window_seconds=300)
    print(f"[EVAL] Discovered {len(edges)} coordination edges.")

    print("[EVAL] Computing coordination campaign scores...")
    coord_scores = compute_account_coordination_scores(features, edges)

    print("[EVAL] Running behavioural anomaly screening against trained baseline...")
    anomaly_scores = screen_account_anomalies(features)

    # Benchmark: evaluate screening performance
    y_true: List[int] = []
    y_pred_elevated: List[int] = []
    y_pred_review: List[int] = []
    y_pred_anomaly: List[int] = []

    for acct_id, label in ground_truth_by_account.items():
        if acct_id not in features:
            continue
        y_true.append(label)

        c_res = coord_scores.get(acct_id)
        is_elevated = 1 if c_res and c_res.label == "elevated_coordination_signals" else 0
        is_review = 1 if c_res and c_res.label in ("elevated_coordination_signals", "needs_review") else 0
        y_pred_elevated.append(is_elevated)
        y_pred_review.append(is_review)

        a_res = anomaly_scores.get(acct_id)
        is_anomaly = 1 if a_res and a_res.label == "anomalous_cadence_or_content" else 0
        y_pred_anomaly.append(is_anomaly)

    def calc_metrics(actual: List[int], predicted: List[int]) -> Dict[str, Any]:
        tp = sum(1 for a, p in zip(actual, predicted) if a == 1 and p == 1)
        fp = sum(1 for a, p in zip(actual, predicted) if a == 0 and p == 1)
        tn = sum(1 for a, p in zip(actual, predicted) if a == 0 and p == 0)
        fn = sum(1 for a, p in zip(actual, predicted) if a == 1 and p == 0)

        precision = tp / max(1, tp + fp)
        recall = tp / max(1, tp + fn)
        f1 = (2 * precision * recall) / max(1e-6, precision + recall)
        fpr = fp / max(1, fp + tn)

        return {
            "tp": tp, "fp": fp, "tn": tn, "fn": fn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "fpr": round(fpr, 4),
        }

    elevated_metrics = calc_metrics(y_true, y_pred_elevated)
    review_metrics = calc_metrics(y_true, y_pred_review)
    anomaly_metrics = calc_metrics(y_true, y_pred_anomaly)

    print("\n[EVAL RESULTS - ELEVATED COORDINATION SIGNALS]")
    print(f"  Precision: {elevated_metrics['precision']:.4f}")
    print(f"  Recall:    {elevated_metrics['recall']:.4f}")
    print(f"  F1 Score:  {elevated_metrics['f1']:.4f}")
    print(f"  FPR:       {elevated_metrics['fpr']:.4f} (TP={elevated_metrics['tp']}, FP={elevated_metrics['fp']}, TN={elevated_metrics['tn']}, FN={elevated_metrics['fn']})")

    print("\n[EVAL RESULTS - BROAD REVIEW THRESHOLD]")
    print(f"  Precision: {review_metrics['precision']:.4f}")
    print(f"  Recall:    {review_metrics['recall']:.4f}")
    print(f"  F1 Score:  {review_metrics['f1']:.4f}")
    print(f"  FPR:       {review_metrics['fpr']:.4f}")

    print("\n[EVAL RESULTS - BEHAVIOURAL ANOMALY SCREENING]")
    print(f"  Precision: {anomaly_metrics['precision']:.4f}")
    print(f"  Recall:    {anomaly_metrics['recall']:.4f}")
    print(f"  F1 Score:  {anomaly_metrics['f1']:.4f}")
    print(f"  FPR:       {anomaly_metrics['fpr']:.4f} (TP={anomaly_metrics['tp']}, FP={anomaly_metrics['fp']}, TN={anomaly_metrics['tn']}, FN={anomaly_metrics['fn']})")

    # Generate Markdown Report
    report_md = f"""# VYUH — Developer 3 Empirical Evaluation & Benchmark Report

**Evaluation Date**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}  
**Evaluator**: Developer 3  
**Datasets**:
- Ground-Truth State Disinformation: Russian IRA Troll Tweets (`russian_ira_normalized.jsonl`, {len(ira_records):,} records sampled)
- Baseline Organic & Protest Discussion: Farmers Protest Tweets (`farmers_protest_normalized.jsonl`, {len(farmers_records):,} records sampled)
- Total Unique Evaluated Accounts: {len(features):,} ({sum(y_true):,} Russian IRA trolls, {len(y_true) - sum(y_true):,} organic public accounts)

---

## 1. Executive Summary

This report documents empirical validation of Developer 3's coordination detection and behavioural anomaly screening against ground-truth historical disinformation campaigns and organic grassroots discussion.

All metrics are derived from verifiable canonical data without synthetic label fabrication.

---

## 2. Quantitative Benchmark Results

### A. Elevated Coordination Screening (`label == "elevated_coordination_signals"`)

| Metric | Empirical Score | Definition |
| :--- | :---: | :--- |
| **Precision** | **{elevated_metrics['precision']:.4f}** | Ratio of flagged accounts that were confirmed IRA trolls ($\frac{{TP}}{{TP + FP}}$) |
| **Recall** | **{elevated_metrics['recall']:.4f}** | Ratio of confirmed IRA trolls successfully surfaced ($\frac{{TP}}{{TP + FN}}$) |
| **F1 Score** | **{elevated_metrics['f1']:.4f}** | Harmonic mean of precision and recall |
| **False Positive Rate (FPR)** | **{elevated_metrics['fpr']:.4f}** | Organic accounts erroneously flagged as elevated coordination ($\frac{{FP}}{{FP + TN}}$) |

**Confusion Matrix**:
- **True Positives (TP)**: {elevated_metrics['tp']}
- **False Positives (FP)**: {elevated_metrics['fp']}
- **True Negatives (TN)**: {elevated_metrics['tn']}
- **False Negatives (FN)**: {elevated_metrics['fn']}

---

### B. Behavioural Anomaly Screening Performance (`score_type == "anomaly"`)

| Metric | Empirical Score | Definition |
| :--- | :---: | :--- |
| **Precision** | **{anomaly_metrics['precision']:.4f}** | Flagged anomalies confirmed as inauthentic troll personas |
| **Recall** | **{anomaly_metrics['recall']:.4f}** | Disinformation accounts exhibiting anomalous cadence/repetition |
| **F1 Score** | **{anomaly_metrics['f1']:.4f}** | Harmonic mean of precision and recall |
| **False Positive Rate (FPR)** | **{anomaly_metrics['fpr']:.4f}** | Organic accounts displaying atypical posting velocity |

**Confusion Matrix**:
- **True Positives (TP)**: {anomaly_metrics['tp']}
- **False Positives (FP)**: {anomaly_metrics['fp']}
- **True Negatives (TN)**: {anomaly_metrics['tn']}
- **False Negatives (FN)**: {anomaly_metrics['fn']}

---

## 3. Analysis of False Positives & Organic Discussion

1. **Why do organic accounts trigger coordination signals?**
   - **Shared Viral Links**: Citizen activists frequently amplify official protest petition links and press releases within narrow time windows ($\Delta t \le 300\text{{s}}$).
   - **Copypasta Statements**: Slogans (e.g. `#StopHateAgainstFarmers`) are copy-pasted organically by thousands of distinct human users without centralized automated coordination.
2. **Mitigation Implemented**:
   - The multi-signal agreement heuristic requires cross-signal concurrence (e.g., temporal sync AND URL repetition AND burst density) to trigger the `elevated_coordination_signals` threshold ($0.65$).
   - Standalone URL or text repetition without synchronized burst cadence is classified as `needs_review` or `low_evidence`.

---

## 4. Methodological Limitations

- Historical archives represent discrete time windows; real-time campaigns may utilize adaptive rate-limiting or linguistic variation to evade exact text matching.
- Anomaly scores identify distribution outliers; they do not prove that an account is an automated bot.
- All high-risk alerts must be routed to human investigative workflows before legal or regulatory action.
"""

    output_report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"[SUCCESS] Evaluation report written to {output_report_path}")
    return {
        "elevated_metrics": elevated_metrics,
        "review_metrics": review_metrics,
        "anomaly_metrics": anomaly_metrics,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate VYUH Coordination and Anomaly Models")
    parser.add_argument("--samples", type=int, default=5000, help="Records to sample per dataset")
    parser.add_argument("--output", type=Path, default=Path("docs/DEV3_EVALUATION_REPORT.md"))
    args = parser.parse_args()

    run_evaluation_benchmark(
        sample_records_per_dataset=args.samples,
        output_report_path=args.output,
    )


if __name__ == "__main__":
    main()
