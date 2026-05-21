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

  const cleanQuery = query.trim();
  const isNumberOnly = /^\d+$/.test(cleanQuery);

  // Build smart search string
  const searchString = isNumberOnly
    ? `${cleanQuery} street Auckland New Zealand`
    : cleanQuery;

  // Build URL properly (NO duplicates)
  const url = isNumberOnly
    ? `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchString
      )}&format=json&addressdetails=1&limit=5`
    : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchString
      )}&countrycodes=nz&format=json&addressdetails=1&limit=5`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "NZAddressCheckerApp/1.0 (addresschecker@example.com)",
      },
    });

    if (!response.ok) {
      console.error(`OSM API responded with status: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => {
      const addr = item.address || {};

      const streetName =
        addr.road || addr.street || addr.pedestrian || "";

      const houseNumber = addr.house_number
        ? `${addr.house_number} `
        : "";

      const streetAddress = streetName
        ? `${houseNumber}${streetName}`
        : "";

      const suburb =
        addr.suburb || addr.neighbourhood || addr.village || "";

      const city =
        addr.city || addr.town || addr.city_district || "New Zealand";

      const postcode = addr.postcode || "";

      return {
        fullAddress: item.display_name || "New Zealand Address",
        street: streetAddress,
        suburb,
        city,
        postcode,
      };
    });
  } catch (error) {
    console.error("Failed inside fetchAddressSuggestions:", error);
    return [];
  }
}