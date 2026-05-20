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

  // OpenStreetMap Nominatim API endpoint targeted strictly to New Zealand
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=nz&featuretype=settlement,street&format=json&addressdetails=1&limit=5`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Crucial: Nominatim requires a distinct User-Agent to prevent 403 Forbidden errors
        'User-Agent': 'NZAddressCheckerApp/1.0 (addresschecker@example.com)'
      }
    });

    if (!response.ok) {
      console.error(`OSM API responded with status: ${response.status}`);
      return []; // Return empty array gracefully instead of crashing
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }

    // Map the raw OpenStreetMap data safely into your StandardizedAddress format
    return data.map((item: any) => {
      const addr = item.address || {};
      
      // Extract the best available street/road name
      const streetName = addr.road || addr.street || addr.pedestrian || '';
      const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
      const streetAddress = streetName ? `${houseNumber}${streetName}` : '';

      // Gather location fallback properties defensively
      const suburb = addr.suburb || addr.neighbourhood || addr.village || '';
      const city = addr.city || addr.town || addr.city_district || 'New Zealand';
      const postcode = addr.postcode || '';

      return {
        fullAddress: item.display_name || 'New Zealand Address',
        street: streetAddress,
        suburb: suburb,
        city: city,
        postcode: postcode
      };
    });

  } catch (error) {
    console.error('Failed inside fetchAddressSuggestions:', error);
    return []; // Return empty array gracefully on network drops
  }
}