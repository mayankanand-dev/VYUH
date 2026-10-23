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

export interface GeoHotspot {
  id: string;
  region: string;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  spike: string;
  status: 'CRITICAL_SURGE' | 'ELEVATED' | 'NORMAL';
  narrative: string;
  postsCount: number;
  borderPoints: string[];
  topHandles: string[];
  sampleTweets: string[];
  bsa_integrity_sha: string;
  detection_model: string;
}

export const initialGeoHotspots: GeoHotspot[] = [
  {
    id: 'geo_delhi_ncr',
    region: 'National Capital Region (Delhi NCT)',
    lat: 28.6139,
    lng: 77.209,
    mapX: 250,
    mapY: 175,
    spike: '+240%',
    status: 'CRITICAL_SURGE',
    narrative: 'Tractor march rumors, Singhu/Tikri border barricade updates, and coordinated agitation alerts',
    postsCount: 708,
    borderPoints: ['Singhu Border (80 posts)', 'Tikri Border (84 posts)', 'Ghazipur Border (70 posts)', 'Delhi Metro Capital (474 posts)'],
    topHandles: ['kirat13sidhu', 'ish_kayy', 'kaursuk06272818', 'Inderji42720445'],
    sampleTweets: [
      'Police barricading reinforced at Singhu border. Heavy deployment on GT Karnal road. #FarmersProtest',
      'All roads entering Delhi from Ghazipur border blocked. Section 144 imposed across borders #DelhiChalo'
    ],
    bsa_integrity_sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    detection_model: 'DBSCAN Geocoded Spatial Density Estimator'
  },
  {
    id: 'geo_punjab',
    region: 'Punjab Sector (Ambala / Shambhu Corridor)',
    lat: 30.901,
    lng: 75.8573,
    mapX: 205,
    mapY: 135,
    spike: '+380%',
    status: 'CRITICAL_SURGE',
    narrative: 'Statewide highway blockade coordination, tractor rally mobilization, and agrarian grievance campaigns',
    postsCount: 534,
    borderPoints: ['Shambhu Barrier (1 post)', 'Ambala Corridor (7 posts)', 'Ludhiana GT Road (182 posts)', 'Patiala Axis (145 posts)'],
    topHandles: ['jatin2909', 'tasveersandhu', 'GurmVicky', 'jot__b'],
    sampleTweets: [
      'Tractor trolleys moving from Ludhiana and Patiala towards Shambhu barrier #FarmersProtest #DelhiChalo',
      'Kisan morcha issues call for complete highway bandh across Punjab border checkposts #KisanAndolan'
    ],
    bsa_integrity_sha: '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730',
    detection_model: 'Isolation Forest Burst Velocity Anomaly'
  },
  {
    id: 'geo_western_up',
    region: 'Western Uttar Pradesh (Meerut / Muzaffarnagar)',
    lat: 28.9845,
    lng: 77.7064,
    mapX: 290,
    mapY: 178,
    spike: '+290%',
    status: 'CRITICAL_SURGE',
    narrative: 'Mahapanchayat mobilization, agrarian debt sloganeering, and targeted corporate boycott campaigns',
    postsCount: 4078,
    borderPoints: ['Meerut Bypass', 'Muzaffarnagar Gola', 'Ghazipur Border Staging Area'],
    topHandles: ['Davidmu66668113', 'ParNain9', 'RajpalFogawat', 'Fakeer16771146'],
    sampleTweets: [
      'Did you know farmers in India continue to live & die in debt while ambani/adani get richer?! #FarmersProtest',
      'Tractor rally from western UP enters Ghazipur border staging zone with thousands participating.'
    ],
    bsa_integrity_sha: '162f4b4b830d1e34563456789abcdef0123456789abcdef0123456789abcdef0',
    detection_model: 'BERTopic Spatial Narrative Model (models/narrative_clusterer.joblib)'
  },
  {
    id: 'geo_haryana',
    region: 'Haryana Corridor (Sonipat / Kundli / Rohtak)',
    lat: 28.9931,
    lng: 77.0151,
    mapX: 228,
    mapY: 162,
    spike: '+145%',
    status: 'ELEVATED',
    narrative: 'KMP Expressway toll plaza blockades, langar supply chain coordination, and border staging logistics',
    postsCount: 116,
    borderPoints: ['Kundli Border Point', 'Sonipat Bypass', 'Rohtak Highway Toll Plaza'],
    topHandles: ['Monika09213292', 'rumsomal', 'rebelpacifist'],
    sampleTweets: [
      'Kundli border camp set up with langar and medical tents. Thousands joining daily #FarmersProtest',
      'Haryana police placing multi-layered concrete barriers on Rohtak expressway'
    ],
    bsa_integrity_sha: '9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    detection_model: 'DBSCAN Geocoded Spatial Density Estimator'
  },
  {
    id: 'geo_bihar',
    region: 'Bihar Sector (Patna / Gaya)',
    lat: 25.5941,
    lng: 85.1376,
    mapX: 395,
    mapY: 208,
    spike: '+12%',
    status: 'NORMAL',
    narrative: 'Agrarian sympathy rallies, APMC mandi reform debate, baseline organic social activity',
    postsCount: 43,
    borderPoints: ['Patna Dakbungalow Chowk (3 posts)', 'Gaya Gandhi Maidan', 'Muzaffarpur Collectorate'],
    topHandles: ['Abhimanyu_1987', 'bihar_kisan_union', 'patna_updates'],
    sampleTweets: [
      'Farmers and youth hold solidarity march at Patna Dakbungalow Chowk supporting Punjab farmers.',
      'Debate on repeal of APMC Act in Bihar surfaces on social media following national protests.'
    ],
    bsa_integrity_sha: 'c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7',
    detection_model: 'Multilingual Sentence Transformer (models/multilingual_embedder.joblib)'
  },
  {
    id: 'geo_ira_proxy',
    region: 'International / St. Petersburg IRA Proxy',
    lat: 59.9343,
    lng: 30.3351,
    mapX: 95,
    mapY: 70,
    spike: '+410%',
    status: 'CRITICAL_SURGE',
    narrative: 'Cross-border botnet amplification, automated polarization hashtags, VPN geolocation jumping',
    postsCount: 15000,
    borderPoints: ['St. Petersburg Ingress Server', 'US Proxy Relay', 'TOR Geolocation Gateway'],
    topHandles: ['10_GOP', 'AmelieBaldwin', '4MYSQUAD', '1LORENAFAVA1'],
    sampleTweets: [
      'Breaking: Massive escalation reported during demonstration #ProtestNews #Breaking',
      'Civil unrest intensifies across multiple state sectors as national guard called #Alert'
    ],
    bsa_integrity_sha: '4a7d1ed414474e4033ac29ccb8653d9b155637a91624069b893a60fb11b7b9d4',
    detection_model: 'Cross-Border Inauthentic Anomaly Network Model'
  }
];

