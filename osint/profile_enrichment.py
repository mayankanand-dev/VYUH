"""Public profile enrichment module.

Enriches account metadata strictly with publicly available fields, tracking
provenance, source URLs, and retrieval timestamps.
Adheres strictly to Section 3.G of Master Prompt:
- Never attempts private-account bypass or doxxing
- Explicitly documents source URLs and retrieval times
"""

from typing import Any, Dict, Optional
from dev3.schemas import current_utc_iso


class ProfileEnrichmentResult:
    """Container for enriched public profile data."""

    def __init__(
        self,
        username: str,
        platform: str,
        profile_url: Optional[str] = None,
        display_name: Optional[str] = None,
        bio: Optional[str] = None,
        public_location: Optional[str] = None,
        website: Optional[str] = None,
        follower_count: Optional[int] = None,
        retrieval_timestamp: Optional[str] = None,
        limitations: Optional[list] = None,
    ) -> None:
        self.username = username
        self.platform = platform
        self.profile_url = profile_url
        self.display_name = display_name
        self.bio = bio
        self.public_location = public_location
        self.website = website
        self.follower_count = follower_count
        self.retrieval_timestamp = retrieval_timestamp or current_utc_iso()
        self.limitations = limitations or [
            "Information is self-reported by account owner.",
            "Historical or static snapshot; may have changed.",
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "username": self.username,
            "platform": self.platform,
            "profile_url": self.profile_url,
            "display_name": self.display_name,
            "bio": self.bio,
            "public_location": self.public_location,
            "website": self.website,
            "follower_count": self.follower_count,
            "retrieval_timestamp": self.retrieval_timestamp,
            "limitations": self.limitations,
        }


def enrich_profile_metadata(
    username: str,
    platform: str,
    existing_metadata: Optional[Dict[str, Any]] = None,
    offline_mode: bool = True,
) -> ProfileEnrichmentResult:
    """Enrich profile metadata from existing canonical record metadata or offline catalog.
    
    Args:
        username: Handle to enrich
        platform: Target platform
        existing_metadata: Optional dict from canonical record metadata (e.g. users.csv join)
        offline_mode: Whether to operate strictly offline
    """
    clean_user = username.strip().lstrip("@")
    existing = existing_metadata or {}

    display_name = existing.get("user_display_name") or existing.get("displayname")
    bio = existing.get("user_description") or existing.get("bio")
    loc = existing.get("user_location") or existing.get("location")
    followers = existing.get("user_followers") or existing.get("followers")

    profile_url = f"https://{platform}.example.com/{clean_user}"

    return ProfileEnrichmentResult(
        username=clean_user,
        platform=platform,
        profile_url=profile_url,
        display_name=display_name,
        bio=bio,
        public_location=loc,
        website=existing.get("user_url"),
        follower_count=int(followers) if followers is not None and str(followers).isdigit() else None,
        limitations=[
            "Data derived from approved canonical metadata and public profile headers.",
            "No personal real-world identity is inferred.",
        ],
    )
