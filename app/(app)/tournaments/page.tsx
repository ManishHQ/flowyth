'use client';

import { useRouter } from 'next/navigation';
import { useTournamentActions } from '@/lib/hooks/useTournaments';
import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { useTournamentStore } from '@/lib/stores/tournament-store';
import { useDynamicContext } from '@/lib/dynamic';
import { Button } from '@/components/ui/button';

export default function TournamentsPage() {
  const { tournaments, tournamentsLoading, fetchTournaments } = useTournamentStore();
  const { getUSDCFaucet } = useTournamentActions();
  const { address, isConnected } = useAccount();
  const { setShowAuthFlow } = useDynamicContext();
  const [gettingFaucet, setGettingFaucet] = useState(false);
  const [showFaucet, setShowFaucet] = useState(false);

  // Fetch tournaments on mount and when user connects
  useEffect(() => {
    if (isConnected) {
      fetchTournaments();
    }
  }, [isConnected, fetchTournaments]);

  const router = useRouter();

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: CONTRACTS.USDC.address,
  });

  const handleJoinTournament = (tournamentAddress: string) => {
    router.push(`/tournaments/${tournamentAddress}`);
  };

  const handleGetFaucet = async () => {
    if (!isConnected) return;

    setGettingFaucet(true);
    try {
      await getUSDCFaucet();
      setShowFaucet(false);
    } catch (error) {
      console.error('Faucet failed:', error);
    } finally {
      setGettingFaucet(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return 'bg-green-500';
      case 'registration':
        return 'bg-blue-500';
      case 'finished':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return 'LIVE';
      case 'registration':
        return 'OPEN';
      case 'finished':
        return 'FINISHED';
      default:
        return status.toUpperCase();
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
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
            Tournaments
          </h1>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view and join tournaments
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          Tournaments
        </h1>

        {/* USDC Balance & Faucet */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">USDC Balance</p>
              <p className="text-lg font-semibold">
                {usdcBalance ? formatUnits(usdcBalance.value, 6) : '0'} USDC
              </p>
            </div>
            <button
              onClick={() => setShowFaucet(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              Get Test USDC
            </button>
          </div>

          {showFaucet && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 mb-3">
                Get free test USDC tokens to join tournaments (Flow testnet only)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleGetFaucet}
                  disabled={gettingFaucet}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {gettingFaucet ? 'Getting...' : 'Get 1000 USDC'}
                </button>
                <button
                  onClick={() => setShowFaucet(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tournaments List */}
        <div className="space-y-4">
          {tournamentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="bg-card border border-border rounded-lg p-4 mb-4 h-48"></div>
                <div className="bg-card border border-border rounded-lg p-4 mb-4 h-48"></div>
              </div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tournaments available</p>
            </div>
          ) : (
            tournaments.map((tournament) => (
              <div
                key={tournament.address}
                className="bg-card border border-border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-card-foreground">
                    {tournament.title}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(
                      tournament.status
                    )}`}
                  >
                    {getStatusText(tournament.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Prize Pool:</span>
                    <span className="font-semibold text-primary">
                      {tournament.prizePool} USDC
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Entry Fee:</span>
                    <span className="font-semibold">{tournament.entryFee} USDC</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span className="font-semibold">
                      {tournament.participants}/{tournament.maxParticipants}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Start Time:</span>
                    <span className="font-semibold">{formatTime(tournament.startTime)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>End Time:</span>
                    <span className="font-semibold">{formatTime(tournament.endTime)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  {tournament.status === 'Registration' && tournament.participants < tournament.maxParticipants ? (
                    <button
                      onClick={() => handleJoinTournament(tournament.address)}
                      className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Join Tournament
                    </button>
                  ) : tournament.status === 'Live' ? (
                    <button
                      onClick={() => handleJoinTournament(tournament.address)}
                      className="w-full bg-green-500 text-white py-2 rounded font-semibold hover:bg-green-600 transition-colors"
                    >
                      Watch Live
                    </button>
                  ) : tournament.status === 'Finished' ? (
                    <button
                      onClick={() => handleJoinTournament(tournament.address)}
                      className="w-full bg-gray-500 text-white py-2 rounded font-semibold hover:bg-gray-600 transition-colors"
                    >
                      View Results
                    </button>
                  ) : (
                    <button className="w-full bg-gray-400 text-white py-2 rounded font-semibold cursor-not-allowed" disabled>
                      Tournament Full
                    </button>
                  )}
                </div>

                {tournament.participants > 0 && (
                  <div className="mt-3">
                    <div className="bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(tournament.participants / tournament.maxParticipants) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {tournament.maxParticipants - tournament.participants} spots left
                    </p>
                  </div>
                )}

                {/* Contract Address for debugging */}
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-mono">
                    {tournament.address}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-colors">
            Create Tournament
          </button>
        </div>
      </div>
    </div>
  );
}