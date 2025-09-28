'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NumberFlow from "@number-flow/react";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitLossData {
  symbol: string;
  emoji: string;
  startPrice: number;
  currentPrice: number;
  percentageChange: number;
  absoluteChange: number;
  isWinning?: boolean;
}

interface ProfitLossDisplayProps {
  creatorData: ProfitLossData;
  opponentData: ProfitLossData;
  timeRemaining?: number;
  isLive?: boolean;
}

export function ProfitLossDisplay({
  creatorData,
  opponentData,
  timeRemaining,
  isLive = false
}: ProfitLossDisplayProps) {

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getBackgroundColor = (change: number, isWinning: boolean) => {
    if (!isLive) return '';
    if (isWinning) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-4">
      {/* Timer and Status */}
      {isLive && timeRemaining !== undefined && (
        <div className="text-center">
          <Badge variant="default" className="bg-blue-500 text-white px-4 py-2">
            <span className="text-lg font-mono">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </Badge>
        </div>
      )}

      {/* P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Creator */}
        <Card className={cn(
          "transition-all duration-300",
          getBackgroundColor(creatorData.percentageChange, creatorData.isWinning || false)
        )}>
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              {/* Player Badge */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{creatorData.emoji}</span>
                <Badge variant="outline">Creator</Badge>
                {creatorData.isWinning && isLive && (
                  <Badge className="bg-green-500 text-white">Leading</Badge>
                )}
              </div>

              {/* Token Info */}
              <div>
                <h3 className="font-bold text-lg">{creatorData.symbol}</h3>
                <div className="text-sm text-muted-foreground">
                  Start: <NumberFlow value={creatorData.startPrice} prefix="$" />
                </div>
                <div className="text-lg font-semibold">
                  Current: <NumberFlow value={creatorData.currentPrice} prefix="$" />
                </div>
              </div>

              {/* P&L */}
              <div className="space-y-1">
                <div className={cn(
                  "flex items-center justify-center gap-2 text-2xl font-bold",
                  getChangeColor(creatorData.percentageChange)
                )}>
                  {getTrendIcon(creatorData.percentageChange)}
                  <NumberFlow
                    value={creatorData.percentageChange}
                    suffix="%"
                    format={{
                      signDisplay: 'always',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4
                    }}
                  />
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  getChangeColor(creatorData.absoluteChange)
                )}>
                  <NumberFlow
                    value={creatorData.absoluteChange}
                    prefix="$"
                    format={{
                      signDisplay: 'always',
                      minimumFractionDigits: 2
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opponent */}
        <Card className={cn(
          "transition-all duration-300",
          getBackgroundColor(opponentData.percentageChange, opponentData.isWinning || false)
        )}>
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              {/* Player Badge */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{opponentData.emoji}</span>
                <Badge variant="outline">Opponent</Badge>
                {opponentData.isWinning && isLive && (
                  <Badge className="bg-green-500 text-white">Leading</Badge>
                )}
              </div>

              {/* Token Info */}
              <div>
                <h3 className="font-bold text-lg">{opponentData.symbol}</h3>
                <div className="text-sm text-muted-foreground">
                  Start: <NumberFlow value={opponentData.startPrice} prefix="$" />
                </div>
                <div className="text-lg font-semibold">
                  Current: <NumberFlow value={opponentData.currentPrice} prefix="$" />
                </div>
              </div>

              {/* P&L */}
              <div className="space-y-1">
                <div className={cn(
                  "flex items-center justify-center gap-2 text-2xl font-bold",
                  getChangeColor(opponentData.percentageChange)
                )}>
                  {getTrendIcon(opponentData.percentageChange)}
                  <NumberFlow
                    value={opponentData.percentageChange}
                    suffix="%"
                    format={{
                      signDisplay: 'always',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4
                    }}
                  />
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  getChangeColor(opponentData.absoluteChange)
                )}>
                  <NumberFlow
                    value={opponentData.absoluteChange}
                    prefix="$"
                    format={{
                      signDisplay: 'always',
                      minimumFractionDigits: 2
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Match Stats */}
      {isLive && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-muted-foreground">Spread</div>
                <div className="font-semibold">
                  <NumberFlow
                    value={Math.abs(creatorData.percentageChange - opponentData.percentageChange)}
                    suffix="%"
                    format={{ minimumFractionDigits: 2 }}
                  />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="font-semibold text-blue-600">Live Battle</div>
              </div>
              <div>
                <div className="text-muted-foreground">Leader</div>
                <div className="font-semibold">
                  {creatorData.percentageChange > opponentData.percentageChange ?
                    creatorData.symbol :
                    opponentData.percentageChange > creatorData.percentageChange ?
                    opponentData.symbol : 'Tied'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}