"""Behavioural anomaly screening module.

Screens accounts for statistical anomalies in cadence, content repetition, and burst patterns.
Combines rule-based explainability with an optional Isolation Forest baseline.
Supports evaluating against pre-trained historical model baselines.

Adheres strictly to Section 3.F of Master Prompt:
- Anomaly score is NEVER labeled as a bot classification
- Safe handling of small samples, missing timestamps, and constant features
- Clearly documents model parameters, training sample size, and limitations
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

from dev3.schemas import AnalysisResult, AccountFeatures
from dev3.config import DEFAULT_CONFIG, Dev3Config


DEFAULT_BASELINE_MODEL_PATH = Path("models/anomaly_detector_baseline.joblib")


def screen_account_anomalies(
    features_by_account: Dict[str, AccountFeatures],
    config: Dev3Config = DEFAULT_CONFIG,
    pretrained_model_path: Optional[Path] = DEFAULT_BASELINE_MODEL_PATH,
) -> Dict[str, AnalysisResult]:
    """Screen accounts for cadence, repetition, and behavioural anomalies.
    
    Args:
        features_by_account: Dict of AccountFeatures per account
        config: Analysis configuration
        pretrained_model_path: Optional path to serialized historical baseline model
        
    Returns:
        Dict mapping account_id -> AnalysisResult
    """
    results: Dict[str, AnalysisResult] = {}
    eligible_accounts: List[str] = []
    feature_matrix: List[List[float]] = []

    # Prepare feature vectors for multi-record accounts
    for acct_id, feat in features_by_account.items():
        if feat.record_count < config.min_posts_for_anomaly:
            # Insufficient records for cadence statistics
            results[acct_id] = AnalysisResult(
                entity_id=acct_id,
                task="behavioural_anomaly_screening",
                model_or_algorithm="cadence_rule_baseline",
                version="1.0.0",
                label="insufficient_history",
                score=0.0,
                score_type="anomaly",
                explanation=[f"Account has only {feat.record_count} post(s); cadence anomaly detection requires >= {config.min_posts_for_anomaly} posts."],
                evidence_record_ids=list(feat.evidence_record_ids),
                threshold=0.5,
                limitations=["Insufficient post history to evaluate interval distributions."],
            )
            continue

        # Extract numerical features
        rate = feat.post_rate_per_hour
        burst = float(feat.max_burst_count)
        text_rep = feat.exact_text_repetition_ratio
        url_rep = feat.repeated_url_ratio
        repost_ratio = feat.repost_ratio
        median_int = feat.inter_post_intervals_sec.get("median") or 0.0

        vec = [rate, burst, text_rep, url_rep, repost_ratio, median_int]
        eligible_accounts.append(acct_id)
        feature_matrix.append(vec)

    # Check if a pre-trained baseline model artifact exists
    iso_forest_scores: Dict[str, float] = {}
    model_provenance = "cadence_rule_engine"
    pretrained_meta: Dict[str, Any] = {}

    if eligible_accounts:
        X = np.array(feature_matrix, dtype=float)
        X = np.nan_to_num(X, nan=0.0, posinf=1e5, neginf=0.0)

        # Attempt to load pre-trained historical baseline
        loaded_pretrained = False
        if pretrained_model_path and pretrained_model_path.exists():
            try:
                artifact = joblib.load(pretrained_model_path)
                iso = artifact["model"]
                scaler = artifact["scaler"]
                X_scaled = scaler.transform(X)
                raw_scores = -iso.score_samples(X_scaled)

                min_s = artifact.get("min_raw_score", float(raw_scores.min()))
                max_s = artifact.get("max_raw_score", float(raw_scores.max()))
                denom = max(1e-6, max_s - min_s)
                norm_scores = np.clip((raw_scores - min_s) / denom, 0.0, 1.0)

                for idx, acct in enumerate(eligible_accounts):
                    iso_forest_scores[acct] = float(norm_scores[idx])

                loaded_pretrained = True
                model_provenance = "calibrated_historical_isolation_forest"
                pretrained_meta = {
                    "trained_accounts": artifact.get("total_accounts_trained"),
                    "contamination": artifact.get("contamination"),
                }
            except Exception:
                loaded_pretrained = False

        # Fallback to in-memory Isolation Forest if pre-trained model not found and sample is adequate
        if not loaded_pretrained and len(eligible_accounts) >= 10:
            try:
                iso = IsolationForest(
                    contamination=config.anomaly_contamination,
                    random_state=42,
                    n_estimators=100,
                )
                iso.fit(X)
                raw_scores = -iso.score_samples(X)
                min_s, max_s = raw_scores.min(), raw_scores.max()
                norm_scores = (raw_scores - min_s) / (max_s - min_s + 1e-8)

                for idx, acct in enumerate(eligible_accounts):
                    iso_forest_scores[acct] = float(norm_scores[idx])
                model_provenance = "in_memory_isolation_forest_sample"
            except Exception:
                pass

    # Process all eligible accounts
    for idx, acct_id in enumerate(eligible_accounts):
        feat = features_by_account[acct_id]
        explanations = []
        rule_anomaly_points = 0.0

        # Rule 1: High burst posting
        burst_ratio = feat.max_burst_count / max(1, feat.record_count)
        if feat.max_burst_count >= 5 and burst_ratio > 0.6:
            rule_anomaly_points += 0.3
            explanations.append(f"High burst concentration: {feat.max_burst_count} posts within burst window ({round(burst_ratio * 100, 1)}% of all observed posts)")

        # Rule 2: Content repetition
        if feat.exact_text_repetition_ratio > 0.4:
            rule_anomaly_points += 0.3
            explanations.append(f"Elevated exact text repetition: {round(feat.exact_text_repetition_ratio * 100, 1)}% duplicate content")

        # Rule 3: Extreme posting rate
        if feat.post_rate_per_hour > 30.0:
            rule_anomaly_points += 0.25
            explanations.append(f"High posting velocity: {feat.post_rate_per_hour} posts/hour across observation window")

        # Rule 4: High repeated URL posting
        if feat.repeated_url_ratio > 0.5:
            rule_anomaly_points += 0.2
            explanations.append(f"Elevated repeated URL sharing: {round(feat.repeated_url_ratio * 100, 1)}% of link posts contain duplicated URLs")

        # Combine with Isolation Forest if available
        if acct_id in iso_forest_scores:
            iso_score = iso_forest_scores[acct_id]
            combined_score = round(min(1.0, 0.5 * rule_anomaly_points + 0.5 * iso_score), 4)
            if model_provenance == "calibrated_historical_isolation_forest":
                explanations.append(
                    f"Calibrated historical Isolation Forest outlier score: {round(iso_score, 3)} "
                    f"(trained on {pretrained_meta.get('trained_accounts')} historical accounts)"
                )
            else:
                explanations.append(f"Isolation Forest outlier score: {round(iso_score, 3)} (sample size: {len(eligible_accounts)})")
        else:
            combined_score = round(min(1.0, rule_anomaly_points), 4)

        # Determine categorical label
        if combined_score >= 0.6:
            label = "anomalous_cadence_or_content"
        elif combined_score >= 0.35:
            label = "moderate_cadence_variation"
        else:
            label = "normal_behaviour"

        if not explanations:
            explanations.append("Activity cadence, burst frequency, and content diversity fall within expected baselines.")

        results[acct_id] = AnalysisResult(
            entity_id=acct_id,
            task="behavioural_anomaly_screening",
            model_or_algorithm=model_provenance,
            version="1.0.0",
            label=label,
            score=combined_score,
            score_type="anomaly",
            explanation=explanations,
            evidence_record_ids=list(feat.evidence_record_ids)[:15],
            threshold=0.6,
            limitations=[
                "Anomaly screening is an unsupervised outlier detector and DOES NOT constitute bot or automated account classification.",
                "Legitimate accounts (e.g. news wires, emergency alerts, active activists) routinely exhibit burst cadence and repetitive links.",
                "Score is an uncalibrated statistical distance metric.",
            ],
        )

    return results
