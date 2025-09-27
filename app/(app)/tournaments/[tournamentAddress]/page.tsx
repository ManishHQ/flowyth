'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTournamentActions } from '@/lib/hooks/useTournaments';
import { useAccount, useBalance } from 'wagmi';
import { CONTRACTS, TOURNAMENT_UTILS } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { SquadService } from '@/lib/services/squad-service';
import type { AvailableToken } from '@/supabase';
import { useTournamentStore } from '@/lib/stores/tournament-store';
import { useDynamicContext } from '@/lib/dynamic';


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
      <DialogContent className="sm:max-w-md w-full max-h-[85vh] p-0 bg-card border-primary/20">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">
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
            ))}
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

  // Use tournament store
  const { tournamentDetails, fetchTournamentDetails, updateTournamentParticipants } = useTournamentStore();
  const details = tournamentDetails[tournamentAddress];
  const tournament = details?.tournament;
  const participants = details?.participants || [];
  const loading = details?.loading || false;
  const { joinTournament } = useTournamentActions();
  const { address, isConnected } = useAccount();
  const { setShowAuthFlow } = useDynamicContext();

  // Fetch tournament details on mount
  useEffect(() => {
    if (tournamentAddress) {
      fetchTournamentDetails(tournamentAddress);
    }
  }, [tournamentAddress, fetchTournamentDetails]);

  const [activeTab, setActiveTab] = useState<'participants' | 'lineup' | 'leaderboard'>('participants');
  const [showLineupBuilder, setShowLineupBuilder] = useState(false);
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<AvailableToken[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(true);

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: CONTRACTS.USDC.address,
  });

  // Load available tokens from database
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const tokens = await SquadService.getAvailableTokens();
        setAvailableTokens(tokens);
      } catch (error) {
        console.error('Failed to load tokens:', error);
      } finally {
        setTokensLoading(false);
      }
    };

    loadTokens();
  }, []);

  // Check if current user is already a participant
  useEffect(() => {
    if (address && participants.length > 0) {
      const isUserParticipant = participants.some(p => p.address.toLowerCase() === address.toLowerCase());
      setIsParticipant(isUserParticipant);
    }
  }, [address, participants]);

  const handleJoinTournament = async () => {
    if (!tournament || !address || isRegistering) return;

    const isLineupComplete = lineup.every(slot => slot.token !== undefined);
    if (!isLineupComplete) {
      alert('Please complete your lineup before joining the tournament');
      return;
    }

    setIsRegistering(true);
    try {
      await joinTournament(tournamentAddress, tournament.entryFee);

      // Update participant count in store
      updateTournamentParticipants(tournamentAddress, tournament.participants + 1);

      // Refresh tournament details
      await fetchTournamentDetails(tournamentAddress, true);

      setIsParticipant(true);
      setShowLineupBuilder(false);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
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
      case 'live': return 'bg-green-500';
      case 'registration': return 'bg-blue-500';
      case 'finished': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view tournament details and participate
            </p>
            <Button
              onClick={() => setShowAuthFlow(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
          </div>
          <div className="animate-pulse">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm mb-6 h-48"></div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Tournament Not Found</h2>
            <p className="text-muted-foreground">
              The tournament you're looking for doesn't exist or hasn't loaded yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Link href="/tournaments" className="text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        </div>

        {/* Tournament Info Card */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-card-foreground">
              {tournament.title}
            </h1>
            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(tournament.status)}`}>
              {tournament.status.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Build your crypto squad in football formation! Choose 1 striker, 2 midfielders, and 3 defenders.
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-muted-foreground">Prize Pool:</span>
              <div className="font-semibold text-primary">{tournament.prizePool} USDC</div>
            </div>
            <div>
              <span className="text-muted-foreground">Entry Fee:</span>
              <div className="font-semibold">{tournament.entryFee} USDC</div>
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

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Participants</span>
              <span className="font-semibold">{tournament.participants}/{tournament.maxParticipants}</span>
            </div>
            <div className="bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }}
              />
            </div>
          </div>

          {/* USDC Balance Display */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Your USDC Balance:</span>
              <span className="font-semibold">
                {usdcBalance ? formatUnits(usdcBalance.value, 6) : '0'} USDC
              </span>
            </div>
          </div>

          {!isParticipant && tournament.status === 'Registration' && tournament.participants < tournament.maxParticipants && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800">
                ⚽ <strong>Build your crypto lineup to join!</strong>
              </div>

              <button
                onClick={() => setShowLineupBuilder(true)}
                className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition-colors"
              >
                🏟️ Build Your Lineup
              </button>
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
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded transition-colors ${
              activeTab === 'participants' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Participants
          </button>
          <button
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded transition-colors ${
              activeTab === 'lineup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Lineup Builder
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded transition-colors ${
              activeTab === 'leaderboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'participants' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Participants ({participants.length})</h2>
            </div>
            {participants.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No participants yet</p>
              </div>
            ) : (
              participants.map((participant, index) => (
                <div key={participant.address} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* User Avatar */}
                      {participant.user?.photo_url ? (
                        <img
                          src={participant.user.photo_url}
                          alt={participant.user.username || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg">
                            {participant.user?.username?.[0]?.toUpperCase() || '🎮'}
                          </span>
                        </div>
                      )}

                      <div>
                        {/* User Info */}
                        {participant.user ? (
                          <>
                            <div className="font-medium text-sm">
                              {participant.user.full_name || participant.user.username}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{participant.user.username}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium font-mono text-sm">
                              {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Participant #{index + 1}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Participant Number Badge */}
                    <div className="text-xs text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">⚽ Build Your Lineup</h2>
              <div className="text-sm text-muted-foreground">
                {lineup.filter(slot => slot.token).length}/6 selected
              </div>
            </div>

            {/* Football Field */}
            <div className="h-[600px] relative bg-gradient-to-br from-green-600 via-green-500 to-green-700 shadow-inner overflow-hidden flex items-center justify-center p-2 rounded-lg">
              {/* Field Container */}
              <div className="relative w-full max-w-sm h-full bg-gradient-to-b from-green-400 to-green-500 rounded-3xl shadow-2xl border-4 border-white/30 overflow-hidden">
                {/* Field Lines */}
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

                {/* Token Formation - 1-2-2-1 */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-12">
                  {/* Striker (1) - Top of field */}
                  <div className="flex justify-center">
                    <TokenSlot
                      slot={lineup[0]}
                      onPress={() => handleSlotPress(lineup[0].id)}
                    />
                  </div>

                  {/* Midfielders (2) - Upper middle */}
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

                  {/* Defenders (2) - Lower middle */}
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

            {/* Crypto Picker Modal */}
            <CryptoPickerModal
              isOpen={showPicker}
              onClose={() => setShowPicker(false)}
              cryptos={availableTokens}
              category={selectedCategory}
              onSelect={handleTokenSelect}
              selectedIds={lineup.filter(slot => slot.token).map(slot => slot.token!.id)}
            />

            {/* Squad Summary */}
            {lineup.filter(slot => slot.token).length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Your Squad</h3>
                <div className="space-y-2">
                  {lineup.filter(slot => slot.token).map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between">
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
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={handleJoinTournament}
                      disabled={isRegistering}
                      className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isRegistering ? '🔄 Joining...' : '🚀 Join Tournament with This Lineup'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            {tournament.status === 'Registration' ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-2">⏳</div>
                <p>Leaderboard will be available once the tournament starts!</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">Tournament results will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}