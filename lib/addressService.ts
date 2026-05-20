// Standardized address interface for the application
export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
  placeId?: string;
}

// Google Places API response interface
interface GooglePlacesPrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesResponse {
  predictions?: GooglePlacesPrediction[];
  suggestions?: any[];
  status: string;
}

/**
 * Address Service Adapter
 * This adapter provides a clean interface for address lookup services.
 * Currently implements Google Places Autocomplete API.
 */

/**
 * Fetch address suggestions from Google Places Autocomplete API
 * @param query - The search query for address lookup
 * @returns Promise<StandardizedAddress[]> - Array of standardized address objects
 */
export async function fetchAddressSuggestions(
  query: string
): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:nz&types=address&location=-40.9006,174.8860&radius=1000000&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data: GooglePlacesResponse = await response.json();

    // Map Google Places predictions to standardized format
    if (data.predictions && Array.isArray(data.predictions)) {
      return data.predictions.map((prediction: GooglePlacesPrediction) => ({
        fullAddress: prediction.description,
        street: prediction.structured_formatting?.main_text || '',
        suburb: prediction.structured_formatting?.secondary_text?.split(',')[0] || '',
        city: '',
        postcode: '',
        placeId: prediction.place_id,
      }));
    }

    // Handle Google Autocomplete (New) v1 endpoint response format
    if (data.suggestions && Array.isArray(data.suggestions)) {
      return data.suggestions.map((suggestion: any) => ({
        fullAddress: suggestion.placePrediction?.text?.text || '',
        street: '',
        suburb: '',
        city: '',
        postcode: '',
        placeId: suggestion.placePrediction?.placeId || '',
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
