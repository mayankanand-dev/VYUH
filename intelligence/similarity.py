"""Multi-Tier Similarity Engine for VYUH (Developer 2).

Implements three distinct forensic matching tiers:
1. Exact Duplicate: SHA-256 hash matching on normalized text (detects automated copypasta bots).
2. Lexical Near-Duplicate: Jaccard similarity over word tokens and character n-grams (detects slight variations, typo insertions, hashtag swaps).
3. Semantic Similarity: Cosine similarity on dense embedding vectors (detects coordinated narratives with different wording).

Conforms strictly to Section 4.B and Section 5 of OSINT_Disinfo_Team_README_Final.md.
"""

import hashlib
from collections import defaultdict
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import numpy as np

from intelligence.models import AnalysisResult, DerivedNLPFeatures, ScoreTypeEnum, SimilarityMatch, SimilarityTierEnum


def compute_text_hash(text: str) -> str:
    """Computes a deterministic SHA-256 hash over normalized text."""
    clean = " ".join(text.strip().lower().split())
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()


def compute_char_ngrams(text: str, n: int = 3) -> Set[str]:
    """Generates character n-grams for typo-resilient lexical matching."""
    cleaned = "".join(c for c in text.lower() if c.isalnum() or c.isspace())
    if len(cleaned) < n:
        return {cleaned} if cleaned else set()
    return {cleaned[i:i + n] for i in range(len(cleaned) - n + 1)}


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    """Calculates Jaccard overlap coefficient between two sets."""
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return round(intersection / union, 4) if union > 0 else 0.0


def find_exact_duplicates(features_list: List[DerivedNLPFeatures]) -> List[SimilarityMatch]:
    """
    Tier 1: Identifies exact normalized text duplicates using hash partitioning in O(N) time.
    """
    hash_groups = defaultdict(list)
    for feat in features_list:
        if not feat.nlp_cleaned_text:
            continue
        h = compute_text_hash(feat.nlp_cleaned_text)
        hash_groups[h].append(feat.record_id)

    matches = []
    for h, record_ids in hash_groups.items():
        if len(record_ids) > 1:
            # Pair each subsequent duplicate with the first exemplar
            exemplar = record_ids[0]
            for target in record_ids[1:]:
                matches.append(
                    SimilarityMatch(
                        source_record_id=exemplar,
                        target_record_id=target,
                        similarity_type=SimilarityTierEnum.EXACT.value,
                        score=1.0,
                        method="sha256_normalized_text",
                        threshold=1.0,
                        shared_tokens=[],
                        evidence_record_ids=[exemplar, target]
                    )
                )
    return matches


