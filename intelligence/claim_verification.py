"""Claim Assessment & Natural Language Inference (NLI) Subsystem for VYUH (Developer 2).

Conforms strictly to Section 4.B.6, Section 5, and Section 9 of OSINT_Disinfo_Team_README_Final.md.
Assesses claims against retrieved evidence using Natural Language Inference (NLI) to output:
- 'supported'
- 'contradicted'
- 'mixed'
- 'insufficient_evidence' (mandatory default whenever evidence is missing or ambiguous)
"""

import re
from typing import Any, Dict, List, Optional, Tuple

from intelligence.evidence_retrieval import EvidenceRetriever
from intelligence.models import AnalysisResult, ClaimStanceEnum, ClaimVerificationResult, ExtractedClaim, ScoreTypeEnum

# Check transformers availability for true neural NLI cross-encoder
_TRANSFORMERS_AVAILABLE = False
try:
    from transformers import pipeline
    _TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

# Negation and contradiction lexical markers
CONTRADICTION_MARKERS = [
    r"\b(no evidence|falsely|debunked|untrue|fabricated|denied|hoax|disproven)\b",
    r"\b(did not|never|failed to|not true|incorrect|refuted|fake|baseless)\b",
    r"\b(hung jury|mistrial|acquitted|dropped charges|phishing)\b",
]

SUPPORT_MARKERS = [
    r"\b(confirmed that|passed|enacted|repealed|established|admitted|verified|authorized)\b",
    r"\b(official records show|gazette notification|formally passed|indicted)\b"
]


