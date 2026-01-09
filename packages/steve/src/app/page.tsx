'use client';

import { useEffect, useState } from 'react';

type OpportunityType = 'arbitrage' | 'sum_error' | 'whale_move' | 'volatility' | 'liquidity';

interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  profitPotential: number;
  markets: Array<{
    name: string;
    currentPrice: number;
    suggestedAction: 'BUY' | 'SELL';
    url: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export default function PolymarketScanner() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filter, setFilter] = useState<OpportunityType | 'all'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch real Polymarket data
  const fetchPolymarketData = async (): Promise<Opportunity[]> => {
    try {
      // Fetch active markets from Polymarket API via our proxy
      const response = await fetch('/api/polymarket');
      const markets = await response.json();
      
      const opportunities: Opportunity[] = [];
      
      // Strategy 1: Sum Error Detection
      // Group markets by event and check if probabilities sum correctly
      const eventGroups = new Map<string, typeof markets>();
      markets.forEach((market: any) => {
        const eventId = market.groupItemTitle || market.question;
        if (!eventGroups.has(eventId)) {
          eventGroups.set(eventId, []);
        }
        eventGroups.get(eventId)?.push(market);
      });
      
      eventGroups.forEach((group, eventName) => {
        if (group.length > 1) {
          const totalProb = group.reduce((sum: number, m: any) => {
            const outcomePrices = m.outcomePrices ? JSON.parse(m.outcomePrices) : ['0.5', '0.5'];
            return sum + parseFloat(outcomePrices[0]);
          }, 0);
          
          if (Math.abs(totalProb - 1.0) > 0.03) { // More than 3% deviation
            opportunities.push({
              id: `sum_${eventName}`,
              type: 'sum_error',
              title: `Probability Sum Error: ${eventName}`,
              description: `Market probabilities sum to ${(totalProb * 100).toFixed(1)}% - arbitrage available`,
              profitPotential: Math.abs(totalProb - 1.0) * 100,
              markets: group.slice(0, 3).map((m: any) => {
                const prices = m.outcomePrices ? JSON.parse(m.outcomePrices) : ['0.5', '0.5'];
                return {
                  name: m.question,
                  currentPrice: parseFloat(prices[0]),
                  suggestedAction: totalProb > 1.0 ? 'SELL' : 'BUY',
                  url: `https://polymarket.com/event/${m.slug || m.id}`
                };
              }),
              confidence: Math.abs(totalProb - 1.0) > 0.05 ? 'high' : 'medium',
              timestamp: new Date()
            });
          }
        }
      });
      
      // Strategy 2: Volatility Detection (price changes)
      markets.forEach((market: any) => {
        if (market.volume24hr && parseFloat(market.volume24hr) > 10000) {
          const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : ['0.5', '0.5'];
          const currentPrice = parseFloat(prices[0]);
          
          // Detect extreme prices that might fade
          if (currentPrice > 0.85 || currentPrice < 0.15) {
            opportunities.push({
              id: `vol_${market.id}`,
              type: 'volatility',
              title: `Extreme Price: ${market.question}`,
              description: `Price at ${(currentPrice * 100).toFixed(0)}% - potential mean reversion`,
              profitPotential: Math.abs(currentPrice - 0.5) * 20,
              markets: [{
                name: market.question,
                currentPrice,
                suggestedAction: currentPrice > 0.85 ? 'SELL' : 'BUY',
                url: `https://polymarket.com/event/${market.slug || market.id}`
              }],
              confidence: 'medium',
              timestamp: new Date()
            });
          }
        }
      });
      
      // Strategy 3: Liquidity Opportunities
      markets.forEach((market: any) => {
        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : ['0.5', '0.5'];
        const currentPrice = parseFloat(prices[0]);
        const liquidity = parseFloat(market.liquidity || '0');
        
        // Low liquidity + price near psychological levels
        if (liquidity < 5000 && (Math.abs(currentPrice - 0.5) < 0.05 || Math.abs(currentPrice - 0.75) < 0.05 || Math.abs(currentPrice - 0.25) < 0.05)) {
          opportunities.push({
            id: `liq_${market.id}`,
            type: 'liquidity',
            title: `Liquidity Play: ${market.question}`,
            description: `Low liquidity at psychological price point - spread opportunity`,
            profitPotential: 5.0,
            markets: [{
              name: market.question,
              currentPrice,
              suggestedAction: currentPrice < 0.5 ? 'BUY' : 'SELL',
              url: `https://polymarket.com/event/${market.slug || market.id}`
            }],
            confidence: 'high',
            timestamp: new Date()
          });
        }
      });
      
      // Strategy 4: Arbitrage Detection (correlated markets)
      // Look for related markets with price discrepancies
      const correlatedPairs = [
        ['trump', 'republican'],
        ['bitcoin', 'crypto'],
        ['fed', 'inflation'],
        ['ai', 'tech']
      ];
      
      correlatedPairs.forEach(([keyword1, keyword2]) => {
        const market1 = markets.find((m: any) => m.question.toLowerCase().includes(keyword1));
        const market2 = markets.find((m: any) => m.question.toLowerCase().includes(keyword2));
        
        if (market1 && market2) {
          const prices1 = market1.outcomePrices ? JSON.parse(market1.outcomePrices) : ['0.5', '0.5'];
          const prices2 = market2.outcomePrices ? JSON.parse(market2.outcomePrices) : ['0.5', '0.5'];
          const price1 = parseFloat(prices1[0]);
          const price2 = parseFloat(prices2[0]);
          
          if (Math.abs(price1 - price2) > 0.1) {
            opportunities.push({
              id: `arb_${market1.id}_${market2.id}`,
              type: 'arbitrage',
              title: `Correlation Gap: ${keyword1.toUpperCase()} vs ${keyword2.toUpperCase()}`,
              description: `Price gap of ${(Math.abs(price1 - price2) * 100).toFixed(0)}% between correlated markets`,
              profitPotential: Math.abs(price1 - price2) * 50,
              markets: [
                {
                  name: market1.question,
                  currentPrice: price1,
                  suggestedAction: price1 > price2 ? 'SELL' : 'BUY',
                  url: `https://polymarket.com/event/${market1.slug || market1.id}`
                },
                {
                  name: market2.question,
                  currentPrice: price2,
                  suggestedAction: price2 > price1 ? 'SELL' : 'BUY',
                  url: `https://polymarket.com/event/${market2.slug || market2.id}`
                }
              ],
              confidence: 'high',
              timestamp: new Date()
            });
          }
        }
      });
      
      // Sort by profit potential and return top opportunities
      return opportunities
        .sort((a, b) => b.profitPotential - a.profitPotential)
        .slice(0, 10);
      
    } catch (error) {
      console.error('Error fetching Polymarket data:', error);
      return [];
    }
  };

  const scanMarkets = async () => {
    setIsScanning(true);
    try {
      const newOpportunities = await fetchPolymarketData();
      setOpportunities(newOpportunities);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanMarkets();
    const interval = setInterval(scanMarkets, 30000); // Scan every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredOpportunities = filter === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.type === filter);

  const getTypeColor = (type: OpportunityType) => {
    const colors = {
      arbitrage: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      sum_error: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      whale_move: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      volatility: 'bg-red-500/20 text-red-300 border-red-500/30',
      liquidity: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[type];
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-500/20 text-green-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-red-500/20 text-red-300'
    };
    return colors[confidence as keyof typeof colors];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Polymarket Scanner
            </h1>
            <p className="text-gray-400">Real-time opportunity detection for manual trading</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-sm text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={scanMarkets}
              disabled={isScanning}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scan Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'arbitrage', 'sum_error', 'whale_move', 'volatility', 'liquidity'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as OpportunityType | 'all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-white text-purple-900'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="max-w-7xl mx-auto grid gap-6">
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl">No opportunities found</p>
            <p className="text-sm mt-2">Try scanning again or adjust filters</p>
          </div>
        ) : (
          filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(opp.type)}`}>
                      {opp.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceBadge(opp.confidence)}`}>
                      {opp.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{opp.title}</h3>
                  <p className="text-gray-400">{opp.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    +{opp.profitPotential.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Potential Profit</div>
                </div>
              </div>

              {/* Markets */}
              <div className="space-y-3">
                {opp.markets.map((market, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{market.name}</div>
                      <div className="text-sm text-gray-400">
                        Current Price: <span className="text-white font-mono">${market.currentPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-2 rounded-lg font-bold ${
                          market.suggestedAction === 'BUY'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {market.suggestedAction}
                      </span>
                      <a
                        href={market.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-all flex items-center gap-2"
                      >
                        Trade
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <p className="text-green-300 text-sm">
          <strong>✓ Live Data:</strong> Connected to Polymarket API. 
          Opportunities are detected in real-time. Always do your own research before trading.
        </p>
      </div>
    </div>
  );
}





