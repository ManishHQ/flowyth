'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import DynamicWidget from '@/components/dynamic/dynamic-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bullet } from '@/components/ui/bullet';
import { cn } from '@/lib/utils';
import type { AvailableToken } from '@/lib/supabase';
import { useTournament, useTournamentRegistration, useSquad } from '@/lib/hooks/useTournaments';

// Mock data - will be replaced with contract integration
const mockTournament = {
  id: '1',
  address: '0x1234567890123456789012345678901234567890',
  title: 'Crypto Champions League',
  status: 'Registration',
  prizePool: '5000',
  entryFee: '100',
  participants: 12,
  maxParticipants: 20,
  startTime: Date.now() + 3600000,
  endTime: Date.now() + 7200000,
};

const mockParticipants = [
  { address: '0x1111111111111111111111111111111111111111', username: 'CryptoKing' },
  { address: '0x2222222222222222222222222222222222222222', username: 'DeFiMaster' },
  { address: '0x3333333333333333333333333333333333333333', username: 'BlockchainBoss' },
];

// Mock available tokens - will be fetched from database
const mockTokens: AvailableToken[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', category: 'striker', multiplier: 10, logo_emoji: '₿', pyth_price_id: 'btc-id', is_active: true, created_at: '' },
  { id: '2', symbol: 'ETH', name: 'Ethereum', category: 'striker', multiplier: 8, logo_emoji: 'Ξ', pyth_price_id: 'eth-id', is_active: true, created_at: '' },
  { id: '3', symbol: 'SOL', name: 'Solana', category: 'midfielder', multiplier: 5, logo_emoji: '◎', pyth_price_id: 'sol-id', is_active: true, created_at: '' },
  { id: '4', symbol: 'LINK', name: 'Chainlink', category: 'midfielder', multiplier: 4, logo_emoji: '🔗', pyth_price_id: 'link-id', is_active: true, created_at: '' },
  { id: '5', symbol: 'ADA', name: 'Cardano', category: 'defender', multiplier: 3, logo_emoji: '🔵', pyth_price_id: 'ada-id', is_active: true, created_at: '' },
  { id: '6', symbol: 'DOT', name: 'Polkadot', category: 'defender', multiplier: 3, logo_emoji: '🟣', pyth_price_id: 'dot-id', is_active: true, created_at: '' },
  { id: '7', symbol: 'USDC', name: 'USD Coin', category: 'defender', multiplier: 1, logo_emoji: '💵', pyth_price_id: 'usdc-id', is_active: true, created_at: '' },
];

interface LineupSlot {
  id: string;
  position: number;
  token?: AvailableToken;
  category: 'striker' | 'midfielder' | 'defender';
}

// Crypto Picker Modal
interface CryptoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cryptos: AvailableToken[];
  category: 'striker' | 'midfielder' | 'defender';
  onSelect: (crypto: AvailableToken) => void;
  selectedIds: string[];
}

