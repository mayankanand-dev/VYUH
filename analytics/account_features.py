"""Account behaviour and feature engineering module.

Calculates behavioural features for accounts across historical canonical streams.
Follows Section 3.A of Master Prompt: no fabricated bot labels, safe zero-division,
explicit missing-data tracking, and explainable statistical distributions.
"""

from collections import Counter, defaultdict
from datetime import datetime, timezone
import math
import statistics
from typing import Any, Dict, Iterable, List, Optional, Tuple

from dev3.schemas import AccountFeatures
from dev3.config import DEFAULT_CONFIG


def parse_iso_utc(ts_str: Optional[str]) -> Optional[datetime]:
    """Parse an ISO 8601 string into a UTC datetime object safely."""
    if not ts_str or not isinstance(ts_str, str):
        return None
    try:
        # Handle trailing Z or offsets
        s = ts_str.strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt
    except Exception:
        return None


def resolve_account_key(record: Dict[str, Any]) -> Tuple[str, str, bool]:
    """Resolve a stable platform-scoped account key.
    
    Returns:
        (account_id, author_name, is_fallback)
    Rule: Never group unrelated unknown authors together.
    """
    platform = str(record.get("platform") or "twitter").strip().lower()
    author_id = record.get("author_id")
    author_name = record.get("author_name")
    record_id = record.get("record_id") or "rec_unknown"

    if author_id and str(author_id).strip() and str(author_id).strip().lower() not in ("null", "none", "unknown"):
        clean_id = str(author_id).strip()
        clean_name = str(author_name or clean_id).strip()
        return f"{platform}:{clean_id}", clean_name, False

    if author_name and str(author_name).strip() and str(author_name).strip().lower() not in ("null", "none", "unknown"):
        clean_name = str(author_name).strip()
        return f"{platform}:handle:{clean_name.lower()}", clean_name, True

    # Unknown author: do NOT group together. Give each record an isolated pseudo-account key.
    return f"{platform}:unresolved:{record_id}", "unknown_author", True


