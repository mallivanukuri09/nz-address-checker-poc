'use client';

export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
}

export async function fetchAddressSuggestions(
  query: string
): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const url = `https://api.addressable.dev/v2/autocomplete?api_key=CyyOrbYFVJLXi4uOUFojxQ&country_code=NZ&q=${encodeURIComponent(query.trim())}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Addressable API responded with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const suggestions = data.suggestions || data.addresses || data.predictions || data;

    if (!Array.isArray(suggestions)) {
      return [];
    }

    return suggestions.map((item: any) => ({
      fullAddress: item.formatted || '',
      street: `${item.street_number || ''} ${item.street || ''}`.trim(),
      suburb: item.locality || '',
      city: item.city || item.region || 'New Zealand',
      postcode: item.postcode || '',
    }));
  } catch (error) {
    console.error('Addressable API Network Error:', error);
    return [];
  }
}
