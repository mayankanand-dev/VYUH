"""Intelligence data contracts and schema definitions for VYUH (Developer 2).

Conforms strictly to Section 5 Analysis Result schema in OSINT_Disinfo_Team_README_Final.md.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ScoreTypeEnum(str, Enum):
    HEURISTIC = "heuristic"
    ANOMALY = "anomaly"
    SIMILARITY = "similarity"
    CALIBRATED_PROBABILITY = "calibrated_probability"


class SimilarityTierEnum(str, Enum):
    EXACT = "exact"
    LEXICAL = "lexical"
    SEMANTIC = "semantic"


class ClaimStanceEnum(str, Enum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    MIXED = "mixed"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class AnalysisResult(BaseModel):
    """
    Standard analysis result conforming to Section 5 of OSINT_Disinfo_Team_README_Final.md.
    Consumed by Developer 1 for main investigation dashboard and case exports.
    """
    entity_id: str = Field(description="record_id, account_id, or campaign_id being analyzed")
    task: str = Field(description="Task identifier (e.g. language_detection, narrative_clustering, claim_verification)")
    model_or_algorithm: str = Field(description="Name of the model, library, or heuristic used")
    version: str = Field(default="1.0", description="Version of the model or algorithm")
    label: str = Field(description="Categorical output label or cluster name")
    score: Optional[float] = Field(default=0.0, description="Confidence, anomaly score, or similarity value")
    score_type: str = Field(
        default=ScoreTypeEnum.HEURISTIC.value,
        description="Type of score: heuristic | anomaly | similarity | calibrated_probability"
    )
    explanation: List[str] = Field(default_factory=list, description="Human-readable signals or reasoning points")
    evidence_record_ids: List[str] = Field(
        default_factory=list,
        description="Pointers to canonical record_id instances supporting this finding"
    )
    source_urls: List[str] = Field(default_factory=list, description="External reference or verification URLs")
    threshold: Optional[float] = Field(default=None, description="Decision threshold applied")
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Execution timestamp in ISO 8601 UTC"
    )
    limitations: List[str] = Field(
        default_factory=list,
        description="Mandatory disclosures regarding score limits, uncertainty, or coverage gaps"
    )

    model_config = ConfigDict(extra="allow")


class DerivedNLPFeatures(BaseModel):
    """
    Derived NLP features produced from CanonicalRecord without mutating canonical text.
    Preserves digital evidence integrity under Section 63 BSA and ISO/IEC 27037.
    """
    record_id: str = Field(description="Globally unique canonical record ID")
    raw_text: Optional[str] = Field(default=None, description="Reference to unmanipulated ground truth text")
    nlp_cleaned_text: str = Field(description="Derived cleaned text (lowercased, whitespace-normalized, stripped URLs)")
    detected_language: str = Field(description="ISO code or label (en, hi, hi-Latn, ru, pa, und)")
    language_confidence: float = Field(default=1.0, description="Confidence of language detection [0.0 - 1.0]")
    detected_script: str = Field(default="Latin", description="Script category (Latin, Devanagari, Cyrillic, Gurmukhi)")
    tokens: List[str] = Field(default_factory=list, description="Cleaned token list for vocabulary/TF-IDF models")
    hashtags: List[str] = Field(default_factory=list, description="Extracted hashtags without '#'")
    mentions: List[str] = Field(default_factory=list, description="Extracted mentioned handles without '@'")
    urls: List[str] = Field(default_factory=list, description="Extracted external hyperlinks")
    character_count: int = Field(default=0, description="Length of cleaned text in characters")
    word_count: int = Field(default=0, description="Length of cleaned text in words")
    is_duplicate_candidate: bool = Field(default=False, description="Flagged if exact hash matches another record")

    model_config = ConfigDict(extra="ignore")


class SimilarityMatch(BaseModel):
    """
    Multi-tier pairwise or cluster similarity match between canonical posts.
    """
    source_record_id: str = Field(description="Originating post record_id")
    target_record_id: str = Field(description="Matched target post record_id")
    similarity_type: str = Field(description="exact | lexical | semantic")
    score: float = Field(description="Similarity metric value [0.0 - 1.0]")
    method: str = Field(description="sha256_exact, jaccard_ngram, cosine_embedding")
    threshold: float = Field(description="Decision threshold applied")
    shared_tokens: List[str] = Field(default_factory=list, description="Common tokens or shared n-grams")
    evidence_record_ids: List[str] = Field(default_factory=list, description="Pair of matched record IDs")

    model_config = ConfigDict(extra="ignore")


class NarrativeCluster(BaseModel):
    """
    Discovered narrative cluster representing a coherent campaign or storyline.
    """
    cluster_id: str = Field(description="Unique cluster identifier, e.g. narrative_01")
    name: str = Field(description="Analyst-readable title or dominant theme")
    record_count: int = Field(default=0, description="Total canonical posts in this cluster")
    representative_record_ids: List[str] = Field(
        default_factory=list,
        description="Top medoid/exemplar posts closest to cluster center"
    )
    top_keywords: List[str] = Field(default_factory=list, description="Top distinctive keywords (TF-IDF / c-TF-IDF)")
    top_hashtags: List[str] = Field(default_factory=list, description="Most frequent hashtags in cluster")
    dominant_language: str = Field(default="en", description="Primary language of the cluster")
    first_seen: Optional[str] = Field(default=None, description="Earliest post timestamp in ISO 8601 UTC")
    last_seen: Optional[str] = Field(default=None, description="Latest post timestamp in ISO 8601 UTC")
    cohesion_score: Optional[float] = Field(default=None, description="Average pairwise intra-cluster similarity")

    model_config = ConfigDict(extra="ignore")


class ExtractedClaim(BaseModel):
    """
    Discrete factual claim extracted from a narrative for verification.
    """
    claim_id: str = Field(description="Unique claim identifier, e.g. claim_8f2a1c")
    source_record_id: str = Field(description="Canonical record_id from which claim was isolated")
    claim_text: str = Field(description="Extracted factual assertion statement")
    entities: List[str] = Field(default_factory=list, description="Named entities or key subjects mentioned")
    confidence: float = Field(default=0.8, description="Claim extractor confidence")
    timestamp: Optional[str] = Field(default=None, description="Timestamp of originating post")

    model_config = ConfigDict(extra="ignore")


class ClaimVerificationResult(BaseModel):
    """
    Natural Language Inference (NLI) claim verification result against known evidence.
    """
    claim_id: str = Field(description="Unique claim identifier")
    stance: str = Field(
        default=ClaimStanceEnum.INSUFFICIENT_EVIDENCE.value,
        description="supported | contradicted | mixed | insufficient_evidence"
    )
    confidence: float = Field(default=0.0, description="NLI entailment / contradiction probability")
    evidence_sources: List[str] = Field(default_factory=list, description="Reference articles or debunking sources")
    rationale: str = Field(description="Explanation of why evidence supports, contradicts, or is insufficient")
    limitations: List[str] = Field(
        default_factory=lambda: ["NLI assessment indicates semantic consistency, not absolute forensic proof."],
        description="Standard legal / analytical limitations"
    )

    model_config = ConfigDict(extra="ignore")
