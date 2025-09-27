'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Users, TrendingUp } from 'lucide-react';

interface AvailableToken {
  id: string;
  symbol: string;
  name: string;
  logo_emoji: string;
  category: 'striker' | 'midfielder' | 'defender';
  multiplier: number;
}

interface LineupSlot {
  id: string;
  position: number;
  token?: AvailableToken;
  category: 'striker' | 'midfielder' | 'defender';
}

const mockTokens: AvailableToken[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', logo_emoji: '₿', category: 'striker', multiplier: 2.5 },
  { id: '2', symbol: 'ETH', name: 'Ethereum', logo_emoji: 'Ξ', category: 'striker', multiplier: 2.2 },
  { id: '3', symbol: 'AVAX', name: 'Avalanche', logo_emoji: '🔺', category: 'midfielder', multiplier: 1.8 },
  { id: '4', symbol: 'LINK', name: 'Chainlink', logo_emoji: '🔗', category: 'midfielder', multiplier: 1.5 },
  { id: '5', symbol: 'USDC', name: 'USD Coin', logo_emoji: '💵', category: 'defender', multiplier: 1.0 },
  { id: '6', symbol: 'USDT', name: 'Tether', logo_emoji: '💰', category: 'defender', multiplier: 1.0 },
];

interface TokenSlotProps {
  slot: LineupSlot;
  onPress: () => void;
}

interface CryptoPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (crypto: AvailableToken) => void;
  selectedTokens: AvailableToken[];
  category: 'striker' | 'midfielder' | 'defender';
  availableTokens: AvailableToken[];
}

function TokenSlot({ slot, onPress }: TokenSlotProps) {
  const getCategoryVariant = () => {
    if (slot.position === 6) {
      return 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-400 text-white shadow-green-500/50';
    }

    switch (slot.category) {
      case 'striker':
        return 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400 text-white shadow-red-500/50';
      case 'midfielder':
        return 'bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-yellow-400 text-white shadow-yellow-500/50';
      case 'defender':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-blue-400 text-white shadow-blue-500/50';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 border-gray-300 text-white shadow-gray-500/50';
    }
  };

  return (
    <Button
      onClick={onPress}
      variant="outline"
      size="icon"
      className={`w-16 h-16 md:w-18 md:h-18 rounded-full p-0 transition-all duration-300 hover:scale-110 border-4 shadow-xl backdrop-blur-sm ${
        slot.token ? getCategoryVariant() : 'bg-gradient-to-br from-white/90 to-gray-100 hover:from-white hover:to-gray-50 border-dashed border-4 border-gray-300 text-gray-600 shadow-lg'
      }`}
    >
      {slot.token ? (
        <div className="text-center">
          <div className="text-lg sm:text-xl md:text-2xl mb-1 drop-shadow-sm">{slot.token.logo_emoji}</div>
          <div className="text-xs font-bold drop-shadow-sm">{slot.token.symbol}</div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-gray-500">+</div>
      )}
    </Button>
  );
}

