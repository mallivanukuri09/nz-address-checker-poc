export interface StandardizedAddress {
  fullAddress: string;
  street: string;
  suburb: string;
  city: string;
  postcode: string;
}

export async function fetchAddressSuggestions(query: string): Promise<StandardizedAddress[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // ⚙️ Modular API Configuration Block
  const apiKey = "CyyOrbYFVJLXi4uOUFojxQ";
  const countryCode = "NZ";

  // 🔀 Dynamic User Input Parser
  const cleanQuery = query.trim();
  const searchString = /^\d+$/.test(cleanQuery) ? `${cleanQuery} ` : cleanQuery;

  // 🌐 Constructed Endpoint URL using GET parameters
  const url = `https://api.addressable.dev/v2/autocomplete?api_key=${apiKey}&country_code=${countryCode}&q=${encodeURIComponent(searchString)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Addressable API responded with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Safety check: Ensure we have an array of suggestions to work with
    const suggestions = data.suggestions || data.addresses || data.predictions || data;
    
    if (!Array.isArray(suggestions)) {
      return [];
    }

    // Map the real data dynamically into your StandardizedAddress format
    return suggestions.map((item: any) => {
      const street = item.street_number && item.street ? `${item.street_number} ${item.street}` : (item.street || '');
      const suburb = item.locality || '';
      const city = item.region || 'New Zealand';
      const postcode = item.postcode || '';
      const addressParts = [street, suburb, city, item.postcode].filter(Boolean);
      const fullAddress = addressParts.join(', ') || 'New Zealand Address';

      return {
        fullAddress,
        street,
        suburb,
        city,
        postcode,
      };
    });

  } catch (error) {
    console.error('Failed inside fetchAddressSuggestions:', error);
    return []; // Graceful fallback on network drop
  }
}