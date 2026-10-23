"""Geospatial analysis and activity screening module.

Screens for evidence-supported spatial clusters and geographic activity spikes.
Adheres strictly to Section 3.H and Section 10 of Master Prompt:
- NEVER infers physical location from language, name, ideology, hashtags, or community
- Distinguishes self-reported profile text from verified numeric coordinates
- Returns 'insufficient_location_data' when coordinate coverage is below threshold
- Never fabricates coordinates or runs mandatory external geocoding requests
"""

from collections import Counter, defaultdict
from typing import Any, Dict, Iterable, List, Optional, Tuple
import math

from dev3.schemas import GeospatialAnalysisResult
from dev3.config import DEFAULT_CONFIG, Dev3Config
from analytics.account_features import resolve_account_key


def extract_coordinates(record: Dict[str, Any]) -> Optional[Tuple[float, float, str]]:
    """Extract explicit numeric coordinates from canonical record or metadata if present.
    
    Returns:
        (latitude, longitude, precision_source) or None
    Rule: Never fabricate coordinates from text strings, hashtags, or names.
    """
    # Check explicit record-level coordinates
    if "latitude" in record and "longitude" in record:
        try:
            lat = float(record["latitude"])
            lon = float(record["longitude"])
            if -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0:
                return lat, lon, "explicit_post_geotag"
        except (ValueError, TypeError):
            pass

    # Check metadata fields
    meta = record.get("metadata") or {}
    geo = meta.get("geo") or meta.get("coordinates")
    if isinstance(geo, dict):
        lat = geo.get("latitude") or geo.get("lat")
        lon = geo.get("longitude") or geo.get("lon")
        if lat is not None and lon is not None:
            try:
                plat = float(lat)
                plon = float(lon)
                if -90.0 <= plat <= 90.0 and -180.0 <= plon <= 180.0:
                    return plat, plon, "metadata_geo_dict"
            except (ValueError, TypeError):
                pass
    elif isinstance(geo, (list, tuple)) and len(geo) == 2:
        try:
            plat = float(geo[0])
            plon = float(geo[1])
            if -90.0 <= plat <= 90.0 and -180.0 <= plon <= 180.0:
                return plat, plon, "metadata_geo_coords"
        except (ValueError, TypeError):
            pass

    return None


def analyze_geospatial_activity(
    records: Iterable[Dict[str, Any]],
    config: Dev3Config = DEFAULT_CONFIG,
) -> GeospatialAnalysisResult:
    """Screen records for geographic activity hotspots and unusual spatial concentrations.
    
    Args:
        records: Canonical record stream
        config: Analysis configuration containing grid precision and thresholds
        
    Returns:
        GeospatialAnalysisResult conforming to contract
    """
    total_records = 0
    records_with_coords = 0
    unique_accounts_with_loc = set()
    grid_counts: Dict[Tuple[float, float], List[str]] = defaultdict(list)
    grid_accounts: Dict[Tuple[float, float], Set[str]] = defaultdict(set)
    self_reported_locations: Counter = Counter()

    grid_precision = config.geo_grid_precision_degrees  # e.g. 0.1 degree

    for r in records:
        total_records += 1
        acct_id, _, _ = resolve_account_key(r)
        rec_id = r.get("record_id") or "unknown_rec"

        # Record self-reported text string separately
        meta = r.get("metadata") or {}
        user_loc = meta.get("user_location")
        if user_loc and isinstance(user_loc, str) and user_loc.strip():
            self_reported_locations[user_loc.strip()] += 1

        coords = extract_coordinates(r)
        if coords:
            lat, lon, src = coords
            records_with_coords += 1
            unique_accounts_with_loc.add(acct_id)

            # Snap to grid cell center
            grid_lat = round(math.floor(lat / grid_precision) * grid_precision + (grid_precision / 2.0), 3)
            grid_lon = round(math.floor(lon / grid_precision) * grid_precision + (grid_precision / 2.0), 3)

            grid_cell = (grid_lat, grid_lon)
            grid_counts[grid_cell].append(rec_id)
            grid_accounts[grid_cell].add(acct_id)

    coverage_ratio = (
        round(records_with_coords / total_records, 4) if total_records > 0 else 0.0
    )

    limitations = [
        "Analysis strictly utilizes explicit, numeric coordinates. No physical locations were inferred from linguistic, ideological, or community attributes.",
        "Self-reported profile strings are subject to spoofing and are preserved separately as unverified metadata.",
    ]

    # Insufficient location coverage check
    if records_with_coords < config.geo_min_records_for_analysis:
        top_self_reported = [
            f"{loc} ({cnt})"
            for loc, cnt in self_reported_locations.most_common(5)
        ]
        top_str = f" [{', '.join(top_self_reported)}]" if top_self_reported else ""
        return GeospatialAnalysisResult(
            task="geospatial_activity_screening",
            status="insufficient_location_data",
            total_records_evaluated=total_records,
            records_with_coordinates=records_with_coords,
            unique_accounts_with_location=len(unique_accounts_with_loc),
            coverage_ratio=coverage_ratio,
            hotspots=[],
            anomalous_spikes=[],
            baseline_description="No baseline established due to absence of numeric coordinates in historical records.",
            limitations=limitations + [
                f"Only {records_with_coords} records have verifiable numeric coordinates (minimum required: {config.geo_min_records_for_analysis}).",
                f"Preserved {len(self_reported_locations)} unique self-reported profile location strings for manual reference{top_str}.",
            ],
        )

    # Calculate spatial hotspots and spike detection
    cell_record_counts = [len(recs) for recs in grid_counts.values()]
    mean_count = sum(cell_record_counts) / len(cell_record_counts)
    variance = sum((c - mean_count) ** 2 for c in cell_record_counts) / len(cell_record_counts)
    std_dev = math.sqrt(variance)

    hotspots = []
    anomalous_spikes = []

    for (grid_lat, grid_lon), rec_ids in grid_counts.items():
        count = len(rec_ids)
        distinct_accts = len(grid_accounts[(grid_lat, grid_lon)])
        z_score = round((count - mean_count) / max(0.01, std_dev), 2)

        cell_summary = {
            "center_latitude": grid_lat,
            "center_longitude": grid_lon,
            "grid_resolution_deg": grid_precision,
            "post_count": count,
            "distinct_accounts_count": distinct_accts,
            "z_score": z_score,
            "sample_record_ids": rec_ids[:10],
        }
        hotspots.append(cell_summary)

        if z_score >= config.geo_spike_sigma_threshold:
            anomalous_spikes.append({
                **cell_summary,
                "spike_description": f"Cell density ({count} posts, {distinct_accts} accounts) exceeds spatial baseline by {z_score} standard deviations.",
            })

    # Sort hotspots descending by post count
    hotspots.sort(key=lambda x: x["post_count"], reverse=True)
    anomalous_spikes.sort(key=lambda x: x["z_score"], reverse=True)

    return GeospatialAnalysisResult(
        task="geospatial_activity_screening",
        status="sufficient_data",
        total_records_evaluated=total_records,
        records_with_coordinates=records_with_coords,
        unique_accounts_with_location=len(unique_accounts_with_loc),
        coverage_ratio=coverage_ratio,
        hotspots=hotspots[:20],
        anomalous_spikes=anomalous_spikes,
        baseline_description=f"Grid cell Poisson/normal baseline: mean={round(mean_count, 2)} posts/cell, std_dev={round(std_dev, 2)}",
        limitations=limitations,
    )
