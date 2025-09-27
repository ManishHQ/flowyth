'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Plus, TrendingUp } from 'lucide-react';
import { CRYPTO_ASSETS_V2 } from '@/lib/contracts/crypto-fantasy-league-v2';
import { useCryptoFantasyLeagueV2, formatPythPrice } from '@/lib/hooks/use-crypto-fantasy-league-v2';

interface SquadSelectionV2Props {
  onSquadChange: (squad: string[]) => void;
  onSquadValid: (isValid: boolean) => void;
  disabled?: boolean;
}

export function SquadSelectionV2({ onSquadChange, onSquadValid, disabled = false }: SquadSelectionV2Props) {
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const { useCurrentPrice } = useCryptoFantasyLeagueV2();

  const validateSquad = (squad: string[]) => {
    // Must have exactly 6 cryptos, no duplicates
    if (squad.length !== 6) return false;

    const uniqueIds = new Set(squad);
    return uniqueIds.size === squad.length;
  };

  const handleCryptoSelect = (cryptoId: string) => {
    let newSquad = [...selectedSquad];

    if (newSquad.includes(cryptoId)) {
      // Remove if already selected
      newSquad = newSquad.filter(id => id !== cryptoId);
    } else if (newSquad.length < 6) {
      // Add if under limit
      newSquad.push(cryptoId);
    } else {
      // Replace oldest selection if at limit
      newSquad.shift();
      newSquad.push(cryptoId);
    }

    setSelectedSquad(newSquad);
    onSquadChange(newSquad);

    const isValid = validateSquad(newSquad);
    onSquadValid(isValid);
  };

  const clearSquad = () => {
    setSelectedSquad([]);
    onSquadChange([]);
    onSquadValid(false);
  };

  const selectAllCryptos = () => {
    const allCryptoIds = Object.values(CRYPTO_ASSETS_V2).map(crypto => crypto.id);
    setSelectedSquad(allCryptoIds);
    onSquadChange(allCryptoIds);
    onSquadValid(validateSquad(allCryptoIds));
  };

  const removeCrypto = (cryptoId: string) => {
    const newSquad = selectedSquad.filter(id => id !== cryptoId);
    setSelectedSquad(newSquad);
    onSquadChange(newSquad);
    onSquadValid(validateSquad(newSquad));
  };

  return (
    <div className="space-y-6">
      {/* Selected Squad Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Squad ({selectedSquad.length}/6)</span>
            <div className="flex gap-2">
              {selectedSquad.length < 6 && (
                <Button variant="outline" size="sm" onClick={selectAllCryptos} disabled={disabled}>
                  Select All
                </Button>
              )}
              {selectedSquad.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearSquad} disabled={disabled}>
                  Clear All
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSquad.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select all 6 cryptocurrencies to build your squad</p>
              <p className="text-sm">Choose all available cryptos - no position restrictions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedSquad.map((cryptoId, index) => {
                const crypto = Object.values(CRYPTO_ASSETS_V2).find(c => c.id === cryptoId);
                return (
                  <SelectedCryptoCard
                    key={`${cryptoId}-${index}`}
                    crypto={crypto}
                    onRemove={() => removeCrypto(cryptoId)}
                    disabled={disabled}
                    position={index + 1}
                  />
                );
              })}
            </div>
          )}

          {selectedSquad.length > 0 && selectedSquad.length < 6 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Select {6 - selectedSquad.length} more crypto{6 - selectedSquad.length !== 1 ? 's' : ''} to complete your squad
              </p>
            </div>
          )}

          {validateSquad(selectedSquad) && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✅ Squad complete! Ready to register for tournament.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Cryptos */}
      <Card>
        <CardHeader>
          <CardTitle>Available Cryptocurrencies</CardTitle>
          <CardDescription>
            Choose any 6 from our supported cryptos. Click to add/remove from your squad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.values(CRYPTO_ASSETS_V2).map((crypto) => (
              <CryptoSelectionCard
                key={crypto.id}
                crypto={crypto}
                isSelected={selectedSquad.includes(crypto.id)}
                isDisabled={disabled || (selectedSquad.length >= 6 && !selectedSquad.includes(crypto.id))}
                onClick={() => handleCryptoSelect(crypto.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SelectedCryptoCardProps {
  crypto: any;
  onRemove: () => void;
  disabled: boolean;
  position: number;
}

function SelectedCryptoCard({ crypto, onRemove, disabled, position }: SelectedCryptoCardProps) {
  if (!crypto) return null;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          #{position}
        </Badge>
        <div>
          <div className="font-semibold">{crypto.symbol}</div>
          <div className="text-xs text-muted-foreground">{crypto.name}</div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface CryptoSelectionCardProps {
  crypto: any;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

function CryptoSelectionCard({ crypto, isSelected, isDisabled, onClick }: CryptoSelectionCardProps) {
  const { useCurrentPrice } = useCryptoFantasyLeagueV2();
  const { data: priceData } = useCurrentPrice(crypto.id);
  const formattedPrice = formatPythPrice(priceData);

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="h-auto p-3 justify-start text-left"
      onClick={onClick}
      disabled={isDisabled}
    >
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold">{crypto.symbol}</span>
          {isSelected && <Badge variant="secondary" className="text-xs">Selected</Badge>}
        </div>
        <div className="text-xs opacity-70 mb-1">{crypto.name}</div>
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp className="w-3 h-3" />
          {formattedPrice ? (
            <span className="font-mono">{formattedPrice.formatted}</span>
          ) : (
            <span className="text-muted-foreground">Loading...</span>
          )}
        </div>
      </div>
    </Button>
  );
}