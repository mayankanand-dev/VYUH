"""Unit tests for Geospatial Activity Screening (Module H).

Covers:
- Insufficient location data handling
- Explicit numeric coordinates extraction
- Grid aggregation and spatial spike detection
- Strict separation of self-reported location strings from verified coordinates
"""

import pytest
from analytics.geospatial import analyze_geospatial_activity, extract_coordinates
from dev3.config import Dev3Config


def test_extract_coordinates_rules():
    # Explicit geotag
    rec1 = {"record_id": "r1", "latitude": 28.6139, "longitude": 77.2090}
    res1 = extract_coordinates(rec1)
    assert res1 is not None
    assert res1[0] == 28.6139
    assert res1[1] == 77.2090

    # Metadata dict
    rec2 = {"record_id": "r2", "metadata": {"geo": {"lat": 19.0760, "lon": 72.8777}}}
    res2 = extract_coordinates(rec2)
    assert res2 is not None
    assert res2[0] == 19.0760

    # Never extract from text strings or hashtags!
    rec3 = {"record_id": "r3", "text": "Protest in New Delhi #Delhi", "metadata": {"user_location": "New Delhi, India"}}
    res3 = extract_coordinates(rec3)
    assert res3 is None


def test_geospatial_insufficient_data():
    records = [
        {"record_id": "r_no_geo_1", "text": "No coordinates attached"},
        {"record_id": "r_no_geo_2", "metadata": {"user_location": "Punjab, India"}},
    ]
    res = analyze_geospatial_activity(records)
    assert res.status == "insufficient_location_data"
    assert res.records_with_coordinates == 0
    assert len(res.hotspots) == 0
    assert "Punjab, India" in res.limitations[-1]


def test_geospatial_sufficient_data_spike_detection():
    config = Dev3Config(geo_min_records_for_analysis=5, geo_grid_precision_degrees=0.1)

    # 10 background cells with 1 post each
    records = [
        {
            "record_id": f"bg_rec_{i}",
            "author_id": f"user_bg_{i}",
            "latitude": 10.0 + (i * 0.5),
            "longitude": 70.0 + (i * 0.5),
        }
        for i in range(10)
    ]
    # 1 anomalous spike cell (New Delhi 28.61, 77.21) with 30 posts
    records += [
        {
            "record_id": f"delhi_rec_{i}",
            "author_id": f"user_delhi_{i}",
            "latitude": 28.61,
            "longitude": 77.21,
        }
        for i in range(30)
    ]

    res = analyze_geospatial_activity(records, config=config)
    assert res.status == "sufficient_data"
    assert res.records_with_coordinates == 40
    assert len(res.hotspots) == 11

    # Cell with 30 posts should be detected as anomalous spike
    assert len(res.anomalous_spikes) >= 1
    top_spike = res.anomalous_spikes[0]
    assert top_spike["post_count"] == 30
    assert top_spike["z_score"] >= config.geo_spike_sigma_threshold
