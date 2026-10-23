"""Media inventory and safe asset loader for VYUH (Developer 3).

Stage 1 of Multimedia Forensics:
- Safely inspects canonical record 'media_reference' objects
- Prevents path traversal and unsafe remote execution
- Strictly separates available local assets from historical remote-only references
- Rejects SSRF / private IP targets
- Enforces configurable file size and format limits
"""

import ast
import json
from pathlib import Path
from typing import Any, Dict, Generator, Iterable, List, Optional, Set, Tuple
from urllib.parse import urlparse

from media.config import DEFAULT_MEDIA_CONFIG, MediaConfig
from media.schemas import MediaInventoryItem


SUPPORTED_IMAGE_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}
SUPPORTED_VIDEO_EXTENSIONS: Set[str] = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def is_safe_local_path(candidate_path: Path, base_dir: Path) -> bool:
    """Ensure candidate_path does not escape base_dir via directory traversal."""
    try:
        resolved_base = base_dir.resolve()
        resolved_cand = candidate_path.resolve()
        return resolved_base in resolved_cand.parents or resolved_base == resolved_cand
    except Exception:
        return False


def is_safe_remote_url(url: str, config: MediaConfig = DEFAULT_MEDIA_CONFIG) -> Tuple[bool, str]:
    """Validate remote URL against allowed schemes and disallowed hosts (SSRF prevention)."""
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in config.allowed_schemes:
            return False, f"Unsupported or dangerous URL scheme: '{parsed.scheme}'"

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False, "Missing hostname in media URL"

        for dh in config.disallowed_hosts:
            if hostname == dh or hostname.endswith(f".{dh}"):
                return False, f"Disallowed private/internal host: '{hostname}'"

        return True, "URL passes safety verification"
    except Exception as ex:
        return False, f"Malformed URL: {ex}"


def parse_media_reference(raw_ref: Any) -> List[Dict[str, Any]]:
    """Safely parse media_reference field into list of dictionaries.
    
    Handles:
    - Native python lists of dicts
    - String representations (e.g. from CSV stringified representations)
    - Empty, None, or malformed entries
    """
    if raw_ref is None:
        return []

    if isinstance(raw_ref, list):
        parsed = []
        for item in raw_ref:
            if isinstance(item, dict):
                parsed.append(item)
            elif isinstance(item, str) and item.strip():
                try:
                    loaded = json.loads(item)
                    if isinstance(loaded, dict):
                        parsed.append(loaded)
                    elif isinstance(loaded, list):
                        parsed.extend([x for x in loaded if isinstance(x, dict)])
                except Exception:
                    # Treat plain string URL as photo reference
                    parsed.append({"type": "photo", "fullUrl": item, "previewUrl": item})
        return parsed

    if isinstance(raw_ref, dict):
        return [raw_ref]

    if isinstance(raw_ref, str):
        cleaned = raw_ref.strip()
        if not cleaned or cleaned in ("[]", "{}", "null", "None"):
            return []
        # Attempt JSON load
        try:
            loaded = json.loads(cleaned)
            if isinstance(loaded, list):
                return [x for x in loaded if isinstance(x, dict)]
            if isinstance(loaded, dict):
                return [loaded]
        except Exception:
            pass
        # Attempt ast.literal_eval for Python repr
        try:
            evaluated = ast.literal_eval(cleaned)
            if isinstance(evaluated, list):
                return [x for x in evaluated if isinstance(x, dict)]
            if isinstance(evaluated, dict):
                return [evaluated]
        except Exception:
            pass

        # If it's a bare URL string
        if cleaned.startswith("http://") or cleaned.startswith("https://"):
            return [{"type": "photo", "fullUrl": cleaned, "previewUrl": cleaned}]

    return []


