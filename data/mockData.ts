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
  target_keyword?: string;
  suspect_accounts?: string[];
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

// Real Sealed Custody Evidence Records generated from flagged canonical posts with Section 63 BSA compliance
export const initialEvidence: EvidenceRecord[] = realEvidence as EvidenceRecord[];

