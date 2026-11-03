import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { searchFoods, searchOpenFoodFacts } from '@/app/diet/actions';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!await getSession()) return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers });
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || '').trim().slice(0, 120);
  if (query.length < 2) return NextResponse.json([], { headers });
  try {
    const results = params.get('source') === 'off' ? await searchOpenFoodFacts(query) : await searchFoods(query);
    return NextResponse.json(results, { headers });
  } catch {
    return NextResponse.json({ error: 'Recherche indisponible' }, { status: 503, headers });
  }
}
