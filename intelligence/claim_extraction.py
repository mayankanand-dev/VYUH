"""Factual Claim Extraction Subsystem for VYUH (Developer 2).

Conforms strictly to Section 4.B.5, Section 5, and Section 10 of OSINT_Disinfo_Team_README_Final.md.
Isolates discrete, testable factual assertions and allegations from viral posts
using a hybrid pretrained instruction/zero-shot model pipeline with deterministic syntactic fallbacks,
filtering out subjective opinions, greetings, slogans, and personal remarks.
"""

import hashlib
import re
from typing import Any, Dict, List, Optional, Tuple

from intelligence.models import AnalysisResult, ExtractedClaim, ScoreTypeEnum

# Try importing HuggingFace transformers for pretrained zero-shot claim extraction
_TRANSFORMERS_AVAILABLE = False
try:
    from transformers import pipeline
    _TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

# Broadened assertion & allegation indicators covering financial panic, public order, and rumors
ASSERTION_INDICATORS = [
    # Allegations & Legal/Political claims
    r"\b(on trial|accused of|investigated for|wiretapped|wiretap|indicted|guilty of|bribed|arrested|registered|firs|fir|charges)\b",
    r"\b(confirmed that|revealed that|leaked that|reported that|admits that|claims that|states that|announced that)\b",
    # Government, Emergency & Policy assertions
    r"\b(passed bill|repealed|enacted|banned|approved law|amendment|ordinance|msp guarantee)\b",
    r"\b(emergency declared|declared emergency|curfew imposed|curfew declared|bank holiday|strike declared|service suspended|blackout)\b",
    # Leak, Fraud & Tampering assertions
    r"\b(paper leak|leaked paper|exam cancelled|hacked|wirelessly connected|deleted names|phishing link|subsidy granted)\b",
    # Quantitative / Statistical assertions
    r"\b(\d+%\s+of|\d+\s+(people|farmers|citizens|voters|protesters|dollars|crore|lakh|million|billion|districts|accounts))\b",
    r"\b(killed|died|injured|lost|spent|earned|funded by|opened fire|shut down)\b",
    # Quoted assertions
    r'["\u201c\u201d]([^"\u201c\u201d]{15,})["\u201c\u201d]',
]

# Opinion / Slogan filters to exclude non-claims
OPINION_INDICATORS = [
    r"^(support|please support|stand with|prayers for|good morning|hello|namaste|jai hind)\b",
    r"^#\w+\s*$",  # Hashtags only
    r"^(i feel|i think|in my opinion|great job|well done|shame on)\b"
]


