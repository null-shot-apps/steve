'use client';

import { useState, useEffect } from 'react';

interface Opportunity {
  id: string;
  market: string;
  yesPrice: number;
  noPrice: number;
  sum: number;
  profitPotential: number;
  action: string;
  marketUrl: string;
  volume24hr: string;
}

export default function PolymarketScanner() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPolymarketData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/polymarket');
      
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      
      const markets = await response.json();
      
      const opportunities: Opportunity[] = [];

      // ONLY ONE STRATEGY: Probability Sum Arbitrage
      // Find markets where YES + NO ≠ 1.00 (guaranteed profit)
      markets.forEach((market: any) => {
        // Must be active and tradeable
        if (market.closed || !market.active) return;
        
        // Must have recent volume
        const volume = parseFloat(market.volume24hr || '0');
        if (volume < 1000) return;

        const outcomes = market.outcomes || [];
        if (outcomes.length < 2) return;

        const yesPrice = parseFloat(outcomes[0]?.price || 0);
        const noPrice = parseFloat(outcomes[1]?.price || 0);

        if (!yesPrice || !noPrice) return;

        // Calculate sum - should equal 1.00 in efficient market
        const sum = yesPrice + noPrice;
        const sumError = Math.abs(1 - sum);
        
        // Only show if there's a meaningful arbitrage opportunity (>3% edge)
        if (sumError > 0.03) {
          const profitPotential = (sumError / sum) * 100;
          
          opportunities.push({
            id: market.id,
            market: market.question,
            yesPrice,
            noPrice,
            sum,
            profitPotential,
            action: sum > 1 ? 'SELL both YES and NO' : 'BUY both YES and NO',
            marketUrl: `https://polymarket.com/event/${market.slug}`,
            volume24hr: `$${volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          });
        }
      });

      // Sort by profit potential (highest first)
      opportunities.sort((a, b) => b.profitPotential - a.profitPotential);

      return opportunities.slice(0, 20); // Top 20 opportunities
    } catch (error) {
      console.error('Error fetching Polymarket data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  };

  const scanMarkets = async () => {
    setLoading(true);
    const opps = await fetchPolymarketData();
    setOpportunities(opps);
    setLastScan(new Date());
    setLoading(false);
  };

  useEffect(() => {
    scanMarkets();
    const interval = setInterval(scanMarkets, 45000); // Scan every 45 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">Polymarket Arbitrage Scanner</h1>
          <p className="text-xl text-gray-300 mb-2">Probability Sum Arbitrage - Risk-Free Profit Opportunities</p>
          <p className="text-sm text-gray-400">
            When YES + NO prices don't equal $1.00, there's guaranteed profit. Buy both if sum &lt; 1.00, sell both if sum &gt; 1.00.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              {lastScan && (
                <p className="text-sm text-gray-300">
                  Last scan: {lastScan.toLocaleTimeString()} • Auto-refresh every 45s
                </p>
              )}
              {error && (
                <p className="text-sm text-red-400 mt-1">Error: {error}</p>
              )}
            </div>
            <button
              onClick={scanMarkets}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 transition-all text-lg"
            >
              {loading ? 'Scanning...' : '🔄 Scan Now'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{opportunities.length}</div>
            <div className="text-sm text-gray-400">Opportunities Found</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {opportunities.length > 0 ? opportunities[0].profitPotential.toFixed(2) : '0'}%
            </div>
            <div className="text-sm text-gray-400">Best Opportunity</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {opportunities.length > 0 ? (opportunities.reduce((sum, o) => sum + o.profitPotential, 0) / opportunities.length).toFixed(2) : '0'}%
            </div>
            <div className="text-sm text-gray-400">Avg Profit Potential</div>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {loading && opportunities.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-12 text-center">
              <div className="text-2xl mb-2">🔍 Scanning markets...</div>
              <p className="text-gray-400">Looking for arbitrage opportunities</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-12 text-center">
              <div className="text-2xl mb-2">😴 No opportunities right now</div>
              <p className="text-gray-400">Markets are efficient. Check back in 45 seconds.</p>
            </div>
          ) : (
            opportunities.map((opp, index) => (
              <div
                key={opp.id}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/15 transition-all border-2 border-transparent hover:border-green-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-bold text-green-400">
                        #{index + 1}
                      </span>
                      <span className="px-4 py-2 bg-green-600 rounded-full text-lg font-bold">
                        +{opp.profitPotential.toFixed(2)}% Profit
                      </span>
                      <span className="text-sm text-gray-400">
                        24h Vol: {opp.volume24hr}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-4">{opp.market}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-900/30 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">YES Price</div>
                        <div className="text-2xl font-bold">${opp.yesPrice.toFixed(3)}</div>
                      </div>
                      <div className="bg-red-900/30 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">NO Price</div>
                        <div className="text-2xl font-bold">${opp.noPrice.toFixed(3)}</div>
                      </div>
                    </div>

                    <div className="bg-yellow-900/30 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-400 mb-1">Sum (should be $1.00)</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        ${opp.sum.toFixed(3)} 
                        <span className="text-base ml-2">
                          ({opp.sum > 1 ? '+' : ''}{((opp.sum - 1) * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-purple-600 rounded-lg font-semibold text-lg">
                        ⚡ {opp.action}
                      </div>
                      <div className="text-sm text-gray-400">
                        {opp.sum > 1 
                          ? 'Prices too high - sell both sides for guaranteed profit' 
                          : 'Prices too low - buy both sides for guaranteed profit'}
                      </div>
                    </div>
                  </div>
                  
                  <a
                    href={opp.marketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-6 px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-all whitespace-nowrap"
                  >
                    Trade Now →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

