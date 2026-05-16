import { NextRequest, NextResponse } from 'next/server';

// ─── Mock Data (fallback when API keys are not configured) ───────────────────
const mockAddresses = [
  {
    address_line_1: '101 Queen Street',
    suburb: 'Auckland CBD',
    city: 'Auckland',
    postcode: '1010'
  },
  {
    address_line_1: '12 Customhouse Quay',
    suburb: 'Wellington Central',
    city: 'Wellington',
    postcode: '6011'
  },
  {
    address_line_1: '45 Cashel Street',
    suburb: 'Christchurch Central',
    city: 'Christchurch',
    postcode: '8011'
  },
  {
    address_line_1: '234 George Street',
    suburb: 'Dunedin Central',
    city: 'Dunedin',
    postcode: '9016'
  },
  {
    address_line_1: '56 Trafalgar Street',
    suburb: 'Nelson Central',
    city: 'Nelson',
    postcode: '7010'
  },
  {
    address_line_1: '78 Victoria Street',
    suburb: 'Hamilton Central',
    city: 'Hamilton',
    postcode: '3204'
  },
  {
    address_line_1: '90 Anzac Avenue',
    suburb: 'Tauranga Central',
    city: 'Tauranga',
    postcode: '3110'
  },
  {
    address_line_1: '132 Princess Street',
    suburb: 'Dunedin North',
    city: 'Dunedin',
    postcode: '9010'
  },
  {
    address_line_1: '15 Lambton Quay',
    suburb: 'Thorndon',
    city: 'Wellington',
    postcode: '6144'
  },
  {
    address_line_1: '333 Karangahape Road',
    suburb: 'Newton',
    city: 'Auckland',
    postcode: '1010'
  }
];

// ─── NZ Post API Configuration ──────────────────────────────────────────────
const NZ_POST_API_URL = 'https://api.nzpost.co.nz/addresschecker/v2/autocomplete';
const CLIENT_ID = process.env.NZ_POST_CLIENT_ID;
const CLIENT_SECRET = process.env.NZ_POST_CLIENT_SECRET;

/**
 * Check if real NZ Post API credentials are configured.
 */
function isApiConfigured(): boolean {
  return !!(
    CLIENT_ID &&
    CLIENT_SECRET &&
    CLIENT_ID !== 'PASTE_YOUR_NZ_POST_CLIENT_ID_HERE' &&
    CLIENT_SECRET !== 'PASTE_YOUR_NZ_POST_SECRET_HERE'
  );
}

/**
 * Fetch addresses from the real NZ Post Address Checker API.
 */
async function fetchFromNzPostApi(query: string) {
  const response = await fetch(
    `${NZ_POST_API_URL}?query=${encodeURIComponent(query)}&max=10`,
    {
      method: 'GET',
      headers: {
        'client_id': CLIENT_ID!,
        'Authorization': `Bearer ${CLIENT_SECRET}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`NZ Post API error (${response.status}):`, errorText);
    throw new Error(`NZ Post API returned ${response.status}`);
  }

  const data = await response.json();

  // Map NZ Post API response to our internal format
  // Adjust field mapping based on actual NZ Post API response structure
  const addresses = (data.addresses || []).map((addr: any) => ({
    address_line_1: addr.full_address || addr.address_line_1 || addr.address1 || '',
    suburb: addr.suburb || addr.suburb_name || '',
    city: addr.city || addr.city_town || addr.town_city || '',
    postcode: addr.postcode || addr.post_code || '',
  }));

  return addresses;
}

/**
 * Fetch addresses from mock data (fallback).
 */
function fetchFromMockData(query: string) {
  return mockAddresses.filter(addr =>
    addr.address_line_1.toLowerCase().includes(query.toLowerCase()) ||
    addr.suburb.toLowerCase().includes(query.toLowerCase()) ||
    addr.city.toLowerCase().includes(query.toLowerCase())
  );
}

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
    let addresses;

    if (isApiConfigured()) {
      // Use real NZ Post API
      console.log('Using NZ Post API for address lookup');
      addresses = await fetchFromNzPostApi(query);
    } else {
      // Fallback to mock data
      console.log('NZ Post API not configured — using mock data');
      addresses = fetchFromMockData(query);
    }

    return NextResponse.json({
      addresses,
      source: isApiConfigured() ? 'nzpost' : 'mock',
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);

    // If real API fails, fall back to mock data
    if (isApiConfigured()) {
      console.log('NZ Post API failed — falling back to mock data');
      const fallbackAddresses = fetchFromMockData(query);
      return NextResponse.json({
        addresses: fallbackAddresses,
        source: 'mock_fallback',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch address suggestions' },
      { status: 500 }
    );
  }
}