def extract_account_features(
    records: Iterable[Dict[str, Any]],
    burst_window_seconds: int = DEFAULT_CONFIG.burst_window_seconds,
) -> Dict[str, AccountFeatures]:
    """Group canonical records by account identity and extract behavioural features.
    
    Args:
        records: Iterable of canonical record dictionaries.
        burst_window_seconds: Time window in seconds to compute maximum posting bursts.
        
    Returns:
        Dict mapping account_id -> AccountFeatures
    """
    # Group records by account
    grouped_records: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    account_metadata: Dict[str, Dict[str, Any]] = {}

    for rec in records:
        acct_id, name, is_fallback = resolve_account_key(rec)
        grouped_records[acct_id].append(rec)
        if acct_id not in account_metadata:
            account_metadata[acct_id] = {
                "platform": rec.get("platform") or "twitter",
                "author_name": name,
                "is_fallback": is_fallback,
            }

    results: Dict[str, AccountFeatures] = {}

    for acct_id, recs in grouped_records.items():
        meta = account_metadata[acct_id]
        total_records = len(recs)
        evidence_ids = [r.get("record_id") for r in recs if r.get("record_id")]

        # Missing data counters
        missing_ts_count = 0
        missing_text_count = 0
        missing_author_id_count = 0

        # Timestamps parsing
        parsed_timestamps: List[datetime] = []
        for r in recs:
            if not r.get("author_id"):
                missing_author_id_count += 1
            if not r.get("text"):
                missing_text_count += 1
            
            dt = parse_iso_utc(r.get("created_at"))
            if dt:
                parsed_timestamps.append(dt)
            else:
                missing_ts_count += 1

        parsed_timestamps.sort()

        # Observation window and rate
        first_obs: Optional[str] = None
        last_obs: Optional[str] = None
        window_seconds: float = 0.0
        post_rate_per_hour: float = 0.0
        interval_stats: Dict[str, Optional[float]] = {
            "min": None,
            "max": None,
            "median": None,
            "mean": None,
            "p25": None,
            "p75": None,
        }
        max_burst_count: int = 1 if total_records > 0 else 0

        if parsed_timestamps:
            first_obs = parsed_timestamps[0].isoformat()
            last_obs = parsed_timestamps[-1].isoformat()
            window_seconds = max(0.0, (parsed_timestamps[-1] - parsed_timestamps[0]).total_seconds())

            if window_seconds > 0:
                post_rate_per_hour = round((total_records / window_seconds) * 3600.0, 4)
            else:
                post_rate_per_hour = 0.0

            # Inter-post intervals
            if len(parsed_timestamps) > 1:
                intervals = [
                    (parsed_timestamps[i] - parsed_timestamps[i - 1]).total_seconds()
                    for i in range(1, len(parsed_timestamps))
                ]
                intervals.sort()
                n_int = len(intervals)
                
                interval_stats["min"] = round(intervals[0], 2)
                interval_stats["max"] = round(intervals[-1], 2)
                interval_stats["mean"] = round(statistics.mean(intervals), 2)
                interval_stats["median"] = round(statistics.median(intervals), 2)
                
                p25_idx = int(0.25 * n_int)
                p75_idx = min(int(0.75 * n_int), n_int - 1)
                interval_stats["p25"] = round(intervals[p25_idx], 2)
                interval_stats["p75"] = round(intervals[p75_idx], 2)

            # Burst calculation using sliding window (two-pointer)
            left = 0
            for right in range(len(parsed_timestamps)):
                while (parsed_timestamps[right] - parsed_timestamps[left]).total_seconds() > burst_window_seconds:
                    left += 1
                curr_burst = right - left + 1
                if curr_burst > max_burst_count:
                    max_burst_count = curr_burst

        # Post types distribution
        type_counts = Counter(str(r.get("record_type") or "post").lower() for r in recs)
        orig_count = type_counts.get("post", 0)
        reply_count = type_counts.get("reply", 0)
        repost_count = type_counts.get("repost", 0)
        quote_count = type_counts.get("quote", 0)

        original_ratio = round(orig_count / total_records, 4) if total_records else 0.0
        reply_ratio = round(reply_count / total_records, 4) if total_records else 0.0
        repost_ratio = round(repost_count / total_records, 4) if total_records else 0.0
        quote_ratio = round(quote_count / total_records, 4) if total_records else 0.0

        # Exact normalized text repetition
        text_counts = Counter()
        non_empty_text_records = 0
        for r in recs:
            t = r.get("text")
            if t and isinstance(t, str):
                normalized = " ".join(t.strip().lower().split())
                if normalized:
                    text_counts[normalized] += 1
                    non_empty_text_records += 1

        repeated_text_occurrences = sum(count for count in text_counts.values() if count > 1)
        exact_text_rep_ratio = (
            round(repeated_text_occurrences / non_empty_text_records, 4)
            if non_empty_text_records > 0
            else 0.0
        )

        # Repeated URLs
        url_counts = Counter()
        posts_with_urls = 0
        for r in recs:
            urls = r.get("urls") or []
            if urls:
                posts_with_urls += 1
                for u in urls:
                    if u and isinstance(u, str):
                        url_counts[u.strip().lower()] += 1

        posts_with_repeated_urls = 0
        for r in recs:
            urls = r.get("urls") or []
            if any(url_counts.get(str(u).strip().lower(), 0) > 1 for u in urls):
                posts_with_repeated_urls += 1

        repeated_url_ratio = (
            round(posts_with_repeated_urls / posts_with_urls, 4)
            if posts_with_urls > 0
            else 0.0
        )

        # Media attachment ratio
        media_posts = sum(1 for r in recs if r.get("media_reference") and len(r["media_reference"]) > 0)
        media_attachment_ratio = round(media_posts / total_records, 4) if total_records else 0.0

        # Engagement stats
        likes_list = []
        retweets_list = []
        replies_list = []
        quotes_list = []
        for r in recs:
            eng = r.get("engagement") or {}
            if "likes" in eng and isinstance(eng["likes"], (int, float)):
                likes_list.append(eng["likes"])
            if "retweets" in eng and isinstance(eng["retweets"], (int, float)):
                retweets_list.append(eng["retweets"])
            if "replies" in eng and isinstance(eng["replies"], (int, float)):
                replies_list.append(eng["replies"])
            if "quotes" in eng and isinstance(eng["quotes"], (int, float)):
                quotes_list.append(eng["quotes"])

        engagement_stats = {
            "mean_likes": round(statistics.mean(likes_list), 2) if likes_list else 0.0,
            "max_likes": max(likes_list) if likes_list else 0,
            "mean_retweets": round(statistics.mean(retweets_list), 2) if retweets_list else 0.0,
            "max_retweets": max(retweets_list) if retweets_list else 0,
            "mean_replies": round(statistics.mean(replies_list), 2) if replies_list else 0.0,
            "max_replies": max(replies_list) if replies_list else 0,
        }

        missing_indicators = {
            "missing_timestamps": missing_ts_count,
            "missing_text": missing_text_count,
            "missing_author_id": missing_author_id_count,
            "is_author_handle_fallback": 1 if meta["is_fallback"] else 0,
        }

        results[acct_id] = AccountFeatures(
            account_id=acct_id,
            platform=meta["platform"],
            author_name=meta["author_name"],
            record_count=total_records,
            first_observed_at=first_obs,
            last_observed_at=last_obs,
            observation_window_seconds=window_seconds,
            post_rate_per_hour=post_rate_per_hour,
            inter_post_intervals_sec=interval_stats,
            max_burst_count=max_burst_count,
            original_ratio=original_ratio,
            reply_ratio=reply_ratio,
            repost_ratio=repost_ratio,
            quote_ratio=quote_ratio,
            exact_text_repetition_ratio=exact_text_rep_ratio,
            repeated_url_ratio=repeated_url_ratio,
            media_attachment_ratio=media_attachment_ratio,
            engagement_stats=engagement_stats,
            missing_data_indicators=missing_indicators,
            evidence_record_ids=evidence_ids[:50],  # Sample representative IDs
        )

    return results
