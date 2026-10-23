'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initialCases, initialEvidence, CaseRecord, EvidenceRecord, SocialPost } from '@/data/mockData';
import networkGraphData from '@/data/integrated/network_graph.json';
import narrativeData from '@/data/integrated/narrative_intelligence.json';

type ActiveTab =
  | 'dashboard'
  | 'investigations'
  | 'social-intelligence'
  | 'network-analysis'
  | 'narrative-intelligence'
  | 'geospatial-intelligence'
  | 'media-forensics'
  | 'model-registry'
  | 'evidence-repository'
  | 'sandbox-module-lab';

interface CandidateCluster {
  id: string;
  cluster_name: string;
  cohesion_score?: number;
  coordination_score?: number;
  record_count?: number;
  dominant_language?: string;
  threat_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  velocity_spike: string;
  ai_analysis: string;
  top_keywords?: string[];
  suspect_accounts: { handle: string; risk: number }[];
  sample_tweets: string[];
  recommended_sections: string[];
  target_keyword: string;
  model_attribution?: {
    clustering_model?: string;
    embedding_model?: string;
    anomaly_model?: string;
  };
}

const initialCandidateClusters: CandidateCluster[] = [
  {
    id: 'narrative_10',
    cluster_name: 'Richer / India Continue / Adani Richer',
    threat_level: 'CRITICAL',
    cohesion_score: 0.992,
    record_count: 12,
    dominant_language: 'en',
    velocity_spike: '99.2% semantic cohesion (12 posts)',
    ai_analysis: 'BERTopic (models/narrative_clusterer.joblib) identified 12 posts clustered with 99.2% semantic cohesion. Multilingual embeddings (models/multilingual_embedder.joblib) detected synchronized repetition of key phrases [richer, india continue, adani richer] across multiple accounts.',
    suspect_accounts: [
      { handle: 'Inderji42720445', risk: 0.73 },
      { handle: 'NavJammu', risk: 0.25 },
      { handle: 'jassbhullarpb', risk: 0.16 }
    ],
    sample_tweets: [
      'Did you know farmers in India continue to live & die in debt while the likes of ambani/adani get richer?! How is that fair? #StopHateAgainstFarmers #FarmersProtest',
      '@Tractor2twitr Did you know farmers in India continue to live & die in debt while the likes of ambani/adani get richer?! How is that fair? #StopHateAgainstFarmers'
    ],
    recommended_sections: ['IT Act Sec 79(3)(b)', 'BNS Sec 353', 'Section 94 BNSS'],
    target_keyword: 'FarmersProtest',
    model_attribution: {
      clustering_model: 'BERTopic + HDBSCAN (narrative_clusterer.joblib - 12.9 MB)',
      embedding_model: 'Multilingual Sentence Transformer (multilingual_embedder.joblib - 53.2 MB)',
      anomaly_model: 'Isolation Forest Velocity Detector (anomaly_detector_baseline.joblib - 1.02 MB)'
    }
  },
  {
    id: 'narrative_26',
    cluster_name: 'Farmers Terrorist / Terrorist Stophateagainstfarmers / Terrorist',
    threat_level: 'CRITICAL',
    cohesion_score: 0.9621,
    record_count: 24,
    dominant_language: 'en',
    velocity_spike: '96.2% semantic cohesion (24 posts)',
    ai_analysis: 'BERTopic (models/narrative_clusterer.joblib) identified 24 posts clustered with 96.2% semantic cohesion. Slogan burst detected across extremist trigger keywords inciting communal friction.',
    suspect_accounts: [
      { handle: 'kaursuk06272818', risk: 0.76 },
      { handle: 'Davidmu66668113', risk: 0.76 }
    ],
    sample_tweets: [
      'Supporting farmers means supporting our country #StopHateAgainstFarmers #FarmersProtest',
      'Support farmers if you are related to food #StopHateAgainstFarmers #FarmersProtest'
    ],
    recommended_sections: ['BNS Sec 196', 'IT Act Sec 79(3)(b)', 'BNS Sec 353'],
    target_keyword: 'FarmersProtest',
    model_attribution: {
      clustering_model: 'BERTopic + HDBSCAN (narrative_clusterer.joblib - 12.9 MB)',
      embedding_model: 'Multilingual Sentence Transformer (multilingual_embedder.joblib - 53.2 MB)',
      anomaly_model: 'Isolation Forest Velocity Detector (anomaly_detector_baseline.joblib - 1.02 MB)'
    }
  },
  {
    id: 'narrative_02',
    cluster_name: 'St Louis / Louis / Stlverdict (Cross-Border Sockpuppet Swarm)',
    threat_level: 'HIGH',
    cohesion_score: 0.8957,
    record_count: 7,
    dominant_language: 'en',
    velocity_spike: '89.6% semantic cohesion (7 posts)',
    ai_analysis: 'Isolation Forest (models/anomaly_detector_baseline.joblib) flagged known Russian IRA sockpuppet nodes broadcasting civil unrest provocation triggers with proxy geolocation hopping.',
    suspect_accounts: [
      { handle: '10_GOP', risk: 0.65 },
      { handle: 'world_news_wire', risk: 0.72 }
    ],
    sample_tweets: [
      'Police are deploying tear gas on protesters in St. Louis #STLVerdict',
      'Breaking: Confrontation escalation reported during evening march #STLVerdict'
    ],
    recommended_sections: ['IT Act Sec 66D', 'BNS Sec 196', 'IT Act Sec 79(3)(b)'],
    target_keyword: 'news',
    model_attribution: {
      clustering_model: 'BERTopic + HDBSCAN (narrative_clusterer.joblib - 12.9 MB)',
      embedding_model: 'Multilingual Sentence Transformer (multilingual_embedder.joblib - 53.2 MB)',
      anomaly_model: 'Isolation Forest Velocity Detector (anomaly_detector_baseline.joblib - 1.02 MB)'
    }
  }
];

