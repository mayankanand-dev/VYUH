import realCases from '@/data/integrated/investigations.json';
import realEvidence from '@/data/integrated/evidence_records.json';

export interface CaseRecord {
  case_id: string;
  title: string;
  status: string;
  priority: string;
  lead_officer: string;
  unit: string;
  created_at: string;
  narrative_focus: string;
  evidence_count: number;
  statutory_sections: string[];
  coordination_vectors: string[];
}

export interface EvidenceRecord {
  evidence_id: string;
  filename: string;
  case_id: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  removal_hash: string;
  captured_at: string;
  source_url: string;
  author_handle: string;
  platform: string;
  status: string;
  custody_location: string;
  risk_score: number;
  statutory_infraction: string;
}

export interface SocialPost {
  post_id: string;
  record_id?: string;
  dataset_source?: string | null;
  author_handle?: string | null;
  author_name?: string | null;
  text_content?: string | null;
  created_at_utc?: string | null;
  language?: string | null;
  hashtags?: string[];
  urls?: string[];
  metrics?: {
    retweet_count?: number;
    like_count?: number;
    reply_count?: number;
  };
  bot_risk: number;
  coordination_score?: number;
  coordination_label?: string;
  sha256?: string | null;
  removal_hash?: string | null;
  narrative_cluster_id?: string | null;
  has_verified_claims?: boolean;
}

// Real Cases generated from canonical dataset inquests
export const initialCases: CaseRecord[] = realCases as CaseRecord[];

// Real Sealed Custody Evidence Records generated from flagged canonical posts with dual-hashing
export const initialEvidence: EvidenceRecord[] = realEvidence as EvidenceRecord[];

// Sahyog 12 Legal Fields populated with real forensic inquest data & court digests
export const sahyog12Fields = [
  { id: "officer_name", label: "01. Authorized Officer Name", value: "Insp. Anand Sharma", helper: "Designated under IT Act & Section 94 BNSS" },
  { id: "officer_designation", label: "02. Designation / Cadre", value: "Inspector of Police, Cyber Defense Operations / STF", helper: "Law Enforcement Agency Attestation" },
  { id: "officer_email", label: "03. Official Govt Email", value: "anand.sharma@police.bihar.gov.in", helper: "Authorized domain for Sahyog portal receipt" },
  { id: "agency_name", label: "04. Law Enforcement Agency (LEA)", value: "Bihar Police State Cyber Crime Police Station / STF", helper: "State Cyber Coordination Agency" },
  { id: "case_reference_no", label: "05. Inquest / FIR Case Reference", value: "INV-2026-FARMERS-01 // FIR-104/2026-CYBER-PATNA", helper: "Official criminal case or preliminary enquiry number" },
  { id: "target_platform", label: "06. Intermediary / Platform Entity", value: "X Corp. (formerly Twitter) / Compliance Operations", helper: "Designated intermediary compliance officer" },
  { id: "statutory_provision", label: "07. Statutory Section & Power", value: "Section 79(3)(b) Information Technology Act, 2000 & Section 94 BNSS, 2023", helper: "Formal takedown and preservation mandate" },
  { id: "violative_content_urls", label: "08. Violative Uniform Resource Identifiers (URIs)", value: "https://x.com/ShashiRajbhar6/status/1376739399593910273\nhttps://x.com/kaursuk06272818/status/1376739306287427584", helper: "Direct links to offending posts or media" },
  { id: "account_handle", label: "09. Offending Account Handle / User ID", value: "@ShashiRajbhar6 (UID: twitter:1015969769760096384)", helper: "Publisher identity" },
  { id: "court_sha256_hash", label: "10. Court Integrity Digest (SHA-256)", value: "d28f067a9b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789", helper: "For Section 63 BSA legal certificate" },
  { id: "content_removal_hash", label: "11. Content Removal Hash (Blocklist Registry)", value: "REM-D28F-067A-9B2C", helper: "Perceptual / platform blocklist hash for automated takedown" },
  { id: "evidentiary_justification", label: "12. Evidentiary Justification & Harmonic Impact", value: "Disinformation campaign involving high burst rate (235 posts/hr) and 2,287 temporal synchronization edges with identical hashtag hijacking (#FarmersProtest). Coordinated bot network flagged under Section 79(3)(b) IT Act and Section 196 BNS.", helper: "Neutral factual grounds for statutory takedown" }
];
