'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import DynamicWidget from '@/components/dynamic/dynamic-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bullet } from '@/components/ui/bullet';
import { cn } from '@/lib/utils';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { useWeb3Provider } from '@/lib/hooks/useWeb3Provider';

// Mock tournament data for now - will be replaced with contract integration
const mockTournaments = [
  {
    id: '1',
    address: '0x1234567890123456789012345678901234567890',
    title: 'Crypto Champions League',
    status: 'Registration',
    prizePool: '5000',
    entryFee: '100',
    participants: 12,
    maxParticipants: 20,
    startTime: Date.now() + 3600000, // 1 hour from now
    endTime: Date.now() + 7200000, // 2 hours from now
  },
  {
    id: '2',
    address: '0x2345678901234567890123456789012345678901',
    title: 'DeFi Derby',
    status: 'Live',
    prizePool: '2500',
    entryFee: '50',
    participants: 16,
    maxParticipants: 16,
    startTime: Date.now() - 1800000, // 30 minutes ago
    endTime: Date.now() + 1800000, // 30 minutes from now
  },
  {
    id: '3',
    address: '0x3456789012345678901234567890123456789012',
    title: 'Altcoin Arena',
    status: 'Finished',
    prizePool: '1000',
    entryFee: '25',
    participants: 8,
    maxParticipants: 10,
    startTime: Date.now() - 7200000, // 2 hours ago
    endTime: Date.now() - 3600000, // 1 hour ago
  }
];

export default function TournamentsPage() {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const walletAddress = primaryWallet?.address;
  const router = useRouter();
  
  const { tournaments, loading, error } = useTournaments();
  const { isInitialized, error: web3Error } = useWeb3Provider();

  const handleJoinTournament = (tournamentAddress: string) => {
    router.push(`/tournaments/${tournamentAddress}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return 'success';
      case 'registration':
        return 'warning';
      case 'finished':
        return 'destructive';
      default:
        return 'default';
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
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>🏆 TOURNAMENTS</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Compete in crypto fantasy tournaments with real prizes
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2.5">
                <Bullet variant="warning" />
                CONNECT WALLET TO COMPETE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Connect your wallet to view and join tournaments!
                </p>
                <div className="max-w-sm mx-auto">
                  <DynamicWidget />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-center">How Tournaments Work:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Build your crypto squad in football formation</p>
                  <p>• Choose 1 striker, 2 midfielders, 3 defenders</p>
                  <p>• Compete based on real price performance</p>
                  <p>• Win prizes based on your squad's performance!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>🏆 TOURNAMENTS</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Compete in crypto fantasy tournaments with real prizes
          </p>
        </div>

        {/* Wallet Info */}
        <Card>
                  <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="success" />
              WALLET CONNECTED
                    </CardTitle>
                  </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
                    <div>
                <p className="text-sm text-muted-foreground">Connected Address</p>
                <p className="font-mono text-sm">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Get Test USDC
                          </Button>
                      </div>
          </CardContent>
        </Card>

        {/* Tournaments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Available Tournaments</h2>
            <Button variant="outline">
              Create Tournament
            </Button>
                    </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">🏟️</div>
                <h3 className="text-lg font-semibold mb-2">No tournaments available</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a tournament!
                </p>
                <Button>Create First Tournament</Button>
              </CardContent>
            </Card>
          ) : (
            tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{tournament.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Bullet variant={getStatusColor(tournament.status)} />
                      <span className="text-xs font-bold">
                        {getStatusText(tournament.status)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                      <span className="text-muted-foreground">Prize Pool</span>
                      <div className="font-semibold text-primary text-lg">
                        ${tournament.prizePool}
                      </div>
                    </div>
                      <div>
                      <span className="text-muted-foreground">Entry Fee</span>
                      <div className="font-semibold text-lg">${tournament.entryFee}</div>
                    </div>
                      <div>
                      <span className="text-muted-foreground">Participants</span>
                      <div className="font-semibold text-lg">
                        {tournament.participants}/{tournament.maxParticipants}
                      </div>
                    </div>
                      <div>
                      <span className="text-muted-foreground">Start Time</span>
                      <div className="font-semibold text-lg">
                        {formatTime(tournament.startTime)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Registration Progress</span>
                      <span className="font-medium">
                        {tournament.maxParticipants - tournament.participants} spots left
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(tournament.participants / tournament.maxParticipants) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {tournament.status === 'Registration' && tournament.participants < tournament.maxParticipants ? (
                      <Button
                        onClick={() => handleJoinTournament(tournament.address)}
                        className="w-full"
                        size="lg"
                      >
                        Join Tournament
                      </Button>
                    ) : tournament.status === 'Live' ? (
                      <Button
                        onClick={() => handleJoinTournament(tournament.address)}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Watch Live
                      </Button>
                    ) : tournament.status === 'Finished' ? (
                      <Button
                        onClick={() => handleJoinTournament(tournament.address)}
                        variant="secondary"
                        className="w-full"
                        size="lg"
                      >
                        View Results
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full"
                        size="lg"
                      >
                        Tournament Full
                      </Button>
                    )}
                  </div>

                  {/* Contract Address */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-mono">
                      Contract: {tournament.address}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <Bullet />
              HOW TOURNAMENTS WORK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">🏗️ Build Your Squad</h4>
                <p className="text-muted-foreground">
                  Choose your crypto lineup in football formation: 1 striker, 2 midfielders, 3 defenders
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📈 Real Performance</h4>
                <p className="text-muted-foreground">
                  Your squad's score is based on real cryptocurrency price movements during the tournament
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🏆 Win Prizes</h4>
                <p className="text-muted-foreground">
                  Top performers share the prize pool based on their squad's performance
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">⚡ Live Updates</h4>
                <p className="text-muted-foreground">
                  Watch your squad compete in real-time with live price feeds from Pyth Network
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}