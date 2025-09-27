'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { CRYPTO_ASSETS_V2 } from '@/lib/contracts/crypto-fantasy-league-v2';
import { useCryptoFantasyLeagueV2, formatPythPrice } from '@/lib/hooks/use-crypto-fantasy-league-v2';

export function LivePrices() {
  return (
    <div className="space-y-4">
      {/* Update indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Updates every 10 seconds</span>
        </div>
        <Badge variant="outline" className="animate-pulse">
          Live
        </Badge>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Object.values(CRYPTO_ASSETS_V2).map((crypto) => (
          <LivePriceCard key={crypto.id} crypto={crypto} />
        ))}
      </div>
    </div>
  );
}

interface LivePriceCardProps {
  crypto: {
    id: string;
    symbol: string;
    name: string;
  };
}

function LivePriceCard({ crypto }: LivePriceCardProps) {
  const { useCurrentPrice } = useCryptoFantasyLeagueV2();
  const { data: priceData, isLoading, error } = useCurrentPrice(crypto.id);

  const formattedPrice = formatPythPrice(priceData);

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    if (!formattedPrice?.publishTime) return null;
    const seconds = Math.floor((Date.now() - formattedPrice.publishTime.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const getChangeIndicator = () => {
    // For now, we'll show a neutral indicator since we don't have historical data
    // In a real implementation, you'd compare with previous price
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  if (error) {
    return (
      <Card className="p-3">
        <div className="text-center">
          <div className="font-semibold text-destructive">{crypto.symbol}</div>
          <div className="text-xs text-muted-foreground">Error loading</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{crypto.symbol}</div>
              <div className="text-xs text-muted-foreground truncate">
                {crypto.name}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getChangeIndicator()}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            {isLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : formattedPrice ? (
              <div className="font-mono text-lg font-semibold">
                {formattedPrice.formatted}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No price data</div>
            )}

            {/* Last update time */}
            {formattedPrice && (
              <div className="text-xs text-muted-foreground">
                {getTimeSinceUpdate()}
              </div>
            )}
          </div>

          {/* Confidence indicator */}
          {formattedPrice && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confidence</span>
              <Badge variant="outline" className="text-xs">
                ±{formattedPrice.confidence.toLocaleString()}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}