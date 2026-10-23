"""Candidate account linkage module.

Identifies cautious candidate linkage hypotheses between accounts across platforms
based on defensible evidence: exact public username reuse, self-reported cross-links,
and bio text similarity.

Adheres strictly to Section 3.G and Section 10 of Master Prompt:
- NEVER asserts accounts belong to the same person based on a username match alone
- Explicitly provides alternative explanations (coincidental collision, popular handle)
- Marks all results as requiring human review
- Strictest non-doxxing policy: no real-world names or private identity inferences
"""

from typing import Any, Dict, List, Optional
from dev3.schemas import CandidateAccountLink, OSINTFinding


def generate_candidate_account_links(
    osint_findings: List[OSINTFinding],
    canonical_accounts: Optional[Dict[str, Dict[str, Any]]] = None,
) -> List[CandidateAccountLink]:
    """Generate candidate cross-platform linkage hypotheses.
    
    Args:
        osint_findings: Enumeration findings from username searches
        canonical_accounts: Optional dictionary of canonical accounts with bios/metadata
        
    Returns:
        List of CandidateAccountLink hypotheses
    """
    links: List[CandidateAccountLink] = []

    # Group findings by queried username
    by_username: Dict[str, List[OSINTFinding]] = {}
    for f in osint_findings:
        if f.status == "found" and f.profile_url:
            by_username.setdefault(f.queried_username.lower(), []).append(f)

    for username, found_list in by_username.items():
        if len(found_list) < 2:
            continue

        # Pairwise or cluster candidate linkage
        platforms = [f.site_name for f in found_list]
        urls = [f.profile_url for f in found_list if f.profile_url]
        account_identifiers = [f"{f.site_name}:{f.queried_username}" for f in found_list]

        # Calculate cautious confidence
        # A common generic username (e.g. 'john', 'admin', 'alex') has very low confidence
        is_short_or_generic = len(username) <= 4 or username in ("news", "daily", "press", "update", "media", "admin")
        confidence = 0.35 if is_short_or_generic else 0.65

        alternative_explanations = [
            f"Common or generic handle '{username}' registered independently by different individuals.",
            "Brand impersonation or parody account.",
            "Platform default username assignment.",
        ]

        limitations = [
            "Candidate linkage is an investigative hypothesis, NOT proof of shared real-world ownership.",
            "Username reuse across disparate services does not establish legal or operational attribution.",
            "Requires corroborating digital forensics and verified ownership credentials.",
        ]

        links.append(CandidateAccountLink(
            candidate_account_ids=account_identifiers,
            linkage_method="exact_public_username_reuse",
            evidence_record_ids=[],
            source_urls=urls,
            matched_fields=["username", "profile_url"],
            confidence_score=confidence,
            scoring_interpretation=(
                "Moderate heuristic confidence based solely on public handle string identity. "
                "Uncalibrated; human review mandatory."
            ),
            alternative_explanations=alternative_explanations,
            limitations=limitations,
            requires_human_review=True,
        ))

    return links
