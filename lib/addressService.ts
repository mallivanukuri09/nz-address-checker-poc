'use client';

export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
}

const BACKUP_MOCK_ADDRESSES: StandardizedAddress[] = [
  {
    fullAddress: "100 Queen Street, Auckland Central, Auckland 1010",
    street: "100 Queen Street",
    suburb: "Auckland Central",
    city: "Auckland",
    postcode: "1010"
  },
  {
    fullAddress: "56 Willis Street, Wellington Central, Wellington 6011",
    street: "56 Willis Street",
    suburb: "Wellington Central",
    city: "Wellington",
    postcode: "6011"
  },
  {
    fullAddress: "12 Riccarton Road, Riccarton, Christchurch 8011",
    street: "12 Riccarton Road",
    suburb: "Riccarton",
    city: "Christchurch",
    postcode: "8011"
  }
];

export async function fetchAddressSuggestions(
  query: string
): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const url = `/api/autocomplete?q=${encodeURIComponent(query.trim())}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Autocomplete API responded with status: ${response.status}`);
      return BACKUP_MOCK_ADDRESSES.filter(addr =>
        addr.fullAddress.toLowerCase().includes(query.toLowerCase())
      );
    }

    const data = await response.json();
    const suggestions = data.suggestions || data.addresses || data.predictions || data;

    if (!Array.isArray(suggestions)) {
      return BACKUP_MOCK_ADDRESSES.filter(addr =>
        addr.fullAddress.toLowerCase().includes(query.toLowerCase())
      );
    }

    return suggestions.map((item: any) => ({
      fullAddress: item.formatted || '',
      street: `${item.street_number || ''} ${item.street || ''}`.trim(),
      suburb: item.locality || '',
      city: item.city || item.region || 'New Zealand',
      postcode: item.postcode || '',
    }));
  } catch (error) {
    console.error('Autocomplete API Network Error:', error);
    return BACKUP_MOCK_ADDRESSES.filter(addr =>
      addr.fullAddress.toLowerCase().includes(query.toLowerCase())
    );
  }
}
