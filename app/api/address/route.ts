import { NextRequest, NextResponse } from 'next/server';

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
    // Filter mock addresses based on query
    const filteredAddresses = mockAddresses.filter(addr => 
      addr.address_line_1.toLowerCase().includes(query.toLowerCase()) ||
      addr.suburb.toLowerCase().includes(query.toLowerCase()) ||
      addr.city.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({
      addresses: filteredAddresses
    });
  } catch (error) {
    console.error('Error fetching mock addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address suggestions' },
      { status: 500 }
    );
  }
}
