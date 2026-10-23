import { NextResponse } from 'next/server';
import networkGraphData from '@/data/integrated/network_graph.json';

export async function GET() {
  return NextResponse.json(networkGraphData);
}
