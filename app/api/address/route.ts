import { NextRequest, NextResponse } from 'next/server';
import { fetchAddressSuggestions, StandardizedAddress } from '@/lib/addressService';

// ─── Mock Data (fallback when API keys are not configured) ───────────────────
const mockAddresses: StandardizedAddress[] = [
  {
    fullAddress: '101 Queen Street, Auckland CBD, Auckland 1010',
    street: '101 Queen Street',
    suburb: 'Auckland CBD',
    city: 'Auckland',
    postcode: '1010'
  },
  {
    fullAddress: '12 Customhouse Quay, Wellington Central, Wellington 6011',
    street: '12 Customhouse Quay',
    suburb: 'Wellington Central',
    city: 'Wellington',
    postcode: '6011'
  },
  {
    fullAddress: '45 Cashel Street, Christchurch Central, Christchurch 8011',
    street: '45 Cashel Street',
    suburb: 'Christchurch Central',
    city: 'Christchurch',
    postcode: '8011'
  },
  {
    fullAddress: '234 George Street, Dunedin Central, Dunedin 9016',
    street: '234 George Street',
    suburb: 'Dunedin Central',
    city: 'Dunedin',
    postcode: '9016'
  },
  {
    fullAddress: '56 Trafalgar Street, Nelson Central, Nelson 7010',
    street: '56 Trafalgar Street',
    suburb: 'Nelson Central',
    city: 'Nelson',
    postcode: '7010'
  },
  {
    fullAddress: '78 Victoria Street, Hamilton Central, Hamilton 3204',
    street: '78 Victoria Street',
    suburb: 'Hamilton Central',
    city: 'Hamilton',
    postcode: '3204'
  },
  {
    fullAddress: '90 Anzac Avenue, Tauranga Central, Tauranga 3110',
    street: '90 Anzac Avenue',
    suburb: 'Tauranga Central',
    city: 'Tauranga',
    postcode: '3110'
  },
  {
    fullAddress: '132 Princess Street, Dunedin North, Dunedin 9010',
    street: '132 Princess Street',
    suburb: 'Dunedin North',
    city: 'Dunedin',
    postcode: '9010'
  },
  {
    fullAddress: '15 Lambton Quay, Thorndon, Wellington 6144',
    street: '15 Lambton Quay',
    suburb: 'Thorndon',
    city: 'Wellington',
    postcode: '6144'
  },
  {
    fullAddress: '333 Karangahape Road, Newton, Auckland 1010',
    street: '333 Karangahape Road',
    suburb: 'Newton',
    city: 'Auckland',
    postcode: '1010'
  }
];

/**
 * Check if Google Maps API key is configured.
 */
function isApiConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  return !!(
    apiKey &&
    apiKey !== 'PASTE_YOUR_GOOGLE_MAPS_KEY_HERE'
  );
}

/**
 * Fetch addresses from mock data (fallback).
 */
function fetchFromMockData(query: string): StandardizedAddress[] {
  return mockAddresses.filter(addr =>
    addr.fullAddress.toLowerCase().includes(query.toLowerCase()) ||
    addr.street.toLowerCase().includes(query.toLowerCase()) ||
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
    let addresses: StandardizedAddress[];

    if (isApiConfigured()) {
      // Use Google Places Autocomplete API through the service adapter
      console.log('Using Google Places API for address lookup');
      addresses = await fetchAddressSuggestions(query);
    } else {
      // Fallback to mock data
      console.log('Addressfinder API not configured — using mock data');
      addresses = fetchFromMockData(query);
    }

    return NextResponse.json({
      addresses,
      source: isApiConfigured() ? 'google' : 'mock',
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);

    // If real API fails, fall back to mock data
    if (isApiConfigured()) {
      console.log('Addressfinder API failed — falling back to mock data');
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