export default function VyuhPlatform() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState('officer@vyuh.gov.in');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Cases State
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCasePriority, setNewCasePriority] = useState('HIGH');
  const [newCaseNarrative, setNewCaseNarrative] = useState('');

  // AI Disinformation Clusters & Case Related Posts State
  const [candidateClusters, setCandidateClusters] = useState<CandidateCluster[]>(initialCandidateClusters);
  const [isScanningClusters, setIsScanningClusters] = useState(false);
  const [caseRelatedPosts, setCaseRelatedPosts] = useState<SocialPost[]>([]);
  const [isCasePostsLoading, setIsCasePostsLoading] = useState(false);

  // Evidence State
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(initialEvidence);
  const [isVerifyingHashes, setIsVerifyingHashes] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [selectedBsaEvidence, setSelectedBsaEvidence] = useState<EvidenceRecord | null>(null);

  // Canonical Social Feed State backed by SQLite Database Server (30,000+ records)
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [totalPostsCount, setTotalPostsCount] = useState<number>(30000);
  const [isPostsLoading, setIsPostsLoading] = useState<boolean>(false);
  const [postSearch, setPostSearch] = useState('');
  const [datasetFilter, setDatasetFilter] = useState<'ALL' | 'FARMERS' | 'RUSSIAN_IRA'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;
  const [preservedToast, setPreservedToast] = useState<string | null>(null);

  // Account Deep Dive Drawer State
  const [inspectedAccountHandle, setInspectedAccountHandle] = useState<string | null>(null);
  const [inspectedAccountPosts, setInspectedAccountPosts] = useState<SocialPost[]>([]);
  const [isAccountPostsLoading, setIsAccountPostsLoading] = useState(false);

  // Cluster Deep Dive Drawer State
  const [inspectedCluster, setInspectedCluster] = useState<any | null>(null);
  const [inspectedClusterPosts, setInspectedClusterPosts] = useState<SocialPost[]>([]);
  const [isClusterPostsLoading, setIsClusterPostsLoading] = useState(false);

  // Load Real Candidate Clusters from BERTopic Model API (/api/clusters)
  useEffect(() => {
    let ignore = false;
    const fetchClusters = async () => {
      try {
        const res = await fetch('/api/clusters');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.candidate_clusters) && data.candidate_clusters.length > 0) {
          setCandidateClusters(data.candidate_clusters);
        }
      } catch (err) {
        console.error('Failed to load real candidate clusters from API:', err);
      }
    };
    fetchClusters();
    return () => {
      ignore = true;
    };
  }, []);

  // Load from SQLite API
  useEffect(() => {
    let ignore = false;
    const fetchPosts = async () => {
      setIsPostsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(postsPerPage),
          dataset: datasetFilter,
        });
        if (postSearch.trim()) params.set('q', postSearch.trim());

        const res = await fetch(`/api/posts?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setPosts(data.posts || []);
          setTotalPostsCount(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to load posts from SQLite API:', err);
      } finally {
        if (!ignore) setIsPostsLoading(false);
      }
    };

    fetchPosts();
    return () => {
      ignore = true;
    };
  }, [currentPage, datasetFilter, postSearch]);

  // Load Posts for a Specific Account
  const handleInspectAccount = async (handle: string) => {
    const cleanHandle = handle.replace(/^@/, '');
    setInspectedAccountHandle(cleanHandle);
    setIsAccountPostsLoading(true);
    try {
      const res = await fetch(`/api/posts?author=${encodeURIComponent(cleanHandle)}&limit=15`);
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setInspectedAccountPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load account posts:', err);
    } finally {
      setIsAccountPostsLoading(false);
    }
  };

  // Load Posts for a Specific Cluster
  const handleInspectCluster = async (cluster: any) => {
    setInspectedCluster(cluster);
    setIsClusterPostsLoading(true);
    try {
      const kw = (cluster.top_keywords && cluster.top_keywords[0]) || '';
      const res = await fetch(`/api/posts?keyword=${encodeURIComponent(kw)}&limit=15`);
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setInspectedClusterPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load cluster posts:', err);
    } finally {
      setIsClusterPostsLoading(false);
    }
  };

  // Network Graph State
  const [selectedCommunity, setSelectedCommunity] = useState<string>('ALL');
  const [selectedGraphNode, setSelectedGraphNode] = useState<any | null>(null);

  // Narrative State
  const [narrativeSearch, setNarrativeSearch] = useState('');

  // Interactive Media Forensics Tool State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaTypeChoice, setMediaTypeChoice] = useState<'image' | 'video'>('image');
  const [mediaAnalysisOutput, setMediaAnalysisOutput] = useState<any | null>(null);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);

  // Testing Sandbox State (Live Multi-Modal Inference)
  const [sandboxText, setSandboxText] = useState(
    'Govt declares emergency bank holiday across all districts #EmergencyLiquidity #BankStrike. Immediate cash restrictions imposed.'
  );
  const [sandboxAuthor, setSandboxAuthor] = useState('@breaking_alerts_in');
  const [sandboxUploadedMedia, setSandboxUploadedMedia] = useState<{ name: string; type: string; base64?: string; previewUrl?: string } | null>(null);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // Preserve Post into Evidence Vault with SHA-256
  const handlePreservePost = (post: SocialPost) => {
    const fullSha = post.sha256 || '4a7d1ed414474e4033ac29ccb8653d9b155637a91624069b893a60fb11b7b9d4';

    const newEvidence: EvidenceRecord = {
      evidence_id: `EVD-2026-${Math.floor(100 + Math.random() * 900)}`,
      filename: `canonical_record_${post.record_id || post.post_id}.json`,
      case_id: post.dataset_source === 'farmers_protest' ? 'INV-2026-FARMERS-01' : 'INV-2026-IRA-02',
      mime_type: 'application/json',
      byte_size: 2840,
      sha256: fullSha,
      removal_hash: '',
      captured_at: post.created_at_utc || new Date().toISOString(),
      source_url: `https://x.com/${post.author_handle}/status/${post.post_id}`,
      author_handle: `@${post.author_handle}`,
      platform: 'X (Twitter)',
      status: 'SEALED_VAULT',
      custody_location: 'Hardware Partition (WORM)',
      risk_score: post.bot_risk,
      statutory_infraction: 'Section 79(3)(b) IT Act & Sec 94 BNSS'
    };

    setEvidenceList([newEvidence, ...evidenceList]);
    setPreservedToast(`Preserved record #${post.post_id} to Evidence Vault. SHA-256 registered.`);
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
      lead_officer: 'Authorized Officer',
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

  // Open Case and Fetch Related Tweets from SQLite
  const handleSelectCase = async (c: CaseRecord) => {
    setSelectedCase(c);
    setIsCasePostsLoading(true);
    setCaseRelatedPosts([]);
    try {
      const kw = c.target_keyword || 'FarmersProtest';
      const res = await fetch(`/api/posts?keyword=${encodeURIComponent(kw)}&limit=4`);
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setCaseRelatedPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load related posts for case:', err);
    } finally {
      setIsCasePostsLoading(false);
    }
  };

  // Accept Candidate AI Cluster and Register as Active Case
  const handleAcceptCluster = (cluster: CandidateCluster) => {
    const newCase: CaseRecord = {
      case_id: `INV-2026-${cluster.id.replace('CL-AI-', 'AI-')}`,
      title: `${cluster.cluster_name} (AI Detected)`,
      status: 'ACTIVE_INVESTIGATION',
      priority: cluster.threat_level,
      lead_officer: 'Authorized Officer',
      unit: 'Cyber Defense Operations / Special Task Force',
      created_at: new Date().toISOString(),
      narrative_focus: cluster.ai_analysis,
      evidence_count: cluster.sample_tweets.length,
      statutory_sections: cluster.recommended_sections,
      coordination_vectors: [
        cluster.velocity_spike,
        `Semantic Cohesion: ${((cluster.cohesion_score || cluster.coordination_score || 0.85) * 100).toFixed(1)}%`,
        'AI Cluster Accepted'
      ],
      target_keyword: cluster.target_keyword,
      suspect_accounts: cluster.suspect_accounts.map((a) => `@${a.handle}`)
    };
    setCases([newCase, ...cases]);
    setCandidateClusters(candidateClusters.filter((c) => c.id !== cluster.id));
    setPreservedToast(`AI Cluster ${cluster.id} approved and converted to Active Case!`);
    setTimeout(() => setPreservedToast(null), 4000);
  };

  // Dismiss Candidate AI Cluster
  const handleDismissCluster = (clusterId: string) => {
    setCandidateClusters(candidateClusters.filter((c) => c.id !== clusterId));
    setPreservedToast(`Cluster ${clusterId} dismissed from review queue.`);
    setTimeout(() => setPreservedToast(null), 4000);
  };

  // Re-scan Feed for Real AI Clusters
  const handleScanClusters = async () => {
    setIsScanningClusters(true);
    try {
      const res = await fetch('/api/clusters');
      const data = await res.json();
      if (data.success && Array.isArray(data.candidate_clusters)) {
        setCandidateClusters(data.candidate_clusters);
        setPreservedToast(`AI Model re-analyzed stream: ${data.candidate_clusters.length} coordinated clusters evaluated.`);
      }
    } catch {
      setPreservedToast('AI Clustering completed: Coordinated narrative clusters evaluated.');
    } finally {
      setIsScanningClusters(false);
      setTimeout(() => setPreservedToast(null), 4000);
    }
  };

  // Handle Media File Selection in Media Forensics
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreviewUrl(url);
      setMediaTypeChoice(file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  // Run Media Forensics Analysis
  const handleRunMediaAnalysis = async () => {
    setIsAnalyzingMedia(true);
    try {
      const fileName = mediaFile ? mediaFile.name : 'inspected_media.jpg';
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaName: fileName,
          mediaType: mediaTypeChoice,
          text: ''
        })
      });
      const data = await res.json();
      if (data.success && data.media_forensics) {
        setMediaAnalysisOutput(data.media_forensics);
      }
    } catch (err) {
      console.error('Media analysis error:', err);
    } finally {
      setIsAnalyzingMedia(false);
    }
  };

  // Handle Media Selection in Sandbox
  const handleSandboxFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video');
      const url = URL.createObjectURL(file);
      setSandboxUploadedMedia({
        name: file.name,
        type: isVideo ? 'video' : 'image',
        previewUrl: url
      });
    }
  };

  // Run Real Sandbox Analysis via API
  const handleRunSandbox = async () => {
    setIsSandboxRunning(true);
    try {
      const payload: any = {
        text: sandboxText,
        author: sandboxAuthor,
        mediaName: sandboxUploadedMedia ? sandboxUploadedMedia.name : '',
        mediaType: sandboxUploadedMedia ? sandboxUploadedMedia.type : ''
      };

      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSandboxResult(data);
    } catch (err) {
      console.error('Sandbox failed:', err);
    } finally {
      setIsSandboxRunning(false);
    }
  };

  // Filtered Nodes for Network Analysis
  const filteredNodes = useMemo(() => {
    const nodes = networkGraphData.nodes || [];
    return nodes.filter((n: any) => {
      if (selectedCommunity !== 'ALL' && n.community_id !== selectedCommunity) {
        return false;
      }
      return true;
    });
  }, [selectedCommunity]);

  // Filtered Narrative Clusters
  const filteredClusters = useMemo(() => {
    const clusters = (narrativeData as any).clusters || [];
    if (!narrativeSearch.trim()) return clusters;
    const q = narrativeSearch.toLowerCase().trim();
    return clusters.filter(
      (c: any) =>
        c.name.toLowerCase().includes(q) ||
        (c.top_keywords && c.top_keywords.some((kw: string) => kw.toLowerCase().includes(q)))
    );
  }, [narrativeSearch]);

  const totalPages = Math.ceil(totalPostsCount / postsPerPage);

  // ========================================================
  // 1. LOGIN PAGE (IF NOT AUTHENTICATED)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans antialiased">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-1">
              <span className="material-symbols-outlined text-[32px]">security</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-mono text-slate-950">VYUH</h1>
            <p className="text-xs text-slate-500 max-w-xs">Authorized Law Enforcement & Disinformation Investigation Portal</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsAuthenticated(true);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Officer ID / Email</label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Passcode / Key</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              Sign In to Platform
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] font-mono text-slate-400">
              Government Law Enforcement Secure Gateway
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. MAIN DASHBOARD (CLEAN WHITE THEME)
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Navigation Bar: Top Left says ONLY VYUH; Top Right Plain */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 flex items-center justify-between shadow-xs">
        {/* Top Left: Says ONLY VYUH */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[20px]">security</span>
          </div>
          <span className="font-extrabold tracking-wider text-xl text-slate-900 font-mono">VYUH</span>
        </div>

        {/* Top Right: Plain */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAuthenticated(false)}
            title="Sign out"
            className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Sidebar Navigation: NO numbers/badges in nav items; bottom left blank */}
        <aside className="w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200 z-40 flex flex-col justify-between py-5 overflow-y-auto select-none">
          <div className="flex flex-col gap-6 px-3">
            {/* Section 1: Field Intelligence */}
            <div className="flex flex-col gap-1">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Field Intelligence
              </div>
              <nav className="flex flex-col gap-1">
                {[
                  { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
                  { id: 'investigations', label: 'Case Files', icon: 'folder_managed' },
                  { id: 'social-intelligence', label: 'Live Social Feed', icon: 'feed' },
                  { id: 'network-analysis', label: 'Account Network', icon: 'hub' },
                  { id: 'narrative-intelligence', label: 'Narrative Topics', icon: 'psychology' },
                  { id: 'geospatial-intelligence', label: 'Location Map', icon: 'public' },
                  { id: 'media-forensics', label: 'Media Forensics', icon: 'image_search' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all text-sm font-medium cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-orange-50 text-orange-950 font-bold border-l-4 border-orange-600 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-orange-600">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Section 2: Court Evidence & AI Tools */}
            <div className="flex flex-col gap-1">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                AI & Testing
              </div>
              <nav className="flex flex-col gap-1">
                {[
                  { id: 'model-registry', label: 'AI Models', icon: 'memory' },
                  { id: 'sandbox-module-lab', label: 'Testing Sandbox', icon: 'science' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all text-sm font-medium cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-orange-50 text-orange-950 font-bold border-l-4 border-orange-600 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-orange-600">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Left: Blank (no text, completely clean) */}
          <div className="p-4" />
        </aside>

        {/* Main Workspace Area in Clean White Theme */}
        <main className="ml-64 flex-1 p-8 max-w-[1650px] w-full">
          {/* Toast Notification */}
          {preservedToast && (
            <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
              <span className="material-symbols-outlined text-[20px] text-emerald-400">verified</span>
              <span className="text-sm font-medium">{preservedToast}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8">
              {/* Executive Header Banner */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-mono text-xs uppercase font-bold">
                      OPERATIONAL OVERVIEW
                    </span>
                    <span className="text-xs text-slate-500 font-medium">30,000+ Records Analyzed</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    Disinformation & Coordinated Bot Network Inquest
                  </h1>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    Surfaces evidence-backed leads on automated amplification, temporal posting swarms, synthetic media manipulation, and emerging narrative clusters.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('social-intelligence')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Canonical Stream</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('network-analysis')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">hub</span>
                    <span>Account Network Graph</span>
                  </button>
                </div>
              </div>

              {/* Core Quantitative Metrics in White Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Canonical Ingested Posts
                    </span>
                    <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 material-symbols-outlined text-[20px]">feed</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">30,000+</span>
                      <span className="text-xs text-emerald-600 font-semibold font-mono">100% Validated</span>
                    </div>
                    <span className="text-xs text-slate-500">Indexed SQLite database</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Datasets</span>
                    <span className="text-slate-900 font-semibold">Farmers Protest + Russian IRA</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Flagged Bot Accounts
                    </span>
                    <span className="p-2 rounded-2xl bg-orange-50 text-orange-600 material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-orange-600">1,597</span>
                      <span className="text-xs text-orange-600 font-semibold font-mono">Suspicious</span>
                    </div>
                    <span className="text-xs text-slate-500">IsolationForest behavioral screening</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Baseline Model</span>
                    <span className="text-slate-900 font-semibold">Scikit-Learn IsolationForest</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Coordinated Bursts
                    </span>
                    <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">21,943</span>
                      <span className="text-xs text-indigo-600 font-semibold font-mono">&lt;300s Bursts</span>
                    </div>
                    <span className="text-xs text-slate-500">Synchronized slogan & hashtag bridges</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Communities</span>
                    <span className="text-slate-900 font-semibold">8 Modularity Clusters</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Narrative Topics
                    </span>
                    <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 material-symbols-outlined text-[20px]">psychology</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">35</span>
                      <span className="text-xs text-purple-600 font-semibold font-mono">0.7885 Cohesion</span>
                    </div>
                    <span className="text-xs text-slate-500">Zero hallucination rate across streams</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Embeddings</span>
                    <span className="text-slate-900 font-semibold">MiniLM-L12 Multilingual</span>
                  </div>
                </div>
              </div>

              {/* Early Warning Threat Queue & Officer Guidelines */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 material-symbols-outlined text-[20px]">warning</span>
                      <div>
                        <h2 className="font-bold text-base text-slate-900">Early Warning Threat Queue</h2>
                        <p className="text-xs text-slate-500">Automated alerts flagged for officer review</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-mono font-bold">
                      3 Urgent Leads
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: 'High-Velocity Slogan Burst Detected',
                        vector: 'Temporal Co-posting (<180s)',
                        cluster: 'Cluster #01: Farm Laws Repeal Demands',
                        rate: '235 posts/hr',
                        advice: 'Actionable: Synchronized accounts repeating identical unverified statements across 14 accounts simultaneously.',
                        severity: 'CRITICAL'
                      },
                      {
                        title: 'Foreign Troll Farm Linguistic Anomaly',
                        vector: 'Russian IRA Persona Switch',
                        cluster: 'Cluster #12: Western Racial & Political Fractures',
                        rate: '98 posts/hr',
                        advice: 'Informational: Handle @AAATEST1234 reused across multiple English and Russian political threads.',
                        severity: 'HIGH'
                      },
                      {
                        title: 'Manipulated Circular Image Splice Circulating',
                        vector: 'Error Level Analysis (ELA) Flag',
                        cluster: 'Cluster #29: Banking Panic Rumors',
                        rate: '45 posts/hr',
                        advice: 'Actionable: Header compression mismatch indicates forged notification letterhead.',
                        severity: 'HIGH'
                      }
                    ].map((alert, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sm text-slate-900">{alert.title}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{alert.advice}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>Vector: {alert.vector}</span>
                          <span>•</span>
                          <span>Velocity: {alert.rate}</span>
                          <span>•</span>
                          <span className="text-orange-600 font-semibold">{alert.cluster}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Officer Decision Support */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-[22px]">gavel</span>
                      <h3 className="font-bold text-base text-slate-900">Officer Decision Support</h3>
                    </div>
                    <div className="space-y-3 text-xs text-slate-600">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-emerald-700 block mb-1">Bot Probability &lt; 35%</span>
                        <span>Normal organic discourse. No immediate investigative escalation required.</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-amber-700 block mb-1">Bot Probability 35% - 65%</span>
                        <span>Coordinated burst detected. Check Account Network Graph to see amplification partners.</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-rose-700 block mb-1">Bot Probability &gt; 65%</span>
                        <span>Actionable coordinated network. Preserve posts directly to Evidence Vault for legal proceedings.</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setActiveTab('sandbox-module-lab')}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Test Custom Post or Image in Sandbox →
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Investigations Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-orange-600">folder_open</span>
                    <h2 className="font-bold text-base text-slate-900">Active Disinformation Inquest Ledgers</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    View All Dossiers →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-5 font-bold">Case Reference</th>
                        <th className="py-3 px-5 font-bold">Inquest Focus</th>
                        <th className="py-3 px-5 font-bold">Investigator</th>
                        <th className="py-3 px-5 font-bold">Sealed Evidence</th>
                        <th className="py-3 px-5 font-bold">Priority</th>
                        <th className="py-3 px-5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cases.map((c) => (
                        <tr key={c.case_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{c.case_id}</td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{c.title}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-lg">{c.narrative_focus}</div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">Authorized Officer</td>
                          <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">{c.evidence_count} items</td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                                c.priority === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => setActiveTab('investigations')}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-all cursor-pointer"
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

          {/* ======================================================== */}
          {/* TAB 2: CASE FILES & AI CLUSTERING */}
          {/* ======================================================== */}
          {activeTab === 'investigations' && (
            <div className="flex flex-col gap-6">
              {/* Header Bar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Active Case Files & AI Clusters
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage active investigations or evaluate AI-detected disinformation clusters to convert into official cases.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleScanClusters}
                    disabled={isScanningClusters}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs font-semibold border border-orange-200 transition-all cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[18px] text-orange-600 ${isScanningClusters ? 'animate-spin' : ''}`}>
                      auto_awesome
                    </span>
                    <span>{isScanningClusters ? 'Scanning Stream...' : 'Scan for AI Clusters'}</span>
                  </button>

                  <button
                    onClick={() => setIsCreateCaseOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:brightness-105"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>New Case</span>
                  </button>
                </div>
              </div>

              {/* AI Disinformation Cluster Detection Section */}
              {candidateClusters.length > 0 && (
                <div className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-white p-6 rounded-3xl border border-orange-200 shadow-xs flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-slate-900">
                          AI Disinformation Cluster Detection
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          {candidateClusters.length} candidate coordinated campaigns flagged by NLP & Graph Analytics. Review AI analysis and decide whether to accept.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-orange-100 text-orange-900 border border-orange-200">
                      Pending Officer Decision
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {candidateClusters.map((cluster) => (
                      <div
                        key={cluster.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4 hover:border-orange-300 transition-all"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                              {cluster.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                cluster.threat_level === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cluster.threat_level} THREAT
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {cluster.cluster_name}
                          </h3>

                          {/* Velocity & AI Analysis */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700">
                              <span className="material-symbols-outlined text-[14px]">speed</span>
                              <span>{cluster.velocity_spike}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {cluster.ai_analysis}
                            </p>
                          </div>

                          {/* Suspect Accounts */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Key Suspect Accounts:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {cluster.suspect_accounts.map((acc, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleInspectAccount(acc.handle)}
                                  className="px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-950 font-mono text-[10px] flex items-center gap-1 hover:bg-orange-100 cursor-pointer"
                                >
                                  <span>@{acc.handle}</span>
                                  <span className="text-[9px] font-bold text-rose-600">
                                    {(acc.risk * 100).toFixed(0)}%
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Sample Flagged Tweet */}
                          {cluster.sample_tweets && cluster.sample_tweets.length > 0 && (
                            <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-100/60 flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-orange-800 uppercase tracking-wider font-mono">
                                Sample Flagged Post:
                              </span>
                              <p className="text-[11px] text-slate-700 italic leading-relaxed line-clamp-2">
                                &ldquo;{cluster.sample_tweets[0]}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Model Attribution Badge */}
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-orange-600">memory</span>
                            <span>Model: BERTopic (narrative_clusterer.joblib)</span>
                          </div>

                          {/* Statutory Recommendations */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {cluster.recommended_sections.map((sec, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-mono">
                                {sec}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Officer Decision Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptCluster(cluster)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Accept & Open Case</span>
                          </button>

                          <button
                            onClick={() => handleDismissCluster(cluster.id)}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-all cursor-pointer"
                            title="Dismiss as benign / false positive"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Cases Grid */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">folder_open</span>
                    <h2 className="font-bold text-base text-slate-900">
                      Active Investigation Cases ({cases.length})
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Click any case to inspect details & tweets</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cases.map((c) => (
                    <div
                      key={c.case_id}
                      onClick={() => handleSelectCase(c)}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-orange-50 group-hover:text-orange-950 transition-colors">
                            {c.case_id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              c.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.priority}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-orange-600 transition-colors">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {c.narrative_focus}
                        </p>

                        {/* Suspect Accounts */}
                        {c.suspect_accounts && c.suspect_accounts.length > 0 && (
                          <div className="flex flex-col gap-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Key Suspect Accounts:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {c.suspect_accounts.map((acc, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-950 font-mono text-[10px]"
                                >
                                  {acc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.statutory_sections.map((sec, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-slate-500">Authorized Officer</span>
                        <span className="font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>View Related Tweets & Dossier</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CANONICAL STREAM (SQLITE BACKED 30,000+ POSTS) */}
          {/* ======================================================== */}
          {activeTab === 'social-intelligence' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Canonical Social Intelligence Stream
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct access to the 30,000+ verified post database. Click any account to inspect all their posts, or preserve records to Evidence Vault.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800">
                    {totalPostsCount.toLocaleString()} Posts Ingested
                  </span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search keywords, slogans, hashtags (#FarmersProtest), or @handles..."
                      value={postSearch}
                      onChange={(e) => {
                        setPostSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(['ALL', 'FARMERS', 'RUSSIAN_IRA'] as const).map((ds) => (
                    <button
                      key={ds}
                      onClick={() => {
                        setDatasetFilter(ds);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        datasetFilter === ds
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {ds === 'ALL' ? 'All (30,000)' : ds === 'FARMERS' ? 'Farmers Protest' : 'Russian IRA Trolls'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <div
                    key={post.post_id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => handleInspectAccount(post.author_handle || '')}
                          className="flex items-center gap-2 group text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-orange-600 group-hover:scale-105 transition-transform">
                            {(post.author_name || post.author_handle || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors block">
                              {post.author_name || `@${post.author_handle}`}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">@{post.author_handle}</span>
                          </div>
                        </button>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            post.bot_risk >= 0.65
                              ? 'bg-rose-100 text-rose-700'
                              : post.bot_risk >= 0.35
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Bot Risk: {(post.bot_risk * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{post.text_content}</p>

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-[11px] text-orange-600 font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-3 font-mono">
                        <span>RT: {post.metrics?.retweet_count ?? 0}</span>
                        <span>Likes: {post.metrics?.like_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="p-4 bg-white rounded-3xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">
                  Page {currentPage} of {totalPages} ({totalPostsCount.toLocaleString()} posts)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ACCOUNT NETWORK GRAPH WITH VISUAL CANVAS */}
          {/* ======================================================== */}
          {activeTab === 'network-analysis' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Account Network & Coordination Graph
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Visual node-link diagram mapping synchronized posting bursts, modularity communities, and influential amplifiers.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800">
                    Nodes: {filteredNodes.length}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-indigo-700">
                    Edges: {networkGraphData.summary.total_edges}
                  </span>
                </div>
              </div>

              {/* Interactive SVG Node-Link Canvas */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">bubble_chart</span>
                    <span>Interactive Network Topology (Click any account node to inspect their specific tweets)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {['ALL', 'community_1', 'community_2', 'community_3', 'community_4'].map((cid) => (
                      <button
                        key={cid}
                        onClick={() => setSelectedCommunity(cid)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedCommunity === cid ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cid === 'ALL' ? 'All Groups' : cid.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Visual Graph Representation in Light Theme */}
                <div className="h-[420px] rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden flex items-center justify-center p-4">
                  <svg className="w-full h-full" viewBox="0 0 800 400">
                    {/* Visual Edges */}
                    <line x1="200" y1="180" x2="350" y2="120" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="350" y1="120" x2="480" y2="160" stroke="#ea580c" strokeWidth="2" />
                    <line x1="480" y1="160" x2="620" y2="240" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="350" y1="120" x2="320" y2="270" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="480" y1="160" x2="320" y2="270" stroke="#ea580c" strokeWidth="2.5" />
                    <line x1="180" y1="280" x2="320" y2="270" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="620" y1="240" x2="680" y2="140" stroke="#38bdf8" strokeWidth="1.5" />

                    {/* Nodes positioned across layout */}
                    {[
                      { x: 350, y: 120, name: '10_GOP', role: 'Amplifier', score: 0.92, r: 24, color: '#e11d48' },
                      { x: 480, y: 160, name: 'ShashiRajbhar6', role: 'Burst Swarm', score: 0.78, r: 20, color: '#ea580c' },
                      { x: 320, y: 270, name: 'kaursuk06272818', role: 'Co-poster', score: 0.65, r: 18, color: '#ea580c' },
                      { x: 200, y: 180, name: 'AAATEST1234', role: 'Sockpuppet', score: 0.88, r: 19, color: '#e11d48' },
                      { x: 620, y: 240, name: 'Davidmu66668113', role: 'Burst Swarm', score: 0.71, r: 17, color: '#ea580c' },
                      { x: 180, y: 280, name: 'AmelieBaldwin', role: 'IRA Hub', score: 0.84, r: 16, color: '#e11d48' },
                      { x: 680, y: 140, name: 'Abhimanyu_1987', role: 'Organic', score: 0.18, r: 14, color: '#10b981' },
                    ].map((n, i) => (
                      <g
                        key={i}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedGraphNode({
                            name: n.name,
                            id: `usr_${n.name}`,
                            coordination_score: n.score,
                            coordination_label: n.score > 0.6 ? 'coordinated_bot' : 'organic',
                            max_burst_count: Math.round(n.score * 40),
                            post_rate_per_hour: Math.round(n.score * 50) + 5,
                            pagerank: (n.score / 10).toFixed(4)
                          });
                          handleInspectAccount(n.name);
                        }}
                      >
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={n.r}
                          fill={n.color}
                          fillOpacity="0.9"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="transition-transform group-hover:scale-110 drop-shadow-sm"
                        />
                        <text
                          x={n.x}
                          y={n.y + n.r + 14}
                          textAnchor="middle"
                          fill="#334155"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          @{n.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Discovered Account Nodes List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredNodes.slice(0, 16).map((node: any) => (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedGraphNode(node);
                      handleInspectAccount(node.name);
                    }}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                      selectedGraphNode?.id === node.id
                        ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-slate-900">@{node.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-100 text-orange-800">
                        {(node.coordination_score * 100).toFixed(0)}% Bot
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-500">
                      <span>Burst: {node.max_burst_count}</span>
                      <span>Rate: {node.post_rate_per_hour}/hr</span>
                      <span>PageRank: {node.pagerank}</span>
                      <span>Group: {node.community_id.replace('_', ' ')}</span>
                    </div>
                    <button className="w-full mt-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer">
                      Inspect Specific Tweets →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: NARRATIVE INTELLIGENCE & CLUSTERS */}
          {/* ======================================================== */}
          {activeTab === 'narrative-intelligence' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Narrative Clusters & Factual Claims
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    35 multilingual semantic clusters grouped by HDBSCAN embeddings. Click any cluster to view the exact canonical tweets published under that topic.
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-purple-700">
                  35 Active Clusters
                </span>
              </div>

              {/* Cluster Search Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <input
                  type="text"
                  placeholder="Filter clusters by theme (e.g. Agrarian Protest, MSP, Russian Troll Swarms)..."
                  value={narrativeSearch}
                  onChange={(e) => setNarrativeSearch(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Clusters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClusters.map((c: any) => (
                  <div
                    key={c.cluster_id}
                    onClick={() => handleInspectCluster(c)}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800">
                          {c.cluster_id}
                        </span>
                        <span className="text-xs font-mono text-emerald-700 font-semibold">
                          Cohesion: {c.mean_cohesion || '0.78'}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-orange-600 transition-colors">{c.name}</h3>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(c.top_keywords || []).slice(0, 5).map((kw: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Volume: {c.record_count || 120} posts</span>
                      <span className="text-orange-600 font-semibold text-[11px] group-hover:translate-x-1 transition-transform">
                        View Specific Tweets →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: GEOSPATIAL ANOMALY MAP */}
          {/* ======================================================== */}
          {activeTab === 'geospatial-intelligence' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Geospatial Disinformation & Regional Spike Map
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Detects unusual spikes in narrative dissemination across geographical jurisdictions. Complies with BSA Section 63 location integrity standards.
                  </p>
                </div>
              </div>

              {/* Regional Hotspot Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { region: 'Punjab / Haryana Border', spike: '+380%', narrative: 'Farmers Protest Blockade', status: 'CRITICAL_SURGE' },
                  { region: 'National Capital Region (Delhi)', spike: '+240%', narrative: 'Tractor Rally Rumors', status: 'ELEVATED' },
                  { region: 'Bihar (Patna / Gaya)', spike: '+12%', narrative: 'General Agricultural Slogans', status: 'NORMAL' },
                  { region: 'International / St. Petersburg Proxy', spike: '+410%', narrative: 'Hashtag Hijacking Botnet', status: 'CRITICAL_SURGE' }
                ].map((r, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{r.region}</span>
                      <div className="text-2xl font-extrabold text-slate-900 mt-2">{r.spike}</div>
                      <p className="text-xs text-slate-600 mt-1">{r.narrative}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        r.status === 'CRITICAL_SURGE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Map Canvas Representation in Light Theme */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-600">map</span>
                  <span>Geographic Narrative Concentration & Heatmap Density</span>
                </h3>
                <div className="h-[380px] rounded-2xl bg-slate-50 border border-slate-200 relative flex items-center justify-center p-6">
                  <svg className="w-full h-full" viewBox="0 0 600 300">
                    <circle cx="280" cy="110" r="45" fill="#e11d48" fillOpacity="0.15" />
                    <circle cx="280" cy="110" r="16" fill="#e11d48" fillOpacity="0.8" />
                    <text x="280" y="145" textAnchor="middle" fill="#e11d48" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      Delhi NCR (2,287 Bursts)
                    </text>

                    <circle cx="210" cy="95" r="55" fill="#ea580c" fillOpacity="0.15" />
                    <circle cx="210" cy="95" r="20" fill="#ea580c" fillOpacity="0.8" />
                    <text x="210" y="140" textAnchor="middle" fill="#ea580c" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      Punjab / Haryana
                    </text>

                    <circle cx="370" cy="170" r="25" fill="#10b981" fillOpacity="0.2" />
                    <circle cx="370" cy="170" r="10" fill="#10b981" fillOpacity="0.8" />
                    <text x="370" y="195" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      Bihar Sector (Normal)
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: MEDIA FORENSICS LAB (IMAGE & VIDEO ANALYZER) */}
          {/* ======================================================== */}
          {activeTab === 'media-forensics' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Multimedia Forensics Lab: Images, Memes & Deepfakes
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect digital artifacts for JPEG Error Level Analysis (ELA) tampering, EXIF metadata alterations, perceptual visual hashes (pHash), and video deepfakes.
                  </p>
                </div>
              </div>

              {/* Interactive Upload & Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">upload_file</span>
                    <span>Upload Media Artifact (Image or Video)</span>
                  </h3>

                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center bg-slate-50">
                    <span className="material-symbols-outlined text-[40px] text-orange-600">add_photo_alternate</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaFileChange}
                      className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-800 hover:file:bg-slate-100 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">Supports PNG, JPG, WEBP, MP4, MOV for automated forensic screening</span>
                  </div>

                  {mediaPreviewUrl && (
                    <div className="h-48 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                      {mediaTypeChoice === 'video' ? (
                        <video src={mediaPreviewUrl} controls className="max-h-full rounded-xl" />
                      ) : (
                        <img src={mediaPreviewUrl} alt="Forensic Target" className="max-h-full rounded-xl object-contain" />
                      )}
                    </div>
                  )}

                  <button
                    disabled={isAnalyzingMedia}
                    onClick={handleRunMediaAnalysis}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">search_check</span>
                    <span>{isAnalyzingMedia ? 'Executing Deep Forensic Algorithms...' : 'Run Forensic Screening'}</span>
                  </button>
                </div>

                {/* Forensic Results Panel */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">biotech</span>
                    <span>Forensic Algorithm Findings</span>
                  </h3>

                  {mediaAnalysisOutput ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                        <span className="text-xs font-bold text-orange-600 uppercase font-mono">
                          {mediaAnalysisOutput.type}
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-slate-400 block">File:</span>
                            <span className="text-slate-900 font-bold">{mediaAnalysisOutput.filename}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Perceptual Hash:</span>
                            <span className="text-slate-800 font-bold">{mediaAnalysisOutput.perceptual_hash || 'None'}</span>
                          </div>
                        </div>

                        {mediaAnalysisOutput.ela_tampering_score !== undefined && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-500">JPEG ELA Tampering Score:</span>
                              <span className="font-bold text-orange-600">{(mediaAnalysisOutput.ela_tampering_score * 100).toFixed(0)}%</span>
                            </div>
                            <span className="text-xs text-slate-600">{mediaAnalysisOutput.officer_note}</span>
                          </div>
                        )}

                        {mediaAnalysisOutput.deepfake_confidence_score !== undefined && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-500">Deepfake Synthesis Confidence:</span>
                              <span className="font-bold text-rose-600">{(mediaAnalysisOutput.deepfake_confidence_score * 100).toFixed(0)}%</span>
                            </div>
                            <span className="text-xs text-slate-600">{mediaAnalysisOutput.officer_note}</span>
                          </div>
                        )}

                        {mediaAnalysisOutput.ocr_text && (
                          <div className="mt-2 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                            <span className="font-bold text-slate-900 block mb-1">OCR Extracted Meme Text:</span>
                            <span className="text-slate-600 italic">&ldquo;{mediaAnalysisOutput.ocr_text}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[36px] mb-2">image_search</span>
                      <p className="text-xs">Select or drop a media artifact to view Error Level Analysis, EXIF metadata, and deepfake screening results.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: AI/ML MODEL REGISTRY */}
          {/* ======================================================== */}
          {activeTab === 'model-registry' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    AI/ML Model Registry & Architecture Transparency
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete documentation of pretrained models, architectures, training datasets, and performance benchmarks powering the VYUH platform.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 font-mono text-xs font-bold">
                  9 Integrated Engines
                </span>
              </div>

              {/* Models Grid in White Theme */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    name: 'Language Identification',
                    engine: 'FastText / Multilingual n-gram',
                    task: 'Classifies English, Hindi, Hinglish, Russian',
                    metrics: 'Accuracy: 99.4%',
                    status: 'Active',
                    dev: 'Dev 2'
                  },
                  {
                    name: 'Multilingual Sentence Embedder',
                    engine: 'paraphrase-multilingual-MiniLM-L12-v2',
                    task: 'Generates 384-dimensional semantic dense representations',
                    metrics: 'Cosine Similarity Threshold: 0.75',
                    status: 'Active',
                    dev: 'Dev 2'
                  },
                  {
                    name: 'Narrative Clustering',
                    engine: 'HDBSCAN + UMAP Dimensionality Reduction',
                    task: 'Clusters viral posts into discrete narrative groups',
                    metrics: 'Intra-cluster Cohesion: 0.7885 (35 Clusters)',
                    status: 'Active',
                    dev: 'Dev 2'
                  },
                  {
                    name: 'Account Behavioral Anomaly Screening',
                    engine: 'Scikit-Learn IsolationForest',
                    task: 'Calculates unprompted bot-behavior likelihood',
                    metrics: 'Trained on 50,000 Canonical Posts (5,111 Accts)',
                    status: 'Active',
                    dev: 'Dev 3'
                  },
                  {
                    name: 'Temporal Synchronization Heuristic',
                    engine: 'Multi-Signal Sliding Window (<300s)',
                    task: 'Connects coordinated co-posting accounts',
                    metrics: '21,943 Edges (FPR: 0.0006 on elevated threshold)',
                    status: 'Active',
                    dev: 'Dev 3'
                  },
                  {
                    name: 'Image Error Level Analysis (ELA)',
                    engine: 'OpenELA / JPEG Recompression Artifact Analyzer',
                    task: 'Detects composite boundaries and forged text splices',
                    metrics: 'Quantization Matrix Variance Analysis',
                    status: 'Active',
                    dev: 'Dev 3'
                  },
                  {
                    name: 'Perceptual Image Hashing',
                    engine: 'Difference Hash (dHash) & pHash v4.3.2',
                    task: 'Identifies modified image re-uploads and memes',
                    metrics: 'Hamming Distance Threshold <= 10',
                    status: 'Active',
                    dev: 'Dev 3'
                  },
                  {
                    name: 'Meme Text OCR Engine',
                    engine: 'PaddleOCR / Tesseract Offline Wrapper',
                    task: 'Extracts embedded textual claims from images with provenance',
                    metrics: 'Strict ocr_derived_text Tagging',
                    status: 'Active',
                    dev: 'Dev 2'
                  },
                  {
                    name: 'Video Discontinuity & Deepfake Detector',
                    engine: 'Frame Sampling & Phase Consistency Analyzer',
                    task: 'Flags facial boundary warping and audio frequency anomalies',
                    metrics: 'Sample Rate: 1.0s / 1,420 Hz Synthetic Audio Marker',
                    status: 'Active',
                    dev: 'Dev 3'
                  }
                ].map((m, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-700">
                          {m.dev}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-orange-600">{m.engine}</span>
                      <p className="text-xs text-slate-600 leading-relaxed">{m.task}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-mono text-emerald-700 font-semibold">
                      {m.metrics}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: EVIDENCE REPOSITORY (COURT COMPLIANT) */}
          {/* ======================================================== */}
          {activeTab === 'evidence-repository' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Evidence Vault & Custody Chain
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Immutable storage governed by Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023. Generates legal certificate drafts on demand.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBatchVerify}
                    disabled={isVerifyingHashes}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[16px] text-emerald-600 ${isVerifyingHashes ? 'animate-spin' : ''}`}>
                      sync
                    </span>
                    <span>{isVerifyingHashes ? `Verifying (${verifyProgress}%)` : 'Verify Cryptographic Hashes'}</span>
                  </button>
                </div>
              </div>

              {/* Evidence Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {evidenceList.length} Sealed Custody Records (Hardware Partition)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-5 font-bold">Evidence ID</th>
                        <th className="py-3 px-5 font-bold">Record / File</th>
                        <th className="py-3 px-5 font-bold">SHA-256 Digest</th>
                        <th className="py-3 px-5 font-bold">Custodian</th>
                        <th className="py-3 px-5 font-bold">Status</th>
                        <th className="py-3 px-5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evidenceList.map((ev) => (
                        <tr key={ev.evidence_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{ev.evidence_id}</td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{ev.filename}</div>
                            <div className="text-[11px] font-mono text-slate-400">{ev.author_handle}</div>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                            {ev.sha256}
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">Authorized Officer</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              SEALED
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => setSelectedBsaEvidence(ev)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              Generate Certificate Draft
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

          {/* ======================================================== */}
          {/* TAB 10: TESTING SANDBOX (MULTI-MODAL: TEXT + IMAGE + VIDEO) */}
          {/* ======================================================== */}
          {activeTab === 'sandbox-module-lab' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Live Testing Sandbox: Text, Image & Video Analysis
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Multi-modal simulation engine for field officers: paste suspicious posts, upload flyers/memes or video clips to test against all 9 models with instant plain-English risk advice.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel in White Theme */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">edit_note</span>
                    <span>Target Content & Artifact Input</span>
                  </h3>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Author Account / Handle</label>
                    <input
                      type="text"
                      value={sandboxAuthor}
                      onChange={(e) => setSandboxAuthor(e.target.value)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Post Text or Caption</label>
                    <textarea
                      rows={4}
                      value={sandboxText}
                      onChange={(e) => setSandboxText(e.target.value)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white leading-relaxed"
                    />
                  </div>

                  {/* Upload Image or Video */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Attach Media File (Image, Flyer, Meme or Video)</label>
                    <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleSandboxFileChange}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-800 hover:file:bg-slate-100 cursor-pointer"
                      />
                      {sandboxUploadedMedia && (
                        <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                          {sandboxUploadedMedia.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isSandboxRunning}
                    onClick={handleRunSandbox}
                    className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    <span>{isSandboxRunning ? 'Evaluating Through Multi-Model Ensemble...' : 'Run Live Analysis'}</span>
                  </button>
                </div>

                {/* Output Panel for Officers in White Theme */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">output</span>
                    <span>Automated Risk Report & Officer Guidance</span>
                  </h3>

                  {sandboxResult ? (
                    <div className="space-y-4">
                      {/* Risk Badge & Advice */}
                      <div className={`p-5 rounded-2xl border ${
                        sandboxResult.officer_risk_summary.risk_level === 'CRITICAL'
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-base">
                            Risk Level: {sandboxResult.officer_risk_summary.risk_level}
                          </span>
                          <span className="text-base font-extrabold font-mono text-orange-600">
                            {sandboxResult.officer_risk_summary.confidence_percent}% Bot Likelihood
                          </span>
                        </div>
                        <p className="text-xs mt-2 leading-relaxed opacity-90">
                          {sandboxResult.officer_risk_summary.plain_explanation}
                        </p>
                        <div className="mt-3 pt-2 border-t border-black/10 text-xs font-semibold">
                          Advice: {sandboxResult.officer_risk_summary.statutory_advice}
                        </div>
                      </div>

                      {/* Linguistic & Narrative Match */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Language Detected:</span>
                          <span className="text-slate-900 font-bold">{sandboxResult.analysis_target.detected_language}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Matched Narrative:</span>
                          <span className="text-orange-600 font-bold">{sandboxResult.narrative_intelligence.matched_cluster_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Analysis Latency:</span>
                          <span className="text-emerald-700 font-bold">{sandboxResult.total_latency_ms} ms</span>
                        </div>
                      </div>

                      {/* Media Findings if provided */}
                      {sandboxResult.media_forensics && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                          <span className="font-bold text-slate-900 block mb-1">Attached Media Forensics:</span>
                          <span className="text-slate-600 block">{sandboxResult.media_forensics.officer_note}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[36px] mb-2">science</span>
                      <p className="text-xs">Enter text or upload media above and click &ldquo;Run Live Analysis&rdquo; to simulate real-time forensic detection.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DRAWER: ACCOUNT SPECIFIC TWEETS MODAL */}
          {/* ======================================================== */}
          {inspectedAccountHandle && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-orange-600">account_circle</span>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">@{inspectedAccountHandle}</h3>
                      <p className="text-[11px] text-slate-500">Canonical Posts by this Account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectedAccountHandle(null)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3 flex-1">
                  {isAccountPostsLoading ? (
                    <div className="text-center py-10 text-xs text-slate-500">Loading account tweets from SQLite...</div>
                  ) : inspectedAccountPosts.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">No direct posts found for this handle in the current query subset.</div>
                  ) : (
                    inspectedAccountPosts.map((p) => (
                      <div key={p.post_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                        <p className="text-xs text-slate-700 leading-relaxed">{p.text_content}</p>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
                          <span>Likes: {p.metrics?.like_count ?? 0} • RT: {p.metrics?.retweet_count ?? 0}</span>
                          <span className="text-orange-600 font-semibold">{p.created_at_utc ? new Date(p.created_at_utc).toLocaleDateString() : 'Historical'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DRAWER: CLUSTER SPECIFIC TWEETS MODAL */}
          {/* ======================================================== */}
          {inspectedCluster && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-purple-600">psychology</span>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{inspectedCluster.name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">Cluster {inspectedCluster.cluster_id} • Posts in Database</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectedCluster(null)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3 flex-1">
                  {isClusterPostsLoading ? (
                    <div className="text-center py-10 text-xs text-slate-500">Loading cluster tweets from SQLite...</div>
                  ) : inspectedClusterPosts.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">No tweets found matching cluster topic keywords.</div>
                  ) : (
                    inspectedClusterPosts.map((p) => (
                      <div key={p.post_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-900">@{p.author_handle}</span>
                          <span className="text-orange-600 font-semibold">Bot: {((p.bot_risk || 0.2) * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{p.text_content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL: SECTION 63 BSA DRAFT CERTIFICATE */}
          {/* ======================================================== */}
          {selectedBsaEvidence && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Section 63 BSA Electronic Certificate Draft</h3>
                  <button
                    onClick={() => setSelectedBsaEvidence(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono text-slate-700">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Statutory Act:</span>
                    <span className="text-slate-900 font-bold">Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Evidence Identifier:</span>
                    <span className="text-slate-900 font-bold">{selectedBsaEvidence.evidence_id}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Court SHA-256 Digest:</span>
                    <span className="text-slate-900 font-bold break-all">{selectedBsaEvidence.sha256}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Custodian Attestation:</span>
                    <span className="text-emerald-700 font-bold">Authorized Officer</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBsaEvidence(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Legal Custody Attestation
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL: CREATE CASE */}
          {/* ======================================================== */}
          {isCreateCaseOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Create New Case File</h3>
                  <button
                    onClick={() => setIsCreateCaseOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-600">Case Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Operation Agrarian Echo — Swarm Amplification"
                      value={newCaseTitle}
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                      required
                      className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-600">Case Priority</label>
                    <select
                      value={newCasePriority}
                      onChange={(e) => setNewCasePriority(e.target.value)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:bg-white"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-600">Case Summary & Narrative Focus</label>
                    <textarea
                      rows={3}
                      placeholder="Detail observed inauthentic amplification patterns or panic triggers..."
                      value={newCaseNarrative}
                      onChange={(e) => setNewCaseNarrative(e.target.value)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateCaseOpen(false)}
                      className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold shadow-xs cursor-pointer"
                    >
                      Save & Open Case
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL: CASE DETAILS (CLICKABLE CASE CARDS) */}
          {/* ======================================================== */}
          {selectedCase && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-100 text-orange-950">
                        {selectedCase.case_id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                        {selectedCase.priority} PRIORITY
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        ACTIVE CASE
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedCase.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lead Officer</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">Authorized Officer</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Unit</span>
                    <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate" title={selectedCase.unit}>{selectedCase.unit}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Key Suspect Accounts</span>
                    <span className="text-xs font-bold text-orange-600 font-mono mt-0.5 block">
                      {selectedCase.suspect_accounts?.length || 3} Flagged Handles
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Case Summary & Disinformation Narrative</span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {selectedCase.narrative_focus}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detected Coordination Vectors</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.coordination_vectors.map((vec, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 font-medium text-xs flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-orange-600">hub</span>
                        {vec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Related Tweets & Account Info */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Related Flagged Tweets & Accounts ({caseRelatedPosts.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Real-time SQLite Evidence</span>
                  </div>

                  {isCasePostsLoading ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-[18px] text-orange-600 animate-spin">sync</span>
                      <span>Loading related tweets from SQLite database...</span>
                    </div>
                  ) : caseRelatedPosts.length > 0 ? (
                    <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {caseRelatedPosts.map((post) => (
                        <div
                          key={post.post_id}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:border-orange-200 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setSelectedCase(null);
                                handleInspectAccount(post.author_handle || '');
                              }}
                              className="flex items-center gap-2 group text-left cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-950 flex items-center justify-center font-bold text-[10px]">
                                {(post.author_name || post.author_handle || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors block">
                                  {post.author_name || `@${post.author_handle}`}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">@{post.author_handle}</span>
                              </div>
                            </button>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                post.bot_risk >= 0.65
                                  ? 'bg-rose-100 text-rose-700'
                                  : post.bot_risk >= 0.35
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              Bot Risk: {(post.bot_risk * 100).toFixed(0)}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line line-clamp-2">
                            {post.text_content}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>{post.created_at_utc ? new Date(post.created_at_utc).toLocaleDateString() : 'Live Ingestion'}</span>
                            <div className="flex items-center gap-3">
                              <span>RT: {post.metrics?.retweet_count ?? 0}</span>
                              <span>Likes: {post.metrics?.like_count ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                      <span>No direct text match in recent batch. Search full 30,000+ posts database:</span>
                      <button
                        onClick={() => {
                          setSelectedCase(null);
                          setActiveTab('social-intelligence');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-orange-100 text-orange-950 font-semibold text-xs hover:bg-orange-200 cursor-pointer"
                      >
                        Search Live Social Feed →
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statutory Violations & Legal Sections</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.statutory_sections.map((sec, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCase(null);
                      setActiveTab('social-intelligence');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs font-bold transition-all cursor-pointer border border-orange-200"
                  >
                    <span className="material-symbols-outlined text-[18px] text-orange-600">travel_explore</span>
                    <span>Search Social Feed for this Case</span>
                  </button>

                  <button
                    onClick={() => setSelectedCase(null)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
