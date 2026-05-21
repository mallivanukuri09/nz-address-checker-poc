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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API Key missing. Using fallback mock items.");
    return BACKUP_MOCK_ADDRESSES.filter(addr => 
      addr.fullAddress.toLowerCase().includes(query.toLowerCase())
    );
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query.trim())}&key=${apiKey}&components=country:nz`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Google API error status: ${response.status}`);
      return BACKUP_MOCK_ADDRESSES.filter(addr => 
        addr.fullAddress.toLowerCase().includes(query.toLowerCase())
      );
    }

    const data = await response.json();
    if (!data.predictions || !Array.isArray(data.predictions)) {
      return BACKUP_MOCK_ADDRESSES.filter(addr => 
        addr.fullAddress.toLowerCase().includes(query.toLowerCase())
      );
    }

    return data.predictions.map((prediction: any) => ({
      fullAddress: prediction.description,
      street: prediction.structured_formatting?.main_text || '',
      suburb: '', 
      city: 'New Zealand',
      postcode: ''
    }));
  } catch (error) {
    console.error("Google Maps API Network Error, falling back to mock data:", error);
    return BACKUP_MOCK_ADDRESSES.filter(addr => 
      addr.fullAddress.toLowerCase().includes(query.toLowerCase())
    );
  }
}
