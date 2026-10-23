"""Temporal Narrative Metrics & Velocity Engine for VYUH (Developer 2).

Conforms strictly to Section 4.B and Section 9 of OSINT_Disinfo_Team_README_Final.md.
Calculates historical post volumes over discrete time windows, detects velocity surges
against statistical baselines, and guarantees explicit historical data mode labelling.
"""

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from intelligence.models import AnalysisResult, ScoreTypeEnum


class NarrativeVelocityEngine:
    """
    Computes temporal metrics, growth velocity, and surge anomaly detection
    for narrative clusters across historical timelines.
    """
    def __init__(self, bucket_freq: str = "daily", surge_std_multiplier: float = 2.0):
        """
        Args:
            bucket_freq: 'hourly' or 'daily'.
            surge_std_multiplier: Number of standard deviations above baseline to flag as a surge.
        """
        self.bucket_freq = bucket_freq
        self.surge_std_multiplier = surge_std_multiplier

    def parse_time_bucket(self, iso_timestamp: Optional[str]) -> Optional[str]:
        """
        Converts an ISO 8601 UTC timestamp into a bucket key.
        e.g. '2021-03-30T03:33:46+00:00' -> '2021-03-30' (daily) or '2021-03-30T03:00:00Z' (hourly).
        """
        if not iso_timestamp:
            return None
        try:
            # Handle ISO string with or without Z
            cleaned = iso_timestamp.replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            if self.bucket_freq == "hourly":
                return dt.strftime("%Y-%m-%dT%H:00:00Z")
            else:
                return dt.strftime("%Y-%m-%d")
        except Exception:
            # Fallback simple string slice for YYYY-MM-DD
            if len(iso_timestamp) >= 10 and iso_timestamp[4] == "-" and iso_timestamp[7] == "-":
                return iso_timestamp[:10]
            return None

    def compute_timeline(
        self,
        cluster_id: str,
        timestamps: List[Optional[str]],
        record_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Computes volume counts across temporal buckets and identifies statistical surges.
        """
        valid_pairs = []
        for i, ts in enumerate(timestamps):
            bucket = self.parse_time_bucket(ts)
            if bucket:
                rid = record_ids[i] if record_ids and i < len(record_ids) else None
                valid_pairs.append((bucket, rid))

        if not valid_pairs:
            return {
                "cluster_id": cluster_id,
                "data_mode": "historical",
                "total_records": 0,
                "baseline_mean": 0.0,
                "baseline_std": 0.0,
                "buckets": [],
                "surges": []
            }

        # Aggregate counts by bucket
        bucket_counts = Counter(b for b, _ in valid_pairs)
        bucket_records = defaultdict(list)
        for b, rid in valid_pairs:
            if rid:
                bucket_records[b].append(rid)

        sorted_buckets = sorted(bucket_counts.keys())
        counts = [bucket_counts[b] for b in sorted_buckets]

        # Calculate historical statistical baseline
        mean_vol = float(np.mean(counts))
        std_vol = float(np.std(counts))
        surge_threshold = mean_vol + (self.surge_std_multiplier * std_vol)

        buckets_data = []
        surges = []

        prev_count = None
        for b in sorted_buckets:
            c = bucket_counts[b]
            growth_rate = 0.0
            if prev_count is not None and prev_count > 0:
                growth_rate = round((c - prev_count) / prev_count, 3)
            prev_count = c

            is_surge = bool(c > surge_threshold and c > 3)
            bucket_entry = {
                "bucket": b,
                "volume": c,
                "growth_rate": growth_rate,
                "is_surge": is_surge,
                "record_ids": bucket_records[b][:5]
            }
            buckets_data.append(bucket_entry)

            if is_surge:
                surges.append({
                    "bucket": b,
                    "volume": c,
                    "surge_magnitude": round(float((c - mean_vol) / max(1e-6, std_vol)), 2),
                    "representative_record_ids": bucket_records[b][:3]
                })

        peak_idx = int(np.argmax(counts))
        return {
            "cluster_id": cluster_id,
            "data_mode": "historical",
            "total_records": len(valid_pairs),
            "baseline_mean": round(mean_vol, 2),
            "baseline_std": round(std_vol, 2),
            "surge_threshold": round(surge_threshold, 2),
            "peak_bucket": sorted_buckets[peak_idx],
            "peak_volume": counts[peak_idx],
            "buckets": buckets_data,
            "surges": surges
        }

    def generate_surge_analysis_results(
        self,
        timeline_data: Dict[str, Any]
    ) -> List[AnalysisResult]:
        """
        Emits canonical Section 5 AnalysisResults for detected narrative volume surges.
        """
        results = []
        cid = timeline_data["cluster_id"]
        surges = timeline_data.get("surges", [])

        for surge in surges:
            bucket = surge["bucket"]
            vol = surge["volume"]
            mag = surge["surge_magnitude"]
            rids = surge["representative_record_ids"]

            results.append(
                AnalysisResult(
                    entity_id=cid,
                    task="narrative_velocity_surge",
                    model_or_algorithm=f"Historical Baseline Z-Score (multiplier={self.surge_std_multiplier})",
                    version="1.0",
                    label="volume_surge_detected",
                    score=mag,
                    score_type=ScoreTypeEnum.ANOMALY.value,
                    explanation=[
                        f"Narrative volume spiked to {vol} posts in bucket {bucket}.",
                        f"Surge magnitude: {mag:.2f} standard deviations above historical baseline (mean={timeline_data['baseline_mean']}).",
                        "Data Mode: Strictly historical collection replay (not live traffic)."
                    ],
                    evidence_record_ids=rids,
                    source_urls=[],
                    threshold=timeline_data["surge_threshold"],
                    limitations=[
                        "Volume surges can be organic breaking news events or coordinated hashtag campaigns.",
                        "Must be cross-referenced with account creation timing and network graphs."
                    ]
                )
            )

        return results

    detect_velocity_surges = generate_surge_analysis_results
