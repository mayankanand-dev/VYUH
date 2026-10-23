# VYUH — Developer 3 Empirical Evaluation & Benchmark Report

**Evaluation Date**: 2026-10-23 17:51:56 UTC  
**Evaluator**: Developer 3  
**Datasets**:
- Ground-Truth State Disinformation: Russian IRA Troll Tweets (`russian_ira_normalized.jsonl`, 25,000 records sampled)
- Baseline Organic & Protest Discussion: Farmers Protest Tweets (`farmers_protest_normalized.jsonl`, 25,000 records sampled)
- Total Unique Evaluated Accounts: 5,111 (38 Russian IRA trolls, 5,073 organic public accounts)

---

## 1. Executive Summary

This report documents empirical validation of Developer 3's coordination detection and behavioural anomaly screening against ground-truth historical disinformation campaigns and organic grassroots discussion.

All metrics are derived from verifiable canonical data without synthetic label fabrication.

---

## 2. Quantitative Benchmark Results

### A. Elevated Coordination Screening (`label == "elevated_coordination_signals"`)

| Metric | Empirical Score | Definition |
| :--- | :---: | :--- |
| **Precision** | **0.0000** | Ratio of flagged accounts that were confirmed IRA trolls ($rac{TP}{TP + FP}$) |
| **Recall** | **0.0000** | Ratio of confirmed IRA trolls successfully surfaced ($rac{TP}{TP + FN}$) |
| **F1 Score** | **0.0000** | Harmonic mean of precision and recall |
| **False Positive Rate (FPR)** | **0.0014** | Organic accounts erroneously flagged as elevated coordination ($rac{FP}{FP + TN}$) |

**Confusion Matrix**:
- **True Positives (TP)**: 0
- **False Positives (FP)**: 7
- **True Negatives (TN)**: 5066
- **False Negatives (FN)**: 38

---

### B. Behavioural Anomaly Screening Performance (`score_type == "anomaly"`)

| Metric | Empirical Score | Definition |
| :--- | :---: | :--- |
| **Precision** | **0.0000** | Flagged anomalies confirmed as inauthentic troll personas |
| **Recall** | **0.0000** | Disinformation accounts exhibiting anomalous cadence/repetition |
| **F1 Score** | **0.0000** | Harmonic mean of precision and recall |
| **False Positive Rate (FPR)** | **0.0012** | Organic accounts displaying atypical posting velocity |

**Confusion Matrix**:
- **True Positives (TP)**: 0
- **False Positives (FP)**: 6
- **True Negatives (TN)**: 5067
- **False Negatives (FN)**: 38

---

## 3. Analysis of False Positives & Organic Discussion

1. **Why do organic accounts trigger coordination signals?**
   - **Shared Viral Links**: Citizen activists frequently amplify official protest petition links and press releases within narrow time windows ($\Delta t \le 300	ext{s}$).
   - **Copypasta Statements**: Slogans (e.g. `#StopHateAgainstFarmers`) are copy-pasted organically by thousands of distinct human users without centralized automated coordination.
2. **Mitigation Implemented**:
   - The multi-signal agreement heuristic requires cross-signal concurrence (e.g., temporal sync AND URL repetition AND burst density) to trigger the `elevated_coordination_signals` threshold ($0.65$).
   - Standalone URL or text repetition without synchronized burst cadence is classified as `needs_review` or `low_evidence`.

---

## 4. Methodological Limitations

- Historical archives represent discrete time windows; real-time campaigns may utilize adaptive rate-limiting or linguistic variation to evade exact text matching.
- Anomaly scores identify distribution outliers; they do not prove that an account is an automated bot.
- All high-risk alerts must be routed to human investigative workflows before legal or regulatory action.
