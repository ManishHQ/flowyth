'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriceData {
  id: string;
  price: number;
  startPrice: number | null;
  timestamp: number;
  symbol: string;
  percentageChange: number;
}

interface PriceDebugProps {
  prices: PriceData[];
  isActive: boolean;
  matchCoins: {
    creator_coin?: string;
    opponent_coin?: string;
  };
}

export const PriceDebug: React.FC<PriceDebugProps> = ({ prices, isActive, matchCoins }) => {
  const relevantPrices = prices.filter(p =>
    p.symbol === `${matchCoins.creator_coin}/USD` ||
    p.symbol === `${matchCoins.opponent_coin}/USD`
  );

  return (
    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-warning-readable">🐛 Price Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs">
          <p><strong>Match Active:</strong> {isActive ? 'Yes' : 'No'}</p>
          <p><strong>Total Prices:</strong> {prices.length}</p>
          <p><strong>Match Coins:</strong> {matchCoins.creator_coin} vs {matchCoins.opponent_coin}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold">Relevant Price Data:</p>
          {relevantPrices.length === 0 && (
            <p className="text-xs text-error-readable">No relevant prices found!</p>
          )}
          {relevantPrices.map((price, index) => (
            <div key={index} className="text-xs p-2 bg-card rounded border">
              <p><strong>Symbol:</strong> {price.symbol}</p>
              <p><strong>Current Price:</strong> ${price.price.toFixed(2)}</p>
              <p><strong>Start Price:</strong> {price.startPrice ? `$${price.startPrice.toFixed(2)}` : 'NOT SET'}</p>
              <p><strong>% Change:</strong> {price.percentageChange.toFixed(6)}%</p>
              <p><strong>Timestamp:</strong> {new Date(price.timestamp * 1000).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>

        <div className="text-xs">
          <p className="font-semibold">All Available Symbols:</p>
          <p>{prices.map(p => p.symbol).join(', ')}</p>
        </div>
      </CardContent>
    </Card>
  );
};