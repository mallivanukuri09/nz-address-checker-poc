// Standardized address interface for the application
export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
}

// Addressfinder API response interface
interface AddressfinderResponse {
  matched: string;
  a: string; // address line 1
  b: string; // suburb
  c: string; // city
  d: string; // postcode
}

/**
 * Address Service Adapter
 * This adapter provides a clean interface for address lookup services.
 * Currently implements Addressfinder API, but can be easily swapped to NZ Post or other providers.
 */

/**
 * Fetch address suggestions from Addressfinder API
 * @param query - The search query for address lookup
 * @param apiKey - The Addressfinder API key (optional, will use env var if not provided)
 * @returns Promise<StandardizedAddress[]> - Array of standardized address objects
 */
export async function fetchAddressSuggestions(
  query: string,
  apiKey?: string
): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }

  // Use provided apiKey or fall back to environment variable
  const key = apiKey || process.env.NEXT_PUBLIC_ADDRESSFINDER_KEY || process.env.ADDRESSFINDER_API_KEY;

  if (!key) {
    throw new Error('Addressfinder API key is not configured');
  }

  try {
    const response = await fetch(
      `https://api.addressfinder.io/api/nz/address/autocomplete/?q=${encodeURIComponent(query)}&key=${key}&format=json`
    );

    if (!response.ok) {
      throw new Error(`Addressfinder API error: ${response.status}`);
    }

    const data = await response.json();

    // Map Addressfinder response to standardized format
    if (data.completions && Array.isArray(data.completions)) {
      return data.completions.map((item: AddressfinderResponse) => ({
        fullAddress: item.matched || item.a,
        street: item.a || '',
        suburb: item.b || '',
        city: item.c || '',
        postcode: item.d || '',
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
