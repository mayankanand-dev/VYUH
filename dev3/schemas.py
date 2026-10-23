"""Pydantic schemas and serialization models for Dev 3 analysis outputs.

All models adhere strictly to Section 4 and Section 5 of OSINT_Disinfo_Team_README_Final.md.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


def current_utc_iso() -> str:
    """Return current UTC time formatted in strict ISO 8601."""
    return datetime.now(timezone.utc).isoformat()


class AnalysisResult(BaseModel):
    """
    Standard analysis result structure consumed by Developer 1's integration interface.
    """
    entity_id: str = Field(description="Record ID, account ID, or campaign cluster ID")
    task: str = Field(description="Task or module identifier")
    model_or_algorithm: str = Field(description="Algorithm, heuristic, or model name")
    version: str = Field(default="1.0.0", description="Implementation version")
    label: str = Field(description="Categorical output label (e.g. low_evidence, elevated_coordination_signals)")
    score: Optional[float] = Field(default=None, description="Numerical score; None if inconclusive or missing")
    score_type: str = Field(
        default="heuristic",
        description="One of: 'heuristic', 'anomaly', 'similarity', 'calibrated_probability'"
    )
    explanation: List[str] = Field(default_factory=list, description="Explainable signals and reasons")
    evidence_record_ids: List[str] = Field(default_factory=list, description="Referenced canonical record IDs")
    source_urls: List[str] = Field(default_factory=list, description="Public permalinks or external sources")
    threshold: Optional[float] = Field(default=None, description="Decision threshold applied")
    created_at: str = Field(default_factory=current_utc_iso, description="UTC ISO 8601 generation timestamp")
    limitations: List[str] = Field(default_factory=list, description="Known caveats, data coverage, or assumptions")

    model_config = ConfigDict(extra="allow")


class CoordinationEdge(BaseModel):
    """
    Typed edge representing observed interactions or inferred coordination links.
    """
    source_account_id: str = Field(description="Originating platform-scoped account ID")
    target_account_id: str = Field(description="Target platform-scoped account ID")
    edge_type: str = Field(
        description="Type: reply, repost, mention, synchronized_post, similar_content, shared_url, shared_media, candidate_identity_link"
    )
    weight: float = Field(default=1.0, description="Edge weight or similarity strength")
    evidence_record_ids: List[str] = Field(default_factory=list, description="Supporting canonical record IDs")
    method: str = Field(description="Detection method or heuristic used to construct this edge")
    threshold: Optional[float] = Field(default=None, description="Threshold parameter applied")
    observed_or_inferred: str = Field(
        default="inferred",
        description="'observed' for direct interactions, 'inferred' for analytical similarities"
    )
    explanation: List[str] = Field(default_factory=list, description="Human-readable explanation of the edge")
    created_at: str = Field(default_factory=current_utc_iso, description="UTC ISO 8601 creation timestamp")

    model_config = ConfigDict(extra="allow")


class AccountFeatures(BaseModel):
    """
    Derived behavioural profile features for a single platform-scoped author.
    """
    account_id: str = Field(description="Platform-scoped identifier (e.g. twitter:1015969769760096384)")
    platform: str = Field(default="twitter")
    author_name: str = Field(description="Public handle or username")
    record_count: int = Field(default=0, description="Total observed canonical records for this account")
    first_observed_at: Optional[str] = Field(default=None, description="Earliest publication timestamp")
    last_observed_at: Optional[str] = Field(default=None, description="Latest publication timestamp")
    observation_window_seconds: float = Field(default=0.0, description="Span between first and last post in seconds")
    post_rate_per_hour: float = Field(default=0.0, description="Posts per hour across observation window")
    inter_post_intervals_sec: Dict[str, Optional[float]] = Field(
        default_factory=dict,
        description="Distribution of intervals between consecutive posts: min, max, median, mean, p25, p75"
    )
    max_burst_count: int = Field(default=0, description="Maximum posts observed within burst window")
    original_ratio: float = Field(default=0.0, description="Ratio of standard posts")
    reply_ratio: float = Field(default=0.0, description="Ratio of replies")
    repost_ratio: float = Field(default=0.0, description="Ratio of retweets/reposts")
    quote_ratio: float = Field(default=0.0, description="Ratio of quote posts")
    exact_text_repetition_ratio: float = Field(default=0.0, description="Ratio of identical duplicate texts")
    repeated_url_ratio: float = Field(default=0.0, description="Ratio of posts containing repeatedly shared URLs")
    media_attachment_ratio: float = Field(default=0.0, description="Ratio of posts with media attachments")
    engagement_stats: Dict[str, Any] = Field(default_factory=dict, description="Mean/max likes, retweets, replies")
    missing_data_indicators: Dict[str, int] = Field(
        default_factory=dict,
        description="Counts of missing fields (timestamps, texts, IDs)"
    )
    evidence_record_ids: List[str] = Field(default_factory=list, description="Sample canonical record IDs")

    model_config = ConfigDict(extra="allow")


class MediaAnalysisResult(BaseModel):
    """
    Unified multimedia analysis result for an image or video artifact.
    """
    artifact_id: str = Field(description="Internal evidence or media asset ID")
    source_record_ids: List[str] = Field(default_factory=list, description="Canonical record IDs citing this media")
    sha256_exact_match: bool = Field(default=False, description="True if identical SHA-256 byte digest found")
    sha256: Optional[str] = Field(default=None, description="Exact file byte SHA-256 digest")
    perceptual_matches: List[Dict[str, Any]] = Field(default_factory=list, description="Perceptual hash matches")
    ocr_result_id: Optional[str] = Field(default=None, description="Reference to Developer 2 OCR result if available")
    forensic_findings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="ELA, EXIF, and dimension manipulation screening indicators"
    )
    video_frame_findings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Sampled frame hashes and discontinuity indicators"
    )
    ai_generated_screening: Dict[str, Any] = Field(
        default_factory=lambda: {"status": "not_configured", "score": None, "model": None},
        description="AI generation detector output or not_configured status"
    )
    method_versions: Dict[str, str] = Field(default_factory=dict)
    thresholds: Dict[str, Any] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)
    requires_human_review: bool = Field(default=True)

    model_config = ConfigDict(extra="allow")


class OSINTFinding(BaseModel):
    """
    Public username lookup result across web platforms.
    """
    queried_username: str
    site_name: str
    profile_url: Optional[str] = None
    status: str = Field(description="'found', 'not_found', 'error', 'blocked'")
    check_timestamp: str = Field(default_factory=current_utc_iso)
    tool_or_provider: str = "vyuh_osint_adapter"
    version: str = "1.0.0"
    matching_field: Optional[str] = None
    provenance: str = "Public HTTP profile probe"
    limitations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class CandidateAccountLink(BaseModel):
    """
    Candidate cross-platform linkage hypothesis between accounts.
    """
    candidate_account_ids: List[str] = Field(description="Two or more linked account handles/IDs")
    linkage_method: str = Field(description="e.g. exact_username_reuse, shared_identifier, bio_similarity")
    evidence_record_ids: List[str] = Field(default_factory=list)
    source_urls: List[str] = Field(default_factory=list)
    matched_fields: List[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.5, description="Heuristic score between 0.0 and 1.0")
    scoring_interpretation: str = Field(default="Uncalibrated candidate heuristic; human verification required")
    alternative_explanations: List[str] = Field(
        default_factory=lambda: ["Coincidental handle collision", "Different individuals sharing pseudonym"]
    )
    limitations: List[str] = Field(default_factory=list)
    requires_human_review: bool = Field(default=True)

    model_config = ConfigDict(extra="allow")


class GeospatialAnalysisResult(BaseModel):
    """
    Evidence-supported spatial activity and clustering report.
    """
    task: str = "geospatial_activity_screening"
    status: str = Field(description="'sufficient_data', 'insufficient_location_data', 'inconclusive'")
    total_records_evaluated: int = 0
    records_with_coordinates: int = 0
    unique_accounts_with_location: int = 0
    coverage_ratio: float = 0.0
    hotspots: List[Dict[str, Any]] = Field(default_factory=list)
    anomalous_spikes: List[Dict[str, Any]] = Field(default_factory=list)
    baseline_description: str = "Uniform spatial distribution across populated cells"
    limitations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class RunSummary(BaseModel):
    """
    End-to-end execution summary for reproducibility and auditing.
    """
    run_id: str
    executed_at: str = Field(default_factory=current_utc_iso)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    versions: Dict[str, str] = Field(default_factory=dict)
    input_records_count: int = 0
    output_counts: Dict[str, int] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")