def resolve_local_asset(
    ref_dict: Dict[str, Any],
    record_id: str,
    media_dir: Optional[Path] = None,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> Tuple[Optional[Path], str, Optional[str], Optional[int]]:
    """Attempt to resolve a local file for a media reference safely.
    
    Returns:
        (resolved_path, status, missing_reason, file_size)
    """
    if not media_dir or not media_dir.exists():
        return None, "bytes_unavailable", "Local media directory not configured or does not exist", None

    # Check candidates from reference
    full_url = ref_dict.get("fullUrl") or ref_dict.get("url") or ""
    preview_url = ref_dict.get("previewUrl") or ""
    local_hint = ref_dict.get("local_path") or ref_dict.get("path") or ""

    candidate_names: List[str] = []
    if local_hint:
        candidate_names.append(Path(local_hint).name)
    if full_url:
        parsed_name = Path(urlparse(full_url).path).name
        if parsed_name:
            candidate_names.append(parsed_name)
    if preview_url:
        parsed_prev = Path(urlparse(preview_url).path).name
        if parsed_prev:
            candidate_names.append(parsed_prev)
    # Also candidate based on record_id
    candidate_names.append(f"{record_id}.jpg")
    candidate_names.append(f"{record_id}.png")
    candidate_names.append(f"{record_id}.mp4")

    for c_name in candidate_names:
        cand_path = media_dir / c_name
        if not is_safe_local_path(cand_path, media_dir):
            return None, "malformed_reference", f"Directory traversal attempt detected: '{c_name}'", None
        if cand_path.exists() and cand_path.is_file():
            size = cand_path.stat().st_size
            ext = cand_path.suffix.lower()

            # Check limits
            if ext in SUPPORTED_IMAGE_EXTENSIONS:
                if size > config.max_image_size_bytes:
                    return cand_path, "unsupported_format", f"Image size ({size} bytes) exceeds limit ({config.max_image_size_bytes})", size
                return cand_path, "available", None, size

            if ext in SUPPORTED_VIDEO_EXTENSIONS:
                if size > config.max_video_size_bytes:
                    return cand_path, "unsupported_format", f"Video size ({size} bytes) exceeds limit ({config.max_video_size_bytes})", size
                return cand_path, "available", None, size

            return cand_path, "unsupported_format", f"Unsupported file extension: '{ext}'", size

    return None, "bytes_unavailable", "Historical remote media bytes are not present in local media directory", None


def inventory_canonical_media(
    records: Iterable[Dict[str, Any]],
    media_dir: Optional[Path] = None,
    config: MediaConfig = DEFAULT_MEDIA_CONFIG,
) -> List[MediaInventoryItem]:
    """Scan canonical records and construct a strict media inventory.
    
    Guarantees:
    - Never fabricates media files, timestamps, or authors
    - Records missing-data reasons honestly
    - Preserves canonical record_id linkage
    """
    inventory: List[MediaInventoryItem] = []
    seen_artifacts: Set[str] = set()

    for rec in records:
        rec_id = str(rec.get("record_id", ""))
        if not rec_id:
            continue

        raw_media = rec.get("media_reference")
        post_id = rec.get("post_id")
        author_id = rec.get("author_id")
        source_dataset = rec.get("source_dataset")

        # Parse media references
        media_list = parse_media_reference(raw_media)

        if not media_list and raw_media not in (None, [], "", {}, "[]", "{}", "null", "None"):
            # Record was malformed
            art_id = f"MEDIA_{rec_id}_malformed"
            inventory.append(
                MediaInventoryItem(
                    artifact_id=art_id,
                    source_record_id=rec_id,
                    source_post_id=post_id,
                    source_author_id=author_id,
                    source_dataset=source_dataset,
                    media_type="unknown",
                    source_media_reference={"raw": str(raw_media)},
                    local_asset_path=None,
                    analysis_status="malformed_reference",
                    missing_data_reason=f"Failed to parse media_reference: '{str(raw_media)[:100]}'",
                )
            )
            continue

        for idx, m_ref in enumerate(media_list):
            m_type = str(m_ref.get("type", "photo")).lower()
            if m_type not in ("photo", "video"):
                m_type = "photo" if any(k in str(m_ref) for k in (".jpg", ".png", ".jpeg")) else "unknown"

            art_id = f"MEDIA_{rec_id}_{idx}"
            if art_id in seen_artifacts:
                art_id = f"MEDIA_{rec_id}_{idx}_{len(seen_artifacts)}"
            seen_artifacts.add(art_id)

            resolved_path, status, missing_reason, f_size = resolve_local_asset(
                m_ref, rec_id, media_dir=media_dir, config=config
            )

            mime = None
            if resolved_path:
                ext = resolved_path.suffix.lower()
                mime = {
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".png": "image/png",
                    ".webp": "image/webp",
                    ".mp4": "video/mp4",
                    ".mov": "video/quicktime",
                }.get(ext, "application/octet-stream")

            inventory.append(
                MediaInventoryItem(
                    artifact_id=art_id,
                    source_record_id=rec_id,
                    source_post_id=post_id,
                    source_author_id=author_id,
                    source_dataset=source_dataset,
                    media_type=m_type,
                    source_media_reference=m_ref,
                    local_asset_path=str(resolved_path) if resolved_path else None,
                    analysis_status=status,
                    missing_data_reason=missing_reason,
                    file_size_bytes=f_size,
                    mime_type=mime,
                )
            )

    return inventory
