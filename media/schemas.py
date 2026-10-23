"""Pydantic data schemas for VYUH Multimedia Forensics Pipeline (Developer 3).

Conforms strictly to Phase 3 requirements and the Media Analysis Result Contract.
Provides exact mapping to Developer 1's general Analysis Result interface.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, ConfigDict, Field


def current_utc_iso() -> str:
    """Return current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


class MediaInventoryItem(BaseModel):
    """Inventory entry for a media asset referenced in canonical data."""

    artifact_id: str = Field(description="Unique identifier for the media asset")
    source_record_id: str = Field(description="Canonical record_id where media was cited")
    source_post_id: Optional[str] = Field(default=None, description="Native post ID if available")
    source_author_id: Optional[str] = Field(default=None, description="Author ID if available")
    source_dataset: Optional[str] = Field(default=None, description="Source dataset name")
    media_type: str = Field(default="photo", description="'photo', 'video', or 'unknown'")
    source_media_reference: Dict[str, Any] = Field(default_factory=dict, description="Original media_reference payload")
    local_asset_path: Optional[str] = Field(default=None, description="Local filepath if available")
    analysis_status: str = Field(
        default="available",
        description="'available', 'bytes_unavailable', 'malformed_reference', 'not_configured', 'unsupported_format'"
    )
    missing_data_reason: Optional[str] = Field(default=None, description="Explanation if bytes are unavailable")
    file_size_bytes: Optional[int] = Field(default=None, description="Actual file size in bytes if available")
    mime_type: Optional[str] = Field(default=None, description="MIME type if available")

    model_config = ConfigDict(extra="allow")


class PerceptualMatchItem(BaseModel):
    """Candidate perceptual visual match against a reference artifact."""

    matched_artifact_id: str = Field(description="ID of the matched reference artifact")
    hamming_distance: int = Field(description="Bit-level Hamming distance")
    threshold: int = Field(description="Max Hamming threshold used for match")
    similarity_score: float = Field(description="Normalized similarity metric [0.0 - 1.0]")
    method: str = Field(default="phash", description="Hash algorithm: 'phash', 'dhash', 'ahash'")
    interpretation: str = Field(default="candidate_visual_similarity")
    source_record_ids: List[str] = Field(default_factory=list, description="Canonical record IDs of the matched asset")
    limitations: List[str] = Field(
        default_factory=lambda: [
            "Perceptual similarity is an indicator of visual resemblance, NOT proof of common origin or manipulation."
        ]
    )

    model_config = ConfigDict(extra="allow")


class ExactMediaMatchItem(BaseModel):
    """Exact cryptographic byte match against a reference artifact."""

    matched_artifact_id: str = Field(description="ID of the matched reference artifact")
    media_sha256: str = Field(description="Exact SHA-256 byte digest of the media file")
    source_record_ids: List[str] = Field(default_factory=list, description="Canonical record IDs of matched asset")
    match_type: str = Field(default="exact_media_sha256_match")
    limitations: List[str] = Field(
        default_factory=lambda: [
            "Exact byte match confirms byte-level identity. It does not establish who created the media or true provenance."
        ]
    )

    model_config = ConfigDict(extra="allow")


class ForensicFindingItem(BaseModel):
    """Explainable image-forensic finding or anomaly indicator."""

    finding_type: str = Field(
        description="Category: 'metadata_extraction', 'ela_variation', 'image_statistics', 'uniform_region'"
    )
    label: str = Field(description="Short categorical label")
    score: Optional[float] = Field(default=None, description="Numeric score if quantitative, else null")
    score_type: str = Field(default="qualitative_indicator", description="'qualitative_indicator', 'heuristic', 'anomaly'")
    explanation: List[str] = Field(default_factory=list, description="Human-readable explanation of the finding")
    derived_artifact_path: Optional[str] = Field(default=None, description="Path to generated visualization (e.g. ELA image)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Algorithm parameters used")
    limitations: List[str] = Field(default_factory=list, description="Disclosures and false-positive boundaries")
    requires_human_review: bool = Field(default=True)

    model_config = ConfigDict(extra="allow")


class VideoFrameFindingItem(BaseModel):
    """Video frame sampling, duplicate sequence, or temporal cut finding."""

    artifact_id: str = Field(description="Source video artifact ID")
    frame_index: Optional[int] = Field(default=None, description="Sampled frame index")
    timestamp_sec: Optional[float] = Field(default=None, description="Timestamp in seconds")
    actual_decoder_timestamp: Optional[float] = Field(default=None, description="Decoder reported timestamp if available")
    timestamp_type: str = Field(default="sampling_derived", description="'decoder_reported' or 'sampling_derived'")
    finding_type: str = Field(
        default="sampled_frame",
        description="'sampled_frame', 'duplicate_frame', 'temporal_discontinuity', 'metadata'"
    )
    frame_hash: Optional[str] = Field(default=None, description="Perceptual hash of the frame")
    dimensions: Optional[Tuple[int, int]] = Field(default=None, description="(width, height)")
    explanation: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class CrossPostMediaMatch(BaseModel):
    """Structured link between multiple canonical posts sharing identical or similar media."""

    primary_artifact_id: str = Field(description="Primary media artifact ID")
    matched_artifact_id: str = Field(description="Matched reference artifact ID")
    match_type: str = Field(description="'exact_byte_match' or 'candidate_perceptual_match'")
    source_record_ids: List[str] = Field(default_factory=list, description="All record IDs citing either media")
    account_ids: List[str] = Field(default_factory=list, description="Accounts publishing the media")
    post_timestamps: List[str] = Field(default_factory=list, description="Publication timestamps")
    source_datasets: List[str] = Field(default_factory=list, description="Originating datasets")
    explanation: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(
        default_factory=lambda: [
            "A shared image alone does not establish coordinated activity; temporal proximity and other evidence are required."
        ]
    )

    model_config = ConfigDict(extra="allow")


