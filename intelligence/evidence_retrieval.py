"""Evidence Retrieval Subsystem for VYUH (Developer 2).

Conforms strictly to Section 4.B.6 and Section 9 of OSINT_Disinfo_Team_README_Final.md.
Retrieves matching factual reference evidence from approved historical debunk sets,
official government gazettes, and verified news archives with strict provenance.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Default fallback reference evidence bank with verified provenance
DEFAULT_REFERENCE_STORE: List[Dict[str, Any]] = [
    {
        "evidence_id": "EV_REF_FARM_01",
        "topic": "Farmers Protest & Farm Laws Passage",
        "category": "historical_protest",
        "text": "The Parliament of India passed three agricultural reform bills in September 2020: the Farmers' Produce Trade and Commerce Act, the Farmers Agreement on Price Assurance Act, and the Essential Commodities Amendment Act.",
        "verdict": "TRUE",
        "source_url": "https://prsindia.org/bills/parliament/the-farmers-produce-trade-and-commerce-promotion-and-facilitation-bill-2020",
        "publisher": "PRS Legislative Research",
        "published_at": "2020-09-28",
        "keywords": ["farmers", "passed", "farm laws", "parliament", "bills", "agriculture"]
    },
    {
        "evidence_id": "EV_REF_FARM_02",
        "topic": "Farmers Protest Repeal Enactment",
        "category": "historical_protest",
        "text": "Prime Minister Narendra Modi announced the repeal of the three farm laws on November 19, 2021, and Parliament formally passed the Farm Laws Repeal Bill on November 29, 2021.",
        "verdict": "TRUE",
        "source_url": "https://sansad.in/rs/bills/repealed-bills",
        "publisher": "Parliament of India Gazette",
        "published_at": "2021-11-29",
        "keywords": ["repeal", "farm laws", "modi", "passed", "parliament", "repealed", "bill"]
    },
    {
        "evidence_id": "EV_REF_FARM_03",
        "topic": "MSP Legal Guarantee Statutory Status",
        "category": "historical_protest",
        "text": "While minimum support price (MSP) is announced administratively for 23 mandated crops, there is no existing statutory or constitutional legal guarantee compelling private buyers to purchase at MSP.",
        "verdict": "TRUE",
        "source_url": "https://agricoop.nic.in/en/msp",
        "publisher": "Ministry of Agriculture & Farmers Welfare, India",
        "published_at": "2021-01-15",
        "keywords": ["msp", "legal guarantee", "minimum support price", "statutory", "mandate"]
    },
    {
        "evidence_id": "EV_REF_IRA_01",
        "topic": "Paul Manafort Surveillance Authorization",
        "category": "historical_foreign",
        "text": "US investigators obtained a FISA court wiretap authorization monitoring Paul Manafort during the 2016 campaign in connection with undisclosed foreign lobbying and financial transactions with pro-Russian Ukrainian politicians.",
        "verdict": "TRUE",
        "source_url": "https://www.justice.gov/storage/report.pdf",
        "publisher": "US Department of Justice / Mueller Report",
        "published_at": "2019-04-18",
        "keywords": ["manafort", "fisa", "wiretap", "surveillance", "mueller", "russia"]
    },
    {
        "evidence_id": "EV_REF_IRA_02",
        "topic": "Trump Tower Wiretapping Allegations",
        "category": "historical_foreign",
        "text": "FBI Director James Comey and the Department of Justice officially testified that there was no evidence to support allegations that President Obama ordered surveillance or wiretapping of Trump Tower.",
        "verdict": "FALSE",
        "source_url": "https://www.justice.gov/oig/reports/review-four-fisa-applications-and-other-aspects-fbis-crossfire-hurricane-investigation",
        "publisher": "US DOJ Inspector General / FBI",
        "published_at": "2019-12-09",
        "keywords": ["trump tower", "wiretap", "wiretapped", "obama", "surveillance", "comey", "no evidence"]
    },
    {
        "evidence_id": "EV_REF_IRA_03",
        "topic": "Senator Menendez Corruption Trial Verdict",
        "category": "historical_foreign",
        "text": "Democratic Senator Bob Menendez was on federal trial in Newark in autumn 2017 facing bribery and corruption charges involving a Florida eye doctor; the trial concluded in a mistrial in November 2017 due to a hung jury.",
        "verdict": "TRUE",
        "source_url": "https://www.justice.gov/usao-nj/pr/us-senator-robert-menendez-and-salomon-melgen-indicted-connection-bribery-scheme",
        "publisher": "US Attorney's Office, District of New Jersey",
        "published_at": "2017-11-16",
        "keywords": ["menendez", "trial", "mistrial", "hung jury", "bribery", "corruption"]
    }
]


def load_knowledge_base(
    custom_path: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Loads reference debunks from disk or defaults to bundled bank."""
    search_paths = [
        custom_path,
        "data/intelligence/debunk_knowledge_base.jsonl",
        os.path.join(os.path.dirname(__file__), "..", "data", "intelligence", "debunk_knowledge_base.jsonl")
    ]

    for p in search_paths:
        if p and os.path.exists(p):
            try:
                loaded = []
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            loaded.append(json.loads(line))
                if loaded:
                    return loaded
            except Exception:
                pass

    return DEFAULT_REFERENCE_STORE


