"""Generate canonicalPosts.ts for the Social Signal Lab (Twitter/X Clone)
from the VYUH normalized canonical_fixture_1000.jsonl stream.
"""

import json
from pathlib import Path
from datetime import datetime

AVATAR_COLORS = [
    "bg-amber-600", "bg-blue-600", "bg-purple-600", "bg-emerald-600",
    "bg-rose-600", "bg-indigo-600", "bg-teal-600", "bg-cyan-600"
]

def format_timestamp(dt_str: str) -> str:
    if not dt_str:
        return "Historical"
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return dt_str[:10] if len(dt_str) >= 10 else dt_str

def main():
    root = Path(__file__).resolve().parent.parent.parent
    fixture_path = root / "VYUH" / "data" / "normalized" / "canonical_fixture_1000.jsonl"
    out_path = root / "social-signal-lab" / "data" / "canonicalPosts.ts"

    if not fixture_path.exists():
        print(f"Fixture not found at {fixture_path}")
        return

    with open(fixture_path, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    print(f"Loaded {len(records)} canonical records.")

    posts = []
    for i, r in enumerate(records):
        uname = (r.get("author_name") or "unknown").strip().lstrip("@")
        dname = (r.get("author_display_name") or uname).strip()
        initials = "".join([part[0] for part in dname.split()[:2]]).upper() or uname[:2].upper()
        if not initials:
            initials = "XX"
        
        avatar_bg = AVATAR_COLORS[hash(uname) % len(AVATAR_COLORS)]
        is_ira = r.get("source_dataset") == "russian_ira_tweets"
        meta = r.get("metadata") or {}
        eng = r.get("engagement") or {}
        likes = eng.get("likes") or 0
        retweets = eng.get("retweets") or 0
        replies = eng.get("replies") or 0
        quotes = eng.get("quotes") or 0

        # Media parsing
        media = None
        media_refs = r.get("media_reference") or []
        if media_refs and isinstance(media_refs, list):
            first = media_refs[0]
            url = first.get("previewUrl") or first.get("fullUrl")
            if url and (url.startswith("http://") or url.startswith("https://")):
                media = {
                    "type": "image",
                    "url": url,
                    "alt": f"Media by @{uname}",
                }

        # Detection Finding
        finding = None
        if is_ira:
            category = meta.get("account_category") or "Troll Account"
            region = meta.get("region") or "Unknown"
            finding = {
                "badgeLabel": "High Coordination Risk",
                "severity": "high",
                "ruleTriggered": "Known Disinformation Account Category (IRA Troll Archive)",
                "confidenceScore": 0.96,
                "reason": f"Account flagged in IRA Troll Archive under persona category: {category} ({region}).",
                "detectedSignals": [
                    "Attributed to Internet Research Agency (IRA) foreign influence operation",
                    f"Persona Category: {category}",
                    f"Target Region: {region}",
                ],
                "disclaimer": "HISTORICAL REPLAY: Sourced from official FiveThirtyEight / Twitter IRA Disinformation Archive.",
            }
        elif r.get("hashtags"):
            tags = r.get("hashtags", [])
            finding = {
                "badgeLabel": "Review recommended",
                "severity": "medium",
                "ruleTriggered": "Protest Mobilization & High-Velocity Hashtags",
                "confidenceScore": 0.82,
                "reason": f"Post features active mobilization tags: {', '.join(['#' + t for t in tags[:3]])}.",
                "detectedSignals": [
                    f"Campaign hashtags: {', '.join(['#' + t for t in tags[:4]])}",
                    f"Verified Author: {'Yes' if meta.get('user_verified') else 'No'}",
                    f"Engagement Volume: {likes} likes, {retweets} retweets",
                ],
                "disclaimer": "HISTORICAL REPLAY: Sourced from Kaggle Farmers Protest Historical Dataset.",
            }

        post = {
            "id": r.get("record_id") or f"can_{i}",
            "authorName": dname,
            "authorHandle": f"@{uname}",
            "authorInitials": initials,
            "authorAvatarBg": avatar_bg,
            "isVerified": bool(meta.get("user_verified")),
            "isSimulationBot": is_ira,
            "isFollowingAuthor": False,
            "timestamp": format_timestamp(r.get("created_at")),
            "content": r.get("text") or "",
            "hashtags": [f"#{h.lstrip('#')}" for h in r.get("hashtags") or []],
            "metrics": {
                "replies": replies,
                "reposts": retweets + quotes,
                "likes": likes,
                "views": f"{max(likes * 12, 100):,}",
                "bookmarks": max(int(likes * 0.05), 0),
            },
            "userInteractions": {
                "isLiked": False,
                "isReposted": False,
                "isBookmarked": False,
            },
            "repliesList": [],
            "sourceDataset": r.get("source_dataset"),
            "dataMode": r.get("data_mode", "historical"),
        }
        if media:
            post["media"] = media
        if finding:
            post["detectionFinding"] = finding

        posts.append(post)

    out_content = f"""// AUTO-GENERATED FROM VYUH CANONICAL NORMALIZED STREAM (Dev 1)
// Source: alpha/VYUH/data/normalized/canonical_fixture_1000.jsonl
// Total Records: {len(posts)}

import {{ Post }} from '@/types/feed';

export interface CanonicalPost extends Post {{
  sourceDataset?: string;
  dataMode?: string;
}}

export const CANONICAL_FIXTURE_POSTS: CanonicalPost[] = {json.dumps(posts, indent=2, ensure_ascii=False)};
"""

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out_content)

    print(f"Successfully generated {out_path} with {len(posts)} canonical posts.")

if __name__ == "__main__":
    main()
