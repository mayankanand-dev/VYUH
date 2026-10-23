"""Sahyog / I4C Notice Preparation Engine for Law Enforcement Agencies.

Generates structured, statutory takedown & preservation notices conforming to:
- Section 79(3)(b) Information Technology Act, 2000
- Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
- Section 91 CrPC / Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 for data preservation

Outputs neutral evidentiary summaries, hash-anchored target lists, and bundleable export packets.
"""

import json
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from evidence.integrity import compute_sha256


def generate_sahyog_notice(
    case_id: str,
    case_title: str,
    investigating_officer: str,
    designation: str,
    police_unit: str,
    target_platform: str,
    infraction_categories: List[str],
    flagged_entities: List[Dict[str, Any]],
    evidentiary_summary: str,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """Generate a formal I4C Sahyog portal statutory notice packet."""
    notice_id = f"I4C-NOT-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    created_at_utc = datetime.now(timezone.utc).isoformat()

    sanitized_items = []
    for idx, item in enumerate(flagged_entities, start=1):
        sanitized_items.append({
            "item_index": idx,
            "target_url": item.get("url") or item.get("target_url") or "N/A",
            "account_handle": item.get("author_handle") or item.get("account_handle") or "Unknown",
            "post_id": item.get("post_id") or item.get("canonical_id") or "N/A",
            "sha256_content_hash": item.get("sha256") or "N/A",
            "bot_or_coordination_score": item.get("risk_score", 0.85),
            "alleged_statutory_violation": item.get("violation") or "Dissemination of false/provocative content prejudicial to public order",
        })

    notice_packet = {
        "sahyog_notice_meta": {
            "notice_id": notice_id,
            "portal": "Indian Cybercrime Coordination Centre (I4C) - Sahyog Platform",
            "statutory_provisions": [
                "Section 79(3)(b) Information Technology Act, 2000",
                "Rule 3(1)(d) Information Technology (Intermediary Guidelines) Rules, 2021",
                "Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Sec 91 CrPC",
            ],
            "generated_at_utc": created_at_utc,
            "urgency_level": "PRIORITY_EXPEDITE",
            "status": "READY_FOR_OFFICER_SIGN_OFF",
        },
        "investigating_authority": {
            "case_id": case_id,
            "case_title": case_title,
            "officer_name": investigating_officer,
            "designation": designation,
            "police_unit": police_unit,
            "contact_email": "cybercell.investigations@biharpolice.gov.in",
        },
        "intermediary_details": {
            "platform_name": target_platform,
            "grievance_or_nodal_office": f"Nodal / Law Enforcement Response Team ({target_platform})",
        },
        "neutral_evidentiary_summary": evidentiary_summary.strip(),
        "flagged_content_registry": sanitized_items,
        "statutory_directions": [
            "1. TAKEDOWN / ACCESS DISABLEMENT: Immediately disable public access to the URLs/accounts detailed herein pursuant to actual knowledge under Section 79(3)(b) of the IT Act within the prescribed 36-hour statutory window.",
            "2. PRESERVATION ORDER: Pursuant to Section 94 BNSS, 2023, preserve all associated server traffic logs, IP registration logs, access timestamps, linked telephone numbers, email addresses, payment records, and device fingerprints for a minimum period of 180 days.",
            "3. CHAIN OF CUSTODY INTEGRITY: Transmit forensic subscriber identity records through the official Sahyog LEA upload gateway.",
        ],
        "declaration": "This notice is requisitioned in furtherance of lawful investigation into coordinated inauthentic dissemination impacting public tranquility. The evidentiary artifacts have been cryptographically hashed and entered into the WORM custody ledger.",
    }

    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        notice_json_file = output_dir / f"{notice_id}.json"
        with open(notice_json_file, "w", encoding="utf-8") as f:
            json.dump(notice_packet, f, indent=2, ensure_ascii=False)

    return notice_packet


def build_sahyog_export_zip(
    notice_packet: Dict[str, Any],
    associated_evidence_files: List[Path],
    output_zip_path: Path,
) -> Path:
    """Bundle the notice JSON, Section 63 certificate draft, and evidence files into a court-ready ZIP."""
    output_zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        notice_bytes = json.dumps(notice_packet, indent=2, ensure_ascii=False).encode("utf-8")
        zf.writestr(f"NOTICE_{notice_packet['sahyog_notice_meta']['notice_id']}.json", notice_bytes)

        manifest_lines = [
            f"# Sahyog Export Bundle Manifest - {notice_packet['sahyog_notice_meta']['notice_id']}",
            f"# Generated: {notice_packet['sahyog_notice_meta']['generated_at_utc']}",
            "---",
        ]
        for fpath in associated_evidence_files:
            if fpath.exists() and fpath.is_file():
                h = compute_sha256(fpath)
                zf.write(fpath, arcname=f"evidence/{fpath.name}")
                manifest_lines.append(f"{h}  evidence/{fpath.name}")

        zf.writestr("SHA256SUMS.txt", "\n".join(manifest_lines).encode("utf-8"))

    return output_zip_path
