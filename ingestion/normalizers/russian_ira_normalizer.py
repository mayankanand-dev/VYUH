"""Normalizer for the Russian Troll Tweets (IRA / FiveThirtyEight) dataset."""

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from ingestion.models import CanonicalRecord, RecordTypeEnum

URL_REGEX = re.compile(r"https?://[^\s]+")
HASHTAG_REGEX = re.compile(r"#(\w+)")
MENTION_REGEX = re.compile(r"@(\w+)")


def _safe_int(val: Any) -> Optional[int]:
    if val is None or val == "":
        return None
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


def _parse_publish_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str or not date_str.strip():
        return None
    s = date_str.strip()
    # Try various date formats common in IRA dataset
    formats = [
        "%m/%d/%Y %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S%z",
        "%m/%d/%y %H:%M",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    return s


def normalize_russian_ira_row(
    row: Dict[str, Any],
    file_name: str,
    row_idx: int,
    run_id: str,
) -> Optional[CanonicalRecord]:
    """
    Transform a raw row from an IRA CSV file into a CanonicalRecord.
    """
    tweet_id = str(row.get("tweet_id") or "").strip()
    if not tweet_id:
        tweet_id = f"{file_name}_{row_idx}"

    content = str(row.get("content") or "").strip()
    author = str(row.get("author") or "unknown").strip()
    author_id = str(row.get("external_author_id") or row.get("alt_external_id") or "").strip() or None

    # Parse publish date
    created_at = _parse_publish_date(row.get("publish_date"))

    # Determine record type
    is_retweet = str(row.get("retweet")).strip() == "1" or str(row.get("post_type")).upper() == "RETWEET"
    is_quote = str(row.get("post_type")).upper() == "QUOTE"

    record_type = RecordTypeEnum.POST.value
    repost_of_id = None
    if is_retweet:
        record_type = RecordTypeEnum.REPOST.value
        rt_match = re.search(r"^RT @(\w+):", content)
        if rt_match:
            repost_of_id = rt_match.group(1)
    elif is_quote:
        record_type = RecordTypeEnum.QUOTE.value

    # Extract entities
    hashtags = list(dict.fromkeys(HASHTAG_REGEX.findall(content)))
    mentions = list(dict.fromkeys(MENTION_REGEX.findall(content)))
    urls = list(dict.fromkeys(URL_REGEX.findall(content)))

    # Add any expanded t.co links if not already present
    for key in ["tco1_step1", "tco2_step1", "tco3_step1"]:
        val = (row.get(key) or "").strip()
        if val and val.startswith("http") and val not in urls:
            urls.append(val)

    # Detect media references from URLs (e.g. video/1 or photo)
    media_refs = []
    for u in urls:
        if "/video/" in u:
            media_refs.append({"type": "video", "fullUrl": u, "previewUrl": None})
        elif "/photo/" in u or any(ext in u.lower() for ext in [".jpg", ".png", ".gif"]):
            media_refs.append({"type": "photo", "fullUrl": u, "previewUrl": u})

    # Public metrics
    engagement = {
        "followers": _safe_int(row.get("followers")),
        "following": _safe_int(row.get("following")),
        "updates": _safe_int(row.get("updates")),
    }

    source_url = row.get("article_url") or f"https://x.com/{author}/status/{tweet_id}"

    # Metadata
    metadata = {
        "region": row.get("region"),
        "account_type": row.get("account_type"),
        "account_category": row.get("account_category"),  # e.g. RightTroll, LeftTroll, NewsFeed
        "harvested_date": row.get("harvested_date"),
        "new_june_2018": str(row.get("new_june_2018")).strip() == "1",
    }

    return CanonicalRecord(
        record_id=f"ira_{tweet_id}",
        platform="twitter",
        record_type=record_type,
        post_id=tweet_id,
        author_id=author_id,
        author_name=author,
        author_display_name=author,
        text=content,
        language=str(row.get("language") or "English").lower(),
        created_at=created_at,
        parent_id=None,
        reply_to_id=None,
        repost_of_id=repost_of_id,
        hashtags=hashtags,
        mentions=mentions,
        urls=urls,
        media_reference=media_refs,
        engagement=engagement,
        source_url=source_url,
        source_dataset="russian_ira_tweets",
        collection_run_id=run_id,
        raw_record_reference=f"russian-troll-tweets-master/{file_name}#{row_idx}",
        schema_version="1.0",
        data_mode="historical",
        metadata=metadata,
    )