function CryptoPickerModal({
  isOpen,
  onClose,
  cryptos,
  category,
  onSelect,
  selectedIds
}: CryptoPickerModalProps) {
  const filteredCryptos = cryptos.filter(crypto => crypto.category === category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            Choose {category.charAt(0).toUpperCase() + category.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-3 pb-4">
            {filteredCryptos.map(crypto => (
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
                      <div className="font-semibold">{crypto.symbol}</div>
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
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 pt-0 border-t">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Token Slot Component
function TokenSlot({ slot, onPress }: { slot: LineupSlot; onPress: () => void }) {
  const getCategoryVariant = () => {
    // Special styling for goalkeeper (position 6)
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
    <button
      onClick={onPress}
      className={`w-12 h-12 md:w-16 md:h-16 rounded-full p-0 transition-all duration-300 hover:scale-110 border-4 shadow-xl backdrop-blur-sm ${
        slot.token ? getCategoryVariant() : 'bg-gradient-to-br from-white/90 to-gray-100 hover:from-white hover:to-gray-50 border-dashed border-4 border-gray-300 text-gray-600 shadow-lg'
      }`}
    >
      {slot.token ? (
        <div className="text-center">
          <div className="text-sm md:text-lg mb-1 drop-shadow-sm">{slot.token.logo_emoji}</div>
          <div className="text-xs font-bold drop-shadow-sm">{slot.token.symbol}</div>
        </div>
      ) : (
        <div className="text-xl font-bold text-gray-500">+</div>
      )}
    </button>
  );
}

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentAddress = params.tournamentAddress as string;
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const walletAddress = primaryWallet?.address;

  const { tournament, participants, loading } = useTournament(tournamentAddress);
  const { registerForTournament, loading: registering } = useTournamentRegistration();
  const { squad, saveSquad } = useSquad(tournamentAddress, walletAddress || '');
  const [activeTab, setActiveTab] = useState<'participants' | 'lineup' | 'leaderboard'>('participants');
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { id: '1', position: 1, category: 'striker' },      // 1 Striker
    { id: '2', position: 2, category: 'midfielder' },   // 2 Midfielders
    { id: '3', position: 3, category: 'midfielder' },
    { id: '4', position: 4, category: 'defender' },     // 2 Defenders
    { id: '5', position: 5, category: 'defender' },
    { id: '6', position: 6, category: 'defender' }      // 1 Goalkeeper (defender category)
  ]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'striker' | 'midfielder' | 'defender'>('striker');
  const [isParticipant, setIsParticipant] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<AvailableToken[]>(mockTokens);
  const [showPicker, setShowPicker] = useState(false);

  // Load squad from saved data if available
  useEffect(() => {
    if (squad && squad.tokens) {
      // Update lineup with saved squad
      setLineup(prev => prev.map(slot => {
        const savedToken = squad.tokens.find(t => t.position === slot.position);
        if (savedToken) {
          const token = availableTokens.find(at => at.id === savedToken.tokenId);
          return { ...slot, token };
        }
        return slot;
      }));
    }
  }, [squad, availableTokens]);

  // Check if current user is already a participant
  useEffect(() => {
    if (walletAddress && participants.length > 0) {
      const isUserParticipant = participants.some(p => p.address.toLowerCase() === walletAddress.toLowerCase());
      setIsParticipant(isUserParticipant);
    }
  }, [walletAddress, participants]);

  const handleJoinTournament = async () => {
    if (!tournament || !walletAddress || registering) return;

    const isLineupComplete = lineup.every(slot => slot.token !== undefined);
    if (!isLineupComplete) {
      alert('Please complete your lineup before joining the tournament');
      return;
    }

    try {
      // Convert lineup to squad format
      const squadTokens = lineup.map(slot => ({
        position: slot.position,
        tokenId: slot.token!.id,
        category: slot.category,
      }));

      // Register for tournament
      await registerForTournament(tournamentAddress, walletAddress, squadTokens);
      
      setIsParticipant(true);
      alert('Successfully joined the tournament!');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    }
  };

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
      setSelectedSlot(null);
      setShowPicker(false);
    }
  };

  const isSquadComplete = () => {
    return lineup.every(slot => slot.token !== undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live': return 'success';
      case 'registration': return 'warning';
      case 'finished': return 'destructive';
      default: return 'default';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading screen if SDK hasn't loaded
  if (!sdkHasLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center mb-4">
            <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
              ← Back to Tournaments
            </Link>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2.5">
                <Bullet variant="warning" />
                CONNECT WALLET TO VIEW TOURNAMENT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Connect your wallet to view tournament details and participate
                </p>
                <div className="max-w-sm mx-auto">
                  <DynamicWidget />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
              ← Back to Tournaments
            </Link>
          </div>
          <div className="animate-pulse space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
            ← Back to Tournaments
          </Link>
        </div>

        {/* Tournament Info Card */}
        {tournament && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{tournament.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Bullet variant={getStatusColor(tournament.status)} />
                  <span className="text-xs font-bold">
                    {tournament.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Build your crypto squad in football formation! Choose 1 striker, 2 midfielders, and 3 defenders.
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <div className="font-semibold text-primary text-lg">${tournament.prizePool}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Entry Fee:</span>
                  <div className="font-semibold text-lg">${tournament.entryFee}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Time:</span>
                  <div className="font-semibold">{formatTime(tournament.startTime)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">End Time:</span>
                  <div className="font-semibold">{formatTime(tournament.endTime)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="font-semibold">{tournament.participants}/{tournament.maxParticipants}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }}
                  />
                </div>
              </div>

              {!isParticipant && tournament.status === 'Registration' && tournament.participants < tournament.maxParticipants && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900 dark:border-blue-800 rounded text-sm dark:text-blue-800">
                    ⚽ <strong>Build your crypto lineup to join!</strong>
                  </div>
                </div>
              )}

              {isParticipant && (
                <div className="bg-green-50 border border-green-200 p-3 rounded text-center">
                  <div className="text-green-800 font-semibold mb-1">
                    ✅ You're in this tournament!
                  </div>
                  <div className="text-sm text-green-600">
                    Ready to compete in the tournament!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'participants' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Participants
          </button>
          <button
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'lineup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Lineup Builder
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded transition-colors ${
              activeTab === 'leaderboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'participants' && (
          <Card>
            <CardHeader>
              <CardTitle>Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No participants yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant, index) => (
                    <div key={participant.address} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{participant.username}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'lineup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ⚽ Build Your Lineup
                <span className="text-sm text-muted-foreground">
                  {lineup.filter(slot => slot.token).length}/6 selected
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Football Field */}
              <div className="h-[500px] relative bg-gradient-to-br from-green-600 via-green-500 to-green-700 shadow-inner overflow-hidden flex items-center justify-center p-4 rounded-lg">
                {/* Field Container */}
                <div className="relative w-full max-w-sm h-full bg-gradient-to-b from-green-400 to-green-500 rounded-3xl shadow-2xl border-4 border-white/30 overflow-hidden">
                  {/* Field Lines */}
                  <div className="absolute inset-0">
                    {/* Grass texture overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-green-600/20" />

                    {/* Outer field border */}
                    <div className="absolute inset-3 border-2 border-white/80 rounded-xl shadow-lg" />

                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white/90 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />

                    {/* Center Line */}
                    <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-white/90 -translate-y-0.5 shadow-sm" />

                    {/* Center spot */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/95 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />
                  </div>

                  {/* Token Formation - 1-2-2-1 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-8">
                    {/* Striker (1) - Top of field */}
                    <div className="flex justify-center">
                      <TokenSlot
                        slot={lineup[0]}
                        onPress={() => handleSlotPress(lineup[0].id)}
                      />
                    </div>

                    {/* Midfielders (2) - Upper middle */}
                    <div className="flex justify-center gap-12">
                      <TokenSlot
                        slot={lineup[1]}
                        onPress={() => handleSlotPress(lineup[1].id)}
                      />
                      <TokenSlot
                        slot={lineup[2]}
                        onPress={() => handleSlotPress(lineup[2].id)}
                      />
                    </div>

                    {/* Defenders (2) - Lower middle */}
                    <div className="flex justify-center gap-12">
                      <TokenSlot
                        slot={lineup[3]}
                        onPress={() => handleSlotPress(lineup[3].id)}
                      />
                      <TokenSlot
                        slot={lineup[4]}
                        onPress={() => handleSlotPress(lineup[4].id)}
                      />
                    </div>

                    {/* Goalkeeper (1) - Bottom of field */}
                    <div className="flex justify-center">
                      <TokenSlot
                        slot={lineup[5]}
                        onPress={() => handleSlotPress(lineup[5].id)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Squad Summary */}
              {lineup.filter(slot => slot.token).length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Your Squad</h3>
                  <div className="space-y-2">
                    {lineup.filter(slot => slot.token).map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{slot.token!.logo_emoji}</span>
                          <span className="font-medium">{slot.token!.symbol}</span>
                          <span className="text-sm text-muted-foreground capitalize">({slot.category})</span>
                        </div>
                        <span className="text-sm font-semibold">{slot.token!.multiplier}x</span>
                      </div>
                    ))}
                  </div>

                  {isSquadComplete() && !isParticipant && (
                    <Button
                      onClick={handleJoinTournament}
                      disabled={registering}
                      className="w-full"
                      size="lg"
                    >
                      {registering ? '🔄 Joining...' : '🚀 Join Tournament with This Lineup'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'leaderboard' && (
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {tournament?.status === 'Registration' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-muted-foreground">Leaderboard will be available once the tournament starts!</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Tournament results will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Crypto Picker Modal */}
        <CryptoPickerModal
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          cryptos={availableTokens}
          category={selectedCategory}
          onSelect={handleTokenSelect}
          selectedIds={lineup.filter(slot => slot.token).map(slot => slot.token!.id)}
        />
      </div>
    </div>
  );
}
