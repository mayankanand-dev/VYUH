"""Synchronization and coordination detection module.

Finds candidate coordination relationships between accounts across independent signals:
- Signal 1: Temporal proximity
- Signal 2: Exact normalized-text repetition
- Signal 3: Shared external URLs
- Signal 4: Shared media references
- Signal 5: Observed direct interactions (replies, reposts, mentions)

Adheres strictly to Section 3.B of Master Prompt:
- Preserves original record IDs
- Deduplicates equivalent edges
- Caps pairwise comparisons per group to protect memory
- Strictly separates observed interactions from inferred similarities
"""

from collections import defaultdict
from datetime import datetime
import re
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

from dev3.schemas import CoordinationEdge, current_utc_iso
from dev3.config import DEFAULT_CONFIG
from analytics.account_features import parse_iso_utc, resolve_account_key


def normalize_text_conservative(text: Optional[str]) -> str:
    """Create a conservative normalized-text key while keeping original intact.
    
    Strips excessive whitespace, lowercases, removes non-alphanumeric punctuation.
    """
    if not text or not isinstance(text, str):
        return ""
    # Strip URL links and user mentions from text key to focus on semantic statement
    cleaned = re.sub(r"https?://\S+", "", text)
    cleaned = re.sub(r"@\w+", "", cleaned)
    # Remove leading RT if present
    cleaned = re.sub(r"^rt\s+", "", cleaned.strip(), flags=re.IGNORECASE)
    # Normalize whitespaces and lowercase
    cleaned = re.sub(r"[^\w\s]", " ", cleaned.lower())
    return " ".join(cleaned.split())


def normalize_url_safely(url_str: Optional[str]) -> Optional[str]:
    """Normalize URL safely without stripping essential content query parameters.
    
    Strips standard marketing tracking params (utm_*, ref, fbclid) but preserves
    functional parameters like 'v' (YouTube video ID), 'id', 'p', etc.
    """
    if not url_str or not isinstance(url_str, str):
        return None
    url_str = url_str.strip()
    if not url_str.startswith("http://") and not url_str.startswith("https://"):
        return None
    try:
        parsed = urlparse(url_str)
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/")

        # Filter query params
        query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
        filtered_pairs = [
            (k, v) for k, v in query_pairs
            if not k.lower().startswith("utm_") and k.lower() not in ("ref", "fbclid", "gclid", "source")
        ]
        new_query = urlencode(filtered_pairs)
        return urlunparse((scheme, netloc, path, "", new_query, ""))
    except Exception:
        return url_str.lower().strip()


