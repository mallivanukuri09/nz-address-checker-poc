import { NextResponse } from 'next/server';

interface GooglePrediction {
  place_id: string;
  description: string;
}

interface AddressComponent {
  long_name: string;
  types: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Production Error: GOOGLE_MAPS_API_KEY is missing from environment variables.");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!query || query.trim().length === 0) {
    return NextResponse.json([]);
  }

  try {
    // 1. Fetch suggestions from Google Autocomplete with address component filtering
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:nz&types=address&key=${apiKey}`;
    const autocompleteRes = await fetch(autocompleteUrl);
    const autocompleteData = await autocompleteRes.json();

    if (autocompleteData.status === "ZERO_RESULTS") {
      return NextResponse.json([]);
    }

    if (autocompleteData.status !== "OK" || !autocompleteData.predictions) {
      console.error(`Google Autocomplete API error status: ${autocompleteData.status}`);
      return NextResponse.json([]);
    }

    // 2. Run concurrent background lookups to capture the missing postcodes immediately
    const detailedPredictions = await Promise.all(
      autocompleteData.predictions.slice(0, 5).map(async (prediction: GooglePrediction) => {
        let postcode = '';
        
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=address_component&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl);
          const detailsData = await detailsRes.json();
          
          if (detailsData.status === "OK" && detailsData.result?.address_components) {
            const postalComponent = detailsData.result.address_components.find((c: AddressComponent) => 
              c.types.includes('postal_code')
            );
            if (postalComponent) {
              postcode = postalComponent.long_name;
            }
          }
        } catch (e) {
          console.error(`Failed background details postcode lookup for ${prediction.place_id}:`, e);
        }

        // Clean up the country suffix from the full string
        const cleanAddress = prediction.description.replace(/, New Zealand$/i, '');

        return {
          id: prediction.place_id,
          fullAddress: cleanAddress,
          postcode: postcode.trim()
        };
      })
    );

    return NextResponse.json(detailedPredictions);
  } catch (error) {
    console.error("Production Autocomplete Aggregator Error:", error);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 502 });
  }
}