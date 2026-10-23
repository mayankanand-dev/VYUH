export interface SimulatedFinding {
  badgeLabel: 'Review recommended' | 'Simulated finding' | 'High Coordination Risk' | 'Coordinated Temporal Burst';
  severity: 'low' | 'medium' | 'high';
  ruleTriggered: string;
  confidenceScore: number;
  reason: string;
  detectedSignals: string[];
  disclaimer: string;
}

export interface PostReply {
  id: string;
  authorName: string;
  authorHandle: string;
  authorInitials: string;
  authorAvatarBg: string;
  timestamp: string;
  content: string;
  likes: number;
  isLiked?: boolean;
}

export interface PostMedia {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
}

export interface Post {
  id: string;
  authorName: string;
  authorHandle: string;
  authorInitials: string;
  authorAvatarBg: string;
  isVerified?: boolean;
  isSimulationBot?: boolean;
  isFollowingAuthor?: boolean;
  timestamp: string;
  content: string;
  hashtags?: string[];
  media?: PostMedia;
  metrics: {
    replies: number;
    reposts: number;
    likes: number;
    views?: string;
    bookmarks?: number;
  };
  userInteractions: {
    isLiked: boolean;
    isReposted: boolean;
    isBookmarked?: boolean;
  };
  detectionFinding?: SimulatedFinding;
  repliesList: PostReply[];
}

export interface TrendingNarrative {
  id: string;
  category: string;
  topic: string;
  postCount: string;
  simulatedRiskLevel: 'Elevated' | 'Monitored' | 'Standard';
  tag: string;
  description: string;
}

export interface DetectionActivityEvent {
  id: string;
  clusterId: string;
  clusterName: string;
  patternType: string;
  matchedCount: number;
  timestamp: string;
  riskSeverity: 'low' | 'medium' | 'high';
  notes: string;
  associatedPostIds: string[];
  coordinationScore: number;
}

export interface SuggestedAccount {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarBg: string;
  isVerified?: boolean;
  bio: string;
  isFollowing: boolean;
}

export interface XTrend {
  id: string;
  category: string;
  topic: string;
  postsCount: string;
  context?: string;
}
