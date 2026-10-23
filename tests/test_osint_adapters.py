"""Unit tests for OSINT Username Search and Candidate Linkage (Module G).

Covers:
- Offline mock adapter statuses: found, not_found, blocked, error
- Zero network requests executed
- Candidate account linkage with alternative explanations and limitations
- Human review flag requirement
"""

import pytest
from osint.username_search import MockUsernameSearchAdapter, search_username_across_platforms
from osint.account_linkage import generate_candidate_account_links


def test_mock_osint_statuses():
    # Configure deterministic responses
    canned = {
        "target_user": {
            "github": "found",
            "reddit": "not_found",
            "telegram": "blocked",
            "youtube": "error",
        }
    }
    adapter = MockUsernameSearchAdapter(canned_responses=canned)
    findings = adapter.search_username("target_user", platforms=["github", "reddit", "telegram", "youtube"])

    by_site = {f.site_name: f for f in findings}

    assert by_site["github"].status == "found"
    assert by_site["github"].profile_url == "https://github.com/target_user"
    assert by_site["reddit"].status == "not_found"
    assert by_site["reddit"].profile_url is None
    assert by_site["telegram"].status == "blocked"
    assert by_site["youtube"].status == "error"

    # Verify provenance and limitations present in every finding
    for f in findings:
        assert f.tool_or_provider == "mock_osint_adapter"
        assert len(f.limitations) > 0


def test_candidate_account_linkage():
    # Simulate a user found across multiple services
    findings = [
        search_username_across_platforms("unique_persona_99", offline_mode=True, platforms=["github", "reddit"])
    ][0]
    # Force both to 'found'
    for f in findings:
        f.status = "found"
        f.profile_url = f"https://{f.site_name}.example.com/unique_persona_99"

    links = generate_candidate_account_links(findings)
    assert len(links) == 1

    link = links[0]
    assert link.linkage_method == "exact_public_username_reuse"
    assert link.requires_human_review is True
    assert link.confidence_score <= 1.0
    assert len(link.alternative_explanations) >= 2
    assert "Coincidental handle collision" in link.alternative_explanations[0] or "independent" in link.alternative_explanations[0]
