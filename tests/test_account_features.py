"""Unit tests for Account Behaviour and Feature Engineering (Module A).

Covers:
- Empty JSONL input
- Malformed/missing timestamps
- Missing author IDs and fallback resolution without grouping unrelated accounts
- Same account publishing multiple posts (intervals, burst calculation)
- Division by zero safety
- Evidence record ID retention
"""

import pytest
from datetime import datetime, timezone
from analytics.account_features import (
    extract_account_features,
    parse_iso_utc,
    resolve_account_key,
)


def test_empty_records_input():
    features = extract_account_features([])
    assert features == {}


def test_parse_iso_utc_valid_and_malformed():
    # Valid ISO with +00:00
    dt1 = parse_iso_utc("2021-03-30T03:33:46+00:00")
    assert dt1 is not None
    assert dt1.year == 2021
    assert dt1.tzinfo == timezone.utc

    # Valid with Z
    dt2 = parse_iso_utc("2021-03-30T03:33:46Z")
    assert dt2 is not None
    assert dt2 == dt1

    # Malformed strings
    assert parse_iso_utc("invalid-date") is None
    assert parse_iso_utc("") is None
    assert parse_iso_utc(None) is None
    assert parse_iso_utc(123456) is None


def test_resolve_account_key_rules():
    # Reliable author_id
    key, name, fallback = resolve_account_key({
        "platform": "twitter",
        "author_id": "12345",
        "author_name": "alice",
    })
    assert key == "twitter:12345"
    assert name == "alice"
    assert not fallback

    # Missing author_id, fallback to handle
    key2, name2, fallback2 = resolve_account_key({
        "platform": "twitter",
        "author_id": None,
        "author_name": "BobTheBuilder",
    })
    assert key2 == "twitter:handle:bobthebuilder"
    assert name2 == "BobTheBuilder"
    assert fallback2

    # Both missing: must NOT group unrelated accounts under a single 'unknown' bucket!
    key3, _, fallback3 = resolve_account_key({
        "platform": "twitter",
        "author_id": None,
        "author_name": "unknown",
        "record_id": "rec_001",
    })
    key4, _, fallback4 = resolve_account_key({
        "platform": "twitter",
        "author_id": None,
        "author_name": None,
        "record_id": "rec_002",
    })
    assert key3 != key4
    assert "rec_001" in key3
    assert "rec_002" in key4


def test_single_and_multiple_posts_features():
    records = [
        {
            "record_id": "rec_1",
            "platform": "twitter",
            "author_id": "user_A",
            "author_name": "UserAlpha",
            "created_at": "2021-01-01T10:00:00Z",
            "text": "Breaking news statement alpha #News",
            "record_type": "post",
            "urls": ["https://example.com/item1?utm_source=tw"],
        },
        {
            "record_id": "rec_2",
            "platform": "twitter",
            "author_id": "user_A",
            "author_name": "UserAlpha",
            "created_at": "2021-01-01T10:02:00Z",  # 120s later
            "text": "Breaking news statement alpha #News",  # Duplicate text
            "record_type": "post",
            "urls": ["https://example.com/item1?utm_source=tw"],  # Duplicate URL
        },
        {
            "record_id": "rec_3",
            "platform": "twitter",
            "author_id": "user_A",
            "author_name": "UserAlpha",
            "created_at": "2021-01-01T10:05:00Z",  # 180s later
            "text": "Distinct third post",
            "record_type": "reply",
            "reply_to_id": "other_post_999",
            "media_reference": [{"type": "photo", "fullUrl": "https://img.example.com/1.jpg"}],
        },
    ]

    features = extract_account_features(records, burst_window_seconds=300)
    assert "twitter:user_A" in features
    f = features["twitter:user_A"]

    assert f.record_count == 3
    assert f.observation_window_seconds == 300.0  # 5 minutes
    assert f.post_rate_per_hour == 36.0  # (3 / 300) * 3600
    assert f.inter_post_intervals_sec["min"] == 120.0
    assert f.inter_post_intervals_sec["max"] == 180.0
    assert f.inter_post_intervals_sec["median"] == 150.0

    # 3 posts within 300s burst window
    assert f.max_burst_count == 3

    # Ratios
    assert f.original_ratio == pytest.approx(2 / 3, 0.01)
    assert f.reply_ratio == pytest.approx(1 / 3, 0.01)
    assert f.exact_text_repetition_ratio == pytest.approx(2 / 3, 0.01)
    assert f.repeated_url_ratio == 1.0
    assert f.media_attachment_ratio == pytest.approx(1 / 3, 0.01)

    # Evidence IDs
    assert "rec_1" in f.evidence_record_ids
    assert "rec_2" in f.evidence_record_ids
    assert "rec_3" in f.evidence_record_ids


def test_malformed_timestamps_safe_handling():
    records = [
        {
            "record_id": "bad_ts_1",
            "platform": "twitter",
            "author_id": "user_B",
            "author_name": "Beta",
            "created_at": "not-a-timestamp",
            "text": "Hello world",
        },
        {
            "record_id": "bad_ts_2",
            "platform": "twitter",
            "author_id": "user_B",
            "author_name": "Beta",
            "created_at": None,
            "text": "Another post",
        },
    ]

    features = extract_account_features(records)
    f = features["twitter:user_B"]
    assert f.record_count == 2
    assert f.observation_window_seconds == 0.0
    assert f.post_rate_per_hour == 0.0
    assert f.missing_data_indicators["missing_timestamps"] == 2
    assert f.inter_post_intervals_sec["median"] is None