def find_lexical_near_duplicates(
    features_list: List[DerivedNLPFeatures],
    token_threshold: float = 0.75,
    ngram_threshold: float = 0.70,
    max_candidates: int = 500
) -> List[SimilarityMatch]:
    """
    Tier 2: Identifies lexical near-duplicates using inverted index token candidate filtering
    followed by token + character n-gram Jaccard verification.
    """
    # 1. Build inverted token index
    inverted_index = defaultdict(set)
    records_by_id = {}
    tokens_by_id = {}
    ngrams_by_id = {}

    for feat in features_list:
        rid = feat.record_id
        records_by_id[rid] = feat
        token_set = set(feat.tokens)
        tokens_by_id[rid] = token_set
        ngrams_by_id[rid] = compute_char_ngrams(feat.nlp_cleaned_text, n=3)

        for tok in token_set:
            if len(tok) >= 4:  # Index on informative tokens
                inverted_index[tok].add(rid)

    matches = []
    seen_pairs = set()

    for feat in features_list:
        rid_a = feat.record_id
        tokens_a = tokens_by_id[rid_a]
        ngrams_a = ngrams_by_id[rid_a]

        if not tokens_a:
            continue

        # Candidate selection from shared tokens
        candidate_counts = defaultdict(int)
        for tok in tokens_a:
            if len(tok) >= 4:
                for rid_b in inverted_index.get(tok, set()):
                    if rid_b != rid_a:
                        candidate_counts[rid_b] += 1

        # Evaluate top candidates
        sorted_candidates = sorted(candidate_counts.items(), key=lambda x: x[1], reverse=True)[:max_candidates]

        for rid_b, count in sorted_candidates:
            pair_key = tuple(sorted([rid_a, rid_b]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            tokens_b = tokens_by_id[rid_b]
            ngrams_b = ngrams_by_id[rid_b]

            tok_sim = jaccard_similarity(tokens_a, tokens_b)
            ngram_sim = jaccard_similarity(ngrams_a, ngrams_b)

            composite_score = round(0.5 * tok_sim + 0.5 * ngram_sim, 4)

            if tok_sim >= token_threshold or composite_score >= ngram_threshold:
                shared = list(tokens_a.intersection(tokens_b))[:5]
                matches.append(
                    SimilarityMatch(
                        source_record_id=rid_a,
                        target_record_id=rid_b,
                        similarity_type=SimilarityTierEnum.LEXICAL.value,
                        score=composite_score,
                        method="jaccard_token_ngram",
                        threshold=token_threshold,
                        shared_tokens=shared,
                        evidence_record_ids=[rid_a, rid_b]
                    )
                )

    return matches


def find_semantic_similarities(
    record_ids: List[str],
    embeddings: np.ndarray,
    threshold: float = 0.85,
    top_k: int = 5
) -> List[SimilarityMatch]:
    """
    Tier 3: Identifies semantic matches using cosine similarity on L2-normalized dense embeddings.
    """
    if len(record_ids) == 0 or len(embeddings) == 0:
        return []

    # Ensure vectors are L2-normalized for pure dot product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    norm_embeddings = embeddings / norms

    # Compute pairwise cosine similarity matrix
    similarity_matrix = np.dot(norm_embeddings, norm_embeddings.T)

    matches = []
    seen_pairs = set()
    n = len(record_ids)

    for i in range(n):
        rid_a = record_ids[i]
        sims = similarity_matrix[i]
        
        # Get top-k matches excluding self
        top_indices = np.argsort(sims)[::-1]
        count = 0
        for j in top_indices:
            if i == j:
                continue
            score = float(sims[j])
            if score < threshold:
                break

            rid_b = record_ids[j]
            pair_key = tuple(sorted([rid_a, rid_b]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            matches.append(
                SimilarityMatch(
                    source_record_id=rid_a,
                    target_record_id=rid_b,
                    similarity_type=SimilarityTierEnum.SEMANTIC.value,
                    score=round(score, 4),
                    method="dense_cosine_embedding",
                    threshold=threshold,
                    shared_tokens=[],
                    evidence_record_ids=[rid_a, rid_b]
                )
            )
            count += 1
            if count >= top_k:
                break

    return matches


def match_to_analysis_result(match: SimilarityMatch, task_label: str = "similarity_detection") -> AnalysisResult:
    """Converts a SimilarityMatch into the canonical Section 5 AnalysisResult schema."""
    tier = match.similarity_type
    explanation = [
        f"{tier.capitalize()} similarity detected with score {match.score:.4f} using {match.method}",
        f"Matched records: {match.source_record_id} <-> {match.target_record_id}"
    ]
    if match.shared_tokens:
        explanation.append(f"Shared salient terms: {', '.join(match.shared_tokens)}")

    return AnalysisResult(
        entity_id=match.source_record_id,
        task=task_label,
        model_or_algorithm=match.method,
        version="1.0",
        label=f"{tier}_duplicate",
        score=match.score,
        score_type=ScoreTypeEnum.SIMILARITY.value,
        explanation=explanation,
        evidence_record_ids=match.evidence_record_ids,
        source_urls=[],
        threshold=match.threshold,
        limitations=[
            f"Similarity score ({match.score:.2f}) indicates content overlap, not definitive coordination.",
            "Must be combined with temporal synchronization and network analysis for campaign attribution."
        ]
    )
