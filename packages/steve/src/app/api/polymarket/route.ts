import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch top markets by volume - these are the most actively traded
    const response = await fetch(`https://gamma-api.polymarket.com/markets?limit=50&closed=false&order=volume24hr&ascending=false`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Raw API response:', JSON.stringify(data.slice(0, 2), null, 2)); // Log first 2 markets
    
    // Filter to only markets that are truly active and tradeable
    const activeMarkets = data.filter((market: any) => {
      const isOpen = !market.closed;
      const hasVolume = market.volume24hr && parseFloat(market.volume24hr) > 100; // At least $100 volume
      const hasValidPrice = market.outcomePrices && market.outcomePrices.length > 0;
      const notExpired = !market.endDate || new Date(market.endDate) > new Date();
      
      return isOpen && hasVolume && hasValidPrice && notExpired;
    });
    
    console.log(`Filtered ${activeMarkets.length} active markets from ${data.length} total`);
    
    return NextResponse.json(activeMarkets);
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}