def detect_coordination_edges(
    records: Iterable[Dict[str, Any]],
    sync_window_seconds: int = DEFAULT_CONFIG.sync_window_seconds,
    max_comparisons_per_bucket: int = DEFAULT_CONFIG.max_pairwise_comparisons_per_bucket,
    min_text_len: int = DEFAULT_CONFIG.min_normalized_text_length,
) -> Tuple[List[CoordinationEdge], Dict[str, Any]]:
    """Analyze canonical records to discover observed and inferred coordination edges.
    
    Returns:
        (edges_list, diagnostic_summary)
    """
    recs_list = list(records)
    edges: List[CoordinationEdge] = []
    seen_edge_keys: Set[Tuple[str, str, str]] = set()

    # Diagnostics
    diagnostics = {
        "total_records_processed": len(recs_list),
        "truncated_buckets": [],
        "observed_edge_count": 0,
        "inferred_edge_count": 0,
    }

    # Index structures for multi-signal matching
    # Map post_id -> (account_id, record_id, timestamp) for resolving interaction targets
    post_index: Dict[str, Tuple[str, str, Optional[datetime]]] = {}
    handle_to_account: Dict[str, str] = {}
    
    # Buckets for matching
    text_buckets: Dict[str, List[Tuple[str, str, Optional[datetime]]]] = defaultdict(list)
    url_buckets: Dict[str, List[Tuple[str, str, Optional[datetime]]]] = defaultdict(list)
    media_buckets: Dict[str, List[Tuple[str, str, Optional[datetime]]]] = defaultdict(list)
    time_sorted_posts: List[Tuple[str, str, datetime]] = []

    for r in recs_list:
        acct_id, author_name, _ = resolve_account_key(r)
        rec_id = r.get("record_id") or "unknown_rec"
        post_id = r.get("post_id")
        created_at_dt = parse_iso_utc(r.get("created_at"))

        if post_id:
            post_index[str(post_id)] = (acct_id, rec_id, created_at_dt)
        if author_name and author_name != "unknown_author":
            handle_to_account[author_name.lower()] = acct_id

        # Text bucket
        norm_text = normalize_text_conservative(r.get("text"))
        if norm_text and len(norm_text) >= min_text_len:
            text_buckets[norm_text].append((acct_id, rec_id, created_at_dt))

        # URL buckets
        for raw_url in (r.get("urls") or []):
            clean_url = normalize_url_safely(raw_url)
            if clean_url:
                url_buckets[clean_url].append((acct_id, rec_id, created_at_dt))

        # Media buckets
        for m in (r.get("media_reference") or []):
            media_key = m.get("fullUrl") or m.get("previewUrl")
            if media_key:
                media_buckets[str(media_key).strip()].append((acct_id, rec_id, created_at_dt))

        # Time sorted
        if created_at_dt:
            time_sorted_posts.append((acct_id, rec_id, created_at_dt))

    time_sorted_posts.sort(key=lambda x: x[2])

    def add_edge(edge: CoordinationEdge) -> None:
        # Deduplicate edges by (source, target, edge_type)
        k = (edge.source_account_id, edge.target_account_id, edge.edge_type)
        if k not in seen_edge_keys:
            seen_edge_keys.add(k)
            edges.append(edge)
            if edge.observed_or_inferred == "observed":
                diagnostics["observed_edge_count"] += 1
            else:
                diagnostics["inferred_edge_count"] += 1

    # -------------------------------------------------------------
    # 1. OBSERVED INTERACTIONS (Replies, Reposts, Mentions)
    # -------------------------------------------------------------
    for r in recs_list:
        src_acct, _, _ = resolve_account_key(r)
        rec_id = r.get("record_id") or "unknown_rec"

        # Check direct reply
        reply_to_id = r.get("reply_to_id")
        if reply_to_id and str(reply_to_id) in post_index:
            tgt_acct, tgt_rec, _ = post_index[str(reply_to_id)]
            if src_acct != tgt_acct:
                add_edge(CoordinationEdge(
                    source_account_id=src_acct,
                    target_account_id=tgt_acct,
                    edge_type="reply",
                    weight=1.0,
                    evidence_record_ids=[rec_id, tgt_rec],
                    method="canonical_reply_to_id_resolution",
                    observed_or_inferred="observed",
                    explanation=[f"Direct reply from post {rec_id} to parent post {tgt_rec}"],
                ))

        # Check repost / retweet
        repost_of_id = r.get("repost_of_id")
        if repost_of_id:
            # repost_of_id could be a post_id or a handle
            if str(repost_of_id) in post_index:
                tgt_acct, tgt_rec, _ = post_index[str(repost_of_id)]
                if src_acct != tgt_acct:
                    add_edge(CoordinationEdge(
                        source_account_id=src_acct,
                        target_account_id=tgt_acct,
                        edge_type="repost",
                        weight=1.0,
                        evidence_record_ids=[rec_id, tgt_rec],
                        method="canonical_repost_of_id_resolution",
                        observed_or_inferred="observed",
                        explanation=[f"Direct retweet/repost of post {tgt_rec}"],
                    ))
            elif str(repost_of_id).lower() in handle_to_account:
                tgt_acct = handle_to_account[str(repost_of_id).lower()]
                if src_acct != tgt_acct:
                    add_edge(CoordinationEdge(
                        source_account_id=src_acct,
                        target_account_id=tgt_acct,
                        edge_type="repost",
                        weight=1.0,
                        evidence_record_ids=[rec_id],
                        method="canonical_repost_author_handle_resolution",
                        observed_or_inferred="observed",
                        explanation=[f"Repost of handle @{repost_of_id}"],
                    ))

        # Check mentions
        for mentioned_handle in (r.get("mentions") or []):
            m_handle = str(mentioned_handle).strip().lower()
            if m_handle in handle_to_account:
                tgt_acct = handle_to_account[m_handle]
                if src_acct != tgt_acct:
                    add_edge(CoordinationEdge(
                        source_account_id=src_acct,
                        target_account_id=tgt_acct,
                        edge_type="mention",
                        weight=0.5,
                        evidence_record_ids=[rec_id],
                        method="canonical_mentions_handle_resolution",
                        observed_or_inferred="observed",
                        explanation=[f"Post mentions target account @{mentioned_handle}"],
                    ))

    # -------------------------------------------------------------
    # 2. INFERRED EDGES: EXACT TEXT REPETITION
    # -------------------------------------------------------------
    for text_key, items in text_buckets.items():
        if len(items) < 2:
            continue
        comparisons = 0
        n = len(items)
        truncated = False

        for i in range(n):
            for j in range(i + 1, n):
                if comparisons >= max_comparisons_per_bucket:
                    truncated = True
                    break
                comparisons += 1
                acct_a, rec_a, dt_a = items[i]
                acct_b, rec_b, dt_b = items[j]
                if acct_a == acct_b:
                    continue

                time_diff_sec = abs((dt_a - dt_b).total_seconds()) if (dt_a and dt_b) else None
                is_sync = (time_diff_sec is not None and time_diff_sec <= sync_window_seconds)

                # Consistent undirected ordering
                u, v = sorted([acct_a, acct_b])
                weight = 0.9 if is_sync else 0.6

                add_edge(CoordinationEdge(
                    source_account_id=u,
                    target_account_id=v,
                    edge_type="similar_content",
                    weight=weight,
                    evidence_record_ids=[rec_a, rec_b],
                    method="exact_normalized_text_repetition",
                    threshold=float(sync_window_seconds) if is_sync else None,
                    observed_or_inferred="inferred",
                    explanation=[
                        f"Accounts published identical text content: '{text_key[:60]}...'",
                        f"Time difference: {time_diff_sec}s (sync_window: {sync_window_seconds}s)"
                        if time_diff_sec is not None else "No timestamp available for delta calculation",
                    ],
                ))
            if truncated:
                diagnostics["truncated_buckets"].append({
                    "bucket_type": "text",
                    "key": text_key[:40],
                    "total_items": n,
                    "max_comparisons_allowed": max_comparisons_per_bucket,
                })
                break

    # -------------------------------------------------------------
    # 3. INFERRED EDGES: SHARED URL WITHIN TIME WINDOW
    # -------------------------------------------------------------
    for url_key, items in url_buckets.items():
        if len(items) < 2:
            continue
        comparisons = 0
        n = len(items)
        truncated = False

        for i in range(n):
            for j in range(i + 1, n):
                if comparisons >= max_comparisons_per_bucket:
                    truncated = True
                    break
                comparisons += 1
                acct_a, rec_a, dt_a = items[i]
                acct_b, rec_b, dt_b = items[j]
                if acct_a == acct_b:
                    continue

                time_diff_sec = abs((dt_a - dt_b).total_seconds()) if (dt_a and dt_b) else None
                # Only connect shared URL if within sync window or window relaxed
                if time_diff_sec is not None and time_diff_sec > (sync_window_seconds * 2):
                    continue

                u, v = sorted([acct_a, acct_b])
                add_edge(CoordinationEdge(
                    source_account_id=u,
                    target_account_id=v,
                    edge_type="shared_url",
                    weight=0.7,
                    evidence_record_ids=[rec_a, rec_b],
                    method="temporal_shared_url_amplification",
                    threshold=float(sync_window_seconds * 2),
                    observed_or_inferred="inferred",
                    explanation=[
                        f"Accounts shared identical URL: {url_key[:80]}",
                        f"Time difference: {time_diff_sec}s" if time_diff_sec is not None else "Timestamp missing",
                    ],
                ))
            if truncated:
                diagnostics["truncated_buckets"].append({
                    "bucket_type": "url",
                    "key": url_key[:40],
                    "total_items": n,
                    "max_comparisons_allowed": max_comparisons_per_bucket,
                })
                break

    # -------------------------------------------------------------
    # 4. INFERRED EDGES: SHARED MEDIA REFERENCE
    # -------------------------------------------------------------
    for media_key, items in media_buckets.items():
        if len(items) < 2:
            continue
        comparisons = 0
        n = len(items)
        truncated = False

        for i in range(n):
            for j in range(i + 1, n):
                if comparisons >= max_comparisons_per_bucket:
                    truncated = True
                    break
                comparisons += 1
                acct_a, rec_a, dt_a = items[i]
                acct_b, rec_b, dt_b = items[j]
                if acct_a == acct_b:
                    continue

                u, v = sorted([acct_a, acct_b])
                add_edge(CoordinationEdge(
                    source_account_id=u,
                    target_account_id=v,
                    edge_type="shared_media",
                    weight=0.8,
                    evidence_record_ids=[rec_a, rec_b],
                    method="shared_media_reference_url",
                    observed_or_inferred="inferred",
                    explanation=[f"Accounts attached identical media reference: {media_key[:60]}..."],
                ))
            if truncated:
                diagnostics["truncated_buckets"].append({
                    "bucket_type": "media",
                    "key": media_key[:40],
                    "total_items": n,
                    "max_comparisons_allowed": max_comparisons_per_bucket,
                })
                break

    # -------------------------------------------------------------
    # 5. INFERRED EDGES: TEMPORAL SYNCHRONIZATION ONLY (distinct text)
    # -------------------------------------------------------------
    # Check sliding window for accounts posting tightly in time with same hashtags/keywords
    # Handled via sliding window over time_sorted_posts
    n_time = len(time_sorted_posts)
    for i in range(n_time):
        acct_a, rec_a, dt_a = time_sorted_posts[i]
        for j in range(i + 1, min(i + 20, n_time)):  # Limit local lookahead
            acct_b, rec_b, dt_b = time_sorted_posts[j]
            delta = (dt_b - dt_a).total_seconds()
            if delta > sync_window_seconds:
                break
            if acct_a == acct_b:
                continue

            # Check if already connected by content
            u, v = sorted([acct_a, acct_b])
            pair_key = (u, v, "synchronized_post")
            if pair_key not in seen_edge_keys:
                add_edge(CoordinationEdge(
                    source_account_id=u,
                    target_account_id=v,
                    edge_type="synchronized_post",
                    weight=0.5,
                    evidence_record_ids=[rec_a, rec_b],
                    method="temporal_proximity_window",
                    threshold=float(sync_window_seconds),
                    observed_or_inferred="inferred",
                    explanation=[f"Posts occurred within {round(delta, 1)} seconds (threshold: {sync_window_seconds}s)"],
                ))

    return edges, diagnostics
