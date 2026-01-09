import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch markets that are:
    // - Not closed
    // - Have active trading (volume > 0)
    // - End date is in the future
    const now = new Date().toISOString();
    const response = await fetch(`https://gamma-api.polymarket.com/markets?closed=false&limit=100&active=true&end_date_min=${now}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter to only markets with recent volume and valid prices
    const activeMarkets = data.filter((market: any) => {
      const hasVolume = market.volume24hr && parseFloat(market.volume24hr) > 0;
      const hasValidPrice = market.outcomePrices && market.outcomePrices.length > 0;
      return hasVolume && hasValidPrice;
    });
    
    return NextResponse.json(activeMarkets);
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}



