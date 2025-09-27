'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CRYPTO_ASSETS,
  Position,
  POSITION_NAMES,
  POSITION_MULTIPLIERS,
  FORMATION_REQUIREMENTS
} from '@/lib/contracts/crypto-fantasy-league';

interface SquadFormationProps {
  onSquadChange: (squad: string[]) => void;
  onSquadValid: (isValid: boolean) => void;
  disabled?: boolean;
}

export function SquadFormation({ onSquadChange, onSquadValid, disabled = false }: SquadFormationProps) {
  const [selectedSquad, setSelectedSquad] = useState<string[]>(Array(6).fill(''));

  const validateSquad = (squad: string[]) => {
    if (squad.some(id => !id)) return false;

    // Check for duplicates
    const uniqueIds = new Set(squad);
    if (uniqueIds.size !== squad.length) return false;

    const positionCounts = { [Position.GOALKEEPER]: 0, [Position.DEFENDER]: 0, [Position.MIDFIELDER]: 0, [Position.STRIKER]: 0 };

    for (const cryptoId of squad) {
      const position = findPositionByCryptoId(cryptoId);
      if (position !== undefined) {
        positionCounts[position]++;
      }
    }

    return (
      positionCounts[Position.GOALKEEPER] === FORMATION_REQUIREMENTS[Position.GOALKEEPER] &&
      positionCounts[Position.DEFENDER] === FORMATION_REQUIREMENTS[Position.DEFENDER] &&
      positionCounts[Position.MIDFIELDER] === FORMATION_REQUIREMENTS[Position.MIDFIELDER] &&
      positionCounts[Position.STRIKER] === FORMATION_REQUIREMENTS[Position.STRIKER]
    );
  };

  const findPositionByCryptoId = (cryptoId: string) => {
    for (const [position, assets] of Object.entries(CRYPTO_ASSETS)) {
      if (assets.some(asset => asset.id === cryptoId)) {
        return Number(position) as Position;
      }
    }
    return undefined;
  };

  const handleCryptoSelect = (cryptoId: string, slotIndex: number) => {
    const newSquad = [...selectedSquad];
    newSquad[slotIndex] = cryptoId;
    setSelectedSquad(newSquad);

    const isValid = validateSquad(newSquad);
    onSquadValid(isValid);
    onSquadChange(newSquad);
  };

  const clearSquad = () => {
    const emptySquad = Array(6).fill('');
    setSelectedSquad(emptySquad);
    onSquadValid(false);
    onSquadChange(emptySquad);
  };

  const getSelectedCrypto = (cryptoId: string) => {
    for (const assets of Object.values(CRYPTO_ASSETS)) {
      const crypto = assets.find(asset => asset.id === cryptoId);
      if (crypto) return crypto;
    }
    return null;
  };

  const getPositionForSlot = (index: number): Position => {
    if (index === 0) return Position.GOALKEEPER;
    if (index === 1 || index === 2) return Position.DEFENDER;
    if (index === 3 || index === 4) return Position.MIDFIELDER;
    return Position.STRIKER;
  };

  const getSlotLabel = (index: number): string => {
    const position = getPositionForSlot(index);
    const positionName = POSITION_NAMES[position];
    const multiplier = POSITION_MULTIPLIERS[position];

    if (position === Position.DEFENDER || position === Position.MIDFIELDER) {
      const num = position === Position.DEFENDER ? (index === 1 ? 1 : 2) : (index === 3 ? 1 : 2);
      return `${positionName} ${num} (${multiplier})`;
    }
    return `${positionName} (${multiplier})`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Squad Formation (1-2-2-1)</CardTitle>
          <CardDescription>
            Select your crypto squad following the football formation. Each position has different scoring multipliers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formation Display */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
              const position = getPositionForSlot(slotIndex);
              const selectedCrypto = getSelectedCrypto(selectedSquad[slotIndex]);

              return (
                <div key={slotIndex} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {getSlotLabel(slotIndex)}
                    </label>
                    {selectedCrypto && (
                      <Badge variant="secondary">
                        {selectedCrypto.symbol}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CRYPTO_ASSETS[position].map((crypto) => {
                      const isSelected = selectedSquad[slotIndex] === crypto.id;
                      const isUsedElsewhere = selectedSquad.includes(crypto.id) && !isSelected;

                      return (
                        <Button
                          key={crypto.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCryptoSelect(crypto.id, slotIndex)}
                          disabled={disabled || isUsedElsewhere}
                          className="justify-start"
                        >
                          <span className="font-semibold">{crypto.symbol}</span>
                          <span className="ml-1 text-xs opacity-70">{crypto.name}</span>
                          {isUsedElsewhere && <span className="ml-1 text-xs">✓</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Squad Summary */}
          <div className="space-y-3">
            <h4 className="font-semibold">Squad Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">🥅 Goalkeeper:</span>
                <p className="text-muted-foreground">
                  {selectedSquad[0] ? getSelectedCrypto(selectedSquad[0])?.symbol : 'Not selected'}
                </p>
              </div>
              <div>
                <span className="font-medium">🛡️ Defenders:</span>
                <p className="text-muted-foreground">
                  {[1, 2].map(i => selectedSquad[i] ? getSelectedCrypto(selectedSquad[i])?.symbol : '?').join(', ')}
                </p>
              </div>
              <div>
                <span className="font-medium">⚽ Midfielders:</span>
                <p className="text-muted-foreground">
                  {[3, 4].map(i => selectedSquad[i] ? getSelectedCrypto(selectedSquad[i])?.symbol : '?').join(', ')}
                </p>
              </div>
              <div>
                <span className="font-medium">🎯 Striker:</span>
                <p className="text-muted-foreground">
                  {selectedSquad[5] ? getSelectedCrypto(selectedSquad[5])?.symbol : 'Not selected'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={clearSquad} disabled={disabled}>
              Clear Squad
            </Button>
            <div className="text-sm text-muted-foreground">
              Squad {validateSquad(selectedSquad) ? '✅ Valid' : '❌ Invalid'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>🥅 Goalkeeper (Stablecoin)</span>
                <Badge>10x multiplier</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Low volatility, defensive play
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>🛡️ Defender (Blue Chip)</span>
                <Badge>5x multiplier</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Established, reliable performance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>⚽ Midfielder (Altcoin)</span>
                <Badge>3x multiplier</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Medium risk/reward
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>🎯 Striker (Meme Coin)</span>
                <Badge>1x multiplier</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                High risk/high reward
              </p>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-muted-foreground">
            <strong>Scoring:</strong> Total Score = Sum of (Position Multiplier × Price Change %)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}