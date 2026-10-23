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
      bot_risk: r.bot_risk,
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

function parseJsonSafe(str: string | null, fallback: any) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
