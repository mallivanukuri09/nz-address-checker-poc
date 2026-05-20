// Standardized address interface for the application
export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
  placeId?: string;
}

// Nominatim API response interface
interface NominatimAddress {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    postcode?: string;
    county?: string;
    country?: string;
  };
}

/**
 * Address Service Adapter
 * This adapter provides a clean interface for address lookup services.
 * Currently implements OpenStreetMap Nominatim API.
 */

/**
 * Fetch address suggestions from OpenStreetMap Nominatim API
 * @param query - The search query for address lookup
 * @returns Promise<StandardizedAddress[]> - Array of standardized address objects
 */
export async function fetchAddressSuggestions(
  query: string
): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=nz&featuretype=settlement,street&format=json&addressdetails=1&limit=5`
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: NominatimAddress[] = await response.json();

    // Map Nominatim response to standardized format
    if (Array.isArray(data)) {
      return data.map((item: NominatimAddress) => ({
        fullAddress: item.display_name,
        street: item.address.road || item.address.house_number ? `${item.address.house_number || ''} ${item.address.road || ''}`.trim() : '',
        suburb: item.address.suburb || '',
        city: item.address.city || item.address.town || '',
        postcode: item.address.postcode || '',
        placeId: item.place_id.toString(),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    throw error;
  }
}

/**
 * Alternative implementation for NZ Post API (commented out for future use)
 * To switch to NZ Post, uncomment this function and update fetchAddressSuggestions to use it
 */
/*
export async function fetchAddressSuggestionsNZPost(
  query: string,
  apiKey: string
): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.nzpost.co.nz/addresschecker/v2/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NZ Post API error: ${response.status}`);
    }

    const data = await response.json();

    // Map NZ Post response to standardized format
    if (data.addresses && Array.isArray(data.addresses)) {
      return data.addresses.map((item: any) => ({
        fullAddress: `${item.address_line_1}, ${item.suburb}, ${item.city} ${item.postcode}`,
        street: item.address_line_1 || '',
        suburb: item.suburb || '',
        city: item.city || '',
        postcode: item.postcode || '',
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    throw error;
  }
}
*/
