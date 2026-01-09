import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch active markets sorted by 24hr volume
    const response = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=100&order=volume24hr', {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}


