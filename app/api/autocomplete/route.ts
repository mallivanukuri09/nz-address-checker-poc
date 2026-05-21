import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  const apiKey = "CyyOrbYFVJLXi4uOUFojxQ";
  const countryCode = "NZ";
  const apiUrl = `https://api.addressable.dev/v2/autocomplete?api_key=${apiKey}&country_code=${countryCode}&q=${encodeURIComponent(q)}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
