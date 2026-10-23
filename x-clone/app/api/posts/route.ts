import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

function findDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data/vyuh.db'),
    path.resolve(process.cwd(), '../data/vyuh.db'),
    path.resolve(process.cwd(), '../../data/vyuh.db'),
    'c:\\Users\\mayank\\Desktop\\bihar police hackathon\\alpha\\VYUH\\data\\vyuh.db'
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    const resolvedPath = findDbPath();
    db = new DatabaseSync(resolvedPath, { readOnly: true });
  }
  return db;
}

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-purple-600', 'bg-emerald-600',
  'bg-amber-600', 'bg-rose-600', 'bg-indigo-600', 'bg-cyan-600'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const source = searchParams.get('source') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const offset = (page - 1) * limit;

    const database = getDb();

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (source === 'farmers') {
      whereClauses.push('dataset_source = ?');
      params.push('farmers_protest');
    } else if (source === 'ira') {
      whereClauses.push('dataset_source = ?');
      params.push('russian_ira');
    }

    if (q) {
      whereClauses.push('(text_content LIKE ? OR author_handle LIKE ? OR hashtags LIKE ?)');
      const wild = `%${q}%`;
      params.push(wild, wild, wild);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const countRow = database.prepare(`SELECT COUNT(*) as total FROM posts WHERE ${whereSql}`).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    // Fetch posts from SQLite
    const query = database.prepare(`
      SELECT 
        record_id, post_id, dataset_source, author_handle, author_name,
        text_content, created_at_utc, language, hashtags, urls,
        retweet_count, like_count, reply_count, bot_risk,
        coordination_score, coordination_label, sha256, removal_hash, has_claims
      FROM posts
      WHERE ${whereSql}
      ORDER BY created_at_utc DESC
      LIMIT ? OFFSET ?
    `);

    const rows = query.all(...params, limit, offset) as any[];

    // Map SQLite rows to X Timeline Post format
    const posts = rows.map((r, index) => {
      const handle = r.author_handle || 'anonymous';
      const name = r.author_name || handle;
      const initials = (name.replace(/[^a-zA-Z]/g, '').substring(0, 2) || handle.substring(0, 2)).toUpperCase();
      const color = AVATAR_COLORS[(handle.charCodeAt(0) || 0) % AVATAR_COLORS.length];
      const risk = r.bot_risk || 0.12;

      let finding: any = undefined;
      if (risk >= 0.5) {
        finding = {
          badgeLabel: risk >= 0.65 ? 'High Coordination Risk' : 'Coordinated Temporal Burst',
          severity: risk >= 0.65 ? 'high' : 'medium',
          ruleTriggered: 'Multi-Signal Temporal Coordination Heuristic (Dev 3)',
          confidenceScore: Math.round(risk * 100),
          reason: `Account flagged with coordination score ${(risk * 100).toFixed(0)}% across synchronized campaign temporal window.`,
          detectedSignals: ['Temporal Burst Cadence', 'Identical Slogan Repetition', 'Synchronized Timestamp'],
          disclaimer: 'Unsupervised forensic heuristic under Section 63 BSA standards. Does not constitute autonomous bot classification.'
        };
      }

      const tags = parseJson(r.hashtags, []);

      return {
        id: r.post_id || r.record_id,
        authorName: name,
        authorHandle: `@${handle.replace(/^@/, '')}`,
        authorInitials: initials || 'XX',
        authorAvatarBg: color,
        isVerified: risk < 0.3 && (r.like_count > 50 || r.retweet_count > 20),
        isSimulationBot: risk >= 0.5,
        timestamp: formatTimestamp(r.created_at_utc),
        content: r.text_content || '',
        hashtags: tags,
        metrics: {
          replies: r.reply_count || 0,
          reposts: r.retweet_count || 0,
          likes: r.like_count || 0,
          views: formatViews((r.retweet_count + r.like_count) * 12 + 104),
          bookmarks: Math.floor((r.like_count || 0) / 4)
        },
        userInteractions: {
          isLiked: false,
          isReposted: false,
          isBookmarked: false
        },
        detectionFinding: finding,
        repliesList: [],
        sourceDataset: r.dataset_source === 'farmers_protest' ? 'farmers_protest_tweets' : 'russian_ira_tweets',
        sha256Hash: r.sha256,
        removalHash: r.removal_hash
      };
    });

    return NextResponse.json({
      success: true,
      engine: 'sqlite3_wal',
      total,
      page,
      limit,
      posts
    });
  } catch (err: any) {
    console.error('x-clone SQLite query error:', err);
    return NextResponse.json({ error: err.message || 'Database query failed' }, { status: 500 });
  }
}

function parseJson(str: string | null, fallback: any) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function formatViews(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatTimestamp(isoStr: string | null) {
  if (!isoStr) return '1h';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `${Math.max(1, diffHours)}h`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '1h';
  }
}
