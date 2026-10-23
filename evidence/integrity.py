"""Cryptographic SHA-256 evidence integrity and manifest manager.

Fulfills BSA Section 63 requirements by recording immutable byte-level hashes,
file sizes, capture timestamps, and chain-of-custody artifacts.

NOTE: Evidence manifests are strictly on-demand. They are NEVER generated automatically
for internal ETL files, but generated ONLY when an investigator explicitly requests
an evidence package through the application.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any, Union
from ingestion.models import EvidenceManifestItem


def compute_sha256(file_path: Path, block_size: int = 65536) -> str:
    """Compute cryptographic SHA-256 over exact file bytes."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for block in iter(lambda: f.read(block_size), b""):
            sha256.update(block)
    return sha256.hexdigest()


def compute_bytes_sha256(data: bytes) -> str:
    """Compute cryptographic SHA-256 over raw byte payload."""
    return hashlib.sha256(data).hexdigest()


def create_manifest_entry(
    file_path: Path,
    artifact_type: str = "original",
    case_id: str = "CASE_ON_DEMAND",
    source_url: Optional[str] = None,
    limitations: Optional[List[str]] = None,
) -> EvidenceManifestItem:
    """Generate a validated EvidenceManifestItem for a given target file."""
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found for hash calculation: {file_path}")

    byte_size = p.stat().st_size
    sha256_hash = compute_sha256(p)

    # Determine MIME type
    ext = p.suffix.lower()
    mime_map = {
        ".csv": "text/csv",
        ".json": "application/json",
        ".jsonl": "application/x-jsonlines",
        ".md": "text/markdown",
        ".txt": "text/plain",
        ".jpg": "image/jpeg",
        ".png": "image/png",
    }
    mime_type = mime_map.get(ext, "application/octet-stream")

    return EvidenceManifestItem(
        evidence_id=f"EV_{uuid.uuid4().hex[:12]}",
        case_id=case_id,
        source_url=source_url or str(p.as_posix()),
        captured_at=datetime.now(timezone.utc).isoformat(),
        filename=p.name,
        mime_type=mime_type,
        byte_size=byte_size,
        sha256=sha256_hash,
        artifact_type=artifact_type,
        tool_version="vyuh_evidence_v1.0",
        limitations=limitations or ["Explicitly requested case evidence", "Verified via local byte-stream hash"],
    )


def verify_file_hash(file_path: Path, expected_sha256: str) -> bool:
    """Verify file integrity by recomputing and comparing SHA-256."""
    actual_hash = compute_sha256(file_path)
    return actual_hash.lower() == expected_sha256.lower()


def generate_on_demand_evidence_package(
    case_id: str,
    investigator_id: str,
    target_evidence_files: List[Path],
    output_dir: Path,
    purpose: str = "Forensic case export for investigation",
    additional_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Generate an official BSA Section 63 compliant Evidence Package ON-DEMAND.
    
    This is called strictly when a user or investigator explicitly triggers
    evidence export in the application UI or API.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_id = f"MANIFEST_{uuid.uuid4().hex[:12].upper()}"
    timestamp_utc = datetime.now(timezone.utc).isoformat()

    manifest_items: List[Dict[str, Any]] = []
    for fp in target_evidence_files:
        p = Path(fp)
        if not p.exists():
            continue
        entry = create_manifest_entry(
            p,
            artifact_type="case_export",
            case_id=case_id,
            limitations=[purpose],
        )
        manifest_items.append(entry.model_dump(mode="json"))

    package = {
        "bsa_section_63_certificate": {
            "certificate_id": f"CERT_BSA63_{uuid.uuid4().hex[:8].upper()}",
            "generated_at": timestamp_utc,
            "case_id": case_id,
            "requested_by_officer_id": investigator_id,
            "purpose": purpose,
            "legal_declaration": (
                "Produced pursuant to Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023. "
                "Cryptographic SHA-256 hashes certify that electronic records have not been "
                "tampered with, altered, or modified since capture."
            ),
        },
        "manifest_id": manifest_id,
        "total_evidence_items": len(manifest_items),
        "items": manifest_items,
        "metadata": additional_metadata or {},
    }

    manifest_path = output_dir / f"evidence_manifest_{case_id}_{uuid.uuid4().hex[:6]}.json"
    raw_json = json.dumps(package, indent=2, ensure_ascii=False)
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(raw_json)

    package_sha256 = compute_bytes_sha256(raw_json.encode("utf-8"))
    package["manifest_file"] = str(manifest_path.as_posix())
    package["manifest_sha256"] = package_sha256

    return package
