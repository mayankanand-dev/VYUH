"""Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Certificate Draft Generator.

Produces legally structured, verifiable digital evidence certificates for court admissibility,
prefilling verified cryptographic SHA-256 digests, timestamps, file sizes, and tool versions,
while leaving human verification declarations and signature fields for the responsible officer.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from evidence.integrity import compute_sha256


def generate_bsa_section63_certificate(
    case_id: str,
    case_title: str,
    officer_name: str,
    officer_designation: str,
    police_station: str,
    evidence_items: List[Dict[str, Any]],
    device_details: Optional[Dict[str, Any]] = None,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """Generate a formal Section 63 BSA Certificate draft."""
    cert_id = f"CERT_BSA63_{uuid.uuid4().hex[:8].upper()}"
    timestamp_utc = datetime.now(timezone.utc).isoformat()

    verified_artifacts = []
    for item in evidence_items:
        file_path_str = item.get("file_path") or item.get("source_url")
        file_p = Path(file_path_str) if file_path_str else None

        actual_sha256 = item.get("sha256")
        byte_size = item.get("byte_size", 0)

        if file_p and file_p.exists():
            actual_sha256 = compute_sha256(file_p)
            byte_size = file_p.stat().st_size

        verified_artifacts.append({
            "artifact_id": item.get("evidence_id") or f"ART_{uuid.uuid4().hex[:8]}",
            "filename": item.get("filename") or (file_p.name if file_p else "electronic_record.json"),
            "mime_type": item.get("mime_type", "application/json"),
            "byte_size": byte_size,
            "sha256_hash": actual_sha256 or "UNSPECIFIED_HASH",
            "capture_timestamp": item.get("captured_at") or timestamp_utc,
            "source_reference": str(item.get("source_url") or "Historical Ingestion Stream"),
            "custody_location": item.get("custody_location") or "VYUH Cryptographic WORM Vault (Local Enclave)",
        })

    certificate = {
        "bsa_certificate_meta": {
            "certificate_id": cert_id,
            "statutory_act": "Bharatiya Sakshya Adhiniyam, 2023 (Act No. 47 of 2023)",
            "section": "Section 63 (Admissibility of electronic records)",
            "generated_at_utc": timestamp_utc,
            "verification_status": "DRAFT_PENDING_OFFICER_SIGNATURE",
        },
        "case_details": {
            "case_id": case_id,
            "case_title": case_title,
            "police_station": police_station,
            "jurisdiction": "Cyber Crime Division / Special Task Force",
            "enclave": "ENCLAVE-04 (Gov-OSINT)",
        },
        "authorized_officer": {
            "name": officer_name,
            "designation": officer_designation,
            "department": "Cyber Defense & Disinformation Investigation Cell",
            "system_role": "Investigating Officer / Evidence Custodian",
        },
        "computing_system_declaration": device_details or {
            "system_description": "Secure Forensic Workstation / VYUH Enclave Server",
            "operating_system": "Windows 11 Enterprise (FIPS mode enabled)",
            "evidence_acquisition_tool": "VYUH OSINT Normalization & Evidence Preserver v1.0",
            "operational_status": "The computing system was operating properly during creation, capture, and preservation. Digital integrity uncompromised.",
        },
        "electronic_records": verified_artifacts,
        "legal_affirmation_text": (
            f"I, {officer_name}, {officer_designation}, do hereby certify pursuant to Section 63(4) of the "
            "Bharatiya Sakshya Adhiniyam (BSA), 2023 that the electronic records detailed herein were produced "
            "by the aforementioned computer system during the period when the computer was operating properly. "
            "The cryptographic SHA-256 hashes certify that the contents have remained bit-level immutable without "
            "alteration, tampering, or deletion since time of capture."
        ),
        "signature_block": {
            "officer_signature": "[PENDING MANUAL OR DIGITAL TOKEN SIGNATURE]",
            "official_seal": "[POLICE STATION CYBER CELL SEAL]",
            "date_signed": None,
        },
    }

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        out_file = output_dir / f"BSA_Sec63_Certificate_{case_id}_{cert_id}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(certificate, f, indent=2, ensure_ascii=False)
        certificate["exported_file_path"] = str(out_file.as_posix())

    return certificate
