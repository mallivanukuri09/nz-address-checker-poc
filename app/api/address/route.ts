import { NextRequest, NextResponse } from 'next/server';
import { fetchAddressSuggestions, StandardizedAddress } from '@/lib/addressService';

// ─── API Route Handler ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Force Google Places API call - bypass all mock data fallbacks
    console.log('Using Google Places API for address lookup');
    const addresses = await fetchAddressSuggestions(query);

    return NextResponse.json({
      addresses,
      source: 'google',
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);

    return NextResponse.json(
      { error: 'Failed to fetch address suggestions' },
      { status: 500 }
    );
  }
}
