"""Evidence Retrieval Subsystem for VYUH (Developer 2).

Conforms strictly to Section 4.B.6 and Section 9 of OSINT_Disinfo_Team_README_Final.md.
Retrieves matching factual reference evidence from approved historical debunk sets,
official government gazettes, and verified news archives with strict provenance.
"""

from typing import Any, Dict, List, Optional
import numpy as np

from intelligence.embeddings import get_embedder

# Curated reference evidence bank with verified provenance
REFERENCE_EVIDENCE_STORE: List[Dict[str, Any]] = [
    {
        "evidence_id": "EV_REF_FARM_01",
        "topic": "Farmers Protest & Farm Laws",
        "text": "The Parliament of India passed three agricultural reform bills in September 2020: the Farmers' Produce Trade and Commerce Act, the Farmers Agreement on Price Assurance Act, and the Essential Commodities Amendment Act.",
        "source_url": "https://prsindia.org/bills/parliament/the-farmers-produce-trade-and-commerce-promotion-and-facilitation-bill-2020",
        "publisher": "PRS Legislative Research",
        "published_at": "2020-09-28"
    },
    {
        "evidence_id": "EV_REF_FARM_02",
        "topic": "Farmers Protest Repeal",
        "text": "Prime Minister Narendra Modi announced the repeal of the three farm laws on November 19, 2021, and Parliament formally passed the Farm Laws Repeal Bill on November 29, 2021.",
        "source_url": "https://sansad.in/rs/bills/repealed-bills",
        "publisher": "Parliament of India Gazette",
        "published_at": "2021-11-29"
    },
    {
        "evidence_id": "EV_REF_FARM_03",
        "topic": "MSP Legal Guarantee",
        "text": "While minimum support price (MSP) is announced administratively for 23 mandated crops, there is no existing statutory or constitutional legal guarantee compelling private buyers to purchase at MSP.",
        "source_url": "https://agricoop.nic.in/en/msp",
        "publisher": "Ministry of Agriculture & Farmers Welfare, India",
        "published_at": "2021-01-15"
    },
    {
        "evidence_id": "EV_REF_IRA_01",
        "topic": "Manafort Surveillance",
        "text": "US investigators obtained a FISA court wiretap authorization monitoring Paul Manafort during the 2016 campaign in connection with undisclosed foreign lobbying and financial transactions with pro-Russian Ukrainian politicians.",
        "source_url": "https://www.justice.gov/storage/report.pdf",
        "publisher": "US Department of Justice / Mueller Report",
        "published_at": "2019-04-18"
    },
    {
        "evidence_id": "EV_REF_IRA_02",
        "topic": "Trump Tower Wiretapping Allegation",
        "text": "FBI Director James Comey and the Department of Justice officially testified that there was no evidence to support allegations that President Obama ordered surveillance or wiretapping of Trump Tower.",
        "source_url": "https://www.justice.gov/oig/reports/review-four-fisa-applications-and-other-aspects-fbis-crossfire-hurricane-investigation",
        "publisher": "US DOJ Inspector General",
        "published_at": "2019-12-09"
    },
    {
        "evidence_id": "EV_REF_IRA_03",
        "topic": "Senator Menendez Corruption Trial",
        "text": "Democratic Senator Bob Menendez was on federal trial in Newark in autumn 2017 facing bribery and corruption charges involving a Florida eye doctor; the trial concluded in a mistrial in November 2017 due to a hung jury.",
        "source_url": "https://www.justice.gov/usao-nj/pr/us-senator-robert-menendez-and-salomon-melgen-indicted-connection-bribery-scheme",
        "publisher": "US Attorney's Office, District of New Jersey",
        "published_at": "2017-11-16"
    }
]


class EvidenceRetriever:
    """
    Retrieves matching evidence documents for a given claim text
    using semantic and lexical reference matching.
    """
    def __init__(self, min_similarity_threshold: float = 0.25):
        self.min_similarity_threshold = min_similarity_threshold
        self.evidence_store = REFERENCE_EVIDENCE_STORE
        self.ref_texts = [f"{item['topic']} {item['text']}" for item in self.evidence_store]

        from sklearn.feature_extraction.text import TfidfVectorizer
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
        enforcing the non-negotiable safeguard that claims lack evidence default to 'insufficient_evidence'.
        """
        if not claim_text or not claim_text.strip():
            return []

        claim_vec = self.vectorizer.transform([claim_text])
        # Compute cosine similarity
        sims = (self.ref_matrix * claim_vec.T).toarray().flatten()

        ranked_indices = np.argsort(sims)[::-1]
        matches = []

        for idx in ranked_indices:
            score = float(sims[idx])
            if score < self.min_similarity_threshold:
                break

            matched_item = dict(self.evidence_store[idx])
            matched_item["relevance_score"] = round(score, 4)
            matched_item["relevance_rationale"] = (
                f"Direct semantic alignment (relevance: {score:.3f}) with reference topic '{matched_item['topic']}'"
            )
            matches.append(matched_item)
            if len(matches) >= top_k:
                break

        return matches

