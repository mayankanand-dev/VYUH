import { NextRequest, NextResponse } from 'next/server';
import canonicalPosts from '@/data/integrated/canonical_posts.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const dataset = searchParams.get('dataset') || 'ALL';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let filtered = canonicalPosts as any[];

  if (dataset === 'FARMERS') {
    filtered = filtered.filter((p) => p.dataset_source === 'farmers_protest');
  } else if (dataset === 'RUSSIAN_IRA') {
    filtered = filtered.filter((p) => p.dataset_source === 'russian_ira');
  }

  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.text_content?.toLowerCase().includes(q) ||
        p.author_handle?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q) ||
        p.hashtags?.some((h: string) => h.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    total,
    page,
    limit,
    posts: paginated
  });
}
