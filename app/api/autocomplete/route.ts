import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!query) return NextResponse.json([]);

  try {
    // 1. Fetch the fast suggestions from Google Autocomplete
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:nz&types=address&key=${apiKey}`;
    const autocompleteRes = await fetch(autocompleteUrl);
    const autocompleteData = await autocompleteRes.json();

    if (autocompleteData.status !== "OK" || !autocompleteData.predictions) {
      return NextResponse.json([]);
    }

    // 2. Perform concurrent background fetches for the postcodes
    const detailedPredictions = await Promise.all(
      autocompleteData.predictions.map(async (prediction: any) => {
        let postcode = '';
        
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=address_component&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl);
          const detailsData = await detailsRes.json();
          
          if (detailsData.status === "OK" && detailsData.result?.address_components) {
            const postalComponent = detailsData.result.address_components.find((c: any) => 
              c.types.includes('postal_code')
            );
            if (postalComponent) {
              postcode = postalComponent.long_name;
            }
          }
        } catch (e) {
          console.error("Background postcode fetch failed:", e);
        }

        // Clean up country names from the display text
        const cleanAddress = prediction.description.replace(/, New Zealand$/i, '');

        // 3. Return a unified object containing the postcode immediately
        return {
          id: prediction.place_id,
          fullAddress: cleanAddress,
          postcode: postcode || '' 
        };
      })
    );

    return NextResponse.json(detailedPredictions);
  } catch (error) {
    console.error("Autocomplete Aggregator error:", error);
    return NextResponse.json([]);
  }
}