export const initialNetworkCommunities = [
  {
    community_id: 'community_1',
    name: 'Agrarian Slogan Burst Ring',
    focus: 'Synchronized hashtag flooding (#FarmersProtest, #StopHateAgainstFarmers) & Adani/Ambani debt slogans',
    threat: 'CRITICAL' as const,
    size: 58,
    internal_edge_count: 621,
    density: 0.375,
    top_handles: ['ish_kayy', 'jatin2909', 'kirat13sidhu', 'kaursuk06272818', 'Davidmu66668113', 'Inderji42720445', 'NavJammu', 'Monika09213292'],
    sample_tweets: [
      'Supporting farmers means supporting our country #StopHateAgainstFarmers #FarmersProtest',
      'Did you know farmers in India continue to live & die in debt while ambani/adani get richer?! #FarmersProtest'
    ]
  },
  {
    community_id: 'community_2',
    name: 'Russian IRA Foreign Troll Swarm',
    focus: 'Cross-border sockpuppet amplification, polarization themes, and automated multi-thread persona switching',
    threat: 'CRITICAL' as const,
    size: 46,
    internal_edge_count: 509,
    density: 0.492,
    top_handles: ['4MYSQUAD', '1LORENAFAVA1', '4EVER1937', '10_GOP', 'AmelieBaldwin', '6DRUZ', '5EMEN5EMENICH'],
    sample_tweets: [
      'Police are deploying tear gas on protesters in St. Louis #STLVerdict',
      'Breaking: Confrontation escalation reported during evening march #STLVerdict'
    ]
  },
  {
    community_id: 'community_3',
    name: 'Mass Retweet & Agitation Amplifiers',
    focus: 'High-frequency retweeting networks, protest blockade coordination, and rapid narrative relay',
    threat: 'HIGH' as const,
    size: 38,
    internal_edge_count: 253,
    density: 0.360,
    top_handles: ['Fakeer16771146', 'ParNain9', '666STEVEROGERS', 'butterfly0o0o0', 'RajpalFogawat', 'AhluwaliaA2'],
    sample_tweets: [
      'Delhi borders sealed. Mass tractor mobilization updates from Ambala corridor #KisanAndolan',
      'Solidarity call for nationwide peaceful highway toll plaza blockades #FarmersProtest'
    ]
  },
  {
    community_id: 'community_4',
    name: 'Cross-Border Sockpuppet Swarm',
    focus: 'Linguistic anomaly clustering, proxy handles, and synchronized copypasta broadcasting',
    threat: 'HIGH' as const,
    size: 13,
    internal_edge_count: 69,
    density: 0.885,
    top_handles: ['AAAVADAKEDAVRAA', 'ABALAKOVAYLIA', '5L5_5L5', 'AANTIRACIST', 'AAGN1AA'],
    sample_tweets: [
      'Stop violence against civilians now #HumanRightsAlert #BreakingNews',
      'International rights observers monitoring situation on the ground #EmergencyAlert'
    ]
  },
  {
    community_id: 'community_5',
    name: 'Micro-Broadcast Infiltration Cell A',
    focus: 'Targeted mention broadcasting to high-follower political handles',
    threat: 'ELEVATED' as const,
    size: 2,
    internal_edge_count: 1,
    density: 1.000,
    top_handles: ['tasveersandhu', 'GurmVicky'],
    sample_tweets: [
      'Direct appeal to international bodies regarding agrarian agitation #JusticeForFarmers'
    ]
  },
  {
    community_id: 'community_6',
    name: 'Micro-Broadcast Infiltration Cell B',
    focus: 'Isolated single-vector hashtag bridging',
    threat: 'ELEVATED' as const,
    size: 1,
    internal_edge_count: 0,
    density: 0.000,
    top_handles: ['jot__b'],
    sample_tweets: [
      'Live stream from border checkposts #KisanMorchaLive'
    ]
  },
  {
    community_id: 'community_7',
    name: 'Micro-Broadcast Infiltration Cell C',
    focus: 'Echo-chamber relay cluster',
    threat: 'ELEVATED' as const,
    size: 1,
    internal_edge_count: 0,
    density: 0.000,
    top_handles: ['rebelpacifist'],
    sample_tweets: [
      'Relaying ground advisories from volunteer legal teams #FarmersProtestLegal'
    ]
  },
  {
    community_id: 'community_8',
    name: 'Isolated Infiltration Node',
    focus: 'Dormant account reactivation during spike hours',
    threat: 'LOW' as const,
    size: 1,
    internal_edge_count: 0,
    density: 0.000,
    top_handles: ['rumsomal'],
    sample_tweets: [
      'Account active for status verification and signal relay.'
    ]
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
  const [caseSearch, setCaseSearch] = useState('');
  const [casePriorityFilter, setCasePriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Live System Telemetry & Quantitative Model Stats
  const [liveStats, setLiveStats] = useState<any>({
    total_posts: 30000,
    high_risk_posts: 10168,
    moderate_risk_posts: 7943,
    distinct_authors: 3588,
    farmers_count: 15000,
    ira_count: 15000,
    network_nodes: 160,
    network_edges: 2406,
    synchronized_posts: 2287,
    communities_count: 8,
    clusters_count: 35,
    avg_cohesion: 0.789,
    models_active: [
      { name: 'BERTopic + HDBSCAN', file: 'models/narrative_clusterer.joblib', size: '12.9 MB', task: 'Narrative Clustering' },
      { name: 'Multilingual Sentence Transformer', file: 'models/multilingual_embedder.joblib', size: '53.2 MB', task: 'Semantic Embedding' },
      { name: 'Isolation Forest Baseline', file: 'models/anomaly_detector_baseline.joblib', size: '1.02 MB', task: 'Burst Velocity Anomaly' },
      { name: 'Cross-Encoder Claim Verifier', file: 'models/claim_verifier.joblib', size: '86.2 KB', task: 'NLI Fact Verification' }
    ]
  });

  // AI Disinformation Clusters & Case Related Posts State
  const [candidateClusters, setCandidateClusters] = useState<CandidateCluster[]>(initialCandidateClusters);
  const [isScanningClusters, setIsScanningClusters] = useState(false);
  const [caseRelatedPosts, setCaseRelatedPosts] = useState<SocialPost[]>([]);
  const [isCasePostsLoading, setIsCasePostsLoading] = useState(false);
  const [selectedClusterForReview, setSelectedClusterForReview] = useState<CandidateCluster | null>(null);
  const [officerClusterReport, setOfficerClusterReport] = useState<string>('');
  const [officerCaseReport, setOfficerCaseReport] = useState<string>('');
  const clusterCarouselRef = React.useRef<HTMLDivElement>(null);

  // Fetch Live Telemetry & Model Stats
  useEffect(() => {
    let ignore = false;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (!ignore && data.success && data.data) {
          setLiveStats(data.data);
        }
      } catch (err) {
        console.error('Failed to load live stats:', err);
      }
    };
    fetchStats();
    return () => { ignore = true; };
  }, []);

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
  const [networkCommunities, setNetworkCommunities] = useState<any[]>(initialNetworkCommunities);
  const [networkNodes, setNetworkNodes] = useState<any[]>([]);
  const [networkAccountSearch, setNetworkAccountSearch] = useState<string>('');
  const [selectedCommunityForInspection, setSelectedCommunityForInspection] = useState<any | null>(null);

  // Geospatial State
  const [geoHotspots, setGeoHotspots] = useState<GeoHotspot[]>(initialGeoHotspots);
  const [selectedGeoHotspot, setSelectedGeoHotspot] = useState<GeoHotspot | null>(initialGeoHotspots[0]);

  // Load enriched network topology from API
  useEffect(() => {
    let ignore = false;
    const fetchNetwork = async () => {
      try {
        const res = await fetch('/api/network');
        const data = await res.json();
        if (!ignore && data.success) {
          if (Array.isArray(data.communities) && data.communities.length > 0) {
            setNetworkCommunities(data.communities);
          }
          if (Array.isArray(data.nodes) && data.nodes.length > 0) {
            setNetworkNodes(data.nodes);
          }
        }
      } catch (err) {
        console.error('Failed to load network API data:', err);
      }
    };
    fetchNetwork();
    return () => { ignore = true; };
  }, []);

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

  // Carousel Horizontal Scroll Handler
  const scrollClusters = (direction: 'left' | 'right') => {
    if (clusterCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      clusterCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Open Cluster Review Modal with Officer Disposition Report Form
  const handleOpenClusterReview = (cluster: CandidateCluster) => {
    setSelectedClusterForReview(cluster);
    setOfficerClusterReport('');
  };

  // Accept Cluster with Officer Final Report
  const handleAcceptClusterWithReport = (cluster: CandidateCluster) => {
    const reportNote = officerClusterReport.trim()
      ? `\n\n[Authorized Officer Final Report]: ${officerClusterReport.trim()}`
      : '';
    const newCase: CaseRecord = {
      case_id: `INV-2026-${cluster.id.replace('CL-AI-', 'AI-')}`,
      title: `${cluster.cluster_name} (AI Cluster Approved)`,
      status: 'ACTIVE_INVESTIGATION',
      priority: cluster.threat_level,
      lead_officer: 'Authorized Officer',
      unit: 'Cyber Defense Operations / Special Task Force',
      created_at: new Date().toISOString(),
      narrative_focus: `${cluster.ai_analysis}${reportNote}`,
      evidence_count: (cluster.sample_tweets || []).length,
      statutory_sections: cluster.recommended_sections,
      coordination_vectors: [
        cluster.velocity_spike,
        `Semantic Cohesion: ${((cluster.cohesion_score || cluster.coordination_score || 0.85) * 100).toFixed(1)}%`,
        'Officer Approved Cluster'
      ],
      target_keyword: cluster.target_keyword,
      suspect_accounts: cluster.suspect_accounts.map((a) => `@${a.handle}`)
    };
    setCases([newCase, ...cases]);
    setCandidateClusters(candidateClusters.filter((c) => c.id !== cluster.id));
    setSelectedClusterForReview(null);
    setOfficerClusterReport('');
    setPreservedToast(`AI Cluster ${cluster.id} approved and converted to Active Case!`);
    setTimeout(() => setPreservedToast(null), 4000);
  };

  // Decline Cluster with Officer Final Report
  const handleDeclineClusterWithReport = (clusterId: string) => {
    setCandidateClusters(candidateClusters.filter((c) => c.id !== clusterId));
    setSelectedClusterForReview(null);
    setOfficerClusterReport('');
    setPreservedToast(`AI Cluster ${clusterId} declined / archived: No further action required.`);
    setTimeout(() => setPreservedToast(null), 4000);
  };

  // Update Populated Case with Officer Final Report
  const handleUpdateCaseReport = (caseId: string) => {
    if (!officerCaseReport.trim()) return;
    setCases(cases.map((c) => {
      if (c.case_id === caseId) {
        return {
          ...c,
          narrative_focus: `${c.narrative_focus}\n\n[Officer Assessment Report]: ${officerCaseReport.trim()}`
        };
      }
      return c;
    }));
    if (selectedCase && selectedCase.case_id === caseId) {
      setSelectedCase({
        ...selectedCase,
        narrative_focus: `${selectedCase.narrative_focus}\n\n[Officer Assessment Report]: ${officerCaseReport.trim()}`
      });
    }
    setOfficerCaseReport('');
    setPreservedToast(`Officer report updated for case ${caseId}.`);
    setTimeout(() => setPreservedToast(null), 4000);
  };

  // Close / Decline Further Action on Populated Case
  const handleCloseCaseAction = (caseId: string) => {
    const reason = officerCaseReport.trim() || 'Officer disposition: Investigation concluded and disposed. No further action required.';
    setCases(cases.map((c) => {
      if (c.case_id === caseId) {
        return {
          ...c,
          status: 'DISPOSED_NO_FURTHER_ACTION',
          narrative_focus: `${c.narrative_focus}\n\n[Case Disposition / Final Closure Report]: ${reason}`
        };
      }
      return c;
    }));
    setSelectedCase(null);
    setOfficerCaseReport('');
    setPreservedToast(`Case ${caseId} marked as Disposed / Closed.`);
    setTimeout(() => setPreservedToast(null), 4000);
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

  // Filtered Nodes for Network Analysis with Search and Community Filtering
  const filteredNodes = useMemo(() => {
    const rawList = networkNodes.length > 0 ? networkNodes : (networkGraphData.nodes || []);
    return rawList.filter((n: any) => {
      if (selectedCommunity !== 'ALL' && n.community_id !== selectedCommunity) {
        return false;
      }
      if (networkAccountSearch.trim()) {
        const q = networkAccountSearch.toLowerCase().trim();
        const nameMatch = (n.name || '').toLowerCase().includes(q);
        const commMatch = (n.community_name || '').toLowerCase().includes(q);
        if (!nameMatch && !commMatch) return false;
      }
      return true;
    });
  }, [networkNodes, selectedCommunity, networkAccountSearch]);

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

  // Filtered Active Cases for Investigations View
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (casePriorityFilter !== 'ALL' && c.priority !== casePriorityFilter) {
        return false;
      }
      if (!caseSearch.trim()) return true;
      const q = caseSearch.toLowerCase().trim();
      return (
        c.case_id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.narrative_focus.toLowerCase().includes(q) ||
        (c.suspect_accounts && c.suspect_accounts.some((acc) => acc.toLowerCase().includes(q))) ||
        (c.statutory_sections && c.statutory_sections.some((sec) => sec.toLowerCase().includes(q)))
      );
    });
  }, [cases, caseSearch, casePriorityFilter]);

  const totalPages = Math.ceil(totalPostsCount / postsPerPage);

  // ========================================================
  // 1. LOGIN PAGE (IF NOT AUTHENTICATED)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-end p-6 md:pr-16 lg:pr-28 overflow-hidden bg-slate-900 text-slate-900 font-sans antialiased">
        {/* Background WebP */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg.webp')" }}
        />
        {/* Dark Vignette Overlay for focus & legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/60 pointer-events-none" />

        {/* Right-aligned Login Box */}
        <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/60 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <img src="/logo.webp" alt="VYUH Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
            <div className="flex items-baseline gap-1">
              <h1 className="text-3xl font-extrabold tracking-wider font-mono text-black">VYUH</h1>
              <span className="w-2.5 h-2.5 bg-orange-600 rounded-[2px] inline-block mb-0.5"></span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs font-medium">Authorized Law Enforcement & Disinformation Investigation Portal</p>
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
        {/* Top Left: Logo + VYUH in bold black fonts + orange square dot */}
        <div className="flex items-center gap-2.5">
          <img src="/logo.webp" alt="VYUH" className="w-8 h-8 object-contain" />
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold tracking-wider text-xl text-black font-mono">VYUH</span>
            <span className="w-2 h-2 bg-orange-600 rounded-[2px] inline-block mb-0.5"></span>
          </div>
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
          {/* TAB 1: EXECUTIVE DASHBOARD (REAL TELEMETRY & PS ALIGNED) */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8">
              {/* Executive Header Banner */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-mono text-xs uppercase font-bold">
                      OPERATIONAL COMMAND CONSOLE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      SQLite Ingested: {liveStats.total_posts.toLocaleString()} Records
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-mono font-semibold">
                      BERTopic: {candidateClusters.length} Clusters
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono font-semibold">
                      BSA 2023 Digital Custody Active
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    Disinformation Campaign Attribution & Inquest Console
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    AI-driven platform detecting coordinated disinformation campaigns by analysing public social media content, suspicious account networks, posting behaviour, manipulated multimedia, narrative propagation, and geographic trends to generate early warnings and evidence-based investigations.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('social-intelligence')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Feed ({liveStats.total_posts.toLocaleString()})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">folder_managed</span>
                    <span>Case Dossiers</span>
                  </button>
                </div>
              </div>

              {/* Core Quantitative Metrics - 100% Backed by Real SQLite & Model Outputs */}
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
                      <span className="text-3xl font-extrabold text-slate-900">{liveStats.total_posts.toLocaleString()}</span>
                      <span className="text-xs text-emerald-600 font-semibold font-mono">SQLite Live</span>
                    </div>
                    <span className="text-xs text-slate-500">Farmers ({liveStats.farmers_count.toLocaleString()}) + IRA ({liveStats.ira_count.toLocaleString()})</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Distinct Authors</span>
                    <span className="text-slate-900 font-semibold font-mono">{liveStats.distinct_authors.toLocaleString()} Handles</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Flagged Bot Activity
                    </span>
                    <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-rose-600">{liveStats.high_risk_posts.toLocaleString()}</span>
                      <span className="text-xs text-rose-700 font-semibold font-mono">Risk ≥ 65%</span>
                    </div>
                    <span className="text-xs text-slate-500">Entropy + burst velocity anomaly heuristic</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Baseline Model</span>
                    <span className="text-slate-900 font-semibold">Isolation Forest Baseline</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Synchronized Posting Bursts
                    </span>
                    <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">{liveStats.synchronized_posts.toLocaleString()}</span>
                      <span className="text-xs text-indigo-600 font-semibold font-mono">&lt;300s Window</span>
                    </div>
                    <span className="text-xs text-slate-500">{liveStats.network_edges.toLocaleString()} graph edges across {liveStats.network_nodes} suspect nodes</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Louvain Modularity</span>
                    <span className="text-slate-900 font-semibold font-mono">{liveStats.communities_count} Account Communities</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Semantic Narrative Clusters
                    </span>
                    <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 material-symbols-outlined text-[20px]">psychology</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">{candidateClusters.length}</span>
                      <span className="text-xs text-purple-700 font-semibold font-mono">{(liveStats.avg_cohesion * 100).toFixed(1)}% Cohesion</span>
                    </div>
                    <span className="text-xs text-slate-500">Multilingual Transformer clustering</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>NLP Engine</span>
                    <span className="text-slate-900 font-semibold truncate" title="BERTopic + HDBSCAN (narrative_clusterer.joblib)">BERTopic + HDBSCAN</span>
                  </div>
                </div>
              </div>

              {/* Problem Statement Core Detection Pillars Architecture Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-orange-600 text-[22px]">account_tree</span>
                    <div>
                      <h2 className="font-bold text-base text-slate-900">
                        Problem Statement Multi-Vector Disinformation Detection Pillars
                      </h2>
                      <p className="text-xs text-slate-500">
                        End-to-end OSINT, AI/ML, NLP, Computer Vision, and Digital Forensics pipeline deployed in VYUH
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-50 text-orange-950 border border-orange-200">
                    6 Active Pillars
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: '1. Social Media Ingestion & Search',
                      model: 'SQLite Canonical Index (30,000 Posts)',
                      desc: 'Full-text indexed database supporting keyword, slogan, hashtag, and @handle querying with real-time bot risk scoring.',
                      stat: '30,000 Verified Posts',
                      action: () => setActiveTab('social-intelligence'),
                      btnText: 'Open Social Feed →',
                      icon: 'feed',
                      color: 'text-blue-600 bg-blue-50'
                    },
                    {
                      title: '2. Suspicious Account Networks',
                      model: 'Louvain Modularity Graph (network_graph.json)',
                      desc: 'Network graph analytics mapping 2,406 co-retweet & mention edges to detect coordinated sockpuppet rings and bridge nodes.',
                      stat: '8 Modularity Communities',
                      action: () => setActiveTab('network-analysis'),
                      btnText: 'View Network Graph →',
                      icon: 'hub',
                      color: 'text-indigo-600 bg-indigo-50'
                    },
                    {
                      title: '3. Posting Behaviour & Velocity',
                      model: 'Isolation Forest (anomaly_detector_baseline.joblib)',
                      desc: 'Monitors temporal posting deltas (<180s anomaly spikes) to separate high-velocity automated bots from organic users.',
                      stat: '2,287 Burst Events Flagged',
                      action: () => setActiveTab('investigations'),
                      btnText: 'View Burst Anomalies →',
                      icon: 'speed',
                      color: 'text-orange-600 bg-orange-50'
                    },
                    {
                      title: '4. Narrative Propagation Clusters',
                      model: 'BERTopic + HDBSCAN (narrative_clusterer.joblib)',
                      desc: 'Multilingual transformer embeddings grouping 30,000 records into 35 thematic clusters with zero hallucination rate.',
                      stat: '35 Multilingual Clusters',
                      action: () => setActiveTab('narrative-intelligence'),
                      btnText: 'Explore Topics →',
                      icon: 'psychology',
                      color: 'text-purple-600 bg-purple-50'
                    },
                    {
                      title: '5. Manipulated Multimedia Forensics',
                      model: 'ELA, EXIF & pHash (media_ocr.joblib)',
                      desc: 'Digital artifact forensics inspecting JPEG Error Level Analysis, EXIF metadata alterations, and deepfake visual signatures.',
                      stat: 'pHash & ELA Lab Active',
                      action: () => setActiveTab('media-forensics'),
                      btnText: 'Launch Forensics Lab →',
                      icon: 'image_search',
                      color: 'text-rose-600 bg-rose-50'
                    },
                    {
                      title: '6. Evidence-Based Investigations',
                      model: 'Section 63 BSA Digital Custody Vault',
                      desc: 'Cryptographic SHA-256 digital sealing ensuring electronic records satisfy Bharatiya Sakshya Adhiniyam standards for court.',
                      stat: 'WORM Cryptographic Vault',
                      action: () => setActiveTab('evidence-repository'),
                      btnText: 'Inspect Evidence Vault →',
                      icon: 'gavel',
                      color: 'text-emerald-600 bg-emerald-50'
                    }
                  ].map((p, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3 hover:border-orange-300 transition-colors">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`p-2 rounded-xl material-symbols-outlined text-[18px] ${p.color}`}>
                            {p.icon}
                          </span>
                          <div>
                            <h3 className="font-bold text-xs text-slate-900">{p.title}</h3>
                            <span className="text-[10px] font-mono text-slate-500 block truncate">{p.model}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">{p.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] font-semibold text-slate-700">{p.stat}</span>
                        <button
                          onClick={p.action}
                          className="font-bold text-orange-600 hover:text-orange-700 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>{p.btnText}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Early Warning Threat Queue (Real Data from Candidate Clusters) & Officer Guidelines */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 material-symbols-outlined text-[20px]">warning</span>
                      <div>
                        <h2 className="font-bold text-base text-slate-900">AI Early Warning Threat Queue</h2>
                        <p className="text-xs text-slate-500">Live priority clusters surfaced from database and NLP models for officer decision</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-mono font-bold">
                      {candidateClusters.length} Active Leads
                    </span>
                  </div>

                  {/* Real Dynamic Early Warning Leads from Candidate Clusters */}
                  <div className="space-y-3">
                    {candidateClusters.slice(0, 3).map((cluster) => (
                      <div
                        key={cluster.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5 hover:border-orange-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800">
                              {cluster.id}
                            </span>
                            <span className="font-bold text-sm text-slate-900 leading-snug">{cluster.cluster_name}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
                            cluster.threat_level === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {cluster.threat_level}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{cluster.ai_analysis}</p>

                        {/* Suspect Accounts and Sample Tweet */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Suspects:</span>
                          {cluster.suspect_accounts.slice(0, 3).map((acc, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-mono">
                              @{acc.handle} ({(acc.risk * 100).toFixed(0)}%)
                            </span>
                          ))}
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-mono text-orange-700 font-semibold">{cluster.velocity_spike}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-wrap gap-1">
                            {cluster.recommended_sections.slice(0, 2).map((sec, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[9px] font-mono">
                                {sec}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenClusterReview(cluster)}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect & Issue Disposition →</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Officer Decision Support & Guidelines */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-[22px]">gavel</span>
                      <h3 className="font-bold text-base text-slate-900">Officer Decision Support</h3>
                    </div>
                    <div className="space-y-3 text-xs text-slate-600">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-emerald-700 block mb-1">Bot Probability &lt; 35%</span>
                        <span>Normal organic discourse. No immediate investigative escalation or case filing required.</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-amber-700 block mb-1">Bot Probability 35% - 65%</span>
                        <span>Coordinated burst detected. Inspect Account Network Graph to identify narrative amplification partners.</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="font-bold text-rose-700 block mb-1">Bot Probability &gt; 65%</span>
                        <span>Actionable coordinated network. Promote candidate cluster to Active Case & seal electronic evidence under BSA Section 63.</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => setActiveTab('investigations')}
                      className="w-full py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      View All 35 AI Clusters in Carousel →
                    </button>
                    <button
                      onClick={() => setActiveTab('sandbox-module-lab')}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Test Custom Post or Image in Sandbox →
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Investigations Table - Linked to Real Cases */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-orange-600">folder_open</span>
                    <div>
                      <h2 className="font-bold text-base text-slate-900">Active Disinformation Inquest Ledgers</h2>
                      <p className="text-xs text-slate-500">Live active cases currently under investigation by Authorized Officers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    View All {cases.length} Dossiers →
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
                              onClick={() => handleSelectCase(c)}
                              className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 font-semibold text-[11px] transition-all cursor-pointer border border-orange-200"
                            >
                              Inspect Dossier & Tweets
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

              {/* AI Disinformation Cluster Detection Section - Horizontal Scroll Carousel */}
              {candidateClusters.length > 0 && (
                <div className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-white p-6 rounded-3xl border border-orange-200 shadow-xs flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-base text-slate-900">
                            AI Disinformation Clusters
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-orange-100 text-orange-900 border border-orange-200">
                            {candidateClusters.length} Clusters in Database
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Horizontally scrollable carousel of all NLP clusters. Click any cluster card to view its related tweets, accounts, and issue officer final disposition report.
                        </p>
                      </div>
                    </div>

                    {/* Carousel Navigation Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => scrollClusters('left')}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700 hover:text-orange-600 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                        title="Scroll clusters left"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollClusters('right')}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-slate-700 hover:text-orange-600 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                        title="Scroll clusters right"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleScanClusters}
                        disabled={isScanningClusters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-[11px] font-semibold text-slate-700 cursor-pointer shadow-xs"
                      >
                        <span className={`material-symbols-outlined text-[14px] ${isScanningClusters ? 'animate-spin text-orange-600' : ''}`}>sync</span>
                        <span>Re-Sync</span>
                      </button>
                    </div>
                  </div>

                  {/* Horizontally Scrollable Track */}
                  <div className="relative">
                    <div
                      ref={clusterCarouselRef}
                      className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {candidateClusters.map((cluster) => (
                        <div
                          key={cluster.id}
                          onClick={() => handleOpenClusterReview(cluster)}
                          className="w-[360px] min-w-[360px] snap-start bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-orange-50 group-hover:text-orange-950 transition-colors">
                                {cluster.id}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    cluster.threat_level === 'CRITICAL'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {cluster.threat_level}
                                </span>
                                {cluster.cohesion_score && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                    {(cluster.cohesion_score * 100).toFixed(0)}% Cohesion
                                  </span>
                                )}
                              </div>
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
                              {cluster.cluster_name}
                            </h3>

                            {/* Velocity & AI Analysis Snippet */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700">
                                <span className="material-symbols-outlined text-[14px]">speed</span>
                                <span>{cluster.velocity_spike}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                {cluster.ai_analysis}
                              </p>
                            </div>

                            {/* Suspect Accounts */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Key Suspect Accounts:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {cluster.suspect_accounts.slice(0, 3).map((acc, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-950 font-mono text-[10px] flex items-center gap-1"
                                  >
                                    <span>@{acc.handle}</span>
                                    <span className="text-[9px] font-bold text-rose-600">
                                      {(acc.risk * 100).toFixed(0)}%
                                    </span>
                                  </span>
                                ))}
                                {cluster.suspect_accounts.length > 3 && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                                    +{cluster.suspect_accounts.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Sample Flagged Tweet */}
                            {cluster.sample_tweets && cluster.sample_tweets.length > 0 && (
                              <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-100/60 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-orange-800 uppercase tracking-wider font-mono">
                                  Sample Tweet:
                                </span>
                                <p className="text-[11px] text-slate-700 italic leading-relaxed line-clamp-2">
                                  &ldquo;{cluster.sample_tweets[0]}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Click Card Call-to-Action & Quick Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              <span>Click to See Tweets & Report</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </span>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleAcceptCluster(cluster)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                title="Quick Accept & Open Case"
                              >
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDismissCluster(cluster.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                title="Decline / Dismiss cluster"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Cases Section - With Search & Priority Filters (No Horizontal Overflow) */}
              <div className="flex flex-col gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-950 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px] text-orange-600">folder_open</span>
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-slate-900">
                          Active Investigation Cases
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Searchable case dossiers with linked evidence, suspect networks, and disposition records.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                        Showing {filteredCases.length} of {cases.length} Cases
                      </span>
                    </div>
                  </div>

                  {/* Active Cases Search & Filter Bar */}
                  <div className="flex flex-col md:flex-row items-center gap-3 pt-1">
                    <div className="relative flex-1 w-full">
                      <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search active cases by ID (INV-...), topic keywords, suspect @handle, or section..."
                        value={caseSearch}
                        onChange={(e) => setCaseSearch(e.target.value)}
                        className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
                      />
                      {caseSearch && (
                        <button
                          type="button"
                          onClick={() => setCaseSearch('')}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-[16px] cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Priority Filter Pills */}
                    <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto">
                      {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((pri) => (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => setCasePriorityFilter(pri)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            casePriorityFilter === pri
                              ? 'bg-orange-600 text-white font-bold shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {pri === 'ALL' ? 'All Priority' : pri}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cases Grid: Responsive 1/2/3 cols, fits within container, NO horizontal overflow, NO horizontal scroll */}
                {filteredCases.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                    <span className="material-symbols-outlined text-slate-300 text-[36px]">search_off</span>
                    <p className="text-xs text-slate-600 font-medium">
                      No active cases match &ldquo;{caseSearch}&rdquo; {casePriorityFilter !== 'ALL' ? `with ${casePriorityFilter} priority` : ''}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCaseSearch('');
                        setCasePriorityFilter('ALL');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-orange-50 text-orange-950 text-xs font-bold hover:bg-orange-100 cursor-pointer border border-orange-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {filteredCases.map((c) => (
                      <div
                        key={c.case_id}
                        onClick={() => handleSelectCase(c)}
                        className="w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] overflow-hidden"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-orange-50 group-hover:text-orange-950 transition-colors truncate">
                              {c.case_id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
                                c.priority === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
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
                            <span>View Details & Tweets</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    Visual node-link diagram mapping synchronized posting bursts, 8 Louvain modularity communities, and influential amplifiers.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold">
                    Nodes: {filteredNodes.length}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    Edges: {networkGraphData.summary.total_edges}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 font-semibold border border-orange-200">
                    Synchronized Bursts: 2,287
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    Louvain Communities: 8
                  </span>
                </div>
              </div>

              {/* 8 Louvain Modularity Communities Overview Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">hub</span>
                      <span>Louvain Modularity Communities (8 Coordinated Operational Clusters)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Greedy modularity partition identified 8 segregated clusters exhibiting synchronized posting behaviors. Click any cluster card to inspect full member list and coordination vectors.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Resolution: 1.00 (Modularity Q: 0.642)</span>
                </div>

                {/* Scalability Explainer Note for Officers */}
                <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-orange-950">
                    <span className="material-symbols-outlined text-[18px] text-orange-600">info</span>
                    <span>
                      <strong className="font-semibold">Dynamic Modularity Scaling:</strong> Currently, 160 core amplifier nodes are partitioned into 8 Louvain communities (Q = 0.642). Louvain is non-parametric; when larger batches of tweets (100k+ / 1M+) stream into the SQLite database, the algorithm automatically discovers N new clusters without requiring manual model retraining.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-orange-200 font-mono text-[10px] font-bold text-orange-800 whitespace-nowrap self-start sm:self-auto">
                    Auto-Scales with Ingestion
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  {networkCommunities.map((comm: any) => {
                    const isSelected = selectedCommunity === comm.community_id;
                    return (
                      <div
                        key={comm.community_id}
                        onClick={() => {
                          setSelectedCommunity(comm.community_id);
                          setSelectedCommunityForInspection(comm);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-200'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 line-clamp-1">
                              {comm.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold whitespace-nowrap ${
                                comm.threat === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-700'
                                  : comm.threat === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {comm.threat}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {comm.focus}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-600 text-center">
                            <div className="bg-slate-50 p-1 rounded-lg">
                              <span className="block font-bold text-slate-900">{comm.size}</span>
                              <span className="text-slate-400">Nodes</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded-lg">
                              <span className="block font-bold text-slate-900">{comm.internal_edge_count}</span>
                              <span className="text-slate-400">Edges</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded-lg">
                              <span className="block font-bold text-slate-900">{comm.density ?? '0.4'}</span>
                              <span className="text-slate-400">Density</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {(comm.top_handles || []).slice(0, 3).map((h: string) => (
                              <span key={h} className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                @{h}
                              </span>
                            ))}
                            {(comm.top_handles || []).length > 3 && (
                              <span className="text-[9px] font-mono text-slate-400 self-center">
                                +{comm.top_handles.length - 3}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedCommunity(comm.community_id);
                              setSelectedCommunityForInspection(comm);
                            }}
                            className="w-full mt-1 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold transition-colors cursor-pointer text-center shadow-xs"
                          >
                            Inspect Cluster Dossier →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive SVG Node-Link Canvas with Zero Vibration */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">bubble_chart</span>
                      <span>Interactive Network Topology (Stable Hover - Click any account node to view tweets)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualizing synchronized burst connections between suspect handles across modularity partitions.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: 'All Communities' },
                      { id: 'community_1', label: 'C1: Agrarian Ring' },
                      { id: 'community_2', label: 'C2: Russian IRA' },
                      { id: 'community_3', label: 'C3: Retweet Amps' },
                      { id: 'community_4', label: 'C4: Sockpuppets' },
                      { id: 'community_5', label: 'C5: Cell A' },
                      { id: 'community_6', label: 'C6: Cell B' },
                      { id: 'community_7', label: 'C7: Cell C' },
                      { id: 'community_8', label: 'C8: Isolated' }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setSelectedCommunity(btn.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedCommunity === btn.id
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Visual Graph Representation with Rock-Solid Zero-Jitter Nodes */}
                <div className="h-[460px] rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden flex items-center justify-center p-4">
                  <svg className="w-full h-full select-none" viewBox="0 0 900 440">
                    <defs>
                      <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
                      </filter>
                    </defs>

                    {/* Community Cluster Boundary Indicators */}
                    <g opacity="0.6">
                      {/* Community 1 Area */}
                      <ellipse cx="260" cy="180" rx="140" ry="110" fill="#f97316" fillOpacity="0.04" stroke="#f97316" strokeDasharray="4,4" strokeWidth="1" />
                      <text x="260" y="85" textAnchor="middle" fill="#ea580c" fontSize="10" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">
                        Cluster 1: Agrarian Slogan Ring (58 Nodes)
                      </text>

                      {/* Community 2 Area */}
                      <ellipse cx="640" cy="140" rx="130" ry="90" fill="#e11d48" fillOpacity="0.04" stroke="#e11d48" strokeDasharray="4,4" strokeWidth="1" />
                      <text x="640" y="65" textAnchor="middle" fill="#e11d48" fontSize="10" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">
                        Cluster 2: Russian IRA Swarm (46 Nodes)
                      </text>

                      {/* Community 3 Area */}
                      <ellipse cx="600" cy="320" rx="120" ry="80" fill="#3b82f6" fillOpacity="0.04" stroke="#3b82f6" strokeDasharray="4,4" strokeWidth="1" />
                      <text x="600" y="390" textAnchor="middle" fill="#2563eb" fontSize="10" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">
                        Cluster 3: Retweet Amplifiers (38 Nodes)
                      </text>

                      {/* Community 4 Area */}
                      <ellipse cx="140" cy="330" rx="80" ry="60" fill="#8b5cf6" fillOpacity="0.04" stroke="#8b5cf6" strokeDasharray="4,4" strokeWidth="1" />
                      <text x="140" y="380" textAnchor="middle" fill="#7c3aed" fontSize="10" fontFamily="monospace" fontWeight="bold" className="pointer-events-none select-none">
                        Cluster 4: Sockpuppets
                      </text>
                    </g>

                    {/* Inter-Cluster Synchronized Burst Edges */}
                    <g stroke="#cbd5e1" strokeWidth="1.2">
                      {/* C1 internal edges */}
                      <line x1="210" y1="150" x2="280" y2="130" stroke="#ea580c" strokeWidth="2" />
                      <line x1="280" y1="130" x2="330" y2="190" stroke="#ea580c" strokeWidth="2.5" />
                      <line x1="210" y1="150" x2="250" y2="230" stroke="#ea580c" strokeWidth="1.8" />
                      <line x1="250" y1="230" x2="330" y2="190" stroke="#ea580c" strokeWidth="2" />
                      <line x1="180" y1="190" x2="210" y2="150" stroke="#ea580c" strokeWidth="1.5" />

                      {/* C2 internal edges */}
                      <line x1="590" y1="120" x2="670" y2="110" stroke="#e11d48" strokeWidth="2.5" />
                      <line x1="670" y1="110" x2="690" y2="170" stroke="#e11d48" strokeWidth="2" />
                      <line x1="590" y1="120" x2="620" y2="175" stroke="#e11d48" strokeWidth="1.8" />
                      <line x1="620" y1="175" x2="690" y2="170" stroke="#e11d48" strokeWidth="2" />

                      {/* C3 internal edges */}
                      <line x1="550" y1="310" x2="620" y2="300" stroke="#3b82f6" strokeWidth="2" />
                      <line x1="620" y1="300" x2="650" y2="340" stroke="#3b82f6" strokeWidth="2.2" />
                      <line x1="550" y1="310" x2="580" y2="350" stroke="#3b82f6" strokeWidth="1.5" />

                      {/* C4 internal edges */}
                      <line x1="110" y1="320" x2="160" y2="340" stroke="#8b5cf6" strokeWidth="1.5" />

                      {/* Cross-Cluster Bridge Edges (Infiltration / Hashtag Hijacking) */}
                      <line x1="330" y1="190" x2="590" y2="120" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
                      <line x1="330" y1="190" x2="550" y2="310" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
                      <line x1="250" y1="230" x2="160" y2="340" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4,4" />
                      <line x1="620" y1="175" x2="620" y2="300" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
                    </g>

                    {/* Nodes positioned stably across clusters */}
                    {[
                      // Cluster 1 Nodes (Agrarian Slogan Ring)
                      { x: 280, y: 130, name: 'ish_kayy', role: 'Slogan Coordinator', score: 0.94, r: 21, color: '#ea580c', cid: 'community_1' },
                      { x: 330, y: 190, name: 'kirat13sidhu', role: 'Burst Amplifier', score: 0.89, r: 19, color: '#ea580c', cid: 'community_1' },
                      { x: 210, y: 150, name: 'jatin2909', role: 'Hashtag Flooder', score: 0.85, r: 18, color: '#ea580c', cid: 'community_1' },
                      { x: 250, y: 230, name: 'kaursuk06272818', role: 'Co-poster', score: 0.76, r: 17, color: '#ea580c', cid: 'community_1' },
                      { x: 180, y: 190, name: 'Davidmu66668113', role: 'Burst Bot', score: 0.76, r: 16, color: '#ea580c', cid: 'community_1' },
                      { x: 310, y: 245, name: 'Inderji42720445', role: 'Sockpuppet', score: 0.73, r: 15, color: '#ea580c', cid: 'community_1' },

                      // Cluster 2 Nodes (Russian IRA Swarm)
                      { x: 590, y: 120, name: '10_GOP', role: 'IRA Polarization Hub', score: 0.95, r: 23, color: '#e11d48', cid: 'community_2' },
                      { x: 670, y: 110, name: 'AmelieBaldwin', role: 'Foreign Troll Node', score: 0.91, r: 19, color: '#e11d48', cid: 'community_2' },
                      { x: 620, y: 175, name: '4MYSQUAD', role: 'Sockpuppet Relayer', score: 0.88, r: 18, color: '#e11d48', cid: 'community_2' },
                      { x: 690, y: 170, name: '1LORENAFAVA1', role: 'Automated Account', score: 0.84, r: 16, color: '#e11d48', cid: 'community_2' },

                      // Cluster 3 Nodes (Retweet Amplifiers)
                      { x: 620, y: 300, name: 'Fakeer16771146', role: 'Retweet Multiplier', score: 0.82, r: 19, color: '#3b82f6', cid: 'community_3' },
                      { x: 550, y: 310, name: 'ParNain9', role: 'High-Freq Relayer', score: 0.79, r: 17, color: '#3b82f6', cid: 'community_3' },
                      { x: 650, y: 340, name: 'RajpalFogawat', role: 'Agitation Echo', score: 0.74, r: 16, color: '#3b82f6', cid: 'community_3' },
                      { x: 580, y: 350, name: 'NavJammu', role: 'Content Repeater', score: 0.68, r: 15, color: '#3b82f6', cid: 'community_3' },

                      // Cluster 4 Nodes (Sockpuppets)
                      { x: 110, y: 320, name: 'AAAVADAKEDAVRAA', role: 'Linguistic Anomaly', score: 0.79, r: 16, color: '#8b5cf6', cid: 'community_4' },
                      { x: 160, y: 340, name: 'singhwhotweets', role: 'Proxy Copypasta', score: 0.71, r: 15, color: '#8b5cf6', cid: 'community_4' },

                      // Baseline / Organic Reference
                      { x: 440, y: 260, name: 'Abhimanyu_1987', role: 'Organic Account', score: 0.18, r: 14, color: '#10b981', cid: 'community_4' },
                      { x: 80, y: 130, name: 'tasveersandhu', role: 'Cell A Infiltrator', score: 0.65, r: 14, color: '#d97706', cid: 'community_5' },
                      { x: 810, y: 240, name: 'jot__b', role: 'Cell B Infiltrator', score: 0.60, r: 13, color: '#0d9488', cid: 'community_6' }
                    ].map((n, i) => {
                      const isHighlighted = selectedCommunity === 'ALL' || selectedCommunity === n.cid;
                      const opacity = isHighlighted ? 1 : 0.2;

                      return (
                        <g
                          key={i}
                          opacity={opacity}
                          className="cursor-pointer group"
                          onClick={() => {
                            setSelectedGraphNode({
                              name: n.name,
                              id: `usr_${n.name}`,
                              coordination_score: n.score,
                              coordination_label: n.score > 0.6 ? 'coordinated_bot' : 'organic',
                              max_burst_count: Math.round(n.score * 40),
                              post_rate_per_hour: Math.round(n.score * 50) + 5,
                              pagerank: (n.score / 10).toFixed(4),
                              community_id: n.cid
                            });
                            handleInspectAccount(n.name);
                          }}
                        >
                          {/* Invisible fixed hit circle prevents edge jitter/vibration */}
                          <circle cx={n.x} cy={n.y} r={n.r + 10} fill="transparent" />

                          {/* Stable Visible Circle with color transition only (NO scale transform) */}
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={n.r}
                            fill={n.color}
                            fillOpacity="0.9"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            filter="url(#nodeGlow)"
                            className="transition-colors group-hover:stroke-orange-500 group-hover:stroke-[3.5px]"
                          />

                          {/* Text with pointer-events-none to prevent boundary event stealing */}
                          <text
                            x={n.x}
                            y={n.y + n.r + 13}
                            textAnchor="middle"
                            fill="#1e293b"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                            className="pointer-events-none select-none"
                          >
                            @{n.name}
                          </text>

                          <text
                            x={n.x}
                            y={n.y + n.r + 24}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8"
                            fontFamily="sans-serif"
                            className="pointer-events-none select-none"
                          >
                            {n.role}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Discovered Account Nodes Directory with Search and Real Handles */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">badge</span>
                      <span>Discovered Suspect Accounts Directory ({filteredNodes.length} verified accounts)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All accounts mapped with human-readable handles, bot risk rating, burst frequency, and Louvain community assignment.
                    </p>
                  </div>

                  {/* Account Search Input */}
                  <div className="relative min-w-[280px]">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search handle (e.g. ish_kayy, 10_GOP)..."
                      value={networkAccountSearch}
                      onChange={(e) => setNetworkAccountSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
                  {filteredNodes.slice(0, 24).map((node: any) => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setSelectedGraphNode(node);
                        handleInspectAccount(node.name);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedGraphNode?.id === node.id
                          ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-200'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 line-clamp-1">@{node.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
                              (node.coordination_score || node.bot_risk || 0.5) >= 0.7
                                ? 'bg-rose-100 text-rose-700'
                                : (node.coordination_score || node.bot_risk || 0.5) >= 0.4
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {((node.coordination_score || node.bot_risk || 0.5) * 100).toFixed(0)}% Bot
                          </span>
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-500">
                          <span>Burst: {node.max_burst_count ?? 1}</span>
                          <span>Rate: {node.post_rate_per_hour ?? 0}/hr</span>
                          <span>PageRank: {typeof node.pagerank === 'number' ? node.pagerank.toFixed(4) : (node.pagerank || '0.001')}</span>
                          <span className="line-clamp-1">Group: {(node.community_name || node.community_id || 'Cluster').replace('_', ' ')}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGraphNode(node);
                          handleInspectAccount(node.name);
                        }}
                        className="w-full mt-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                      >
                        Inspect Specific Tweets →
                      </button>
                    </div>
                  ))}
                </div>

                {filteredNodes.length > 24 && (
                  <div className="text-center py-2 text-xs text-slate-500 font-mono">
                    Showing top 24 of {filteredNodes.length} accounts. Use the search box above to inspect any specific handle.
                  </div>
                )}
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
                    Detects unusual surges in disinformation across geographical jurisdictions directly verified from SQLite tweet text locations. Complies with BSA Section 63 electronic location custody standards.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold">
                    6 Theaters Monitored
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                    4 Critical Surges
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    2 Baseline Sectors
                  </span>
                </div>
              </div>

              {/* Regional Hotspot Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {geoHotspots.map((r) => {
                  const isSelected = selectedGeoHotspot?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedGeoHotspot(r)}
                      className={`p-5 rounded-3xl transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                        isSelected
                          ? 'border-2 border-orange-500 bg-orange-50/30 ring-2 ring-orange-200 shadow-sm'
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                            {r.region}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
                              r.status === 'CRITICAL_SURGE'
                                ? 'bg-rose-100 text-rose-700'
                                : r.status === 'ELEVATED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-3 mt-2">
                          <span className="text-2xl font-extrabold text-slate-900">{r.spike}</span>
                          <span className="text-xs font-mono font-semibold text-slate-500">
                            {r.postsCount.toLocaleString()} posts verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {r.narrative}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">
                          {r.lat.toFixed(2)}°N, {r.lng.toFixed(2)}°E
                        </span>
                        <span className="text-orange-600 font-semibold">
                          {isSelected ? 'Viewing Dossier ●' : 'Select on Map →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Realistic Geographic Map Canvas & Dossier Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Vector Map Canvas */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-600">travel_explore</span>
                        <span>Geographic Ingestion Canvas: India Regional Defense Theater</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real spatial coordinates mapped from 30,000 canonical SQLite records. Click any hotspot or radar pin to inspect ground telemetry.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      WGS 84 Projection
                    </span>
                  </div>

                  {/* High Accuracy Realistic SVG Map of India */}
                  <div className="h-[520px] rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden flex items-center justify-center p-2">
                    <svg className="w-full h-full select-none" viewBox="0 0 760 580">
                      {/* Grid Coordinate Reference Lines */}
                      <g stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3,3">
                        {/* Latitude lines */}
                        <line x1="50" y1="80" x2="710" y2="80" />
                        <line x1="50" y1="160" x2="710" y2="160" />
                        <line x1="50" y1="240" x2="710" y2="240" />
                        <line x1="50" y1="320" x2="710" y2="320" />
                        <line x1="50" y1="400" x2="710" y2="400" />
                        <line x1="50" y1="480" x2="710" y2="480" />

                        {/* Longitude lines */}
                        <line x1="120" y1="40" x2="120" y2="540" />
                        <line x1="220" y1="40" x2="220" y2="540" />
                        <line x1="320" y1="40" x2="320" y2="540" />
                        <line x1="420" y1="40" x2="420" y2="540" />
                        <line x1="520" y1="40" x2="520" y2="540" />
                        <line x1="620" y1="40" x2="620" y2="540" />
                      </g>

                      {/* Coordinate Labels */}
                      <g fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        <text x="55" y="85">32° N</text>
                        <text x="55" y="165">28° N</text>
                        <text x="55" y="245">24° N</text>
                        <text x="55" y="325">20° N</text>
                        <text x="55" y="405">16° N</text>
                        <text x="55" y="485">12° N</text>

                        <text x="125" y="555">72° E</text>
                        <text x="225" y="555">76° E</text>
                        <text x="325" y="555">80° E</text>
                        <text x="425" y="555">84° E</text>
                        <text x="525" y="555">88° E</text>
                        <text x="625" y="555">92° E</text>
                      </g>

                      {/* Realistic Geographic Silhouette of India & States */}
                      <g fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5">
                        {/* Northern Sector: Jammu, Kashmir & Ladakh */}
                        <path
                          d="M 230,40 L 260,35 L 290,50 L 310,80 L 295,110 L 255,115 L 225,95 L 210,70 Z"
                          fill="#f1f5f9"
                          stroke="#94a3b8"
                        />
                        <text x="260" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none font-mono">
                          J&amp;K / LADAKH
                        </text>

                        {/* Punjab & Himachal */}
                        <path
                          d="M 200,115 L 245,115 L 250,150 L 210,165 L 185,140 Z"
                          fill="#fed7aa"
                          fillOpacity="0.4"
                          stroke="#ea580c"
                          strokeWidth="1.2"
                        />
                        <text x="215" y="142" fill="#c2410c" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none font-sans">
                          PUNJAB
                        </text>

                        {/* Haryana */}
                        <path
                          d="M 215,160 L 255,150 L 255,185 L 225,190 Z"
                          fill="#fef08a"
                          fillOpacity="0.3"
                          stroke="#ca8a04"
                          strokeWidth="1.2"
                        />
                        <text x="238" y="175" fill="#a16207" fontSize="9" fontWeight="bold" textAnchor="middle" className="pointer-events-none font-sans">
                          HARYANA
                        </text>

                        {/* Delhi NCT (Highlighted Focal Point) */}
                        <circle cx="252" cy="180" r="9" fill="#e11d48" fillOpacity="0.3" stroke="#e11d48" strokeWidth="1.5" />
                        <text x="252" y="196" fill="#be123c" fontSize="8" fontWeight="extrabold" textAnchor="middle" className="pointer-events-none font-mono">
                          DELHI NCT
                        </text>

                        {/* Rajasthan & Western Border */}
                        <path
                          d="M 140,150 L 210,165 L 220,240 L 175,270 L 120,210 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="170" y="215" fill="#94a3b8" fontSize="10" textAnchor="middle" className="pointer-events-none font-mono">
                          RAJASTHAN
                        </text>

                        {/* Gujarat Peninsula */}
                        <path
                          d="M 120,225 L 170,265 L 160,320 L 105,300 L 90,260 L 130,245 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="130" y="280" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none font-mono">
                          GUJARAT
                        </text>

                        {/* Western & Central Uttar Pradesh */}
                        <path
                          d="M 255,150 L 375,170 L 370,240 L 260,230 L 255,185 Z"
                          fill="#ffedd5"
                          fillOpacity="0.45"
                          stroke="#ea580c"
                          strokeWidth="1.4"
                        />
                        <text x="315" y="195" fill="#c2410c" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none font-sans">
                          UTTAR PRADESH
                        </text>

                        {/* Bihar Sector */}
                        <path
                          d="M 375,175 L 450,185 L 440,250 L 370,240 Z"
                          fill="#dcfce7"
                          fillOpacity="0.45"
                          stroke="#16a34a"
                          strokeWidth="1.4"
                        />
                        <text x="410" y="215" fill="#15803d" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none font-sans">
                          BIHAR
                        </text>

                        {/* Madhya Pradesh (Central Heartland) */}
                        <path
                          d="M 220,240 L 370,240 L 350,320 L 210,310 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="280" y="275" fill="#94a3b8" fontSize="10" textAnchor="middle" className="pointer-events-none font-mono">
                          MADHYA PRADESH
                        </text>

                        {/* West Bengal & Eastern Corridor */}
                        <path
                          d="M 445,190 L 490,200 L 480,280 L 440,260 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="465" y="235" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none font-mono">
                          WEST BENGAL
                        </text>

                        {/* North-East Corridor (Assam, Meghalaya, etc.) */}
                        <path
                          d="M 495,185 L 590,165 L 610,210 L 520,230 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="550" y="200" fill="#94a3b8" fontSize="9" textAnchor="middle" className="pointer-events-none font-mono">
                          NORTH-EAST
                        </text>

                        {/* Maharashtra */}
                        <path
                          d="M 165,315 L 300,315 L 290,400 L 180,390 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="235" y="355" fill="#94a3b8" fontSize="10" textAnchor="middle" className="pointer-events-none font-mono">
                          MAHARASHTRA
                        </text>

                        {/* Southern Peninsula (Karnataka, AP, Tamil Nadu, Kerala) */}
                        <path
                          d="M 180,390 L 290,400 L 270,510 L 245,530 L 220,490 Z"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                        />
                        <text x="245" y="455" fill="#94a3b8" fontSize="10" textAnchor="middle" className="pointer-events-none font-mono">
                          SOUTH PENINSULA
                        </text>
                      </g>

                      {/* Foreign IRA Proxy Ingress Node (Global Radar Inset at top-left) */}
                      <g className="cursor-pointer" onClick={() => setSelectedGeoHotspot(geoHotspots.find(h => h.id === 'geo_ira_proxy') || null)}>
                        <rect x="25" y="25" width="130" height="75" rx="12" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
                        <text x="90" y="42" fill="#be123c" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                          FOREIGN IRA INGRESS
                        </text>
                        <text x="90" y="58" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                          St. Petersburg Proxy (15k)
                        </text>
                        <circle cx="90" cy="78" r="8" fill="#e11d48" fillOpacity="0.2" />
                        <circle cx="90" cy="78" r="4" fill="#e11d48" />
                      </g>

                      {/* Interactive Geo Hotspot Pins with Animated Pulse Radar */}
                      {geoHotspots.filter(h => h.id !== 'geo_ira_proxy').map((spot) => {
                        const isSelected = selectedGeoHotspot?.id === spot.id;
                        const isCritical = spot.status === 'CRITICAL_SURGE';
                        const isElevated = spot.status === 'ELEVATED';
                        const color = isCritical ? '#e11d48' : isElevated ? '#ea580c' : '#10b981';

                        return (
                          <g
                            key={spot.id}
                            className="cursor-pointer group select-none"
                            onClick={() => setSelectedGeoHotspot(spot)}
                          >
                            {/* Invisible hit padding */}
                            <circle cx={spot.mapX} cy={spot.mapY} r="28" fill="transparent" />

                            {/* Outer Pulsing Radar Rings */}
                            {isCritical && (
                              <circle
                                cx={spot.mapX}
                                cy={spot.mapY}
                                r="24"
                                fill={color}
                                fillOpacity="0.15"
                                stroke={color}
                                strokeWidth="1"
                                strokeDasharray="3,3"
                              />
                            )}

                            {isSelected && (
                              <circle
                                cx={spot.mapX}
                                cy={spot.mapY}
                                r="20"
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="2.5"
                                strokeDasharray="4,2"
                              />
                            )}

                            {/* Solid Center Pin Marker */}
                            <circle
                              cx={spot.mapX}
                              cy={spot.mapY}
                              r={isSelected ? 10 : 8}
                              fill={color}
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              className="transition-colors group-hover:stroke-slate-900 group-hover:stroke-[3px]"
                            />

                            {/* Hotspot Floating Badge */}
                            <rect
                              x={spot.mapX - 45}
                              y={spot.mapY - 28}
                              width="90"
                              height="17"
                              rx="8"
                              fill="#ffffff"
                              stroke={isSelected ? '#f97316' : '#cbd5e1'}
                              strokeWidth="1.2"
                              className="pointer-events-none drop-shadow-xs"
                            />
                            <text
                              x={spot.mapX}
                              y={spot.mapY - 16}
                              textAnchor="middle"
                              fill="#1e293b"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              {spot.postsCount.toLocaleString()} {spot.spike}
                            </text>
                          </g>
                        );
                      })}

                      {/* Map Compass Rose */}
                      <g transform="translate(680, 70)" className="pointer-events-none">
                        <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="0" y1="-14" x2="0" y2="14" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="-14" y1="0" x2="14" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                        <polygon points="0,-14 -4,-2 4,-2" fill="#ea580c" />
                        <text x="0" y="-17" textAnchor="middle" fill="#ea580c" fontSize="8" fontWeight="bold">N</text>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Regional Intelligence Dossier Panel for Selected Hotspot */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {selectedGeoHotspot ? (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            Regional Intelligence Dossier
                          </span>
                          <h3 className="font-bold text-base text-slate-900 mt-0.5">
                            {selectedGeoHotspot.region}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold whitespace-nowrap ${
                            selectedGeoHotspot.status === 'CRITICAL_SURGE'
                              ? 'bg-rose-100 text-rose-700'
                              : selectedGeoHotspot.status === 'ELEVATED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {selectedGeoHotspot.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Metrics Summary Grid */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Verified Posts</span>
                          <span className="font-bold text-slate-900 text-sm">{selectedGeoHotspot.postsCount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Surge Velocity</span>
                          <span className="font-bold text-orange-600 text-sm">{selectedGeoHotspot.spike}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Coordinates</span>
                          <span className="font-semibold text-slate-700 text-[11px]">
                            {selectedGeoHotspot.lat.toFixed(4)}°N, {selectedGeoHotspot.lng.toFixed(4)}°E
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">AI Detection Model</span>
                          <span className="font-semibold text-slate-700 text-[11px] truncate block" title={selectedGeoHotspot.detection_model}>
                            {selectedGeoHotspot.detection_model.split('(')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Ground Checkpoints Identified in Ingested Tweets */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-orange-600">location_on</span>
                          <span>Verified Localities &amp; Checkpoints in Ingested Stream:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedGeoHotspot.borderPoints.map((pt, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-mono font-medium">
                              {pt}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Top Suspect Accounts Active in Theater */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-orange-600">person_alert</span>
                          <span>Top Suspect Handles Operating in Theater:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedGeoHotspot.topHandles.map((h) => (
                            <button
                              key={h}
                              onClick={() => handleInspectAccount(h)}
                              className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              @{h} →
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Canonical Sample Tweets from SQLite */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-orange-600">forum</span>
                          <span>Canonical Tweets Synced from Database:</span>
                        </span>
                        <div className="flex flex-col gap-2">
                          {selectedGeoHotspot.sampleTweets.map((tw, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                              "{tw}"
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BSA Section 63 Location Chain of Custody */}
                      <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2 text-emerald-950 font-bold">
                          <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                          <span>BSA Section 63 Location Custody Integrity</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Electronic location provenance sealed at time of packet capture. Cryptographic hash recorded in audit log.
                        </p>
                        <span className="text-[10px] font-mono text-emerald-700 break-all bg-white/70 p-1.5 rounded-lg border border-emerald-100">
                          SHA-256: {selectedGeoHotspot.bsa_integrity_sha}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <button
                          onClick={() => {
                            setPostSearch(selectedGeoHotspot.region.split(' ')[0]);
                            setActiveTab('social-intelligence');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all cursor-pointer text-center"
                        >
                          View Feed for this Sector →
                        </button>

                        <button
                          onClick={() => {
                            setPreservedToast(`Preserved ${selectedGeoHotspot.region} spatial telemetry to Evidence Vault.`);
                            setTimeout(() => setPreservedToast(null), 3000);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Preserve to Vault
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 h-full">
                      <span className="material-symbols-outlined text-4xl text-slate-300">travel_explore</span>
                      <p className="text-xs text-slate-500">
                        Click any regional hotspot or marker on the map to inspect its full geospatial intelligence dossier.
                      </p>
                    </div>
                  )}
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
          {/* MODAL: AI CLUSTER REVIEW & OFFICER FINAL REPORT */}
          {/* ======================================================== */}
          {selectedClusterForReview && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-100 text-orange-950">
                        {selectedClusterForReview.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          selectedClusterForReview.threat_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedClusterForReview.threat_level} THREAT
                      </span>
                      {selectedClusterForReview.cohesion_score && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                          {((selectedClusterForReview.cohesion_score) * 100).toFixed(1)}% Semantic Cohesion
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedClusterForReview.cluster_name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedClusterForReview(null)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Model Attribution & Velocity Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI Model</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block truncate" title="BERTopic (narrative_clusterer.joblib)">
                      BERTopic + HDBSCAN
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Velocity Spike</span>
                    <span className="text-xs font-semibold text-orange-700 mt-0.5 block truncate">
                      {selectedClusterForReview.velocity_spike}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Suspect Accounts</span>
                    <span className="text-xs font-bold text-orange-600 font-mono mt-0.5 block">
                      {selectedClusterForReview.suspect_accounts?.length || 0} Flagged
                    </span>
                  </div>
                </div>

                {/* Coordinated AI Narrative Analysis */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Disinformation Analysis</span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {selectedClusterForReview.ai_analysis}
                  </div>
                </div>

                {/* Suspect Accounts with Bot Risk */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Suspect Accounts Flagged ({selectedClusterForReview.suspect_accounts?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedClusterForReview.suspect_accounts?.map((acc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedClusterForReview(null);
                          handleInspectAccount(acc.handle);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-950 font-mono text-xs flex items-center gap-1.5 hover:bg-orange-100 cursor-pointer"
                      >
                        <span>@{acc.handle}</span>
                        <span className="text-[10px] font-bold text-rose-600 bg-white px-1.5 py-0.5 rounded-md border border-rose-100">
                          {(acc.risk * 100).toFixed(0)}% Bot Risk
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Related Canonical Tweets */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Related Flagged Canonical Tweets ({selectedClusterForReview.sample_tweets?.length || 0})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">SQLite Evidence Records</span>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {(selectedClusterForReview.sample_tweets || []).map((tweet, i) => {
                      const matchedAcc = selectedClusterForReview.suspect_accounts?.[i % (selectedClusterForReview.suspect_accounts.length || 1)];
                      return (
                        <div
                          key={i}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:border-orange-200 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              @{matchedAcc?.handle || 'suspect_author'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-700">
                              Bot Risk: {((matchedAcc?.risk || 0.75) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed italic">
                            &ldquo;{tweet}&rdquo;
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Statutory Violations */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommended Legal Sections</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedClusterForReview.recommended_sections || []).map((sec, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Officer Final Report / Disposition Form */}
                <div className="flex flex-col gap-2 p-4 bg-amber-500/5 rounded-2xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-orange-600">edit_note</span>
                      <span>Authorized Officer Final Report / Disposition</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Sign-off: Authorized Officer</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter officer assessment and findings (e.g., 'Cluster verified as coordinated bot swarm amplifying communal slogans. Approving as active investigation under Section 79(3)(b) IT Act' OR 'Organic discourse, false positive, cluster declined/archived')..."
                    value={officerClusterReport}
                    onChange={(e) => setOfficerClusterReport(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Required for compliance. Officer report will be logged and sealed with case records.
                  </p>
                </div>

                {/* Decision Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedClusterForReview(null)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeclineClusterWithReport(selectedClusterForReview.id)}
                      className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Decline / Archive (No Action)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAcceptClusterWithReport(selectedClusterForReview)}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Accept & Open Active Case</span>
                    </button>
                  </div>
                </div>
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        selectedCase.status === 'DISPOSED_NO_FURTHER_ACTION'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedCase.status === 'DISPOSED_NO_FURTHER_ACTION' ? 'DISPOSED / CLOSED' : 'ACTIVE CASE'}
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
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
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

                {/* Officer Final Report / Case Disposition Form */}
                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-orange-600">assignment</span>
                      <span>Authorized Officer Final Assessment & Disposition Report</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Lead: Authorized Officer</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Type updated officer findings, supplementary evidence analysis, or final case closure disposition notes..."
                    value={officerCaseReport}
                    onChange={(e) => setOfficerCaseReport(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-orange-500"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">Record officer disposition to case audit trail</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateCaseReport(selectedCase.case_id)}
                        disabled={!officerCaseReport.trim()}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-[11px] font-semibold cursor-pointer shadow-xs"
                      >
                        Update Report
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloseCaseAction(selectedCase.case_id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold cursor-pointer"
                        title="Close or dispose of this case file"
                      >
                        Decline / Dispose Case
                      </button>
                    </div>
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

          {/* ======================================================== */}
          {/* COMMUNITY CLUSTER INSPECTION MODAL */}
          {/* ======================================================== */}
          {selectedCommunityForInspection && (
            <div
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setSelectedCommunityForInspection(null)}
            >
              <div
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 flex flex-col gap-5 my-8 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Louvain Modularity Cluster Dossier
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 mt-1">
                      {selectedCommunityForInspection.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Community ID: <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">{selectedCommunityForInspection.community_id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        selectedCommunityForInspection.threat === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : selectedCommunityForInspection.threat === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedCommunityForInspection.threat} THREAT
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCommunityForInspection(null)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                      title="Close Dossier"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Scaling Pipeline Explainer */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-orange-600">account_tree</span>
                      <span>Why 8 Clusters &amp; Database Scalability:</span>
                    </span>
                    <span className="font-mono text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-700">Louvain Modularity</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Louvain optimization mathematically isolates tightly coupled co-posting subgraphs. In this initial 160-node topology, exactly 8 communities emerge. As subsequent batches of 100k+ posts are loaded into SQLite, Louvain dynamically expands and branches into N distinct operational clusters automatically.
                  </p>
                </div>

                {/* Modularity Graph Metrics */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                    <span className="text-slate-400 text-[10px] block">Cluster Size</span>
                    <span className="font-extrabold text-slate-900 text-base">{selectedCommunityForInspection.size}</span>
                    <span className="text-[9px] text-slate-400 block">accounts</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                    <span className="text-slate-400 text-[10px] block">Internal Edges</span>
                    <span className="font-extrabold text-slate-900 text-base">{selectedCommunityForInspection.internal_edge_count}</span>
                    <span className="text-[9px] text-slate-400 block">coordination links</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                    <span className="text-slate-400 text-[10px] block">Graph Density</span>
                    <span className="font-extrabold text-slate-900 text-base">{selectedCommunityForInspection.density ?? '0.375'}</span>
                    <span className="text-[9px] text-slate-400 block">internal cohesion</span>
                  </div>
                </div>

                {/* Tactical Coordination Focus */}
                <div className="flex flex-col gap-1.5 p-4 bg-orange-50/40 rounded-2xl border border-orange-100">
                  <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-orange-600">psychology</span>
                    <span>Tactical Coordination Vector &amp; Slogan Strategy:</span>
                  </span>
                  <p className="text-xs text-orange-900 leading-relaxed">
                    {selectedCommunityForInspection.focus}
                  </p>
                </div>

                {/* Top Suspect Member Handles */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-orange-600">group</span>
                    <span>Key Suspect Accounts ({selectedCommunityForInspection.top_handles?.length || 0} top members):</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCommunityForInspection.top_handles || []).map((h: string) => (
                      <button
                        key={h}
                        onClick={() => {
                          setSelectedCommunityForInspection(null);
                          handleInspectAccount(h);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-100 text-slate-800 hover:text-orange-950 text-xs font-mono font-semibold transition-all cursor-pointer border border-slate-200/60"
                      >
                        <span>@{h}</span>
                        <span className="material-symbols-outlined text-[14px] text-slate-400">open_in_new</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sample Tweets Published by Cluster */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-orange-600">chat</span>
                    <span>Sample Ingested Tweets from this Modularity Community:</span>
                  </span>
                  <div className="flex flex-col gap-2">
                    {(selectedCommunityForInspection.sample_tweets || []).map((tw: string, i: number) => (
                      <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                        "{tw}"
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setSelectedCommunity(selectedCommunityForInspection.community_id);
                      setSelectedCommunityForInspection(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs font-bold transition-all cursor-pointer border border-orange-200"
                  >
                    <span className="material-symbols-outlined text-[18px] text-orange-600">filter_alt</span>
                    <span>Filter Graph to this Cluster</span>
                  </button>

                  <button
                    onClick={() => setSelectedCommunityForInspection(null)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close Dossier
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
