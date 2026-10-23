"""Factual Claim Extraction Subsystem for VYUH (Developer 2).

Conforms strictly to Section 4.B and Section 5 of OSINT_Disinfo_Team_README_Final.md.
Isolates discrete, verifiable factual assertions and allegations from viral posts
while filtering out subjective opinions, slogans, and personal remarks.
"""

import hashlib
import re
from typing import Any, Dict, List, Optional, Tuple

from intelligence.models import AnalysisResult, ExtractedClaim, ScoreTypeEnum

# Patterns that signal objective factual claims or allegations
ASSERTION_INDICATORS = [
    # Allegations & Legal/Political claims
    r"\b(on trial|accused of|investigated for|wiretapped|wiretap|indicted|guilty of|bribed|arrested|registered|firs|fir|charges)\b",

    r"\b(confirmed that|revealed that|leaked that|reported that|admits that|claims that|states that)\b",
    # Government & Policy assertions
    r"\b(passed bill|repealed|enacted|banned|approved law|amendment|ordinance|msp guarantee)\b",
    # Quantitative / Statistical assertions
    r"\b(\d+%\s+of|\d+\s+(people|farmers|citizens|voters|protesters|dollars|crore|lakh|million|billion))\b",
    r"\b(killed|died|injured|lost|spent|earned|funded by)\b",
    # Quoted assertions
    r'["\u201c\u201d]([^"\u201c\u201d]{15,})["\u201c\u201d]',
]

# Opinion / Slogan filters to exclude non-claims
OPINION_INDICATORS = [
    r"^(support|please support|stand with|prayers for|good morning|hello)\b",
    r"^#\w+\s*$",  # Hashtags only
]


class ClaimExtractor:
    """
    Extracts testable factual claims from social media text using structural
    and lexical assertion indicators with schema validation.
    """
    def __init__(self, min_claim_len: int = 15, max_claim_len: int = 280):
        self.min_claim_len = min_claim_len
        self.max_claim_len = max_claim_len
        self.compiled_assertions = [re.compile(p, re.IGNORECASE) for p in ASSERTION_INDICATORS]
        self.compiled_opinions = [re.compile(p, re.IGNORECASE) for p in OPINION_INDICATORS]

    def is_opinion_or_slogan(self, text: str) -> bool:
        """Flags subjective slogans that do not represent testable factual claims."""
        clean = text.strip().lower()
        if len(clean) < self.min_claim_len:
            return True
        for op_regex in self.compiled_opinions:
            if op_regex.search(clean):
                # If it's just 'Support farmers protest', it's a slogan
                if len(clean.split()) < 8:
                    return True
        return False

    def extract_named_entities(self, text: str) -> List[str]:
        """Extracts candidate entities (capitalized phrases, political figures, agencies)."""
        # Proper noun heuristic
        capitalized = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
        known_entities = {
            "Trump", "Trump Tower", "Manafort", "Paul Manafort", "Modi",
            "Congress", "BJP", "Supreme Court", "FBI", "DOJ", "Democrat",
            "Republican", "Senate", "Farmers", "Kisan", "Delhi"
        }
        found = set()
        for ent in capitalized:
            if ent in known_entities or len(ent.split()) > 1:
                found.add(ent)
        for ke in known_entities:
            if re.search(rf"\b{re.escape(ke)}\b", text, re.IGNORECASE):
                found.add(ke)
        return sorted(list(found))

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
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", text) if len(s.strip()) >= self.min_claim_len]

        for s in sentences:
            # Check for direct assertion pattern
            matches = sum(1 for regex in self.compiled_assertions if regex.search(s))
            entities = self.extract_named_entities(s)

            if matches > 0 or len(entities) >= 2:
                # Clean URLs from claim text
                clean_claim = re.sub(r"https?://\S+", "", s).strip()
                clean_claim = re.sub(r"^[~@\s]+", "", clean_claim)
                if len(clean_claim) < self.min_claim_len:
                    continue

                claim_id = f"claim_{hashlib.md5(f'{record_id}_{clean_claim}'.encode()).hexdigest()[:10]}"
                confidence = min(0.95, round(0.6 + (0.15 * matches) + (0.1 * min(len(entities), 2)), 2))

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
        model_or_algorithm="Rule-based Assertion & Entity Matcher",
        version="1.0",
        label=f"claim_extracted:{claim.claim_id}",
        score=claim.confidence,
        score_type=ScoreTypeEnum.HEURISTIC.value,
        explanation=[
            f"Factual claim isolated: '{claim.claim_text}'",
            f"Salient entities identified: {', '.join(claim.entities)}" if claim.entities else "No entities"
        ],
        evidence_record_ids=[claim.source_record_id],
        source_urls=[],
        threshold=0.60,
        limitations=[
            "Claim extraction isolates testable assertions from post syntax.",
            "Extraction does not determine whether the assertion is true or false."
        ]
    )
