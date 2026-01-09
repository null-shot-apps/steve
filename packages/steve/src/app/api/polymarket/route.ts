import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://gamma-api.polymarket.com/markets?limit=50&active=true', {
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

