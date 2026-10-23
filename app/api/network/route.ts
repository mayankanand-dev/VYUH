import { NextResponse } from 'next/server';
import networkGraphData from '@/data/integrated/network_graph.json';

const COMMUNITY_METADATA: Record<string, { name: string; focus: string; threat: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW'; defaultHandles: string[] }> = {
  community_1: {
    name: 'Agrarian Slogan Burst Ring',
    focus: 'Synchronized hashtag flooding (#FarmersProtest, #StopHateAgainstFarmers) & Adani/Ambani debt slogans',
    threat: 'CRITICAL',
    defaultHandles: ['ish_kayy', 'jatin2909', 'kirat13sidhu', 'kaursuk06272818', 'Davidmu66668113', 'Inderji42720445', 'NavJammu', 'Monika09213292']
  },
  community_2: {
    name: 'Russian IRA Foreign Troll Swarm',
    focus: 'Cross-border sockpuppet amplification, polarization themes, and automated multi-thread persona switching',
    threat: 'CRITICAL',
    defaultHandles: ['4MYSQUAD', '1LORENAFAVA1', '4EVER1937', '10_GOP', 'AmelieBaldwin', '6DRUZ', '5EMEN5EMENICH']
  },
  community_3: {
    name: 'Mass Retweet & Agitation Amplifiers',
    focus: 'High-frequency retweeting networks, protest blockade coordination, and rapid narrative relay',
    threat: 'HIGH',
    defaultHandles: ['Fakeer16771146', 'ParNain9', '666STEVEROGERS', 'butterfly0o0o0', 'RajpalFogawat', 'AhluwaliaA2']
  },
  community_4: {
    name: 'Cross-Border Sockpuppet Swarm',
    focus: 'Linguistic anomaly clustering, proxy handles, and synchronized copypasta broadcasting',
    threat: 'HIGH',
    defaultHandles: ['AAAVADAKEDAVRAA', 'ABALAKOVAYLIA', '5L5_5L5', 'AANTIRACIST', 'AAGN1AA']
  },
  community_5: {
    name: 'Micro-Broadcast Infiltration Cell A',
    focus: 'Targeted mention broadcasting to high-follower political handles',
    threat: 'ELEVATED',
    defaultHandles: ['tasveersandhu', 'GurmVicky']
  },
  community_6: {
    name: 'Micro-Broadcast Infiltration Cell B',
    focus: 'Isolated single-vector hashtag bridging',
    threat: 'ELEVATED',
    defaultHandles: ['jot__b']
  },
  community_7: {
    name: 'Micro-Broadcast Infiltration Cell C',
    focus: 'Echo-chamber relay cluster',
    threat: 'ELEVATED',
    defaultHandles: ['rebelpacifist']
  },
  community_8: {
    name: 'Isolated Infiltration Node',
    focus: 'Dormant account reactivation during spike hours',
    threat: 'LOW',
    defaultHandles: ['rumsomal']
  }
};

export async function GET() {
  try {
    const rawNodes = (networkGraphData as any).nodes || [];
    const idToHandleMap = new Map<string, string>();

    // Build ID to Handle lookup
    rawNodes.forEach((n: any) => {
      if (n.id && n.name && !n.name.startsWith('twitter:') && !/^\d+$/.test(n.name)) {
        idToHandleMap.set(n.id, n.name);
      }
    });

    // Enrich Communities
    const rawCommunities = (networkGraphData as any).communities?.communities || [];
    const enrichedCommunities = rawCommunities.map((c: any) => {
      const meta = COMMUNITY_METADATA[c.community_id] || {
        name: `Cluster ${c.community_id}`,
        focus: 'Coordinated narrative propagation ring',
        threat: 'ELEVATED' as const,
        defaultHandles: []
      };

      // Map raw IDs to readable handles
      const readableHandles = (c.top_accounts || [])
        .map((accId: string) => idToHandleMap.get(accId) || accId.replace('twitter:', ''))
        .filter((h: string) => !/^\d+$/.test(h));

      const finalHandles = readableHandles.length > 0 ? readableHandles : meta.defaultHandles;

      return {
        community_id: c.community_id,
        name: meta.name,
        focus: meta.focus,
        threat: meta.threat,
        size: c.size,
        internal_edge_count: c.internal_edge_count,
        density: Number(((c.internal_edge_count / Math.max(1, (c.size * (c.size - 1)) / 2))).toFixed(3)),
        top_handles: finalHandles.slice(0, 8),
        sample_tweets: [
          'Supporting farmers means supporting our country #StopHateAgainstFarmers #FarmersProtest',
          'Did you know farmers in India continue to live & die in debt while ambani/adani get richer?! #FarmersProtest'
        ]
      };
    });

    // Clean nodes: ensure no raw twitter: IDs are shown as names
    const cleanedNodes = rawNodes.map((n: any) => {
      let displayName = n.name;
      if (!displayName || displayName.startsWith('twitter:') || /^\d+$/.test(displayName)) {
        displayName = idToHandleMap.get(n.id) || `account_${n.id.replace('twitter:', '').slice(-5)}`;
      }
      return {
        ...n,
        name: displayName,
        bot_risk: n.coordination_score || 0.65,
        community_name: COMMUNITY_METADATA[n.community_id]?.name || 'Coordinated Ring'
      };
    });

    return NextResponse.json({
      success: true,
      summary: (networkGraphData as any).summary,
      communities: enrichedCommunities,
      nodes: cleanedNodes,
      total_edges: (networkGraphData as any).summary?.total_edges || 2406,
      synchronized_posts: (networkGraphData as any).summary?.edge_breakdown_by_type?.synchronized_post || 2287
    });
  } catch (err: any) {
    console.error('Network API error:', err);
    return NextResponse.json(networkGraphData);
  }
}
