# VYUH — OSINT & Coordinated Disinformation Investigation Platform

[![Specification](https://img.shields.io/badge/Schema-v1.0%20Canonical-blue)](docs/CANONICAL_DATA_SCHEMA.md)
[![Compliance](https://img.shields.io/badge/Compliance-BSA%20Section%2063-emerald)](evidence/integrity.py)
[![Frontend](https://img.shields.io/badge/UI-Social%20Signal%20Lab%20(X%20Clone)-black)](social-signal-lab/)

VYUH is an open-source intelligence (OSINT) and forensic investigation platform designed to analyze coordinated inauthentic behavior, narrative manipulation, and influence campaigns.

Built pursuant to **ISO/IEC 27037** (Digital Evidence Preservation) and **Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023**.

---

## Repository Layout (Monorepo)

```
VYUH/
├── docs/
│   └── CANONICAL_DATA_SCHEMA.md       # Complete 26-field canonical schema specification & data contracts
├── ingestion/                         # Developer 1: Ingestion & Normalization Engine
│   ├── models.py                      # Pydantic v2 CanonicalRecord, Manifest & Audit models
│   ├── run_normalization.py           # Streaming orchestrator for 4M+ records
│   └── normalizers/
│       ├── farmers_protest_normalizer.py  # 64-bit ID regex, media & user joins
│       └── russian_ira_normalizer.py      # Troll persona metadata, retweets & ISO timestamps
├── evidence/                          # Digital Evidence & Chain-of-Custody Subsystem
│   └── integrity.py                   # On-demand BSA Section 63 certificate & SHA-256 package generator
├── data/
│   └── normalized/
│       └── canonical_fixture_1000.jsonl   # Balanced 1,000-record test fixture for Dev 2, Dev 3 & UI
├── logs/
│   ├── DEV1_CHANGELOG.md              # Detailed chronological implementation audit log
│   └── audit_log.jsonl                # Append-only structured audit trail
├── social-signal-lab/                 # Twitter / X Clone Frontend (Next.js + TypeScript)
│   ├── app/                           # Next.js App Router (Pure Home Feed)
│   ├── components/feed/               # Timeline, PostCard with historical campaign badges
│   └── data/canonicalPosts.ts         # Ingested 1,000 canonical fixture posts
├── OSINT_Disinfo_Team_README_Final.md # Master team plan & cross-developer contract
└── README.md                          # Repository overview (this document)
```

---

## Key Deliverables (Developer 1)

1. **Canonical Schema Normalization**:
   - Ingests raw historical campaign data (`farmers protest tweets` and `russian-troll-tweets-master`).
   - Resolves tweet ID floating-point precision loss via URL regex extraction.
   - Enriches records with complete user profile joins (followers, verified status, bios).
   - Generates unified, immutable JSONL records conforming to [`docs/CANONICAL_DATA_SCHEMA.md`](docs/CANONICAL_DATA_SCHEMA.md).
2. **BSA Section 63 Evidence Architecture**:
   - Cryptographic SHA-256 byte-level digests.
   - **On-Demand Generation**: Evidence packages are generated exclusively when requested for an investigation dossier via `evidence/integrity.py`.
3. **Single Source of Truth**:
   - Developer 2 (NLP / Narrative Intelligence) and Developer 3 (Graph / OSINT) consume directly from the canonical stream.
   - No parallel ingestion or redundant raw CSV wrangling needed.
4. **Social Signal Lab (Twitter/X Clone)**:
   - Streamlined, dark-mode Twitter/X interface.
   - Ingests the 1,000 canonical test fixture with dataset switching: `All Canonical`, `Farmers Protest`, `Russian IRA Trolls`, `Simulated Lab`.
   - Native image and media preview rendering.

---

## Quickstart

### 1. Python Ingestion & Evidence Subsystem
```bash
# Clone the repository
git clone https://github.com/mayankanand-dev/VYUH.git
cd VYUH

# Install requirements
pip install pydantic

# Run verification test on canonical fixture
python -c "import json; from ingestion.models import CanonicalRecord; [CanonicalRecord.model_validate(json.loads(line)) for line in open('data/normalized/canonical_fixture_1000.jsonl', encoding='utf-8')]; print('1,000 records successfully validated against Canonical Schema!')"
```

### 2. Social Signal Lab (Twitter/X Clone)
```bash
cd social-signal-lab

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:3000
```

---

## Team Handoff for Developer 2 & Developer 3

- **Primary Test Fixture**: Use `data/normalized/canonical_fixture_1000.jsonl` (1,000 balanced records with 500 Farmers Protest and 500 Russian IRA posts).
- **Data Contract**: Detailed field dictionary and mapping in [`docs/CANONICAL_DATA_SCHEMA.md`](docs/CANONICAL_DATA_SCHEMA.md).
- **Team Guidelines**: See [`OSINT_Disinfo_Team_README_Final.md`](OSINT_Disinfo_Team_README_Final.md).
