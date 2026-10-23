"""Public username search and enumeration module.

Provides an adapter-based architecture for Sherlock-style public account searches.
Adheres strictly to Section 3.G of Master Prompt:
- Performs ZERO network calls during tests (mock/offline mode by default)
- Does not bypass logins, CAPTCHAs, or rate limits
- Explicitly models statuses: 'found', 'not_found', 'error', 'blocked'
- Captures provenance, check timestamps, and tool versions
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import urllib.parse
from dev3.schemas import OSINTFinding, current_utc_iso


# Target platform catalog with public URL templates
PLATFORM_TEMPLATES = {
    "github": "https://github.com/{username}",
    "reddit": "https://www.reddit.com/user/{username}",
    "telegram": "https://t.me/{username}",
    "youtube": "https://www.youtube.com/@{username}",
    "medium": "https://medium.com/@{username}",
    "mastodon": "https://mastodon.social/@{username}",
    "hackernews": "https://news.ycombinator.com/user?id={username}",
}


class BaseUsernameSearchAdapter(ABC):
    """Abstract interface for public username enumeration providers."""

    @abstractmethod
    def search_username(
        self,
        username: str,
        platforms: Optional[List[str]] = None,
    ) -> List[OSINTFinding]:
        """Query platforms for public presence of username."""
        pass


class MockUsernameSearchAdapter(BaseUsernameSearchAdapter):
    """Deterministic offline adapter for unit tests and local demonstrations."""

    def __init__(self, canned_responses: Optional[Dict[str, Dict[str, str]]] = None) -> None:
        """
        canned_responses: dict of {username: {platform: status}}
        e.g. {'10_GOP': {'reddit': 'found', 'github': 'not_found', 'telegram': 'blocked'}}
        """
        self.canned_responses = canned_responses or {}

    def search_username(
        self,
        username: str,
        platforms: Optional[List[str]] = None,
    ) -> List[OSINTFinding]:
        clean_user = username.strip().lstrip("@")
        target_platforms = platforms or list(PLATFORM_TEMPLATES.keys())
        findings: List[OSINTFinding] = []

        user_presets = self.canned_responses.get(clean_user, {})

        for plat in target_platforms:
            template = PLATFORM_TEMPLATES.get(plat, "https://{platform}.example.com/{username}")
            profile_url = template.format(username=urllib.parse.quote(clean_user), platform=plat)
            
            # Determine mock status
            if plat in user_presets:
                status = user_presets[plat]
            elif "fail" in clean_user.lower() and plat == "telegram":
                status = "blocked"
            elif "error" in clean_user.lower():
                status = "error"
            elif hash(clean_user + plat) % 3 == 0:
                status = "found"
            else:
                status = "not_found"

            url_reported = profile_url if status == "found" else None
            matching_field = "HTTP 200 Public Profile" if status == "found" else None

            limitations = [
                "Offline deterministic test simulation; no external network packets transmitted.",
                "Non-existence cannot be proven purely by automated HTTP status codes.",
            ]
            if status in ("blocked", "error"):
                limitations.append("Lookup encountered simulated access block or timeout; account status unconfirmed.")

            findings.append(OSINTFinding(
                queried_username=clean_user,
                site_name=plat,
                profile_url=url_reported,
                status=status,
                check_timestamp=current_utc_iso(),
                tool_or_provider="mock_osint_adapter",
                version="1.0.0",
                matching_field=matching_field,
                provenance="Simulated public endpoint probe",
                limitations=limitations,
            ))

        return findings


class PublicHttpUsernameAdapter(BaseUsernameSearchAdapter):
    """Conservative HTTP HEAD/GET probe for public websites."""

    def __init__(self, timeout_seconds: int = 10, user_agent: Optional[str] = None) -> None:
        self.timeout = timeout_seconds
        self.user_agent = user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OSINT Research Tool/1.0"

    def search_username(
        self,
        username: str,
        platforms: Optional[List[str]] = None,
    ) -> List[OSINTFinding]:
        import requests

        clean_user = username.strip().lstrip("@")
        target_platforms = platforms or list(PLATFORM_TEMPLATES.keys())
        findings: List[OSINTFinding] = []

        headers = {"User-Agent": self.user_agent}

        for plat in target_platforms:
            template = PLATFORM_TEMPLATES.get(plat)
            if not template:
                continue
            profile_url = template.format(username=urllib.parse.quote(clean_user))
            status = "not_found"
            matching_field = None
            limitations = ["Public probe; does not verify account ownership."]

            try:
                resp = requests.head(profile_url, headers=headers, timeout=self.timeout, allow_redirects=True)
                if resp.status_code == 200:
                    status = "found"
                    matching_field = "HTTP 200 OK"
                elif resp.status_code == 404:
                    status = "not_found"
                elif resp.status_code in (403, 429):
                    status = "blocked"
                    limitations.append("Site returned rate limit or anti-scraping response; existence indeterminate.")
                else:
                    status = "error"
            except requests.Timeout:
                status = "error"
                limitations.append("Connection timed out; account existence not disproven.")
            except Exception as ex:
                status = "error"
                limitations.append(f"Network error during lookup: {type(ex).__name__}")

            findings.append(OSINTFinding(
                queried_username=clean_user,
                site_name=plat,
                profile_url=profile_url if status == "found" else None,
                status=status,
                check_timestamp=current_utc_iso(),
                tool_or_provider="vyuh_http_osint_probe",
                version="1.0.0",
                matching_field=matching_field,
                provenance=f"GET/HEAD request to {profile_url}",
                limitations=limitations,
            ))

        return findings


def search_username_across_platforms(
    username: str,
    adapter: Optional[BaseUsernameSearchAdapter] = None,
    offline_mode: bool = True,
    platforms: Optional[List[str]] = None,
) -> List[OSINTFinding]:
    """Top-level convenience function for username enumeration."""
    if adapter is None:
        adapter = MockUsernameSearchAdapter() if offline_mode else PublicHttpUsernameAdapter()
    return adapter.search_username(username, platforms=platforms)