class ClaimExtractor:
    """
    Extracts testable factual claims from social media text using a hybrid approach:
    1. Pretrained Zero-Shot Instruction Classifier (HuggingFace transformers) when loaded.
    2. Structural syntactic and lexical assertion extraction with entity grounding.
    """
    def __init__(
        self,
        min_claim_len: int = 15,
        max_claim_len: int = 280,
        use_pretrained_model: bool = False
    ):
        self.min_claim_len = min_claim_len
        self.max_claim_len = max_claim_len
        self.compiled_assertions = [re.compile(p, re.IGNORECASE) for p in ASSERTION_INDICATORS]
        self.compiled_opinions = [re.compile(p, re.IGNORECASE) for p in OPINION_INDICATORS]
        self.use_pretrained_model = use_pretrained_model and _TRANSFORMERS_AVAILABLE
        self._classifier = None

    def _get_classifier(self):
        """Lazy loader for HuggingFace zero-shot classification pipeline."""
        if self._classifier is None and self.use_pretrained_model:
            try:
                # Fast, lightweight zero-shot pipeline
                self._classifier = pipeline(
                    "zero-shot-classification",
                    model="typeform/distilbert-base-uncased-mnli",
                    device=-1
                )
            except Exception:
                self.use_pretrained_model = False
        return self._classifier

    def is_opinion_or_slogan(self, text: str) -> bool:
        """Flags subjective slogans and personal remarks that do not represent testable factual claims."""
        clean = text.strip().lower()
        if len(clean) < self.min_claim_len:
            return True
        for op_regex in self.compiled_opinions:
            if op_regex.search(clean):
                if len(clean.split()) < 8:
                    return True
        return False

    def extract_named_entities(self, text: str) -> List[str]:
        """Extracts candidate entities (proper nouns, political entities, institutions)."""
        capitalized = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
        known_entities = {
            "Trump", "Trump Tower", "Manafort", "Paul Manafort", "Modi",
            "Congress", "BJP", "Supreme Court", "FBI", "DOJ", "Democrat",
            "Republican", "Senate", "Farmers", "Kisan", "Delhi", "Patna",
            "Bihar", "BPSC", "RBI", "NPCI", "Railways", "ECI"
        }
        found = set()
        for ent in capitalized:
            if ent in known_entities or len(ent.split()) > 1:
                found.add(ent)
        for ke in known_entities:
            if re.search(rf"\b{re.escape(ke)}\b", text, re.IGNORECASE):
                found.add(ke)
        return sorted(list(found))

    def evaluate_with_instruction_model(self, candidate_sentence: str) -> Tuple[bool, float]:
        """
        Evaluates whether a candidate sentence represents a factual claim
        using a zero-shot instruction hypothesis.
        """
        classifier = self._get_classifier()
        if not classifier:
            return False, 0.0

        labels = ["factual claim or allegation", "subjective opinion or slogan"]
        try:
            res = classifier(candidate_sentence, candidate_labels=labels)
            top_label = res["labels"][0]
            top_score = float(res["scores"][0])
            if top_label == "factual claim or allegation" and top_score >= 0.65:
                return True, top_score
        except Exception:
            pass
        return False, 0.0

    def extract_claims_from_text(
        self,
        text: str,
        record_id: str,
        timestamp: Optional[str] = None
    ) -> List[ExtractedClaim]:
        """
        Isolates testable factual assertions from a given post text.
        """
        if not text or self.is_opinion_or_slogan(text):
            return []

        claims = []
        # Discourse segmentation into candidate statements
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", text) if len(s.strip()) >= self.min_claim_len]

        for s in sentences:
            # Clean URLs and leading user handles from candidate claim
            clean_claim = re.sub(r"https?://\S+", "", s).strip()
            clean_claim = re.sub(r"^[~@\s]+", "", clean_claim)
            clean_claim = re.sub(r"\s+", " ", clean_claim)
            
            if len(clean_claim) < self.min_claim_len:
                continue

            matches = sum(1 for regex in self.compiled_assertions if regex.search(clean_claim))
            entities = self.extract_named_entities(clean_claim)

            # Check with instruction classifier if enabled
            is_neural_claim, neural_score = False, 0.0
            if self.use_pretrained_model:
                is_neural_claim, neural_score = self.evaluate_with_instruction_model(clean_claim)

            # Acceptance criteria: regex assertion match, multi-entity factual statement, or neural confirmation
            if matches > 0 or len(entities) >= 2 or is_neural_claim:
                claim_id = f"claim_{hashlib.md5(f'{record_id}_{clean_claim}'.encode()).hexdigest()[:10]}"
                
                if is_neural_claim:
                    confidence = min(0.96, round(neural_score, 2))
                else:
                    confidence = min(0.95, round(0.65 + (0.10 * min(matches, 3)) + (0.05 * min(len(entities), 2)), 2))

                claims.append(
                    ExtractedClaim(
                        claim_id=claim_id,
                        source_record_id=record_id,
                        claim_text=clean_claim,
                        entities=entities,
                        confidence=confidence,
                        timestamp=timestamp
                    )
                )

        return claims

    extract_claims = extract_claims_from_text


def claim_to_analysis_result(claim: ExtractedClaim) -> AnalysisResult:
    """Converts an ExtractedClaim into canonical Section 5 AnalysisResult schema."""
    return AnalysisResult(
        entity_id=claim.source_record_id,
        task="claim_extraction",
        model_or_algorithm="Hybrid Instruction & Syntactic Assertion Extractor",
        version="2.0",
        label=f"claim_extracted:{claim.claim_id}",
        score=claim.confidence,
        score_type=ScoreTypeEnum.HEURISTIC.value,
        explanation=[
            f"Factual claim isolated: '{claim.claim_text}'",
            f"Salient entities identified: {', '.join(claim.entities)}" if claim.entities else "No named entities detected"
        ],
        evidence_record_ids=[claim.source_record_id],
        source_urls=[],
        threshold=0.60,
        limitations=[
            "Claim extraction isolates testable assertions from post syntax.",
            "Extraction does not determine whether the assertion is true or false."
        ]
    )