class EvidenceRetriever:
    """
    Retrieves matching evidence documents for a given claim text
    using hybrid semantic, lexical, and keyword reference matching.
    """
    def __init__(
        self,
        knowledge_base_path: Optional[str] = None,
        min_similarity_threshold: float = 0.18
    ):
        self.min_similarity_threshold = min_similarity_threshold
        self.evidence_store = load_knowledge_base(knowledge_base_path)
        
        # Build composite representation for TF-IDF
        self.ref_texts = []
        for item in self.evidence_store:
            kw_str = " ".join(item.get("keywords", []))
            topic_str = item.get("topic", "")
            claim_str = item.get("claim_debunked", "")
            text_str = item.get("text", "")
            composite = f"{topic_str} {claim_str} {text_str} {kw_str}".strip()
            self.ref_texts.append(composite)

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True
        )
        self.ref_matrix = self.vectorizer.fit_transform(self.ref_texts)

    def retrieve_evidence(
        self,
        claim_text: str,
        top_k: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Retrieves matching evidence items.
        If no evidence passes the similarity threshold, returns an empty list,
        enforcing the non-negotiable safeguard that claims lacking evidence default to 'insufficient_evidence'.
        """
        if not claim_text or not claim_text.strip():
            return []

        # Vectorized TF-IDF cosine similarity
        claim_vec = self.vectorizer.transform([claim_text])
        sims = (self.ref_matrix * claim_vec.T).toarray().flatten()

        # Keyword boost: bonus score if explicit keywords match
        claim_lower = claim_text.lower()
        claim_tokens = set(re.findall(r"\b\w{3,}\b", claim_lower))

        scored_indices = []
        for idx, base_sim in enumerate(sims):
            item = self.evidence_store[idx]
            keywords = [k.lower() for k in item.get("keywords", [])]
            kw_overlap = len(claim_tokens.intersection(keywords))
            
            # Boost score based on keyword overlap
            boosted_score = float(base_sim) + (0.05 * kw_overlap)
            scored_indices.append((idx, boosted_score))

        # Rank by score descending
        scored_indices.sort(key=lambda x: x[1], reverse=True)
        matches = []

        for idx, score in scored_indices:
            if score < self.min_similarity_threshold:
                break

            matched_item = dict(self.evidence_store[idx])
            matched_item["relevance_score"] = round(min(1.0, score), 4)
            matched_item["relevance_rationale"] = (
                f"Direct semantic and lexical alignment (relevance: {score:.3f}) with reference topic '{matched_item['topic']}'"
            )
            matches.append(matched_item)
            if len(matches) >= top_k:
                break

        return matches
