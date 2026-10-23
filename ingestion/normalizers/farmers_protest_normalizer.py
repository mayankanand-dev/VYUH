"""Normalizer for the Farmers Protest tweets dataset."""

import ast
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from ingestion.models import CanonicalRecord, RecordTypeEnum

URL_REGEX = re.compile(r"https?://[^\s]+")
HASHTAG_REGEX = re.compile(r"#(\w+)")
MENTION_REGEX = re.compile(r"@(\w+)")
TWEET_URL_REGEX = re.compile(r"twitter\.com/([^/]+)/status/(\d+)")


def _safe_int(val: Any) -> Optional[int]:
    if val is None or val == "":
        return None
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


def _parse_media(media_str: Optional[str]) -> List[Dict[str, Any]]:
    if not media_str or not media_str.strip():
        return []
    try:
        parsed = ast.literal_eval(media_str.strip())
        if isinstance(parsed, list):
            clean_media = []
            for item in parsed:
                if isinstance(item, dict):
                    clean_media.append({
                        "type": item.get("type", "photo"),
                        "previewUrl": item.get("previewUrl"),
                        "fullUrl": item.get("fullUrl"),
                    })
            return clean_media
    except Exception:
        pass
    return []


def normalize_farmers_protest_row(
    row: Dict[str, Any],
    row_idx: int,
    run_id: str,
    user_metadata: Optional[Dict[str, Any]] = None,
) -> Optional[CanonicalRecord]:
    """
    Transform a raw row from Farmers Protest tweets.csv into a CanonicalRecord.
    """
    tweet_url = (row.get("tweetUrl") or "").strip()
    rendered_content = (row.get("renderedContent") or "").strip()

    # Extract stable ID and author from tweetUrl to avoid scientific notation float corruption
    post_id = None
    url_author = None
    if tweet_url:
        match = TWEET_URL_REGEX.search(tweet_url)
        if match:
            url_author = match.group(1)
            post_id = match.group(2)

    if not post_id:
        raw_id = row.get("tweetId")
        if raw_id:
            try:
                post_id = str(int(float(raw_id)))
            except Exception:
                post_id = str(raw_id)
        else:
            post_id = f"row_{row_idx}"

    author_name = url_author or (user_metadata.get("username") if user_metadata else None) or "unknown"
    author_id = row.get("userId")
    if author_id:
        try:
            author_id = str(int(float(author_id)))
        except Exception:
            author_id = str(author_id)

    # Determine publication date
    created_at = None
    raw_date = row.get("date")
    if raw_date:
        try:
            dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            created_at = dt.astimezone(timezone.utc).isoformat()
        except Exception:
            created_at = str(raw_date)

    # Detect record type and relationships
    record_type = RecordTypeEnum.POST.value
    repost_of_id = None
    reply_to_id = None

    if rendered_content.startswith("RT @"):
        record_type = RecordTypeEnum.REPOST.value
        rt_match = re.search(r"^RT @(\w+):", rendered_content)
        if rt_match:
            repost_of_id = rt_match.group(1)
    elif row.get("retweetedTweet"):
        record_type = RecordTypeEnum.REPOST.value

    if row.get("quotedTweet"):
        record_type = RecordTypeEnum.QUOTE.value

    # Extract entities
    hashtags = list(dict.fromkeys(HASHTAG_REGEX.findall(rendered_content)))
    mentions = list(dict.fromkeys(MENTION_REGEX.findall(rendered_content)))
    urls = list(dict.fromkeys(URL_REGEX.findall(rendered_content)))

    # Media
    media_refs = _parse_media(row.get("media"))

    # Public engagement metrics
    engagement = {
        "likes": _safe_int(row.get("likeCount")),
        "retweets": _safe_int(row.get("retweetCount")),
        "replies": _safe_int(row.get("replyCount")),
        "quotes": _safe_int(row.get("quoteCount")),
    }

    # Author display name
    author_display = user_metadata.get("displayname") if user_metadata else None

    # Source metadata
    metadata = {
        "source_client": row.get("source"),
    }
    if user_metadata:
        metadata["user_followers"] = _safe_int(user_metadata.get("followersCount"))
        metadata["user_friends"] = _safe_int(user_metadata.get("friendsCount"))
        metadata["user_verified"] = str(user_metadata.get("verified")).lower() == "true"
        metadata["user_location"] = user_metadata.get("location")

    return CanonicalRecord(
        record_id=f"fp_{post_id}",
        platform="twitter",
        record_type=record_type,
        post_id=post_id,
        author_id=author_id,
        author_name=author_name,
        author_display_name=author_display,
        text=rendered_content,
        language="und",  # Will be enriched by Dev 2 NLP language detection
        created_at=created_at,
        parent_id=None,
        reply_to_id=reply_to_id,
        repost_of_id=repost_of_id,
        hashtags=hashtags,
        mentions=mentions,
        urls=urls,
        media_reference=media_refs,
        engagement=engagement,
        source_url=tweet_url or f"https://x.com/{author_name}/status/{post_id}",
        source_dataset="farmers_protest_tweets",
        collection_run_id=run_id,
        raw_record_reference=f"farmers_protest_tweets/tweets.csv#{row_idx}",
        schema_version="1.0",
        data_mode="historical",
        metadata=metadata,
    )