class MediaAnalysisResult(BaseModel):
    """Comprehensive multimedia forensics report for an individual artifact.
    
    Conforms to Developer 3 Phase 3 output contract and maps to Developer 1 dashboard.
    """

    artifact_id: str = Field(description="Internal evidence or media asset ID")
    source_record_ids: List[str] = Field(default_factory=list, description="Canonical record IDs citing this media")
    media_sha256: Optional[str] = Field(
        default=None,
        description="Exact file byte SHA-256 digest for media exact-matching (distinct from evidence manifest)"
    )
    sha256_exact_match: bool = Field(default=False, description="True if identical SHA-256 byte digest found in catalog")
    exact_matches: List[ExactMediaMatchItem] = Field(default_factory=list, description="Matching artifacts with identical bytes")
    perceptual_matches: List[PerceptualMatchItem] = Field(default_factory=list, description="Perceptually similar visual artifacts")
    ocr_result_id: Optional[str] = Field(default=None, description="Reference to Developer 2 OCR result if available")
    forensic_findings: List[Union[ForensicFindingItem, Dict[str, Any]]] = Field(
        default_factory=list,
        description="ELA, EXIF, and dimension manipulation screening indicators"
    )
    video_frame_findings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Sampled frame hashes and discontinuity indicators"
    )
    ai_generated_screening: Dict[str, Any] = Field(
        default_factory=lambda: {
            "status": "not_configured",
            "score": None,
            "model_or_algorithm": "optional_deepfake_detector",
            "limitations": ["No compatible, configured and evaluated detector is available."]
        },
        description="Optional AI detector output or explicit not_configured payload"
    )
    method_versions: Dict[str, str] = Field(default_factory=dict)
    thresholds: Dict[str, Any] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)
    requires_human_review: bool = Field(default=True)

    model_config = ConfigDict(extra="allow")

    def to_developer1_analysis_results(self) -> List[Dict[str, Any]]:
        """Map findings into Developer 1's standard Analysis Result contract."""
        results: List[Dict[str, Any]] = []

        # 1. Exact media matching result
        if self.sha256_exact_match:
            results.append({
                "entity_id": self.artifact_id,
                "task": "exact_media_matching",
                "model_or_algorithm": "sha256_byte_digest",
                "version": self.method_versions.get("sha256", "1.0"),
                "label": "exact_media_match",
                "score": 1.0,
                "score_type": "similarity",
                "explanation": [
                    f"Identical byte-level SHA-256 digest found across {len(self.exact_matches)} artifacts."
                ],
                "evidence_record_ids": self.source_record_ids,
                "source_urls": [],
                "threshold": 1.0,
                "created_at": current_utc_iso(),
                "limitations": [
                    "Exact byte match confirms identical file bytes, not common authorship or intent."
                ],
            })

        # 2. Perceptual matches
        for pm in self.perceptual_matches:
            results.append({
                "entity_id": self.artifact_id,
                "task": "perceptual_image_similarity",
                "model_or_algorithm": pm.method,
                "version": self.method_versions.get("perceptual_hash", "imagehash_4.3.2"),
                "label": pm.interpretation,
                "score": pm.similarity_score,
                "score_type": "similarity",
                "explanation": [
                    f"Candidate visual similarity with artifact {pm.matched_artifact_id} "
                    f"(Hamming distance: {pm.hamming_distance}, threshold: {pm.threshold})."
                ],
                "evidence_record_ids": self.source_record_ids + pm.source_record_ids,
                "source_urls": [],
                "threshold": float(pm.threshold),
                "created_at": current_utc_iso(),
                "limitations": pm.limitations,
            })

        # 3. Forensic findings
        for ff in self.forensic_findings:
            if isinstance(ff, dict):
                results.append({
                    "entity_id": self.artifact_id,
                    "task": "image_forensics",
                    "model_or_algorithm": ff.get("finding_type", "image_forensics"),
                    "version": self.method_versions.get("image_forensics", "1.0.0"),
                    "label": ff.get("label", ff.get("status", "finding")),
                    "score": ff.get("score"),
                    "score_type": ff.get("score_type", "qualitative_indicator"),
                    "explanation": ff.get("explanation", [str(ff)]),
                    "evidence_record_ids": self.source_record_ids,
                    "source_urls": [],
                    "threshold": None,
                    "created_at": current_utc_iso(),
                    "limitations": ff.get("limitations", self.limitations),
                })
            else:
                results.append({
                    "entity_id": self.artifact_id,
                    "task": "image_forensics",
                    "model_or_algorithm": ff.finding_type,
                    "version": self.method_versions.get("image_forensics", "1.0.0"),
                    "label": ff.label,
                    "score": ff.score,
                    "score_type": ff.score_type,
                    "explanation": ff.explanation,
                    "evidence_record_ids": self.source_record_ids,
                    "source_urls": [],
                    "threshold": None,
                    "created_at": current_utc_iso(),
                    "limitations": ff.limitations,
                })

        return results
