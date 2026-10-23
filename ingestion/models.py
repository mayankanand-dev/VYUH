"""Canonical data models and evidence schemas for VYUH platform (Dev 1).

Adheres strictly to Section 5 of OSINT_Disinfo_Team_README_Final.md.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class DataModeEnum(str, Enum):
    HISTORICAL = "historical"
    LIVE = "live"
    REPLAY = "replay"


class RecordTypeEnum(str, Enum):
    POST = "post"
    REPLY = "reply"
    REPOST = "repost"
    QUOTE = "quote"
    MESSAGE = "message"
    COMMENT = "comment"


class CanonicalRecord(BaseModel):
    """
    Shared validated schema for all OSINT and historical records.
    Consumed by both the Twitter/X clone and the analysis pipeline (Dev 2 NLP & Dev 3 Graph/OSINT).
    """
    record_id: str = Field(description="Globally unique stable record identifier (e.g., fp_<id> or ira_<id>)")
    platform: str = Field(default="twitter", description="Platform identifier (twitter, x, telegram, etc.)")
    record_type: str = Field(default="post", description="post, reply, repost, quote, message, comment")
    post_id: Optional[str] = Field(default=None, description="Source native post ID")
    author_id: Optional[str] = Field(default=None, description="Source native author/user ID")
    author_name: Optional[str] = Field(default=None, description="Public handle or username")
    author_display_name: Optional[str] = Field(default=None, description="Public display name if available")
    text: Optional[str] = Field(default=None, description="Original unmanipulated post/message text")
    language: Optional[str] = Field(default=None, description="Detected or source-declared language code")
    created_at: Optional[str] = Field(default=None, description="Original publication timestamp in ISO 8601 UTC")
    collected_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Ingestion/normalization timestamp in ISO 8601 UTC"
    )
    parent_id: Optional[str] = Field(default=None, description="Parent thread/conversation ID")
    reply_to_id: Optional[str] = Field(default=None, description="Target post ID if this is a reply")
    repost_of_id: Optional[str] = Field(default=None, description="Original post ID if this is a retweet/repost")
    hashtags: List[str] = Field(default_factory=list, description="Extracted hashtags without '#' prefix")
    mentions: List[str] = Field(default_factory=list, description="Extracted usernames mentioned without '@'")
    urls: List[str] = Field(default_factory=list, description="Extracted external URLs")
    media_reference: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of media references with type (photo/video), previewUrl, and fullUrl"
    )
    engagement: Dict[str, Any] = Field(
        default_factory=dict,
        description="Public interaction metrics (likes, retweets, replies, quotes, impressions)"
    )
    source_url: Optional[str] = Field(default=None, description="Canonical public permalink")
    source_dataset: str = Field(description="Name/identifier of originating dataset")
    collection_run_id: str = Field(description="Identifier of import/normalization run")
    raw_record_reference: str = Field(description="Pointer to raw file line or object (e.g. filename#line)")
    schema_version: str = Field(default="1.0", description="Canonical schema specification version")
    data_mode: str = Field(default="historical", description="historical, live, or replay")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Preserved source-specific fields (e.g. account_category, region, user profile)"
    )

    model_config = ConfigDict(extra="ignore")


class EvidenceManifestItem(BaseModel):
    """
    Evidence preservation record for chain of custody and BSA Section 63 compliance.
    """
    evidence_id: str = Field(description="Unique evidence identifier")
    case_id: Optional[str] = Field(default="DEFAULT_CASE", description="Case or investigation ID")
    source_url: Optional[str] = Field(default=None, description="Original URL or source path")
    captured_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Capture/import timestamp in ISO 8601 UTC"
    )
    filename: str = Field(description="Name of preserved file")
    mime_type: str = Field(description="MIME type (e.g. text/csv, application/x-jsonlines)")
    byte_size: int = Field(description="Exact file size in bytes")
    sha256: str = Field(description="Cryptographic SHA-256 hex digest computed over exact bytes")
    perceptual_hash: Optional[str] = Field(default=None, description="Optional perceptual hash for media")
    artifact_type: str = Field(default="original", description="original, derivative, screenshot, export")
    tool_version: str = Field(default="vyuh_ingestion_v1.0", description="Software version used for acquisition")
    limitations: List[str] = Field(default_factory=list, description="Known capture limitations or data gaps")

    model_config = ConfigDict(extra="allow")


class AuditLogEntry(BaseModel):
    """
    Append-only audit trail entry for tracking every transformation, access, or export.
    """
    event_id: str = Field(description="Unique audit event ID")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Event timestamp in ISO 8601 UTC"
    )
    operator: str = Field(default="dev_1_pipeline", description="User, service, or pipeline identifier")
    action: str = Field(description="Action name (e.g., DATASET_IMPORT, HASH_VERIFICATION, SCHEMA_EXPORT)")
    target: str = Field(description="Affected artifact or dataset")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured event parameters")
    sha256_checkpoint: Optional[str] = Field(default=None, description="Hash checkpoint associated with action")
