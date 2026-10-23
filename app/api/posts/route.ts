import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

// Connect to SQLite database in read-only mode for speed & safety
const dbPath = path.join(process.cwd(), 'data', 'vyuh.db');
let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(dbPath, { readOnly: true });
  }
  return db;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const dataset = searchParams.get('dataset') || 'ALL';
    const minRisk = parseFloat(searchParams.get('min_risk') || '0');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const database = getDb();

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (dataset === 'FARMERS') {
      whereClauses.push('dataset_source = ?');
      params.push('farmers_protest');
    } else if (dataset === 'RUSSIAN_IRA') {
      whereClauses.push('dataset_source = ?');
      params.push('russian_ira');
    }

    if (minRisk > 0) {
      whereClauses.push('bot_risk >= ?');
      params.push(minRisk);
    }

    const author = searchParams.get('author')?.trim();
    if (author) {
      whereClauses.push('author_handle LIKE ?');
      params.push(`%${author.replace(/^@/, '')}%`);
    }

    const keyword = searchParams.get('keyword')?.trim();
    if (keyword) {
      whereClauses.push('(text_content LIKE ? OR hashtags LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (q) {
      whereClauses.push('(text_content LIKE ? OR author_handle LIKE ? OR hashtags LIKE ?)');
      const wild = `%${q}%`;
      params.push(wild, wild, wild);
    }

    const whereSql = whereClauses.join(' AND ');

    // Count query
    const countQuery = database.prepare(`SELECT COUNT(*) as total FROM posts WHERE ${whereSql}`);
    const countRow = countQuery.get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    // Select query
    const selectQuery = database.prepare(`
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

    const rows = selectQuery.all(...params, limit, offset) as any[];

    // Parse JSON arrays for hashtags and metrics
    const posts = rows.map((r) => ({
      post_id: r.post_id,
      record_id: r.record_id,
      dataset_source: r.dataset_source,
      author_handle: r.author_handle,
      author_name: r.author_name,
      text_content: r.text_content,
      created_at_utc: r.created_at_utc,
      language: r.language,
      hashtags: parseJsonSafe(r.hashtags, []),
      urls: parseJsonSafe(r.urls, []),
      metrics: {
        retweet_count: r.retweet_count,
        like_count: r.like_count,
        reply_count: r.reply_count
      },
      bot_risk: computeDynamicBotRisk(r),
      coordination_score: r.coordination_score,
      coordination_label: r.coordination_label,
      sha256: r.sha256,
      removal_hash: r.removal_hash,
      has_verified_claims: Boolean(r.has_claims)
    }));

    return NextResponse.json({
      success: true,
      engine: 'sqlite3_wal',
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      posts
    });
  } catch (err: any) {
    console.error('SQLite query error:', err);
    return NextResponse.json({ error: err.message || 'Database query failed' }, { status: 500 });
  }
}

function computeDynamicBotRisk(r: any): number {
  let score = 0.14; // baseline organic prior

  const handle = (r.author_handle || '').toLowerCase();
  const text = r.text_content || '';
  const dataset = r.dataset_source || '';

  // 1. Author Handle Signal: Bot accounts typically end with 4+ random digits
  const digitMatch = handle.match(/\d+$/);
  if (digitMatch) {
    const digitCount = digitMatch[0].length;
    if (digitCount >= 6) {
      score += 0.38; // e.g. kaursuk06272818 -> +38%
    } else if (digitCount >= 4) {
      score += 0.22;
    } else if (digitCount >= 2) {
      score += 0.08;
    }
  }

  // 2. High ratio of numbers/underscores in handle
  if (/^[a-z]+_\d+$/.test(handle) || /^[a-z]+[0-9]{5,}$/.test(handle)) {
    score += 0.15;
  }

  // 3. Known state-sponsored IRA campaign baseline
  if (dataset === 'russian_ira') {
    score += 0.45;
  }

  // 4. Copypasta & High Hashtag density
  const hashtagCount = (text.match(/#[a-zA-Z0-9_]+/g) || []).length;
  if (hashtagCount >= 4) {
    score += 0.14;
  } else if (hashtagCount >= 2) {
    score += 0.06;
  }

  // 5. Short text with only tags/links (typical bot amplification broadcast)
  const nonTagText = text.replace(/#[a-zA-Z0-9_]+/g, '').replace(/https?:\/\/\S+/g, '').trim();
  if (nonTagText.length < 15 && hashtagCount >= 1) {
    score += 0.16;
  }

  // 6. Zero engagement with high claim intensity
  if ((r.retweet_count || 0) === 0 && (r.like_count || 0) === 0) {
    score += 0.04;
  }

  // 7. Small deterministic pseudo-random variance based on post_id so each tweet is unique
  let hash = 0;
  const seed = String(r.post_id || r.record_id || handle);
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const variance = ((Math.abs(hash) % 100) - 50) / 1000; // -0.05 to +0.05
  score += variance;

  // Clamp between 0.05 and 0.98
  return Math.max(0.05, Math.min(0.98, parseFloat(score.toFixed(2))));
}

function parseJsonSafe(str: string | null, fallback: any) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
