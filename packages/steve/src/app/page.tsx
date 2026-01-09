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

  // Mock data generator - replace with real Polymarket API calls
  const generateMockOpportunities = (): Opportunity[] => {
    const mockData: Opportunity[] = [
      {
        id: '1',
        type: 'arbitrage',
        title: 'Trump Win vs Republican Win Correlation',
        description: 'Price gap detected between correlated markets',
        profitPotential: 8.5,
        markets: [
          { name: 'Trump Wins 2024', currentPrice: 0.62, suggestedAction: 'BUY', url: 'https://polymarket.com/event/trump-wins' },
          { name: 'Republican Wins 2024', currentPrice: 0.58, suggestedAction: 'SELL', url: 'https://polymarket.com/event/republican-wins' }
        ],
        confidence: 'high',
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'sum_error',
        title: 'Fed Rate Decision Probabilities',
        description: 'Market probabilities sum to 103% - arbitrage available',
        profitPotential: 3.2,
        markets: [
          { name: 'Rate Cut 0.25%', currentPrice: 0.45, suggestedAction: 'SELL', url: 'https://polymarket.com/event/fed-rate-1' },
          { name: 'Rate Cut 0.50%', currentPrice: 0.38, suggestedAction: 'SELL', url: 'https://polymarket.com/event/fed-rate-2' },
          { name: 'No Change', currentPrice: 0.20, suggestedAction: 'SELL', url: 'https://polymarket.com/event/fed-rate-3' }
        ],
        confidence: 'medium',
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'whale_move',
        title: 'Large Wallet Activity Detected',
        description: 'Whale bought $50K in "Bitcoin $100K by March"',
        profitPotential: 12.0,
        markets: [
          { name: 'Bitcoin $100K by March', currentPrice: 0.35, suggestedAction: 'BUY', url: 'https://polymarket.com/event/btc-100k' }
        ],
        confidence: 'medium',
        timestamp: new Date()
      },
      {
        id: '4',
        type: 'volatility',
        title: 'News Overreaction - AI Regulation',
        description: 'Price spiked 15% in 10 minutes, likely to fade',
        profitPotential: 6.8,
        markets: [
          { name: 'AI Regulation Passed 2024', currentPrice: 0.72, suggestedAction: 'SELL', url: 'https://polymarket.com/event/ai-regulation' }
        ],
        confidence: 'low',
        timestamp: new Date()
      },
      {
        id: '5',
        type: 'liquidity',
        title: 'Liquidity Imbalance - Taylor Swift',
        description: 'Large spread at 0.50 price point, place limit order',
        profitPotential: 4.5,
        markets: [
          { name: 'Taylor Swift Grammy Win', currentPrice: 0.48, suggestedAction: 'BUY', url: 'https://polymarket.com/event/taylor-swift' }
        ],
        confidence: 'high',
        timestamp: new Date()
      }
    ];
    return mockData;
  };

  const scanMarkets = () => {
    setIsScanning(true);
    setTimeout(() => {
      const newOpportunities = generateMockOpportunities();
      setOpportunities(newOpportunities);
      setLastUpdate(new Date());
      setIsScanning(false);
    }, 1500);
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
      <div className="max-w-7xl mx-auto mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-300 text-sm">
          <strong>Note:</strong> This scanner currently shows mock data for demonstration. 
          Connect to Polymarket API for real-time opportunities. Always do your own research before trading.
        </p>
      </div>
    </div>
  );
}

