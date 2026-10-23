"""VYUH Platform: Content & Narrative Intelligence Engine (Developer 2).

Subsystem for multilingual NLP, narrative clustering, multi-tier similarity,
claim extraction, NLI verification, and OCR.
Conforms strictly to Section 5 Analysis Result schema in OSINT_Disinfo_Team_README_Final.md.
"""

from typing import Any, Dict, List, Optional
import os

from intelligence.models import (
    AnalysisResult,
    DerivedNLPFeatures,
    NarrativeCluster,
    SimilarityMatch,
    ExtractedClaim,
    ClaimVerificationResult,
    ClaimStanceEnum,
    ScoreTypeEnum,
    SimilarityTierEnum,
)
from intelligence.language import detect_language
from intelligence.preprocessing import preprocess_record
from intelligence.embeddings import get_embedder, DenseMultilingualLSAEmbedder
from intelligence.similarity import (
    find_exact_duplicates,
    find_lexical_near_duplicates,
    find_semantic_similarities,
    match_to_analysis_result,
)
from intelligence.clustering import NarrativeClusterEngine, cluster_to_analysis_results
from intelligence.narrative_metrics import NarrativeVelocityEngine
from intelligence.claim_extraction import ClaimExtractor, claim_to_analysis_result
from intelligence.evidence_retrieval import EvidenceRetriever
from intelligence.claim_verification import NLIVerifier, verification_to_analysis_result
from intelligence.media_text.ocr import MemeOCREngine, ocr_to_analysis_result
from intelligence.run_intelligence import run_pipeline

__version__ = "1.0.0"

__all__ = [
    "AnalysisResult",
    "DerivedNLPFeatures",
    "NarrativeCluster",
    "SimilarityMatch",
    "ExtractedClaim",
    "ClaimVerificationResult",
    "ClaimStanceEnum",
    "ScoreTypeEnum",
    "SimilarityTierEnum",
    "detect_language",
    "preprocess_record",
    "get_embedder",
    "DenseMultilingualLSAEmbedder",
    "find_exact_duplicates",
    "find_lexical_near_duplicates",
    "find_semantic_similarities",
    "match_to_analysis_result",
    "NarrativeClusterEngine",
    "cluster_to_analysis_results",
    "NarrativeVelocityEngine",
    "ClaimExtractor",
    "claim_to_analysis_result",
    "EvidenceRetriever",
    "NLIVerifier",
    "verification_to_analysis_result",
    "MemeOCREngine",
    "ocr_to_analysis_result",
    "run_pipeline",
    "analyze_post",
]


def analyze_post(record: Dict[str, Any]) -> List[AnalysisResult]:
    """
    Convenience API for Developer 1 and Developer 3.
    Accepts a canonical record dictionary and executes end-to-end intelligence analysis,
    returning a list of conforming Section 5 AnalysisResult objects.
    """
    results: List[AnalysisResult] = []
    feat = preprocess_record(record)
    rid = feat.record_id

    # 1. Language Detection Finding
    results.append(
        AnalysisResult(
            entity_id=rid,
            task="language_detection",
            model_or_algorithm="multilingual_detector_v1",
            version="1.0",
            label=feat.detected_language,
            score=feat.language_confidence,
            score_type=ScoreTypeEnum.HEURISTIC.value,
            explanation=[
                f"Detected dominant language: {feat.detected_language} (script: {feat.detected_script})",
                f"Confidence rating: {feat.language_confidence:.2f}",
            ],
            evidence_record_ids=[rid],
            limitations=["Language detection is heuristic on short social media posts (<15 tokens)."],
        )
    )

    # 2. Claim Extraction & Stance Verification
    extractor = ClaimExtractor()
    claims = extractor.extract_claims(feat.nlp_cleaned_text, rid)
    if claims:
        verifier = NLIVerifier()
        for cl in claims:
            res = verifier.verify_claim(cl)
            results.append(verification_to_analysis_result(cl, res))


    # 3. Media OCR screening if media references exist
    media_refs = record.get("media_reference") or []
    if media_refs:
        ocr_engine = MemeOCREngine()
        for m in media_refs:
            ocr_res = ocr_engine.extract_text_from_media(m)
            if ocr_res.extracted_text:
                results.append(ocr_to_analysis_result(ocr_res, rid))

    return results
