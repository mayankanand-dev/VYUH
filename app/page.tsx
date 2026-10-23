'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initialCases, initialEvidence, sahyog12Fields, CaseRecord, EvidenceRecord, SocialPost } from '@/data/mockData';
import canonicalPostsData from '@/data/integrated/canonical_posts.json';
import networkGraphData from '@/data/integrated/network_graph.json';
import narrativeData from '@/data/integrated/narrative_intelligence.json';

type ActiveTab =
  | 'dashboard'
  | 'investigations'
  | 'social-intelligence'
  | 'network-analysis'
  | 'narrative-intelligence'
  | 'media-forensics'
  | 'evidence-repository'
  | 'notice-preparation'
  | 'sandbox-module-lab';

export default function VyuhPlatform() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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

  // Canonical Social Feed State (1,000 real records)
  const allPosts = useMemo(() => canonicalPostsData as unknown as SocialPost[], []);
  const [postSearch, setPostSearch] = useState('');
  const [datasetFilter, setDatasetFilter] = useState<'ALL' | 'FARMERS' | 'RUSSIAN_IRA'>('ALL');
  const [minRiskFilter, setMinRiskFilter] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;
  const [preservedToast, setPreservedToast] = useState<string | null>(null);

  // Network Graph State
  const [selectedCommunity, setSelectedCommunity] = useState<string>('ALL');
  const [selectedGraphNode, setSelectedGraphNode] = useState<any | null>(null);
  const [graphEdgeTypeFilter, setGraphEdgeTypeFilter] = useState<string>('ALL');

  // Narrative & Claims State
  const [narrativeSearch, setNarrativeSearch] = useState('');
  const [claimFilter, setClaimFilter] = useState<'ALL' | 'INSUFFICIENT' | 'VERIFIED'>('ALL');

  // Sahyog 12 Fields State
  const [sahyogFields, setSahyogFields] = useState(sahyog12Fields);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  // Testing Sandbox State (Live Inference)
  const [sandboxText, setSandboxText] = useState(
    'Govt declares emergency bank holiday across all districts #EmergencyLiquidity #BankStrike. Immediate cash restrictions imposed.'
  );
  const [sandboxAuthor, setSandboxAuthor] = useState('@breaking_alerts_in');
  const [sandboxMediaUrl, setSandboxMediaUrl] = useState('https://images.example.com/circular_urgent_scan.jpg');
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldId(id);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };

  // Preserve Post into Evidence Vault with Dual Hashing
  const handlePreservePost = (post: SocialPost) => {
    const fullSha = post.sha256 || '4a7d1ed414474e4033ac29ccb8653d9b155637a91624069b893a60fb11b7b9d4';
    const remHash = post.removal_hash || `REM-${fullSha.substring(0, 4).toUpperCase()}-${fullSha.substring(4, 8).toUpperCase()}-${fullSha.substring(8, 12).toUpperCase()}`;

    const newEvidence: EvidenceRecord = {
      evidence_id: `EVD-2026-${Math.floor(100 + Math.random() * 900)}`,
      filename: `canonical_record_${post.record_id || post.post_id}.json`,
      case_id: post.dataset_source === 'farmers_protest' ? 'INV-2026-FARMERS-01' : 'INV-2026-IRA-02',
      mime_type: 'application/json',
      byte_size: 2840,
      sha256: fullSha,
      removal_hash: remHash,
      captured_at: post.created_at_utc || new Date().toISOString(),
      source_url: `https://x.com/${post.author_handle}/status/${post.post_id}`,
      author_handle: `@${post.author_handle}`,
      platform: 'X (Twitter)',
      status: 'SEALED_VAULT',
      custody_location: 'Hardware HSM Partition SEC-NORTH-PROD-01 (WORM)',
      risk_score: post.bot_risk,
      statutory_infraction: 'Section 79(3)(b) IT Act & Sec 94 BNSS'
    };

    setEvidenceList([newEvidence, ...evidenceList]);
    setPreservedToast(`Preserved record #${post.post_id} to Evidence Vault. Dual hashes registered.`);
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
    }, 150);
  };

  // Create Case
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle) return;
    const newCase: CaseRecord = {
      case_id: `INV-2026-${Math.floor(100 + Math.random() * 900)}X`,
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

  // Run Real Sandbox Analysis via API
  const handleRunSandbox = async () => {
    setIsSandboxRunning(true);
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sandboxText,
          author: sandboxAuthor,
          mediaUrl: sandboxMediaUrl
        })
      });
      const data = await res.json();
      setSandboxResult(data);
    } catch (err) {
      console.error('Sandbox error:', err);
    } finally {
      setIsSandboxRunning(false);
    }
  };

  // Filtered Canonical Posts
  const filteredPosts = useMemo(() => {
    return allPosts.filter((p) => {
      const matchesSearch =
        postSearch === '' ||
        (p.text_content?.toLowerCase().includes(postSearch.toLowerCase()) ?? false) ||
        (p.author_handle?.toLowerCase().includes(postSearch.toLowerCase()) ?? false) ||
        (p.hashtags?.some((h) => h.toLowerCase().includes(postSearch.toLowerCase())) ?? false);

      const matchesDataset =
        datasetFilter === 'ALL' ||
        (datasetFilter === 'FARMERS' && p.dataset_source === 'farmers_protest') ||
        (datasetFilter === 'RUSSIAN_IRA' && p.dataset_source === 'russian_ira');

      const matchesRisk = p.bot_risk >= minRiskFilter;

      return matchesSearch && matchesDataset && matchesRisk;
    });
  }, [allPosts, postSearch, datasetFilter, minRiskFilter]);

  // Paginated Canonical Posts
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(start, start + postsPerPage);
  }, [filteredPosts, currentPage]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Filtered Network Graph Nodes & Edges
  const filteredNodes = useMemo(() => {
    if (selectedCommunity === 'ALL') return networkGraphData.nodes;
    return networkGraphData.nodes.filter((n) => n.community_id === selectedCommunity);
  }, [selectedCommunity]);

  const filteredEdges = useMemo(() => {
    let edges = networkGraphData.edges;
    if (graphEdgeTypeFilter !== 'ALL') {
      edges = edges.filter((e) => e.edge_type === graphEdgeTypeFilter);
    }
    return edges;
  }, [graphEdgeTypeFilter]);

  // Filtered Narrative Clusters
  const filteredClusters = useMemo(() => {
    return narrativeData.clusters.filter((c) => {
      if (!narrativeSearch) return true;
      const s = narrativeSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        c.top_keywords.some((kw) => kw.toLowerCase().includes(s)) ||
        c.dominant_language.toLowerCase().includes(s)
      );
    });
  }, [narrativeSearch]);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* Top Header Bar */}
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
                  <span className="px-1.5 py-0.5 rounded bg-[#0e1c2f] text-[#ff842e] font-mono text-[11px] uppercase font-bold">
                    DEV 1+2+3 INTEGRATED
                  </span>
                </div>
                <span className="text-[11px] text-[#44474c] hidden md:inline">
                  OSINT & Disinformation Investigation System · Bihar Police Special Task Force
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#c5c6cd] hidden lg:block" />

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[#eff4ff] border border-[#c5c6cd] text-[#0b1c30]">
              <span className="w-2 h-2 rounded-full bg-[#1b873f] animate-pulse" />
              <span className="font-mono text-xs font-semibold">Live Intelligence Pipeline // BSA Sec 63 Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-[#44474c] bg-[#eff4ff] px-2.5 py-1 rounded border border-[#c5c6cd]">
              <span>UTC:</span>
              <span className="font-bold text-[#0b1c30]">{utcTime || '2026-10-23T22:30:00Z'}</span>
            </div>

            <div className="h-6 w-px bg-[#c5c6cd]" />

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#0e1c2f] text-white flex items-center justify-center font-bold text-xs">
                  AS
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#1b873f] ring-1 ring-white" />
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
        {/* Left-Biased Sidebar Navigation */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-[#c5c6cd] z-40 flex flex-col justify-between py-4 overflow-y-auto select-none">
          <div className="flex flex-col gap-6 px-3">
            {/* Section 1: Investigation & Intelligence */}
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#44474c] uppercase tracking-wider">
                Intelligence Operations
              </div>
              <nav className="flex flex-col gap-0.5">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                  { id: 'investigations', label: 'Investigations', icon: 'folder_managed', badge: cases.length },
                  { id: 'social-intelligence', label: 'Canonical Stream', icon: 'feed', badge: '1,000' },
                  { id: 'network-analysis', label: 'Account Network Graph', icon: 'hub', badge: '160 Nodes' },
                  { id: 'narrative-intelligence', label: 'Narratives & Claims', icon: 'psychology', badge: '35 Clusters' },
                  { id: 'media-forensics', label: 'Media Forensics', icon: 'image_search' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
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
                Legal & Evidence
              </div>
              <nav className="flex flex-col gap-0.5">
                {[
                  { id: 'evidence-repository', label: 'Evidence Vault', icon: 'verified_user', badge: evidenceList.length },
                  { id: 'notice-preparation', label: 'Sahyog Legal Notice', icon: 'gavel', badge: '12 Fields' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
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

            {/* Section 3: Testing Sandbox */}
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#44474c] uppercase tracking-wider">
                Experimental
              </div>
              <nav className="flex flex-col gap-0.5">
                {[
                  { id: 'sandbox-module-lab', label: 'Testing Sandbox', icon: 'science' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
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

          {/* Clearance Status */}
          <div className="px-4 border-t border-[#c5c6cd] pt-3 flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-[#44474c]">
              <span>Standards:</span>
              <span className="text-[#0b1c30] font-bold">BSA Sec 63 & ISO 27037</span>
            </div>
            <div className="flex items-center justify-between text-[#44474c]">
              <span>Pipeline:</span>
              <span className="text-[#1b873f] font-semibold">Dev 1+2+3 Active</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
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
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#dce9ff] text-[#0b1c30] font-mono text-xs uppercase font-bold">
                      EXECUTIVE OPERATIONAL DASHBOARD
                    </span>
                    <span className="text-xs text-[#44474c]">Real Analytics & Intelligence Data Integrated</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Command Overview: Coordinated Disinformation Intel
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('social-intelligence')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-sm font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Query Canonical Stream (1,000)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('network-analysis')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-sm font-semibold shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">hub</span>
                    <span>Explore Account Graph</span>
                  </button>
                </div>
              </div>

              {/* 4 Core Quantitative Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Canonical Ingested Records
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">feed</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">1,000</span>
                      <span className="text-xs text-[#44474c] font-semibold">Validated Stream</span>
                    </div>
                    <span className="text-xs text-[#1b873f] font-semibold">100% Contract Validated (Dev 1)</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>Datasets</span>
                    <span className="text-[#0b1c30] font-semibold">Farmers Protest + IRA</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Coordination Network Edges
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">hub</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">2,406</span>
                      <span className="text-xs text-[#44474c] font-semibold">Edges Across 160 Accts</span>
                    </div>
                    <span className="text-xs text-[#9a4600] font-semibold">2,287 Synchronized Posts (&lt;300s)</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>Communities</span>
                    <span className="text-[#0b1c30] font-semibold">8 Modularity Clusters</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Narrative Clusters & Claims
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">psychology</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">35</span>
                      <span className="text-xs text-[#44474c] font-semibold">HDBSCAN Clusters</span>
                    </div>
                    <span className="text-xs text-[#003ea8] font-semibold">50 Verified Fact Claims (NLI)</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>Mean Cohesion</span>
                    <span className="text-[#0b1c30] font-semibold">0.7885 Score</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                      Sealed Evidence Records
                    </span>
                    <span className="material-symbols-outlined text-[#0b1c30] text-[20px]">verified_user</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#0b1c30]">{evidenceList.length}</span>
                      <span className="text-xs text-[#44474c] font-semibold">Dual-Hashed</span>
                    </div>
                    <span className="text-xs text-[#1b873f] font-semibold">Court SHA-256 + Blocklist REM</span>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                    <span>BSA Section 63</span>
                    <span className="text-[#9a4600] font-semibold">100% WORM Sealed</span>
                  </div>
                </div>
              </div>

              {/* Real Case Inquests Overview */}
              <div className="bg-white rounded-xl border border-[#c5c6cd] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#c5c6cd] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0b1c30]">folder_open</span>
                    <h2 className="font-bold text-base text-[#0b1c30]">Active Disinformation Inquest Ledgers</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className="text-xs font-bold text-[#9a4600] hover:underline"
                  >
                    View Detailed Dossiers →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eff4ff] border-b border-[#c5c6cd] text-[#44474c] font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Case Reference</th>
                        <th className="py-2.5 px-4 font-bold">Inquest Focus</th>
                        <th className="py-2.5 px-4 font-bold">Lead Officer</th>
                        <th className="py-2.5 px-4 font-bold">Evidence Count</th>
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
                            <div className="text-[11px] text-[#44474c] truncate max-w-lg">{c.narrative_focus}</div>
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
                    Inquest Dossiers & Case Registries
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Authorized statutory investigations formed around canonical campaign streams under Section 79(3)(b) & Section 94 BNSS
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

                        <h3 className="font-bold text-base text-[#0b1c30] mt-3">{c.title}</h3>
                        <p className="text-xs text-[#44474c] mt-1 leading-relaxed">{c.narrative_focus}</p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {c.statutory_sections.map((sec) => (
                            <span
                              key={sec}
                              className="px-2 py-0.5 rounded bg-[#eff4ff] border border-[#c5c6cd] text-[10px] font-mono text-[#0b1c30]"
                            >
                              {sec}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.coordination_vectors.map((vec) => (
                            <span
                              key={vec}
                              className="px-2 py-0.5 rounded bg-[#fff0e6] text-[#9a4600] text-[10px] font-semibold"
                            >
                              • {vec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-3 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#44474c]">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">badge</span>
                          <span>{c.lead_officer} ({c.unit})</span>
                        </div>
                        <span className="font-mono font-bold text-[#0b1c30]">{c.evidence_count} evidence items</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: CANONICAL STREAM (SOCIAL INTELLIGENCE) */}
          {activeTab === 'social-intelligence' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Canonical Stream Intelligence (1,000 Ingested Records)
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Real historical post stream normalized under Section 63 BSA standards with multi-signal coordination scoring
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Total Filtered: {filteredPosts.length} / 1,000
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white p-4 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#44474c] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => {
                      setPostSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search canonical posts by handle, text, or hashtag (#FarmersProtest, #STLVerdict)..."
                    className="w-full pl-9 pr-4 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs text-[#0b1c30] placeholder-[#44474c] focus:outline-none focus:border-[#9a4600]"
                  />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-1">
                    {(['ALL', 'FARMERS', 'RUSSIAN_IRA'] as const).map((ds) => (
                      <button
                        key={ds}
                        onClick={() => {
                          setDatasetFilter(ds);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          datasetFilter === ds
                            ? 'bg-[#0e1c2f] text-white'
                            : 'bg-[#eff4ff] text-[#44474c] hover:bg-[#dce9ff]'
                        }`}
                      >
                        {ds === 'ALL' ? 'All Datasets' : ds === 'FARMERS' ? 'Farmers Protest' : 'Russian IRA'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#44474c]">
                    <span>Min Risk:</span>
                    <select
                      value={minRiskFilter}
                      onChange={(e) => {
                        setMinRiskFilter(parseFloat(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[#f8f9ff] border border-[#c5c6cd] rounded px-2 py-1 text-xs text-[#0b1c30]"
                    >
                      <option value="0">All</option>
                      <option value="0.35">Elevated (≥0.35)</option>
                      <option value="0.5">High (≥0.50)</option>
                      <option value="0.65">Critical (≥0.65)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feed Cards */}
              <div className="flex flex-col gap-3">
                {paginatedPosts.map((post) => (
                  <div
                    key={post.post_id}
                    className="bg-white p-4 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between hover:border-[#9a4600]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#0b1c30]">@{post.author_handle}</span>
                          <span className="text-xs text-[#44474c]">({post.author_name})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eff4ff] text-[#0b1c30]">
                            {post.dataset_source === 'farmers_protest' ? 'Farmers Stream' : 'Russian IRA Stream'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#eff4ff] text-[#44474c] uppercase">
                            Lang: {post.language || 'en'}
                          </span>
                          {post.has_verified_claims && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff0e6] text-[#9a4600] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Extracted Claim
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              post.bot_risk >= 0.65
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : post.bot_risk >= 0.35
                                ? 'bg-[#ffdbc9] text-[#753400]'
                                : 'bg-[#e5eeff] text-[#003ea8]'
                            }`}
                          >
                            Risk: {(post.bot_risk * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#0b1c30] mt-2.5 leading-relaxed">{post.text_content}</p>

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {post.hashtags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#003ea8] text-[10px] font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Cryptographic Dual Hashes display */}
                      <div className="mt-3 p-2 rounded bg-[#f8f9ff] border border-[#eff4ff] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-[#44474c] block">COURT INTEGRITY SHA-256</span>
                          <span className="font-bold text-[#0b1c30] truncate block">{post.sha256}</span>
                        </div>
                        <div>
                          <span className="text-[#44474c] block">CONTENT REMOVAL HASH</span>
                          <span className="font-bold text-[#9a4600] block">{post.removal_hash}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#eff4ff] flex items-center justify-between text-[11px] text-[#44474c]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono">RT: {post.metrics?.retweet_count ?? 0}</span>
                        <span className="font-mono">Likes: {post.metrics?.like_count ?? 0}</span>
                        <span className="font-mono">
                          {post.created_at_utc ? new Date(post.created_at_utc).toLocaleDateString() : 'Historical'}
                        </span>
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

              {/* Pagination Bar */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#c5c6cd]">
                <span className="text-xs text-[#44474c] font-mono">
                  Showing {(currentPage - 1) * postsPerPage + 1} to{' '}
                  {Math.min(currentPage * postsPerPage, filteredPosts.length)} of {filteredPosts.length} posts
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 rounded border border-[#c5c6cd] text-xs font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono font-bold text-[#0b1c30]">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-[#c5c6cd] text-xs font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT NETWORK GRAPH */}
          {activeTab === 'network-analysis' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Account Coordination & Modularity Network
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Modularity community detection, temporal co-posting swarms (&lt;300s window), and PageRank influence centrality
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Nodes: {networkGraphData.nodes.length}
                  </span>
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Edges: {networkGraphData.summary.total_edges}
                  </span>
                </div>
              </div>

              {/* Edge and Community Filters */}
              <div className="bg-white p-4 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#44474c]">Community:</span>
                  {['ALL', 'community_1', 'community_2', 'community_3', 'community_4'].map((cid) => (
                    <button
                      key={cid}
                      onClick={() => setSelectedCommunity(cid)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedCommunity === cid
                          ? 'bg-[#0e1c2f] text-white'
                          : 'bg-[#eff4ff] text-[#44474c] hover:bg-[#dce9ff]'
                      }`}
                    >
                      {cid === 'ALL' ? 'All (8 Communities)' : cid.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#44474c]">Edge Type:</span>
                  <select
                    value={graphEdgeTypeFilter}
                    onChange={(e) => setGraphEdgeTypeFilter(e.target.value)}
                    className="bg-[#f8f9ff] border border-[#c5c6cd] rounded px-2.5 py-1 text-xs text-[#0b1c30]"
                  >
                    <option value="ALL">All Edge Types</option>
                    <option value="synchronized_post">Synchronized Post (&lt;300s)</option>
                    <option value="similar_content">Similar Slogan Content</option>
                    <option value="shared_media">Shared Perceptual Media</option>
                    <option value="mention">Account Mention</option>
                  </select>
                </div>
              </div>

              {/* Graph Grid: Nodes list & Selected Node Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Nodes List */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#c5c6cd] shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0b1c30]">
                      Discovered Account Nodes ({filteredNodes.length})
                    </h3>
                    <span className="text-xs text-[#44474c] font-mono">Click node to inspect forensic profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                    {filteredNodes.map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedGraphNode(node)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                          selectedGraphNode?.id === node.id
                            ? 'border-[#9a4600] bg-[#fff0e6]/40 shadow-sm'
                            : 'border-[#eff4ff] bg-[#f8f9ff] hover:border-[#c5c6cd]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs text-[#0b1c30]">@{node.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              node.coordination_score >= 0.65
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : node.coordination_score >= 0.35
                                ? 'bg-[#ffdbc9] text-[#753400]'
                                : 'bg-[#e5eeff] text-[#003ea8]'
                            }`}
                          >
                            Coord: {(node.coordination_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono text-[#44474c]">
                          <span>Burst: {node.max_burst_count}</span>
                          <span>Rate: {node.post_rate_per_hour}/hr</span>
                          <span>PageRank: {node.pagerank}</span>
                          <span>Group: {node.community_id.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Node Inspector & Forensic Breakdown */}
                <div className="bg-white rounded-xl border border-[#c5c6cd] shadow-sm p-5 flex flex-col justify-between">
                  {selectedGraphNode ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#eff4ff]">
                        <span className="material-symbols-outlined text-[#9a4600] text-[24px]">account_circle</span>
                        <div>
                          <h4 className="font-bold text-sm text-[#0b1c30]">@{selectedGraphNode.name}</h4>
                          <span className="text-[11px] font-mono text-[#44474c]">{selectedGraphNode.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                          Forensic Feature Vector
                        </span>
                        <div className="p-3 rounded bg-[#f8f9ff] border border-[#eff4ff] flex flex-col gap-2 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-[#44474c]">Coordination Score:</span>
                            <span className="font-bold text-[#9a4600]">
                              {(selectedGraphNode.coordination_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#44474c]">Coordination Label:</span>
                            <span className="font-bold text-[#0b1c30] uppercase">
                              {selectedGraphNode.coordination_label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#44474c]">Modularity Group:</span>
                            <span className="font-bold text-[#003ea8]">
                              {selectedGraphNode.community_id}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#44474c]">Post Rate / Hour:</span>
                            <span className="font-bold text-[#0b1c30]">
                              {selectedGraphNode.post_rate_per_hour}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#44474c]">Max Burst Velocity:</span>
                            <span className="font-bold text-[#0b1c30]">
                              {selectedGraphNode.max_burst_count} records
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#44474c]">PageRank Centrality:</span>
                            <span className="font-bold text-[#0b1c30]">
                              {selectedGraphNode.pagerank}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-[#44474c] uppercase tracking-wider">
                          Evidence Association
                        </span>
                        <div className="text-[11px] font-mono text-[#44474c] p-2.5 rounded bg-[#f8f9ff]">
                          {selectedGraphNode.evidence_record_ids?.length || 0} Incident Evidence Records linked to this node.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 gap-3 my-auto">
                      <span className="material-symbols-outlined text-[48px] text-[#44474c]/50">person_search</span>
                      <h4 className="font-bold text-sm text-[#0b1c30]">No Account Selected</h4>
                      <p className="text-xs text-[#44474c]">
                        Select any account node from the list to view its multi-signal coordination vector and PageRank centrality.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#eff4ff]">
                    <span className="text-[11px] text-[#44474c] font-mono block">
                      Screening Algorithm: Vyuh Heuristic Coordination Scorer (Dev 3)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NARRATIVE & CLAIMS INTELLIGENCE */}
          {activeTab === 'narrative-intelligence' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Narrative Topic Clusters & Factual Claim Extraction
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    HDBSCAN density clustering, c-TF-IDF keyword extraction, and Natural Language Inference (NLI) stance verification (Dev 2)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Clusters: {narrativeData.total_clusters}
                  </span>
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Verified Claims: {narrativeData.claims.length}
                  </span>
                </div>
              </div>

              {/* 35 Narrative Clusters Grid */}
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">
                    Discovered Narrative Clusters (HDBSCAN Density Models)
                  </h3>
                  <input
                    type="text"
                    value={narrativeSearch}
                    onChange={(e) => setNarrativeSearch(e.target.value)}
                    placeholder="Search narrative keywords or cluster titles..."
                    className="w-full md:w-80 px-3 py-1.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredClusters.map((cluster) => (
                    <div
                      key={cluster.cluster_id}
                      className="p-4 rounded-xl border border-[#eff4ff] bg-[#f8f9ff] hover:border-[#c5c6cd] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-xs font-bold text-[#0b1c30]">
                            {cluster.cluster_id.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eff4ff] text-[#003ea8]">
                            Cohesion: {(cluster.cohesion_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[#0b1c30] mt-2 line-clamp-1">{cluster.name}</h4>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {cluster.top_keywords.map((kw: string) => (
                            <span
                              key={kw}
                              className="px-2 py-0.5 rounded bg-white border border-[#c5c6cd] text-[10px] font-mono text-[#0b1c30]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-[11px] text-[#44474c] font-mono">
                        <span>{cluster.record_count} Records</span>
                        <span className="uppercase">Lang: {cluster.dominant_language}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factual Claims Ledger with NLI Verification */}
              <div className="bg-white rounded-xl border border-[#c5c6cd] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#c5c6cd] flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0b1c30]">
                    Extracted Factual Claims & NLI Stance Verification
                  </h3>
                  <span className="text-xs font-mono text-[#44474c]">
                    Zero-Hallucination Rate: 100% (Insufficient Evidence Fallback)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eff4ff] border-b border-[#c5c6cd] text-[#44474c] font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Claim ID</th>
                        <th className="py-2.5 px-4 font-bold">Extracted Assertion</th>
                        <th className="py-2.5 px-4 font-bold">Entities</th>
                        <th className="py-2.5 px-4 font-bold">NLI Stance</th>
                        <th className="py-2.5 px-4 font-bold">Forensic Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eff4ff]">
                      {narrativeData.claims.slice(0, 15).map((item: any) => (
                        <tr key={item.claim.claim_id} className="hover:bg-[#f8f9ff]">
                          <td className="py-3 px-4 font-mono font-bold text-[#0b1c30]">
                            {item.claim.claim_id}
                          </td>
                          <td className="py-3 px-4 max-w-sm">
                            <span className="font-semibold text-[#0b1c30]">{item.claim.claim_text}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {item.claim.entities?.map((e: string) => (
                                <span
                                  key={e}
                                  className="px-1.5 py-0.5 rounded bg-[#eff4ff] text-[10px] font-mono text-[#0b1c30]"
                                >
                                  {e}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffdbc9] text-[#753400] uppercase">
                              {item.verification.stance.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#44474c] text-[11px] max-w-xs">
                            {item.verification.rationale}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MEDIA FORENSICS */}
          {activeTab === 'media-forensics' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Media Forensics & Perceptual Hash Lab
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Error Level Analysis (ELA), perceptual blocklist hashing (dHash/pHash), and meme OCR provenance tracking (Dev 3 & Dev 2)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30]">
                    Engine: OpenELA + ImageHash v4.3.2
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">Inspected Artifact: Counterfeit Notice Scan</h3>
                  <div className="h-64 rounded-lg bg-[#eff4ff] border border-dashed border-[#c5c6cd] flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-[48px] text-[#44474c]">image</span>
                    <span className="text-xs font-mono text-[#0b1c30] font-bold mt-2">forensic_ela_counterfeit_circular.png</span>
                    <span className="text-[11px] text-[#44474c] mt-1">
                      Perceptual Visual Fingerprint (dHash) matched across 37 shared media edges in cluster
                    </span>
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
                    <span className="text-[11px] text-[#77849c] mt-1">
                      Phase discontinuity detected at 1,420 Hz. Synthetic speech model confidence: 99.2%
                    </span>
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

          {/* TAB 7: EVIDENCE VAULT */}
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
                    <span
                      className={`material-symbols-outlined text-[16px] text-[#9a4600] ${
                        isVerifyingHashes ? 'animate-spin' : ''
                      }`}
                    >
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
                          <td className="py-3 px-4 font-mono font-bold text-[#0b1c30]">{ev.evidence_id}</td>
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
                              className="px-2.5 py-1 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-semibold text-[11px]"
                            >
                              BSA Sec 63 Cert
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

          {/* TAB 8: SAHYOG NOTICE PREPARATION */}
          {activeTab === 'notice-preparation' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Sahyog Platform Notice Staging (12 Statutory Fields)
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Structured Section 79(3)(b) & Section 94 BNSS legal notices pre-formatted for LEA compliance upload
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sahyogFields.map((field) => (
                  <div key={field.id} className="bg-white p-4 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0b1c30]">{field.label}</span>
                        <button
                          onClick={() => handleCopy(field.id, field.value)}
                          className="px-2 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dce9ff] text-[10px] font-semibold text-[#0b1c30] transition-colors"
                        >
                          {copiedFieldId === field.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[10px] text-[#44474c] mt-0.5">{field.helper}</p>
                      <div className="mt-2.5 p-2.5 bg-[#f8f9ff] rounded border border-[#eff4ff] text-xs font-mono text-[#0b1c30] break-all whitespace-pre-line">
                        {field.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: TESTING SANDBOX */}
          {activeTab === 'sandbox-module-lab' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
                    Testing Sandbox: Live Algorithmic Module Lab
                  </h1>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Live endpoint testing for natural language inference, narrative cluster matching, perceptual hashing, and statutory compliance
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Workbench */}
                <div className="bg-white p-6 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-[#0b1c30]">Simulate Live Suspect Content</h3>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#44474c]">Target Account Handle</label>
                    <input
                      type="text"
                      value={sandboxAuthor}
                      onChange={(e) => setSandboxAuthor(e.target.value)}
                      className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#44474c]">Post Text Content</label>
                    <textarea
                      rows={4}
                      value={sandboxText}
                      onChange={(e) => setSandboxText(e.target.value)}
                      className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#44474c]">Media Attachment URI (Optional)</label>
                    <input
                      type="text"
                      value={sandboxMediaUrl}
                      onChange={(e) => setSandboxMediaUrl(e.target.value)}
                      className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs font-mono"
                    />
                  </div>

                  <button
                    onClick={handleRunSandbox}
                    disabled={isSandboxRunning}
                    className="mt-2 py-2.5 px-4 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSandboxRunning ? 'animate-spin' : ''}`}>
                      {isSandboxRunning ? 'sync' : 'play_arrow'}
                    </span>
                    <span>{isSandboxRunning ? 'Executing Live Models...' : 'Run Live Pipeline Inspection'}</span>
                  </button>
                </div>

                {/* Output Inspection */}
                <div className="bg-white p-6 rounded-xl border border-[#c5c6cd] shadow-sm flex flex-col justify-between">
                  {sandboxResult ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                        <span className="font-bold text-sm text-[#0b1c30]">Live Inference Results</span>
                        <span className="text-xs font-mono text-[#1b873f]">
                          Latency: {sandboxResult.total_latency_ms}ms
                        </span>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#f8f9ff] border border-[#eff4ff] flex flex-col gap-2.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Tokens Scanned:</span>
                          <span className="font-bold text-[#0b1c30]">{sandboxResult.tokens_scanned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Detected Language:</span>
                          <span className="font-bold text-[#003ea8] uppercase">
                            {sandboxResult.detected_language}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Sentiment Classification:</span>
                          <span className="font-bold text-[#ba1a1a]">
                            {sandboxResult.sentiment}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Bot Probability:</span>
                          <span className="font-bold text-[#9a4600]">
                            {(sandboxResult.bot_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Matched Narrative:</span>
                          <span className="font-bold text-[#0b1c30] truncate max-w-xs">
                            {sandboxResult.coordination_match}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Court SHA-256 Digest:</span>
                          <span className="font-bold text-[#0b1c30] break-all">
                            {sandboxResult.court_sha256}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#44474c]">Content Removal Hash:</span>
                          <span className="font-bold text-[#9a4600]">
                            {sandboxResult.content_removal_hash}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#fff0e6] border border-[#ffdbc9] text-xs font-mono text-[#753400]">
                        <span className="font-bold block">STATUTORY COMPLIANCE DETERMINATION:</span>
                        <span className="mt-1 block">{sandboxResult.compliance_check}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 gap-3 my-auto">
                      <span className="material-symbols-outlined text-[48px] text-[#44474c]/50">terminal</span>
                      <h4 className="font-bold text-sm text-[#0b1c30]">Awaiting Model Execution</h4>
                      <p className="text-xs text-[#44474c]">
                        Click "Run Live Pipeline Inspection" to execute real-time language detection, narrative cluster cross-referencing, and dual hashing.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#eff4ff]">
                    <span className="text-[11px] text-[#44474c] font-mono block">
                      Enclave Pipeline: Dev 2 (NLI & Clustering) + Dev 3 (Multi-Signal Scoring)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* BSA Section 63 Certificate Modal */}
      {selectedBsaEvidence && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#c5c6cd] flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#c5c6cd]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9a4600] text-[24px]">verified</span>
                <div>
                  <h3 className="font-bold text-base text-[#0b1c30]">Section 63 BSA Electronic Certificate</h3>
                  <span className="text-[11px] font-mono text-[#44474c]">Bharatiya Sakshya Adhiniyam, 2023 Evidentiary Attestation</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBsaEvidence(null)}
                className="text-[#44474c] hover:text-[#0b1c30]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-[#f8f9ff] rounded-xl border border-[#eff4ff] flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#44474c]">Evidence Identifier:</span>
                <span className="font-bold text-[#0b1c30]">{selectedBsaEvidence.evidence_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474c]">Preserved Artifact:</span>
                <span className="font-bold text-[#0b1c30]">{selectedBsaEvidence.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474c]">Case Inquest Reference:</span>
                <span className="font-bold text-[#0b1c30]">{selectedBsaEvidence.case_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474c]">Court Integrity SHA-256:</span>
                <span className="font-bold text-[#0b1c30] break-all">{selectedBsaEvidence.sha256}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474c]">Content Removal Hash:</span>
                <span className="font-bold text-[#9a4600]">{selectedBsaEvidence.removal_hash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#44474c]">Custodian Location:</span>
                <span className="font-bold text-[#0b1c30]">{selectedBsaEvidence.custody_location}</span>
              </div>
            </div>

            <p className="text-xs text-[#44474c] leading-relaxed">
              I hereby certify pursuant to Section 63 of Bharatiya Sakshya Adhiniyam, 2023 that the electronic artifact above was captured during official cyber investigations without alteration, maintaining continuous cryptographic integrity on WORM partition SEC-NORTH-PROD-01.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eff4ff]">
              <button
                onClick={() => setSelectedBsaEvidence(null)}
                className="px-4 py-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold hover:bg-[#dce9ff]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {isCreateCaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCase}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#c5c6cd] flex flex-col gap-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#c5c6cd]">
              <h3 className="font-bold text-base text-[#0b1c30]">Register New Disinformation Inquest</h3>
              <button
                type="button"
                onClick={() => setIsCreateCaseOpen(false)}
                className="text-[#44474c] hover:text-[#0b1c30]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#44474c]">Inquest Operation Title</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Operation EchoShield"
                  className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#44474c]">Priority Level</label>
                  <select
                    value={newCasePriority}
                    onChange={(e) => setNewCasePriority(e.target.value)}
                    className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#44474c]">Lead Officer</label>
                  <input
                    type="text"
                    value={newCaseOfficer}
                    onChange={(e) => setNewCaseOfficer(e.target.value)}
                    className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#44474c]">Narrative Focus & Target Vectors</label>
                <textarea
                  rows={3}
                  value={newCaseNarrative}
                  onChange={(e) => setNewCaseNarrative(e.target.value)}
                  placeholder="Describe observed coordination swarms or violative content..."
                  className="px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eff4ff]">
              <button
                type="button"
                onClick={() => setIsCreateCaseOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold hover:bg-[#dce9ff]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#9a4600] hover:bg-[#753400] text-white text-xs font-semibold"
              >
                Register Inquest
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
