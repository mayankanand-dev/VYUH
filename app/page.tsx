'use client';

import React, { useState, useEffect } from 'react';
import { initialCases, initialEvidence, sahyog12Fields, CaseRecord, EvidenceRecord, SocialPost } from '@/data/mockData';
import samplePostsData from '@/data/samplePosts.json';

export default function VyuhPlatform() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'investigations' | 'social-intelligence' | 'network-analysis' | 'media-forensics' | 'evidence-repository' | 'notice-preparation' | 'sandbox-module-lab'
  >('dashboard');

  // Live UTC Clock
  const [utcTime, setUtcTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      setUtcTime(new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cases State
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [caseFilter, setCaseFilter] = useState<'ALL' | 'HIGH' | 'CRITICAL' | 'MEDIUM'>('ALL');
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCasePriority, setNewCasePriority] = useState('HIGH');
  const [newCaseOfficer, setNewCaseOfficer] = useState('Insp. A. Sharma');
  const [newCaseNarrative, setNewCaseNarrative] = useState('');

  // Evidence State with Dual Hashing
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(initialEvidence);
  const [isVerifyingHashes, setIsVerifyingHashes] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [selectedBsaEvidence, setSelectedBsaEvidence] = useState<EvidenceRecord | null>(null);

  // Social Intelligence State
  const [posts, setPosts] = useState<SocialPost[]>(samplePostsData as unknown as SocialPost[]);
  const [postSearch, setPostSearch] = useState('');
  const [datasetFilter, setDatasetFilter] = useState('ALL');
  const [preservedToast, setPreservedToast] = useState<string | null>(null);

  // Sahyog 12 Fields State & Copied Tracking
  const [sahyogFields, setSahyogFields] = useState(sahyog12Fields);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  // Sandbox State
  const [sandboxText, setSandboxText] = useState('Govt declares emergency bank holiday in 4 districts #EmergencyLiquidity #BankStrike');
  const [sandboxAuthor, setSandboxAuthor] = useState('@breaking_alerts_in');
  const [sandboxMediaUrl, setSandboxMediaUrl] = useState('https://images.example.com/circular_urgent_scan.jpg');
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxStage, setSandboxStage] = useState(0);

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldId(id);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };

  // Preserve Post into Evidence Vault with Dual Hashing
  const handlePreservePost = (post: SocialPost) => {
    const rawSha = 'sha256_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const fullSha = rawSha.padEnd(64, '0');
    const remHash = `REM-${fullSha.substring(0, 4).toUpperCase()}-${fullSha.substring(4, 8).toUpperCase()}-${fullSha.substring(8, 12).toUpperCase()}`;

    const newEvidence: EvidenceRecord = {
      evidence_id: `EVD-2025-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
      filename: `canonical_post_${post.post_id}.json`,
      case_id: 'INV-2025-089X',
      mime_type: 'application/json',
      byte_size: 2840,
      sha256: fullSha,
      removal_hash: remHash,
      captured_at: new Date().toISOString(),
      source_url: `https://x.com/${post.author_handle}/status/${post.post_id}`,
      author_handle: `@${post.author_handle}`,
      platform: 'X (Twitter)',
      status: 'SEALED_VAULT',
      custody_location: 'Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)',
      risk_score: post.bot_risk,
      statutory_infraction: 'Section 79(3)(b) IT Act & Sec 94 BNSS'
    };

    setEvidenceList([newEvidence, ...evidenceList]);
    setPreservedToast(`Preserved post #${post.post_id} to Court Vault. SHA-256 and Content Removal Hash generated.`);
    setTimeout(() => setPreservedToast(null), 4000);
  };

  // Batch Verify Hashes
  const handleBatchVerify = () => {
    setIsVerifyingHashes(true);
    setVerifyProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setVerifyProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsVerifyingHashes(false), 500);
      }
    }, 200);
  };

  // Create Case
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle) return;
    const newCase: CaseRecord = {
      case_id: `INV-2025-${Math.floor(100 + Math.random() * 900)}X`,
      title: newCaseTitle,
      status: 'ACTIVE_INVESTIGATION',
      priority: newCasePriority,
      lead_officer: newCaseOfficer,
      unit: 'Cyber Defense Operations / Special Task Force',
      created_at: new Date().toISOString(),
      narrative_focus: newCaseNarrative || 'Preliminary assessment of inauthentic social amplification',
      evidence_count: 0,
      statutory_sections: ['IT Act Sec 79(3)(b)', 'Section 94 BNSS'],
      coordination_vectors: ['Bot Cluster', 'High Velocity Burst']
    };
    setCases([newCase, ...cases]);
    setIsCreateCaseOpen(false);
    setNewCaseTitle('');
    setNewCaseNarrative('');
  };

  // Run Sandbox Pipeline Smoke Test
  const handleRunSandbox = () => {
    setIsSandboxRunning(true);
    setSandboxStage(1);
    const timer1 = setTimeout(() => setSandboxStage(3), 400);
    const timer2 = setTimeout(() => setSandboxStage(5), 800);
    const timer3 = setTimeout(() => setSandboxStage(7), 1200);
    const timer4 = setTimeout(() => {
      setSandboxStage(8);
      setIsSandboxRunning(false);
      setSandboxResult({
        tokens_scanned: 18,
        sentiment: 'HIGHLY_ALARMIST_PANIC',
        bot_probability: 0.89,
        coordination_match: 'CLUSTER-DELTA-09',
        perceptual_hash: 'dHash-0a1f9e2c4b8d7a11',
        court_sha256: 'a9b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        content_removal_hash: 'REM-A9B2-C3D4-E5F6',
        compliance_check: 'Violates Section 79(3)(b) & BNS Sec 353 (Public Mischief)',
        total_latency_ms: 384
      });
    }, 1600);
  };

  // Filtered Posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      postSearch === '' ||
      (p.text_content?.toLowerCase().includes(postSearch.toLowerCase()) ?? false) ||
      (p.author_handle?.toLowerCase().includes(postSearch.toLowerCase()) ?? false);
    const matchesDataset =
      datasetFilter === 'ALL' ||
      (datasetFilter === 'FARMERS' && p.dataset_source === 'farmers_protest') ||
      (datasetFilter === 'RUSSIAN_IRA' && p.dataset_source === 'russian_ira');
    return matchesSearch && matchesDataset;
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* Top Header Bar from Stitch */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#c5c6cd] shadow-[0_1px_4px_rgba(11,28,48,0.05)]">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#0e1c2f] flex items-center justify-center text-white font-bold text-lg tracking-wider">
                V
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#0b1c30] tracking-tight">VYUH</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#0e1c2f] text-[#77849c] font-mono text-[11px] uppercase font-bold">
                    GOV-OSINT
                  </span>
                </div>
                <span className="text-[11px] text-[#44474c] hidden md:inline">
                  OSINT & Disinformation Investigation System · Bihar Police
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#c5c6cd] hidden lg:block" />

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]">
              <span className="w-2 h-2 rounded-full bg-[#9a4600] animate-pulse" />
              <span className="font-mono text-xs font-semibold">Historical Dataset // Demo Enclave</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-[#44474c] bg-[#eff4ff] px-2.5 py-1 rounded border border-[#c5c6cd]">
              <span>UTC:</span>
              <span className="font-bold text-[#0b1c30]">{utcTime || '2026-10-23T21:40:00Z'}</span>
            </div>

            <div className="h-6 w-px bg-[#c5c6cd]" />

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#0e1c2f] text-white flex items-center justify-center font-bold text-xs">
                  AS
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#9a4600] ring-1 ring-white" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs text-[#0b1c30] font-bold">Insp. A. Sharma</span>
                <span className="font-mono text-[10px] text-[#44474c]">Senior Analyst, Cyber STF</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Shell */}
      <div className="flex pt-16 flex-1 min-h-[calc(100vh-64px)]">
        {/* Left-Biased Sidebar Navigation matching Stitch */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-[#c5c6cd] z-40 flex flex-col justify-between py-4 overflow-y-auto select-none">
          <div className="flex flex-col gap-6 px-3">
            {/* Section 1: Investigation */}
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#44474c] uppercase tracking-wider">
                Investigation
              </div>
              <nav className="flex flex-col gap-0.5">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                  { id: 'investigations', label: 'Investigations', icon: 'folder_managed', badge: cases.length },
                  { id: 'social-intelligence', label: 'Social Feed', icon: 'feed', badge: '1,000' },
                  { id: 'network-analysis', label: 'Network Graph', icon: 'hub' },
                  { id: 'media-forensics', label: 'Media Forensics', icon: 'image_search' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-[#eff4ff] text-[#0b1c30] font-bold border-l-4 border-[#9a4600] pl-2'
                        : 'text-[#44474c] hover:bg-[#eff4ff]/60 hover:text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e5eeff] text-[#0b1c30] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Section 2: Evidence & Action */}
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#44474c] uppercase tracking-wider">
                Evidence & Action
              </div>
              <nav className="flex flex-col gap-0.5">
                {[
                  { id: 'evidence-repository', label: 'Evidence Vault', icon: 'verified_user', badge: evidenceList.length },
                  { id: 'notice-preparation', label: 'Sahyog Notice', icon: 'gavel', badge: '12 Fields' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-[#eff4ff] text-[#0b1c30] font-bold border-l-4 border-[#9a4600] pl-2'
                        : 'text-[#44474c] hover:bg-[#eff4ff]/60 hover:text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e5eeff] text-[#0b1c30] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Section 3: System */}
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#44474c] uppercase tracking-wider">
                System
              </div>
              <nav className="flex flex-col gap-0.5">
                {[
                  { id: 'sandbox-module-lab', label: 'Testing Sandbox', icon: 'science' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-[#eff4ff] text-[#0b1c30] font-bold border-l-4 border-[#9a4600] pl-2'
                        : 'text-[#44474c] hover:bg-[#eff4ff]/60 hover:text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer Clearance Status */}
          <div className="px-4 border-t border-[#c5c6cd] pt-3 flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-[#44474c]">
              <span>Clearance:</span>
              <span className="text-[#9a4600] font-bold">RESTRICTED // LE-CERT</span>
            </div>
            <div className="flex items-center justify-between text-[#44474c]">
              <span>Vault Ledger:</span>
              <span className="text-[#0b1c30] font-semibold">Dual-Hash Validated</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="ml-64 flex-1 p-6 max-w-[1600px] w-full">
          {/* Toast Notification */}
          {preservedToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#0e1c2f] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-[#3a475c] animate-in fade-in slide-in-from-bottom-3">
              <span className="material-symbols-outlined text-[20px] text-[#ff842e]">verified</span>
              <span className="text-sm font-medium">{preservedToast}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* Top Banner */}
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#dce9ff] text-[#0b1c30] font-mono text-xs uppercase font-bold">
                      ENCLAVE-04 // EXECUTIVE BRIEF
                    </span>
                    <span className="text-xs text-[#44474c]">Dual Hashing Active (Court SHA-256 + Content Removal Hash)</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Investigative Operational Overview
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('social-intelligence')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-sm font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Query Canonical Posts</span>
                  </button>
                  <button
                    onClick={() => setIsCreateCaseOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-sm font-semibold shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Create Investigation</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Active Investigations
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">folder_managed</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">{cases.length}</span>
                      <span className="text-xs text-[#44474c] font-semibold">Tracked Enclaves</span>
                    </div>
                    <span className="text-xs text-[#ba1a1a] font-semibold">2 Critical Priority Cases</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>Magistrate clearance</span>
                    <span className="text-[#9a4600] font-semibold">100% on SLA</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Narrative Clusters
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">hub</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">28</span>
                      <span className="text-xs text-[#44474c] font-semibold">Swarms Identified</span>
                    </div>
                    <span className="text-xs text-[#9a4600] font-semibold">6 Coordinated High-Burst</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>Louvain Modularity</span>
                    <span className="text-[#0b1c30] font-semibold">0.742 Score</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Preserved Evidence
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">verified_user</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">{evidenceList.length}</span>
                      <span className="text-xs text-[#44474c] font-semibold">Dual-Hashed</span>
                    </div>
                    <span className="text-xs text-[#0b1c30] font-semibold">SHA-256 + REM Blocklist</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>WORM Integrity</span>
                    <span className="text-[#9a4600] font-semibold">100% Sealed</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Sahyog Legal Notices
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">gavel</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">4</span>
                      <span className="text-xs text-[#44474c] font-semibold">Draft Packages</span>
                    </div>
                    <span className="text-xs text-[#0b1c30] font-semibold">12 Portal Fields Ready</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>Statutory Base</span>
                    <span className="text-[#9a4600] font-semibold">Sec 79(3)(b) & BNSS 94</span>
                  </div>
                </div>
              </div>

              {/* Active Cases Quick Ledger */}
              <div className="bg-white rounded-xl border border-[#c5c6cd] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#c5c6cd] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0b1c30]">folder_open</span>
                    <h2 className="font-bold text-base text-[#0b1c30]">Registered Inquest Ledgers</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className="text-xs font-bold text-[#9a4600] hover:underline"
                  >
                    View All Cases →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eff4ff] border-b border-[#c5c6cd] text-[#44474c] font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Case Reference</th>
                        <th className="py-2.5 px-4 font-bold">Inquest Title</th>
                        <th className="py-2.5 px-4 font-bold">Lead Officer</th>
                        <th className="py-2.5 px-4 font-bold">Evidence</th>
                        <th className="py-2.5 px-4 font-bold">Priority</th>
                        <th className="py-2.5 px-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eff4ff]">
                      {cases.map((c) => (
                        <tr key={c.case_id} className="hover:bg-[#f8f9ff]">
                          <td className="py-3 px-4 font-mono font-bold text-[#0b1c30]">{c.case_id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0b1c30]">{c.title}</div>
                            <div className="text-[11px] text-[#44474c] truncate max-w-md">{c.narrative_focus}</div>
                          </td>
                          <td className="py-3 px-4 text-[#44474c]">{c.lead_officer}</td>
                          <td className="py-3 px-4 font-mono font-semibold">{c.evidence_count} items</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                c.priority === 'CRITICAL'
                                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                  : c.priority === 'HIGH'
                                  ? 'bg-[#ffdbc9] text-[#753400]'
                                  : 'bg-[#e5eeff] text-[#003ea8]'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setActiveTab('investigations')}
                              className="px-2.5 py-1 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-semibold text-[11px]"
                            >
                              Open Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATIONS */}
          {activeTab === 'investigations' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Investigations Registry & Case Dossiers
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Authorized cyber disinformation and OSINT operations under Section 79(3)(b) & Section 94 BNSS
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateCaseOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Create Investigation</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setCaseFilter(f as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      caseFilter === f
                        ? 'bg-[#0e1c2f] text-white'
                        : 'bg-white text-[#44474c] border border-[#c5c6cd] hover:bg-[#eff4ff]'
                    }`}
                  >
                    {f} PRIORITY
                  </button>
                ))}
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cases
                  .filter((c) => caseFilter === 'ALL' || c.priority === caseFilter)
                  .map((c) => (
                    <div
                      key={c.case_id}
                      className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#eff4ff] text-[#0b1c30]">
                              {c.case_id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                c.priority === 'CRITICAL'
                                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                  : c.priority === 'HIGH'
                                  ? 'bg-[#ffdbc9] text-[#753400]'
                                  : 'bg-[#e5eeff] text-[#003ea8]'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#44474c]">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#0b1c30] mt-3">{c.title}</h3>
                        <p className="text-xs text-[#44474c] mt-1 leading-relaxed">{c.narrative_focus}</p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.statutory_sections.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#eff4ff] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-[#44474c]">
                          <span className="material-symbols-outlined text-[16px]">badge</span>
                          <span>{c.lead_officer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab('evidence-repository')}
                            className="px-2.5 py-1 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-semibold text-[11px]"
                          >
                            {c.evidence_count} Evidence Items
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL FEED (SOCIAL INTELLIGENCE) */}
          {activeTab === 'social-intelligence' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Historical Social Stream & OSINT Harvester
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Query canonical post repository (Farmers Protest & Russian IRA datasets). 1-click preserve to Court Vault with dual hashing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#44474c] bg-[#eff4ff] px-2.5 py-1 rounded">
                    Indexed: 1,000 Canonical Fixtures
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#44474c]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search keywords, slogans, hashtags, or author handle..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#eff4ff] rounded-lg text-xs text-[#0b1c30] placeholder-[#75777d] focus:outline-none focus:ring-1 focus:ring-[#9a4600]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDatasetFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      datasetFilter === 'ALL'
                        ? 'bg-[#0e1c2f] text-white'
                        : 'bg-[#eff4ff] text-[#44474c] hover:bg-[#dce9ff]'
                    }`}
                  >
                    All Datasets ({posts.length})
                  </button>
                  <button
                    onClick={() => setDatasetFilter('FARMERS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      datasetFilter === 'FARMERS'
                        ? 'bg-[#0e1c2f] text-white'
                        : 'bg-[#eff4ff] text-[#44474c] hover:bg-[#dce9ff]'
                    }`}
                  >
                    Farmers Protest
                  </button>
                  <button
                    onClick={() => setDatasetFilter('RUSSIAN_IRA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      datasetFilter === 'RUSSIAN_IRA'
                        ? 'bg-[#0e1c2f] text-white'
                        : 'bg-[#eff4ff] text-[#44474c] hover:bg-[#dce9ff]'
                    }`}
                  >
                    Russian IRA Trolls
                  </button>
                </div>
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPosts.slice(0, 30).map((post) => (
                  <div
                    key={post.post_id}
                    className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30] flex items-center justify-center font-bold text-xs">
                            {post.author_handle ? post.author_handle.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#0b1c30]">
                              {post.author_name || post.author_handle}
                            </div>
                            <div className="text-[11px] font-mono text-[#44474c]">@{post.author_handle}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              post.dataset_source === 'russian_ira'
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : 'bg-[#e5eeff] text-[#003ea8]'
                            }`}
                          >
                            {post.dataset_source === 'russian_ira' ? 'IRA TROLL' : 'FARMERS PROTEST'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              post.bot_risk > 0.7
                                ? 'bg-[#ffdbc9] text-[#753400]'
                                : 'bg-[#eff4ff] text-[#44474c]'
                            }`}
                          >
                            BOT: {(post.bot_risk * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#0b1c30] mt-3 leading-relaxed whitespace-pre-wrap">
                        {post.text_content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#eff4ff] flex items-center justify-between text-[11px] text-[#44474c]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono">RT: {post.metrics?.retweet_count ?? 0}</span>
                        <span className="font-mono">Likes: {post.metrics?.like_count ?? 0}</span>
                        <span className="font-mono">{post.created_at_utc ? new Date(post.created_at_utc).toLocaleDateString() : 'Historical'}</span>
                      </div>

                      <button
                        onClick={() => handlePreservePost(post)}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-[#9a4600] hover:bg-[#753400] text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        <span>Preserve to Vault</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NETWORK ANALYSIS */}
          {activeTab === 'network-analysis' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Narrative Coordination & Account Graph
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Modularity community detection, temporal co-retweet swarms, and sockpuppet amplification bridges
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Modularity Q: 0.742
                  </span>
                </div>
              </div>

              {/* Visual Graph Canvas Mock */}
              <div className="bg-white rounded-xl border border-[#c5c6cd] p-6 shadow-sm flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#dce9ff_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

                <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-lg">
                  <div className="w-16 h-16 rounded-full bg-[#eff4ff] border-2 border-[#9a4600] flex items-center justify-center text-[#9a4600] animate-pulse">
                    <span className="material-symbols-outlined text-[32px]">hub</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0b1c30]">
                    Louvain Coordination Graph Active
                  </h3>
                  <p className="text-xs text-[#44474c]">
                    3 Core Clusters identified in Operation PaperStorm: Cluster A (14 Bot Nodes, Burst Rate 48/min), Cluster B (8 Echo Bridges), Cluster C (12 Organic Influencers).
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-mono font-bold">
                      Cluster A: 94% Coordination
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#ffdbc9] text-[#753400] text-xs font-mono font-bold">
                      Cluster B: 72% Amplification
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA FORENSICS */}
          {activeTab === 'media-forensics' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Media Forensics & Perceptual Hash Lab
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Error Level Analysis (ELA), perceptual blocklist hashing, and synthetic artifact verification
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Engine: OpenELA v2.4 + Perceptual DHash
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">Inspected Artifact: Counterfeit Notice Scan</h3>
                  <div className="h-64 rounded-lg bg-[#eff4ff] border border-dashed border-[#c5c6cd] flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-[48px] text-[#44474c]">image</span>
                    <span className="text-xs font-mono text-[#0b1c30] font-bold mt-2">forensic_ela_counterfeit_circular.png</span>
                    <span className="text-[11px] text-[#44474c] mt-1">Simulated Error Level Analysis shows text block resave splice (p &lt; 0.001)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#eff4ff]">
                      <span className="text-[#44474c] block text-[10px]">COURT SHA-256</span>
                      <span className="font-bold text-[#0b1c30] break-all">e3b0c44298fc1c14...</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#eff4ff]">
                      <span className="text-[#44474c] block text-[10px]">CONTENT REMOVAL HASH</span>
                      <span className="font-bold text-[#9a4600]">REM-E3B0-C442-98FC</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">Synthetic Audio Deepfake Spectrogram</h3>
                  <div className="h-64 rounded-lg bg-[#0e1c2f] flex flex-col items-center justify-center p-4 text-center text-white">
                    <span className="material-symbols-outlined text-[48px] text-[#ff842e]">graphic_eq</span>
                    <span className="text-xs font-mono font-bold mt-2">synthetic_audio_spectrogram_assembly.wav</span>
                    <span className="text-[11px] text-[#77849c] mt-1">Phase discontinuity detected at 1,420 Hz. Synthetic speech model confidence: 99.2%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#eff4ff]">
                      <span className="text-[#44474c] block text-[10px]">COURT SHA-256</span>
                      <span className="font-bold text-[#0b1c30] break-all">3f2504e04f891f8b...</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#eff4ff]">
                      <span className="text-[#44474c] block text-[10px]">CONTENT REMOVAL HASH</span>
                      <span className="font-bold text-[#9a4600]">REM-3F25-04E0-4F89</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EVIDENCE VAULT (EVIDENCE REPOSITORY) */}
          {activeTab === 'evidence-repository' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Cryptographic Evidence Vault & Chain of Custody
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Immutable WORM storage with Dual Hashing: Court SHA-256 for Section 63 BSA + Content Removal Hash for takedowns.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBatchVerify}
                    disabled={isVerifyingHashes}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold transition-colors"
                  >
                    <span className={`material-symbols-outlined text-[16px] text-[#9a4600] ${isVerifyingHashes ? 'animate-spin' : ''}`}>
                      sync
                    </span>
                    <span>{isVerifyingHashes ? `Verifying (${verifyProgress}%)` : 'Batch Verify Hashes'}</span>
                  </button>
                </div>
              </div>

              {/* Dual Hashing Table */}
              <div className="bg-white rounded-xl border border-[#c5c6cd] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#c5c6cd] flex items-center justify-between bg-[#eff4ff]/60">
                  <span className="text-xs font-bold text-[#0b1c30]">
                    {evidenceList.length} Sealed Custody Records
                  </span>
                  <span className="text-xs font-mono text-[#44474c]">
                    Enclave Partition: SEC-NORTH-PROD-01 (WORM)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eff4ff] border-b border-[#c5c6cd] text-[#44474c] font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Evidence ID</th>
                        <th className="py-2.5 px-4 font-bold">File / Case</th>
                        <th className="py-2.5 px-4 font-bold">Court SHA-256</th>
                        <th className="py-2.5 px-4 font-bold">Content Removal Hash</th>
                        <th className="py-2.5 px-4 font-bold">Platform</th>
                        <th className="py-2.5 px-4 font-bold text-right">Legal Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eff4ff]">
                      {evidenceList.map((ev) => (
                        <tr key={ev.evidence_id} className="hover:bg-[#f8f9ff]">
                          <td className="py-3 px-4 font-mono font-bold text-[#0b1c30]">
                            {ev.evidence_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0b1c30]">{ev.filename}</div>
                            <div className="text-[11px] font-mono text-[#44474c]">{ev.case_id}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#0b1c30] text-[11px]">
                            <span className="bg-[#eff4ff] px-2 py-0.5 rounded border border-[#c5c6cd]">
                              {ev.sha256.substring(0, 16)}...
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#9a4600] font-bold text-[11px]">
                            {ev.removal_hash}
                          </td>
                          <td className="py-3 px-4 text-[#44474c]">
                            {ev.platform} ({ev.author_handle})
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedBsaEvidence(ev)}
                              className="px-3 py-1 rounded bg-[#0e1c2f] hover:bg-[#213145] text-white font-semibold text-[11px] shadow-sm transition-colors"
                            >
                              Sec 63 BSA Cert
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SAHYOG NOTICE PREPARATION */}
          {activeTab === 'notice-preparation' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a]">
                      SECTION 79(3)(b) & SECTION 94 BNSS
                    </span>
                    <span className="text-xs text-[#44474c]">I4C Sahyog Portal Staging</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30] mt-1">
                    Sahyog Intermediary Notice Instrument
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const fullJson = JSON.stringify(sahyogFields, null, 2);
                      const blob = new Blob([fullJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sahyog_notice_bundle_INV-2025-089X.json';
                      a.click();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0e1c2f] hover:bg-[#213145] text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">sim_card_download</span>
                    <span>Download Sahyog JSON</span>
                  </button>
                </div>
              </div>

              {/* 12 Required Fields Grid with Individual Copy Buttons */}
              <div className="bg-white p-6 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#c5c6cd]">
                  <span className="text-xs font-bold uppercase text-[#44474c] tracking-wider">
                    Official Sahyog Form Fields (12 Statutory Parameters)
                  </span>
                  <span className="text-xs text-[#9a4600] font-semibold">
                    Click [Copy] next to any field to paste directly into the Sahyog portal
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sahyogFields.map((field) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <label className="text-xs font-bold text-[#0b1c30] block">{field.label}</label>
                          <span className="text-[10px] text-[#44474c]">{field.helper}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(field.id, field.value)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1 ${
                            copiedFieldId === field.id
                              ? 'bg-[#003ea8] text-white'
                              : 'bg-white text-[#0b1c30] hover:bg-[#dce9ff] border border-[#c5c6cd]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedFieldId === field.id ? 'check' : 'content_copy'}
                          </span>
                          <span>{copiedFieldId === field.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="mt-1">
                        <textarea
                          readOnly
                          rows={field.value.includes('\n') ? 3 : 2}
                          value={field.value}
                          className="w-full text-xs font-mono p-2 rounded bg-white border border-[#c5c6cd] text-[#0b1c30] resize-none focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TESTING SANDBOX (ALGORITHMIC MODULE LAB) */}
          {activeTab === 'sandbox-module-lab' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#eff4ff] text-[#9a4600] border border-[#c5c6cd]">
                      ZERO WRITE PRIVILEGES TO PRODUCTION HSM
                    </span>
                    <span className="text-xs text-[#44474c]">Enclave: SYNTH-INFER-04</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30] mt-1">
                    Algorithmic Module Lab & Pipeline Testing Workbench
                  </h1>
                </div>
                <button
                  onClick={handleRunSandbox}
                  disabled={isSandboxRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isSandboxRunning ? 'animate-spin' : ''}`}>
                    {isSandboxRunning ? 'refresh' : 'play_arrow'}
                  </span>
                  <span>{isSandboxRunning ? 'Executing 8 Stages...' : 'Run Pipeline Smoke Test'}</span>
                </button>
              </div>

              {/* 8-Stage Progression Ribbon from Stitch */}
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#c5c6cd]">
                  <span className="text-xs font-bold uppercase text-[#44474c] tracking-wider">
                    8-Stage Extraction Pipeline Progression Sequence
                  </span>
                  <span className="font-mono text-xs text-[#44474c]">
                    Stage: {sandboxStage}/8 Completed
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[
                    { id: 1, name: '01. INGEST', desc: 'Payload Check' },
                    { id: 2, name: '02. NORM', desc: 'Canonical 26-Field' },
                    { id: 3, name: '03. NLP', desc: 'Dev 2 Heuristic' },
                    { id: 4, name: '04. MEDIA', desc: 'Dev 3 Forensics' },
                    { id: 5, name: '05. CLUSTER', desc: 'Louvain Graph' },
                    { id: 6, name: '06. WORM', desc: 'Dual Hash Mock' },
                    { id: 7, name: '07. NOTICE', desc: '79(3)(b) Check' },
                    { id: 8, name: '08. EXPORT', desc: 'Court Staging' },
                  ].map((stg) => (
                    <div
                      key={stg.id}
                      className={`p-3 rounded-lg border transition-all flex flex-col justify-between h-20 ${
                        sandboxStage >= stg.id
                          ? 'bg-[#eff4ff] border-[#9a4600] text-[#0b1c30]'
                          : 'bg-[#f8f9ff] border-[#c5c6cd] text-[#75777d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold">{stg.name}</span>
                        {sandboxStage >= stg.id && (
                          <span className="material-symbols-outlined text-[14px] text-[#9a4600]">check_circle</span>
                        )}
                      </div>
                      <span className="text-[10px] truncate">{stg.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modular Input Testing Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">
                    Module 1: Custom Tweet Input Tester (Dev 2 NLP & Dev 3 Media)
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-[#44474c] block mb-1">Tweet Text Content</label>
                    <textarea
                      rows={3}
                      value={sandboxText}
                      onChange={(e) => setSandboxText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30] resize-none focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#44474c] block mb-1">Author Handle</label>
                      <input
                        type="text"
                        value={sandboxAuthor}
                        onChange={(e) => setSandboxAuthor(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#44474c] block mb-1">Attached Media URL</label>
                      <input
                        type="text"
                        value={sandboxMediaUrl}
                        onChange={(e) => setSandboxMediaUrl(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRunSandbox}
                    disabled={isSandboxRunning}
                    className="w-full py-2.5 rounded-lg bg-[#0e1c2f] hover:bg-[#213145] text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Run Modular Test Evaluation
                  </button>
                </div>

                {/* Output Sandbox Evaluation Card */}
                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">Pipeline Evaluation Output</h3>

                  {sandboxResult ? (
                    <div className="flex flex-col gap-3 font-mono text-xs">
                      <div className="p-3 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Sentiment / Intent:</span>
                          <span className="font-bold text-[#ba1a1a]">{sandboxResult.sentiment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Bot Probability:</span>
                          <span className="font-bold text-[#9a4600]">{(sandboxResult.bot_probability * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Cluster Alignment:</span>
                          <span className="font-bold text-[#0b1c30]">{sandboxResult.coordination_match}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Execution Latency:</span>
                          <span className="font-bold text-[#0b1c30]">{sandboxResult.total_latency_ms} ms</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] space-y-1">
                        <span className="text-[#44474c] block text-[10px]">COURT SHA-256 (Section 63 BSA)</span>
                        <span className="font-bold text-[#0b1c30] text-[11px] break-all">{sandboxResult.court_sha256}</span>
                      </div>

                      <div className="p-3 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] space-y-1">
                        <span className="text-[#44474c] block text-[10px]">CONTENT REMOVAL HASH (Platform Blocklist)</span>
                        <span className="font-bold text-[#9a4600] text-sm">{sandboxResult.content_removal_hash}</span>
                      </div>

                      <div className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] font-sans text-xs">
                        <strong>Statutory Evaluation:</strong> {sandboxResult.compliance_check}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 rounded-lg bg-[#eff4ff] border border-dashed border-[#c5c6cd] flex flex-col items-center justify-center text-center p-4">
                      <span className="material-symbols-outlined text-[36px] text-[#44474c]">science</span>
                      <span className="text-xs text-[#44474c] mt-2">
                        Execute the smoke test or modular evaluator to view real-time pipeline telemetry.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


        </main>
      </div>

      {/* CREATE INVESTIGATION MODAL */}
      {isCreateCaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-[#c5c6cd] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#c5c6cd]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9a4600]">folder_open</span>
                <h3 className="font-bold text-base text-[#0b1c30]">Register New Investigation Enclave</h3>
              </div>
              <button
                onClick={() => setIsCreateCaseOpen(false)}
                className="text-[#44474c] hover:text-[#0b1c30]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-[#0b1c30] block mb-1">Inquest Title / Operation Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Northern Shield // Bank Phish Inquest"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#0b1c30] block mb-1">Priority</label>
                  <select
                    value={newCasePriority}
                    onChange={(e) => setNewCasePriority(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#0b1c30] block mb-1">Lead Officer</label>
                  <input
                    type="text"
                    value={newCaseOfficer}
                    onChange={(e) => setNewCaseOfficer(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#0b1c30] block mb-1">Narrative Focus & Target Slogans</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of malicious narrative propagation, targeted entities, or disinformation vector..."
                  value={newCaseNarrative}
                  onChange={(e) => setNewCaseNarrative(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#c5c6cd]">
                <button
                  type="button"
                  onClick={() => setIsCreateCaseOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white font-semibold text-xs shadow-sm"
                >
                  Create Inquest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 63 BSA CERTIFICATE MODAL WITH 1-CLICK PRINT/PDF */}
      {selectedBsaEvidence && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-[#c5c6cd] shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#c5c6cd]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9a4600]">verified</span>
                <h3 className="font-bold text-base text-[#0b1c30]">
                  Section 63 BSA, 2023 Electronic Evidence Certificate
                </h3>
              </div>
              <button
                onClick={() => setSelectedBsaEvidence(null)}
                className="text-[#44474c] hover:text-[#0b1c30]"
              >
                ✕
              </button>
            </div>

            {/* Certificate Body (Court Printable) */}
            <div id="bsa-cert-print-area" className="p-6 rounded-lg bg-[#f8f9ff] border border-[#c5c6cd] flex flex-col gap-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-[#c5c6cd]">
                <h4 className="font-bold text-sm uppercase text-[#0b1c30]">
                  Certificate Under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023
                </h4>
                <span className="text-[11px] text-[#44474c]">
                  (Admissibility of Electronic Records in Judicial Proceedings)
                </span>
              </div>

              <div className="space-y-2 text-[#0b1c30] leading-relaxed">
                <p>
                  <strong>Case Reference:</strong> {selectedBsaEvidence.case_id} // FIR-88/2025-CYBER
                </p>
                <p>
                  <strong>Evidence Identifier:</strong> {selectedBsaEvidence.evidence_id}
                </p>
                <p>
                  <strong>Primary Filename:</strong> {selectedBsaEvidence.filename} ({selectedBsaEvidence.mime_type})
                </p>
                <p>
                  <strong>Source URI:</strong> {selectedBsaEvidence.source_url}
                </p>
                <p className="font-mono bg-white p-2 rounded border border-[#c5c6cd] break-all">
                  <strong>Court SHA-256 Digest:</strong> {selectedBsaEvidence.sha256}
                </p>
                <p className="font-mono bg-white p-2 rounded border border-[#c5c6cd]">
                  <strong>Content Removal Hash (Blocklist Registry):</strong>{' '}
                  <span className="text-[#9a4600] font-bold">{selectedBsaEvidence.removal_hash}</span>
                </p>
                <p>
                  <strong>Custodian / Examining Officer:</strong> Insp. Anand Sharma (Inspector of Police, Cyber STF)
                </p>
                <p className="italic text-[#44474c] mt-2 border-t border-[#c5c6cd] pt-2">
                  "I hereby certify that the electronic record described above was captured and preserved under my lawful custody. The hash digest above was generated directly upon acquisition in an isolated hardware security enclave and has remained unaltered."
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#c5c6cd]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#44474c]">Dated:</span>
                  <span className="font-semibold text-[#0b1c30]">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-[#44474c]">Officer Signature:</span>
                  <span className="font-bold text-[#0b1c30]">[e-Signed via State PKI // Insp. A. Sharma]</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c5c6cd]">
              <button
                onClick={() => setSelectedBsaEvidence(null)}
                className="px-4 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white font-semibold text-xs shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
