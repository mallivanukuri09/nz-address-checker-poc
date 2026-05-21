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
  const url =
    "https://api.addressable.dev/v2/autocomplete?api_key=CyyOrbYFVJLXi4uOUFojxQ&country_code=NZ&q=5/";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "NZAddressCheckerApp/1.0 (addresschecker@example.com)",
      },
    });

    if (!response.ok) {
      console.error(`Addressable API responded with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log("Addressable Raw Data:", data);

    return [
      {
        fullAddress: "5 Hardcoded Test Street, Auckland Central, Auckland",
        street: "5 Test Street",
        suburb: "Auckland Central",
        city: "Auckland",
        postcode: "1010",
      },
    ];
  } catch (error) {
    console.error("Failed inside fetchAddressSuggestions:", error);
    return [];
  }
}
