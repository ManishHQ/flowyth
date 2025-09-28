'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NumberFlow from "@number-flow/react";
import { Trophy, Crown, Target, TrendingUp, TrendingDown, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MatchResultData {
  symbol: string;
  emoji: string;
  startPrice: number;
  endPrice: number;
  percentageChange: number;
  absoluteChange: number;
  playerWallet: string;
  playerRole: 'creator' | 'opponent';
}

interface MatchResultsProps {
  creatorData: MatchResultData;
  opponentData: MatchResultData;
  matchDuration: number;
  winner: 'creator' | 'opponent' | 'tie';
  userRole: 'creator' | 'opponent' | null;
  onPlayAgain?: () => void;
  onShare?: () => void;
}

export function MatchResults({
  creatorData,
  opponentData,
  matchDuration,
  winner,
  userRole,
  onPlayAgain,
  onShare
}: MatchResultsProps) {

  const isUserWinner = userRole === winner;
  const winnerData = winner === 'creator' ? creatorData :
                    winner === 'opponent' ? opponentData : null;
  const loserData = winner === 'creator' ? opponentData :
                   winner === 'opponent' ? creatorData : null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Winner Announcement */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
      >
        <Card className={cn(
          "text-center border-2",
          winner === 'tie' ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100" :
          isUserWinner ? "border-green-300 bg-gradient-to-r from-green-50 to-green-100" :
          "border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100"
        )}>
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
              className="flex justify-center mb-4"
            >
              {winner === 'tie' ? (
                <div className="text-6xl">🤝</div>
              ) : (
                <div className="relative">
                  <Crown className="h-16 w-16 text-yellow-500" />
                  <div className="absolute -top-2 -right-2 text-3xl">
                    {winnerData?.emoji}
                  </div>
                </div>
              )}
            </motion.div>

            <CardTitle className="text-3xl">
              {winner === 'tie' ? (
                "It's a Tie!"
              ) : isUserWinner ? (
                "🎉 You Win! 🎉"
              ) : userRole ? (
                "You Lost"
              ) : (
                `${winnerData?.playerRole === 'creator' ? 'Creator' : 'Opponent'} Wins!`
              )}
            </CardTitle>

            {winner !== 'tie' && winnerData && (
              <div className="text-lg text-muted-foreground">
                {winnerData.symbol} outperformed with{' '}
                <span className="font-bold text-green-600">
                  +<NumberFlow value={winnerData.percentageChange} suffix="%" />
                </span>
              </div>
            )}
          </CardHeader>
        </Card>
      </motion.div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Creator Results */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={cn(
            "transition-all duration-300",
            winner === 'creator' ? "ring-2 ring-green-300 bg-green-50" : "bg-gray-50"
          )}>
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl">{creatorData.emoji}</span>
                  <Badge variant="outline">Creator</Badge>
                  {winner === 'creator' && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold">{creatorData.symbol}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Start: <NumberFlow value={creatorData.startPrice} prefix="$" /></div>
                    <div>End: <NumberFlow value={creatorData.endPrice} prefix="$" /></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={cn(
                    "text-3xl font-bold flex items-center justify-center gap-2",
                    creatorData.percentageChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {creatorData.percentageChange >= 0 ?
                      <TrendingUp className="h-6 w-6" /> :
                      <TrendingDown className="h-6 w-6" />
                    }
                    <NumberFlow
                      value={creatorData.percentageChange}
                      suffix="%"
                      format={{ signDisplay: 'always', minimumFractionDigits: 2 }}
                    />
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    creatorData.absoluteChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    <NumberFlow
                      value={creatorData.absoluteChange}
                      prefix="$"
                      format={{ signDisplay: 'always', minimumFractionDigits: 2 }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Opponent Results */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={cn(
            "transition-all duration-300",
            winner === 'opponent' ? "ring-2 ring-green-300 bg-green-50" : "bg-gray-50"
          )}>
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl">{opponentData.emoji}</span>
                  <Badge variant="outline">Opponent</Badge>
                  {winner === 'opponent' && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold">{opponentData.symbol}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Start: <NumberFlow value={opponentData.startPrice} prefix="$" /></div>
                    <div>End: <NumberFlow value={opponentData.endPrice} prefix="$" /></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={cn(
                    "text-3xl font-bold flex items-center justify-center gap-2",
                    opponentData.percentageChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {opponentData.percentageChange >= 0 ?
                      <TrendingUp className="h-6 w-6" /> :
                      <TrendingDown className="h-6 w-6" />
                    }
                    <NumberFlow
                      value={opponentData.percentageChange}
                      suffix="%"
                      format={{ signDisplay: 'always', minimumFractionDigits: 2 }}
                    />
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    opponentData.absoluteChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    <NumberFlow
                      value={opponentData.absoluteChange}
                      prefix="$"
                      format={{ signDisplay: 'always', minimumFractionDigits: 2 }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Match Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Match Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-lg font-semibold">{formatDuration(matchDuration)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Spread</div>
              <div className="text-lg font-semibold">
                <NumberFlow
                  value={Math.abs(creatorData.percentageChange - opponentData.percentageChange)}
                  suffix="%"
                  format={{ minimumFractionDigits: 2 }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Best Performance</div>
              <div className="text-lg font-semibold text-green-600">
                +<NumberFlow
                  value={Math.max(creatorData.percentageChange, opponentData.percentageChange)}
                  suffix="%"
                  format={{ minimumFractionDigits: 2 }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Price Movement</div>
              <div className="text-lg font-semibold">
                $<NumberFlow
                  value={Math.abs(creatorData.absoluteChange) + Math.abs(opponentData.absoluteChange)}
                  format={{ minimumFractionDigits: 2 }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        {onPlayAgain && (
          <Button onClick={onPlayAgain} size="lg" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Play Again
          </Button>
        )}
        {onShare && (
          <Button onClick={onShare} variant="outline" size="lg" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        )}
      </div>
    </div>
  );
}