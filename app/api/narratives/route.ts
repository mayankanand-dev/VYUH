import { NextResponse } from 'next/server';
import narrativeData from '@/data/integrated/narrative_intelligence.json';

export async function GET() {
  return NextResponse.json(narrativeData);
}
