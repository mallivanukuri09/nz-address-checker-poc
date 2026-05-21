// lib/addressService.ts

export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
}

export async function fetchGoogleAddressSuggestions(query: string): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length === 0) return [];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Google Maps API Key missing.");
    return [];
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&components=country:nz`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.predictions) return [];

    // Map Google predictions to your application's address format
    return data.predictions.map((prediction: any) => ({
      fullAddress: prediction.description,
      street: prediction.structured_formatting?.main_text || '',
      suburb: '', // Google requires a secondary "details" fetch for full component breakdowns
      city: 'New Zealand',
      postcode: ''
    }));
  } catch (error) {
    console.error("Google Maps API Error:", error);
    return [];
  }
}