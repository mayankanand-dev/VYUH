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
  dataset_source?: string | null;
  author_handle?: string | null;
  author_name?: string | null;
  text_content?: string | null;
  created_at_utc?: string | null;
  metrics?: {
    retweet_count?: number;
    like_count?: number;
    reply_count?: number;
  };
  bot_risk: number;
  sha256?: string | null;
  language?: string | null;
}

export const initialCases: CaseRecord[] = [
  {
    case_id: "INV-2025-089X",
    title: "Operation PaperStorm",
    status: "ACTIVE_INVESTIGATION",
    priority: "HIGH",
    lead_officer: "Insp. A. Sharma",
    unit: "Cyber Defense Operations / Special Task Force",
    created_at: "2025-05-12T08:30:00Z",
    narrative_focus: "Coordinated synthetic panic & banking run rumors targeting state financial hubs",
    evidence_count: 18,
    statutory_sections: ["IT Act Sec 79(3)(b)", "BNS Sec 196", "BNS Sec 353"],
    coordination_vectors: ["Synchronized Bot Clusters", "Hashtag Hijacking", "Manipulated Circulars"]
  },
  {
    case_id: "INV-2025-092M",
    title: "Operation RedGlacier",
    status: "UNDER_REVIEW",
    priority: "HIGH",
    lead_officer: "DySP R. Verma",
    unit: "OSINT Unit, Cyber Crime Police Station Patna",
    created_at: "2025-05-14T11:15:00Z",
    narrative_focus: "Cross-border sockpuppet botnet disseminating localized communal provocation",
    evidence_count: 12,
    statutory_sections: ["IT Act Sec 66D", "IT Act Sec 79(3)(b)", "BNS Sec 299"],
    coordination_vectors: ["IRA Sockpuppet Network", "Proxy Geolocation Shifting", "Meme Injection"]
  },
  {
    case_id: "INV-2025-095K",
    title: "Agrarian Policy Disinformation Inquest",
    status: "ACTIVE_INVESTIGATION",
    priority: "MEDIUM",
    lead_officer: "Insp. P. Jha",
    unit: "State Cyber Intelligence Bureau",
    created_at: "2025-05-16T14:40:00Z",
    narrative_focus: "Automated engagement boosting on agricultural policy hashtags and localized protests",
    evidence_count: 14,
    statutory_sections: ["IT Act Sec 79(3)(b)", "IT Rules 2021 Rule 3(1)(d)"],
    coordination_vectors: ["Copy-Paste Tweet Storms", "High Burst Velocity", "Inauthentic Retweet Swarms"]
  },
  {
    case_id: "INV-2025-101T",
    title: "Operation ShadowSignal",
    status: "STAGED_FOR_NOTICE",
    priority: "CRITICAL",
    lead_officer: "Insp. A. Sharma",
    unit: "Cyber Defense Operations / Special Task Force",
    created_at: "2025-05-17T09:00:00Z",
    narrative_focus: "Coordinated deepfake audio dissemination during sensitive public assembly",
    evidence_count: 6,
    statutory_sections: ["IT Act Sec 66D", "IT Act Sec 79(3)(b)", "BNS Sec 336"],
    coordination_vectors: ["Audio Cloning", "Telegram Relay Nodes", "Instant Messenger Forwarding"]
  }
];