function CryptoPicker({ visible, onClose, onSelect, selectedTokens, category, availableTokens }: CryptoPickerProps) {
  const selectedIds = selectedTokens.map(t => t.id);
  const categoryTokens = availableTokens.filter(token => token.category === category);

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full max-h-[85vh] p-0 bg-card border-primary/20">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">
            Choose {category.charAt(0).toUpperCase() + category.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-3 pb-4">
            {categoryTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">🔍</div>
                <div className="text-sm">No {category}s available</div>
                <div className="text-xs mt-2 text-muted-foreground/70">Database might not be set up yet</div>
              </div>
            ) : (
              categoryTokens.map(crypto => (
                <Button
                  key={crypto.id}
                  onClick={() => {
                    onSelect(crypto);
                    onClose();
                  }}
                  disabled={selectedIds.includes(crypto.id)}
                  variant="outline"
                  className={`w-full h-auto p-4 justify-start text-left ${
                    selectedIds.includes(crypto.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent hover:border-primary/50 transition-all duration-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{crypto.logo_emoji}</span>
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{crypto.symbol}</div>
                        <div className="text-sm text-muted-foreground">{crypto.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {crypto.multiplier}x
                      </Badge>
                      <div className="text-xs text-muted-foreground capitalize mt-1">
                        {crypto.category}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-0 border-t border-border">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const dynamic = 'force-dynamic';

export default function CreateSquadPage() {
  const [activeTab, setActiveTab] = useState<'lineup' | 'leaderboard' | 'prices'>('lineup');
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { id: '1', position: 1, category: 'striker' },
    { id: '2', position: 2, category: 'midfielder' },
    { id: '3', position: 3, category: 'midfielder' },
    { id: '4', position: 4, category: 'defender' },
    { id: '5', position: 5, category: 'defender' },
    { id: '6', position: 6, category: 'defender' }
  ]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'striker' | 'midfielder' | 'defender'>('striker');

  const selectedTokens = lineup.filter(slot => slot.token).map(slot => slot.token!);
  const totalScore = selectedTokens.reduce((sum, token) => sum + (token.multiplier * 100), 0);

  const handleSlotPress = (slotId: string) => {
    const slot = lineup.find(s => s.id === slotId);
    if (slot) {
      setSelectedSlot(slotId);
      setSelectedCategory(slot.category);
      setShowPicker(true);
    }
  };

  const handleTokenSelect = (crypto: AvailableToken) => {
    if (selectedSlot) {
      setLineup(prev => prev.map(slot =>
        slot.id === selectedSlot ? { ...slot, token: crypto } : slot
      ));
    }
  };

  const isSquadComplete = () => {
    return lineup.every(slot => slot.token !== undefined);
  };

  const handleRegisterSquad = async () => {
    if (!isSquadComplete()) return;
    alert('Squad registered successfully! (Demo mode)');
  };

  const renderFootballField = () => (
    <div className="relative flex-1 bg-gradient-to-br from-green-600 via-green-500 to-green-700 shadow-inner overflow-hidden flex items-center justify-center p-2">
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg h-full max-h-[calc(100vh-200px)] bg-gradient-to-b from-green-400 to-green-500 rounded-3xl shadow-2xl border-4 border-white/30 overflow-hidden">
        {/* Field Lines */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-green-600/20" />

          <div className="absolute inset-3 border-3 border-white/80 rounded-xl shadow-lg" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-3 border-white/90 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
          <div className="absolute top-1/2 left-3 right-3 h-1 bg-white/90 -translate-y-0.5 shadow-sm" />

          <div className="absolute top-3 left-1/2 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-20 border-3 border-white/90 border-t-0 -translate-x-1/2 bg-green-300/40 shadow-lg" />
          <div className="absolute bottom-3 left-1/2 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-20 border-3 border-white/90 border-b-0 -translate-x-1/2 bg-green-300/40 shadow-lg" />

          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/95 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
        </div>
      </div>

      {/* Token Formation - 1-2-2-1 */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-12">
        <div className="flex justify-center">
          <TokenSlot
            slot={lineup[0]}
            onPress={() => handleSlotPress(lineup[0].id)}
          />
        </div>

        <div className="flex justify-center gap-8 sm:gap-12">
          <TokenSlot
            slot={lineup[1]}
            onPress={() => handleSlotPress(lineup[1].id)}
          />
          <TokenSlot
            slot={lineup[2]}
            onPress={() => handleSlotPress(lineup[2].id)}
          />
        </div>

        <div className="flex justify-center gap-8 sm:gap-12">
          <TokenSlot
            slot={lineup[3]}
            onPress={() => handleSlotPress(lineup[3].id)}
          />
          <TokenSlot
            slot={lineup[4]}
            onPress={() => handleSlotPress(lineup[4].id)}
          />
        </div>

        <div className="flex justify-center">
          <TokenSlot
            slot={lineup[5]}
            onPress={() => handleSlotPress(lineup[5].id)}
          />
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="flex-1 px-4 pt-4 bg-gradient-to-br from-slate-900 to-slate-800 overflow-y-auto">
      <Card className="p-4 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4 text-center">🏆 Tournament Leaderboard</h3>
        {[
          { rank: 1, name: 'CryptoKing', points: 156 },
          { rank: 2, name: 'DiamondHands', points: 142 },
          { rank: 3, name: 'MoonBoy', points: 138 },
          { rank: 67, name: 'You', points: totalScore, isUser: true }
        ].map((entry, index) => (
          <div key={index} className={`flex items-center justify-between py-3 ${entry.isUser ? 'bg-accent -mx-2 px-2 rounded-lg border' : ''}`}>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-lg ${entry.isUser ? 'text-primary' : 'text-muted-foreground'}`}>
                #{entry.rank}
              </span>
              <span className={`font-semibold ${entry.isUser ? 'text-foreground' : 'text-foreground'}`}>
                {entry.name}
              </span>
            </div>
            <span className={`font-bold ${entry.points >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              {entry.points >= 0 ? '+' : ''}{entry.points} pts
            </span>
          </div>
        ))}
      </Card>
    </div>
  );

  const renderLivePrices = () => (
    <div className="flex-1 px-4 pt-4 bg-background overflow-y-auto">
      <Card className="p-4 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4 text-center">💎 Your Squad Tokens</h3>
        {selectedTokens.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-4xl mb-4">⚽</div>
            <div>No tokens selected yet. Build your squad first!</div>
          </div>
        ) : (
          selectedTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{token.logo_emoji}</span>
                <div>
                  <div className="font-bold text-foreground">{token.symbol}</div>
                  <div className="text-muted-foreground text-sm">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">
                  {token.multiplier}x multiplier
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {token.category}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-primary">
        <h1 className="text-primary-foreground text-2xl sm:text-3xl font-bold text-center mb-1">⚽ Crypto Fantasy League</h1>
        <p className="text-primary-foreground/90 text-center text-sm sm:text-base">💰 Entry: $5 USDC • Formation: 1-2-2-1</p>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'lineup' && renderFootballField()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'prices' && renderLivePrices()}
      </div>

      {/* Register Button */}
      {activeTab === 'lineup' && isSquadComplete() && (
        <div className="flex-shrink-0 bg-card border-t border-border px-4 py-3">
          <Button
            onClick={handleRegisterSquad}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 text-base sm:text-lg"
          >
            🚀 REGISTER SQUAD ($5 USDC)
          </Button>
        </div>
      )}

      {/* Bottom Tab Navigation */}
      <div className="flex-shrink-0 bg-card border-t border-border px-4 py-2">
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab('lineup')}
            variant={activeTab === 'lineup' ? 'default' : 'ghost'}
            className={`flex-1 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 ${
              activeTab === 'lineup'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Lineup</span>
            <span className="sm:hidden">⚽</span>
          </Button>
          <Button
            onClick={() => setActiveTab('leaderboard')}
            variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
            className={`flex-1 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 ${
              activeTab === 'leaderboard'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="sm:hidden">🏆</span>
          </Button>
          <Button
            onClick={() => setActiveTab('prices')}
            variant={activeTab === 'prices' ? 'default' : 'ghost'}
            className={`flex-1 py-2 sm:py-3 rounded-xl font-bold transition-all duration-200 ${
              activeTab === 'prices'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Squad</span>
            <span className="sm:hidden">💎</span>
          </Button>
        </div>
      </div>

      <CryptoPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleTokenSelect}
        selectedTokens={selectedTokens}
        category={selectedCategory}
        availableTokens={mockTokens}
      />
    </div>
  );
}