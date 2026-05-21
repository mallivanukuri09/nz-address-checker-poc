export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
  placeId?: string;
  mainText?: string;
  secondaryText?: string;
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

    // Safely ensure data is an array before mapping
    if (!Array.isArray(data)) {
      console.error("Backend proxy did not return an array. Received:", data);
      // Return our backup mock data so the application still works for testing
      return BACKUP_MOCK_ADDRESSES;
    }

    return data.map((item: any) => ({
      fullAddress: item.fullAddress || item.description || '',
      street: '',
      suburb: '',
      city: '',
      postcode: item.postcode || '',
      placeId: item.id || item.place_id || '',
      mainText: item.fullAddress?.split(',')[0] || '',
      secondaryText: item.fullAddress?.split(',').slice(1).join(',').trim() || '',
    }));
  } catch (error) {
    console.error('Autocomplete API Network Error:', error);
    return BACKUP_MOCK_ADDRESSES.filter(addr =>
      addr.fullAddress.toLowerCase().includes(query.toLowerCase())
    );
  }
}

/** Helper logic to find specific fields inside Google's address_components array */
const getComponent = (components: any[], type: string): string => {
  const item = components.find((c: any) => c.types.includes(type));
  return item ? item.long_name : '';
};

/** Fetch Place Details via its place_id to get precise address_components */
export async function fetchPlaceDetails(
  placeId: string
): Promise<Partial<StandardizedAddress> | null> {
  if (!placeId) return null;

  try {
    const response = await fetch(`/api/place-details?place_id=${encodeURIComponent(placeId)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.address_components) return null;

    const components = data.address_components;

    const streetNumber = getComponent(components, 'street_number');
    const route = getComponent(components, 'route');

    return {
      fullAddress: data.formatted_address || '',
      street: `${streetNumber} ${route}`.trim(),
      suburb: getComponent(components, 'suburb')
        || getComponent(components, 'sublocality')
        || getComponent(components, 'neighborhood'),
      city: getComponent(components, 'locality')
        || getComponent(components, 'administrative_area_level_1'),
      postcode: getComponent(components, 'postal_code'),
    };
  } catch (error) {
    console.error('Place Details Error:', error);
    return null;
  }
}
