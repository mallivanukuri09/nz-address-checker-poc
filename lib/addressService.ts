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

export async function fetchAddressSuggestions(query: string): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const apiKey = process.env.ADDRESSABLE_API_KEY;
  const countryCode = "NZ";

  if (!apiKey) {
    console.warn("AWS Environment variable 'ADDRESSABLE_API_KEY' missing. Using fallback mock items.");
    return BACKUP_MOCK_ADDRESSES.filter(addr => 
      addr.fullAddress.toLowerCase().includes(query.toLowerCase())
    );
  }

  const cleanQuery = query.trim();
  const searchString = /^\d+$/.test(cleanQuery) ? `${cleanQuery} ` : cleanQuery;
  const url = `https://api.addressable.dev/v2/autocomplete?api_key=${apiKey}&country_code=${countryCode}&q=${encodeURIComponent(searchString)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error(`API Error Status: ${response.status}. Initiating safety fallback rows.`);
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

    return suggestions.map((item: any) => {
      const fullAddr = item.formatted || '';
      const street = item.street_number && item.street ? `${item.street_number} ${item.street}` : (item.street || '');
      return {
        fullAddress: fullAddr,
        street: street,
        suburb: item.locality || '',
        city: item.region || 'New Zealand',
        postcode: item.postcode || ''
      };
    });

  } catch (error) {
    console.error('Network failure detected inside fetchAddressSuggestions. Activating offline fallback:', error);
    
    const filteredMocks = BACKUP_MOCK_ADDRESSES.filter(addr => 
      addr.fullAddress.toLowerCase().includes(query.toLowerCase())
    );

    return filteredMocks;
  }
}