export const initialEvidence: EvidenceRecord[] = [
  {
    evidence_id: "EVD-2025-089-01",
    filename: "warc_session_bankrun_thread.warc.gz",
    case_id: "INV-2025-089X",
    mime_type: "application/gzip-warc",
    byte_size: 1428590,
    sha256: "4a7d1ed414474e4033ac29ccb8653d9b155637a91624069b893a60fb11b7b9d4",
    removal_hash: "REM-4A7D-1ED4-1447",
    captured_at: "2025-05-18T09:12:33Z",
    source_url: "https://x.com/thread/17892182947192842",
    author_handle: "@insider_reserve_leak",
    platform: "X (Twitter)",
    status: "SEALED_VAULT",
    custody_location: "Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)",
    risk_score: 0.94,
    statutory_infraction: "BNS Sec 353 / IT Act Sec 79(3)(b)"
  },
  {
    evidence_id: "EVD-2025-089-02",
    filename: "forensic_ela_counterfeit_circular.png",
    case_id: "INV-2025-089X",
    mime_type: "image/png",
    byte_size: 2491820,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    removal_hash: "REM-E3B0-C442-98FC",
    captured_at: "2025-05-18T09:44:11Z",
    source_url: "https://t.me/patna_bulletins/9041",
    author_handle: "@patna_bulletins",
    platform: "Telegram",
    status: "SEALED_VAULT",
    custody_location: "Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)",
    risk_score: 0.98,
    statutory_infraction: "BNS Sec 336 / BNS Sec 196"
  },
  {
    evidence_id: "EVD-2025-092-01",
    filename: "canonical_ira_troll_post_99214.json",
    case_id: "INV-2025-092M",
    mime_type: "application/json",
    byte_size: 3418,
    sha256: "7c8e98f01b138d4a9cf441e8c78351b68194d216bc3b798b0b925b441ca12d90",
    removal_hash: "REM-7C8E-98F0-1B13",
    captured_at: "2025-05-14T11:22:04Z",
    source_url: "https://x.com/status/9921400281920",
    author_handle: "@ten_gop_news",
    platform: "X (Twitter)",
    status: "SEALED_VAULT",
    custody_location: "Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)",
    risk_score: 0.89,
    statutory_infraction: "IT Act Sec 66D"
  },
  {
    evidence_id: "EVD-2025-095-01",
    filename: "tweet_swarm_farmers_campaign_slice.json",
    case_id: "INV-2025-095K",
    mime_type: "application/json",
    byte_size: 18450,
    sha256: "9b12a537f89b91040854cb0633b497b715690b230236a0d42614b8d78572186c",
    removal_hash: "REM-9B12-A537-F89B",
    captured_at: "2025-05-16T15:02:18Z",
    source_url: "https://x.com/search?q=%23FarmersProtest",
    author_handle: "@kisan_front_amplified",
    platform: "X (Twitter)",
    status: "SEALED_VAULT",
    custody_location: "Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)",
    risk_score: 0.82,
    statutory_infraction: "IT Act Sec 79(3)(b)"
  },
  {
    evidence_id: "EVD-2025-101-01",
    filename: "synthetic_audio_spectrogram_assembly.wav",
    case_id: "INV-2025-101T",
    mime_type: "audio/wav",
    byte_size: 894100,
    sha256: "3f2504e04f891f8b2210da0da59e5d969767ea626a8f2244ea612e13b829ee1b",
    removal_hash: "REM-3F25-04E0-4F89",
    captured_at: "2025-05-17T09:15:40Z",
    source_url: "https://t.me/voice_leaks_bihar/302",
    author_handle: "@voice_leaks_bihar",
    platform: "Telegram",
    status: "SEALED_VAULT",
    custody_location: "Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)",
    risk_score: 0.99,
    statutory_infraction: "BNS Sec 336 / IT Act Sec 66D"
  }
];

export const sahyog12Fields = [
  { id: "officer_name", label: "01. Authorized Officer Name", value: "Insp. Anand Sharma", helper: "Designated under IT Act & BNSS" },
  { id: "officer_designation", label: "02. Designation / Cadre", value: "Inspector of Police, Cyber Defense Operations Unit", helper: "Law Enforcement Agency Attestation" },
  { id: "officer_email", label: "03. Official Govt Email", value: "anand.sharma@police.bihar.gov.in", helper: "Authorized domain for Sahyog portal receipt" },
  { id: "agency_name", label: "04. Law Enforcement Agency (LEA)", value: "Bihar Police State Cyber Crime Police Station / STF", helper: "State Cyber Coordination Agency" },
  { id: "case_reference_no", label: "05. Inquest / FIR Case Reference", value: "INV-2025-089X // FIR-88/2025-CYBER", helper: "Official criminal case or preliminary enquiry number" },
  { id: "target_platform", label: "06. Intermediary / Platform Entity", value: "X Corp. (formerly Twitter) / Telegram FZ-LLC", helper: "Designated intermediary compliance officer" },
  { id: "statutory_provision", label: "07. Statutory Section & Power", value: "Section 79(3)(b) Information Technology Act, 2000 & Section 94 BNSS, 2023", helper: "Formal takedown and preservation mandate" },
  { id: "violative_content_urls", label: "08. Violative Uniform Resource Identifiers (URIs)", value: "https://x.com/thread/17892182947192842\nhttps://x.com/status/17892182947192842/photo/1", helper: "Direct links to offending posts or media" },
  { id: "account_handle", label: "09. Offending Account Handle / User ID", value: "@insider_reserve_leak (UID: 184920491829)", helper: "Publisher identity" },
  { id: "court_sha256_hash", label: "10. Court Integrity Digest (SHA-256)", value: "4a7d1ed414474e4033ac29ccb8653d9b155637a91624069b893a60fb11b7b9d4", helper: "For Section 63 BSA legal certificate" },
  { id: "content_removal_hash", label: "11. Content Removal Hash (Blocklist Registry)", value: "REM-4A7D-1ED4-1447", helper: "Perceptual / platform blocklist hash for automated takedown" },
  { id: "evidentiary_justification", label: "12. Evidentiary Justification & Harmonic Impact", value: "Coordinated distribution of synthetic counterfeit RBI emergency liquidity notice inciting statewide run on regional branches. Forensic analysis established 94% coordination score across bot cluster with high burst velocity.", helper: "Neutral factual grounds for statutory takedown" }
];