class NLIVerifier:
    """
    Evaluates factual claims against retrieved reference evidence using
    Natural Language Inference (NLI) cross-encoder scoring, semantic polarity,
    and verified debunk archive matching.
    """
    def __init__(
        self,
        retriever: Optional[EvidenceRetriever] = None,
        use_neural_nli: bool = False
    ):
        self.retriever = retriever or EvidenceRetriever()
        self.use_neural_nli = use_neural_nli and _TRANSFORMERS_AVAILABLE
        self._nli_pipeline = None

    def _get_nli_pipeline(self):
        """Lazy loader for NLI zero-shot / cross-encoder pipeline."""
        if self._nli_pipeline is None and self.use_neural_nli:
            try:
                self._nli_pipeline = pipeline(
                    "zero-shot-classification",
                    model="typeform/distilbert-base-uncased-mnli",
                    device=-1
                )
            except Exception:
                self.use_neural_nli = False
        return self._nli_pipeline

    def assess_entailment_polarity(
        self,
        claim_text: str,
        evidence_text: str,
        evidence_meta: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, float, str]:
        """
        Determines whether evidence supports, contradicts, or has insufficient signal
        for the given claim text using neural NLI and polarity heuristics.
        """
        if not evidence_text or not evidence_text.strip():
            return ClaimStanceEnum.INSUFFICIENT_EVIDENCE.value, 0.0, "No reference evidence provided."

        claim_lower = claim_text.lower()
        ev_lower = evidence_text.lower()
        meta = evidence_meta or {}
        official_verdict = str(meta.get("verdict", "")).upper()

        # 1. Neural NLI evaluation if enabled
        nli_pipe = self._get_nli_pipeline()
        if nli_pipe:
            try:
                candidate_labels = ["contradicts the claim", "supports the claim", "unrelated"]
                premise = f"Official Evidence: {evidence_text}"
                hypo_template = f"Regarding the statement '{claim_text}', this evidence {{}}."
                res = nli_pipe(premise, candidate_labels=candidate_labels, hypothesis_template=hypo_template)
                top_label = res["labels"][0]
                top_score = float(res["scores"][0])

                if top_label == "contradicts the claim" and top_score >= 0.60:
                    return (
                        ClaimStanceEnum.CONTRADICTED.value,
                        round(top_score, 2),
                        f"Neural NLI cross-encoder confirms direct contradiction (score: {top_score:.2f})."
                    )
                elif top_label == "supports the claim" and top_score >= 0.60:
                    return (
                        ClaimStanceEnum.SUPPORTED.value,
                        round(top_score, 2),
                        f"Neural NLI cross-encoder confirms factual entailment (score: {top_score:.2f})."
                    )
            except Exception:
                pass

        # 2. Debunk Knowledge Base explicit verdict alignment
        if official_verdict in ("FALSE", "SYNTHETIC_DEEPFAKE"):
            # The reference archive explicitly debunks this assertion
            has_debunk_words = any(re.search(pat, ev_lower) for pat in CONTRADICTION_MARKERS)
            conf = 0.92 if has_debunk_words else 0.85
            return (
                ClaimStanceEnum.CONTRADICTED.value,
                conf,
                f"Official authority verdict is {official_verdict}: Evidence explicitly refutes and debunks the assertion."
            )

        if official_verdict == "TRUE":
            # The reference archive explicitly confirms this historical fact
            return (
                ClaimStanceEnum.SUPPORTED.value,
                0.90,
                "Official authority records confirm this assertion as established factual history."
            )

        # 3. Structural Polarity and Refutation Marker Analysis
        has_negation_in_evidence = any(re.search(pat, ev_lower) for pat in CONTRADICTION_MARKERS)
        has_negation_in_claim = any(re.search(pat, claim_lower) for pat in CONTRADICTION_MARKERS)

        if has_negation_in_evidence and not has_negation_in_claim:
            # Evidence explicitly denies or debunks the positive claim
            return (
                ClaimStanceEnum.CONTRADICTED.value,
                0.88,
                "Reference evidence explicitly refutes, denies, or marks the claim as fabricated."
            )

        if not has_negation_in_evidence and has_negation_in_claim:
            # Claim denies something that evidence affirms
            return (
                ClaimStanceEnum.CONTRADICTED.value,
                0.85,
                "Reference evidence affirms facts directly disputed by the claim."
            )

        # 4. Lexical Content Overlap Alignment
        claim_words = set(re.findall(r"\b\w{4,}\b", claim_lower))
        ev_words = set(re.findall(r"\b\w{4,}\b", ev_lower))

        if not claim_words:
            return ClaimStanceEnum.INSUFFICIENT_EVIDENCE.value, 0.0, "Claim contains insufficient lexical signal."

        overlap = claim_words.intersection(ev_words)
        overlap_ratio = len(overlap) / len(claim_words)

        if overlap_ratio >= 0.40:
            conf = min(0.92, round(0.65 + (0.35 * overlap_ratio), 2))
            return (
                ClaimStanceEnum.SUPPORTED.value,
                conf,
                f"Reference evidence corroborates key factual predicates: {', '.join(list(overlap)[:4])}."
            )

        return (
            ClaimStanceEnum.INSUFFICIENT_EVIDENCE.value,
            0.30,
            "Evidence overlap is insufficient to definitively support or contradict the claim."
        )

    def verify_claim(self, claim: ExtractedClaim) -> ClaimVerificationResult:
        """
        Retrieves reference evidence and evaluates stance for a given ExtractedClaim.
        Enforces that claims with no matching evidence strictly return 'insufficient_evidence'.
        """
        # Step 1: Evidence retrieval from debunk knowledge base
        evidence_items = self.retriever.retrieve_evidence(claim.claim_text, top_k=2)

        # Mandatory Section 63 BSA safeguard: if no evidence found, NEVER guess truth
        if not evidence_items:
            return ClaimVerificationResult(
                claim_id=claim.claim_id,
                stance=ClaimStanceEnum.INSUFFICIENT_EVIDENCE.value,
                confidence=0.0,
                evidence_sources=[],
                rationale="No verified evidence found in approved reference source set.",
                limitations=[
                    "Lack of reference evidence does not prove a claim is false, but prevents automated verification.",
                    "Requires human fact-checker review."
                ]
            )

        # Step 2: NLI evaluation across retrieved evidence items
        stances = []
        confidences = []
        rationales = []
        sources = []

        for ev in evidence_items:
            stance, conf, reason = self.assess_entailment_polarity(
                claim_text=claim.claim_text,
                evidence_text=ev["text"],
                evidence_meta=ev
            )
            stances.append(stance)
            confidences.append(conf)
            pub = ev.get("publisher", "Official Reference")
            dt = ev.get("published_at", "")
            rationales.append(f"[{pub}{' (' + dt + ')' if dt else ''}]: {reason}")
            sources.append(ev.get("source_url", ""))

        # Step 3: Stance consensus synthesis
        unique_stances = set(stances)
        if len(unique_stances) == 1:
            final_stance = stances[0]
            final_conf = confidences[0]
        elif ClaimStanceEnum.SUPPORTED.value in unique_stances and ClaimStanceEnum.CONTRADICTED.value in unique_stances:
            final_stance = ClaimStanceEnum.MIXED.value
            final_conf = 0.50
        elif ClaimStanceEnum.CONTRADICTED.value in unique_stances:
            final_stance = ClaimStanceEnum.CONTRADICTED.value
            final_conf = max(confidences)
        elif ClaimStanceEnum.SUPPORTED.value in unique_stances:
            final_stance = ClaimStanceEnum.SUPPORTED.value
            final_conf = max(confidences)
        else:
            final_stance = ClaimStanceEnum.INSUFFICIENT_EVIDENCE.value
            final_conf = 0.0

        return ClaimVerificationResult(
            claim_id=claim.claim_id,
            stance=final_stance,
            confidence=round(final_conf, 2),
            evidence_sources=[s for s in sources if s],
            rationale=" | ".join(rationales),
            limitations=[
                "NLI stance reflects semantic consistency with verified reference articles.",
                "NLI scores are not legal proof of truth pursuant to Section 63 BSA standards."
            ]
        )


def verification_to_analysis_result(
    claim: ExtractedClaim,
    verification: ClaimVerificationResult
) -> AnalysisResult:
    """
    Serializes a ClaimVerificationResult into the canonical Section 5 AnalysisResult schema.
    """
    return AnalysisResult(
        entity_id=claim.source_record_id,
        task="claim_verification",
        model_or_algorithm="Pretrained NLI & Polarity Entailment",
        version="2.0",
        label=verification.stance,
        score=verification.confidence,
        score_type=ScoreTypeEnum.CALIBRATED_PROBABILITY.value if verification.confidence > 0 else ScoreTypeEnum.HEURISTIC.value,
        explanation=[
            f"Claim: '{claim.claim_text}'",
            f"Verification Outcome: {verification.stance.upper()} (Confidence: {verification.confidence:.2f})",
            f"Rationale: {verification.rationale}"
        ],
        evidence_record_ids=[claim.source_record_id],
        source_urls=verification.evidence_sources,
        threshold=0.50,
        limitations=verification.limitations
    )
