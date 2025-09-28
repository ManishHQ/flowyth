'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bullet } from '@/components/ui/bullet';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from "@number-flow/react";
import { Clock, Users, Trophy, Target, Coins, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tournament {
  id: number;
  name: string;
  entryFee: number;
  registrationStart: number;
  registrationEnd: number;
  startTime: number;
  endTime: number;
  maxParticipants: number;
  totalParticipants: number;
  groupCount: number;
  state: 'REGISTRATION' | 'ACTIVE' | 'FINISHED' | 'FINALIZED';
  totalPrizePool: number;
}

interface CryptoAsset {
  pythId: string;
  symbol: string;
  name: string;
  isActive: boolean;
}

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [supportedCryptos, setSupportedCryptos] = useState<CryptoAsset[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Mock data for development
  useEffect(() => {
    const mockTournaments: Tournament[] = [
      {
        id: 1,
        name: "Crypto Championship League",
        entryFee: 0.01,
        registrationStart: Date.now() / 1000,
        registrationEnd: (Date.now() + 30 * 60 * 1000) / 1000, // 30 min from now
        startTime: (Date.now() + 60 * 60 * 1000) / 1000, // 1 hour from now
        endTime: (Date.now() + 75 * 60 * 1000) / 1000, // 1h 15m from now
        maxParticipants: 100,
        totalParticipants: 23,
        groupCount: 5,
        state: 'REGISTRATION',
        totalPrizePool: 0.23
      },
      {
        id: 2,
        name: "Quick Trading Battle",
        entryFee: 0.005,
        registrationStart: (Date.now() - 60 * 60 * 1000) / 1000,
        registrationEnd: (Date.now() + 10 * 60 * 1000) / 1000,
        startTime: (Date.now() + 20 * 60 * 1000) / 1000,
        endTime: (Date.now() + 35 * 60 * 1000) / 1000,
        maxParticipants: 50,
        totalParticipants: 47,
        groupCount: 9,
        state: 'REGISTRATION',
        totalPrizePool: 0.235
      },
      {
        id: 3,
        name: "Elite Traders Cup",
        entryFee: 0.02,
        registrationStart: (Date.now() - 120 * 60 * 1000) / 1000,
        registrationEnd: (Date.now() - 60 * 60 * 1000) / 1000,
        startTime: (Date.now() - 30 * 60 * 1000) / 1000,
        endTime: (Date.now() + 15 * 60 * 1000) / 1000,
        maxParticipants: 80,
        totalParticipants: 64,
        groupCount: 13,
        state: 'ACTIVE',
        totalPrizePool: 1.28
      }
    ];

    const mockCryptos: CryptoAsset[] = [
      { pythId: 'btc', symbol: 'BTC', name: 'Bitcoin', isActive: true },
      { pythId: 'eth', symbol: 'ETH', name: 'Ethereum', isActive: true },
      { pythId: 'sol', symbol: 'SOL', name: 'Solana', isActive: true },
      { pythId: 'link', symbol: 'LINK', name: 'Chainlink', isActive: true },
      { pythId: 'ada', symbol: 'ADA', name: 'Cardano', isActive: true },
      { pythId: 'dot', symbol: 'DOT', name: 'Polkadot', isActive: true },
      { pythId: 'matic', symbol: 'MATIC', name: 'Polygon', isActive: true },
      { pythId: 'avax', symbol: 'AVAX', name: 'Avalanche', isActive: true },
      { pythId: 'doge', symbol: 'DOGE', name: 'Dogecoin', isActive: true },
      { pythId: 'usdt', symbol: 'USDT', name: 'Tether', isActive: true }
    ];

    setTournaments(mockTournaments);
    setSupportedCryptos(mockCryptos);
  }, []);

  const formatTimeLeft = (timestamp: number): string => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;

    if (diff <= 0) return "Time's up!";

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getStateColor = (state: Tournament['state']) => {
    switch (state) {
      case 'REGISTRATION': return 'bg-blue-500';
      case 'ACTIVE': return 'bg-green-500';
      case 'FINISHED': return 'bg-yellow-500';
      case 'FINALIZED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateText = (state: Tournament['state']) => {
    switch (state) {
      case 'REGISTRATION': return 'Open Registration';
      case 'ACTIVE': return 'Live Tournament';
      case 'FINISHED': return 'Calculating Results';
      case 'FINALIZED': return 'Completed';
      default: return state;
    }
  };

  const toggleCryptoSelection = (cryptoId: string) => {
    setSelectedSquad(prev => {
      if (prev.includes(cryptoId)) {
        return prev.filter(id => id !== cryptoId);
      } else if (prev.length < 6) {
        return [...prev, cryptoId];
      }
      return prev;
    });
  };

  const handleRegister = async (tournament: Tournament) => {
    if (selectedSquad.length !== 6) {
      alert('Please select exactly 6 cryptocurrencies for your squad');
      return;
    }

    setIsRegistering(true);

    // Simulate registration process
    setTimeout(() => {
      alert(`Successfully registered for ${tournament.name}!`);
      setIsRegistering(false);
      setSelectedTournament(null);
      setSelectedSquad([]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold" style={{ fontFamily: 'var(--font-rebels), serif' }}>
            🏆 CRYPTO TOURNAMENTS
          </h1>
          <p className="text-muted-foreground text-lg">
            Join group-based trading tournaments and compete for prizes
          </p>
        </div>

        {/* Tournament Registration Modal */}
        <AnimatePresence>
          {selectedTournament && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedTournament(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Register for {selectedTournament.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTournament(null)}
                      >
                        ✕
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Squad Selection */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Select Your Squad ({selectedSquad.length}/6)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {supportedCryptos.map((crypto) => (
                          <Button
                            key={crypto.pythId}
                            variant={selectedSquad.includes(crypto.pythId) ? "default" : "outline"}
                            size="sm"
                            className="justify-start"
                            onClick={() => toggleCryptoSelection(crypto.pythId)}
                            disabled={!selectedSquad.includes(crypto.pythId) && selectedSquad.length >= 6}
                          >
                            <span className="font-mono">{crypto.symbol}</span>
                            <span className="ml-2 text-xs opacity-70">{crypto.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Tournament Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry Fee:</span>
                        <div className="font-semibold">{selectedTournament.entryFee} ETH</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prize Pool:</span>
                        <div className="font-semibold">{selectedTournament.totalPrizePool} ETH</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Participants:</span>
                        <div className="font-semibold">
                          {selectedTournament.totalParticipants}/{selectedTournament.maxParticipants}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Groups:</span>
                        <div className="font-semibold">{selectedTournament.groupCount} groups</div>
                      </div>
                    </div>

                    {/* Registration Button */}
                    <Button
                      onClick={() => handleRegister(selectedTournament)}
                      disabled={selectedSquad.length !== 6 || isRegistering}
                      className="w-full"
                      size="lg"
                    >
                      {isRegistering ? 'Registering...' : `Register for ${selectedTournament.entryFee} ETH`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Tournaments */}
        <div className="grid gap-6">
          {tournaments.map((tournament) => (
            <motion.div
              key={tournament.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className={cn(
                "overflow-hidden transition-all duration-300 hover:shadow-lg",
                tournament.state === 'ACTIVE' && "ring-2 ring-green-500/50 bg-green-50/30"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3">
                        <Bullet variant={
                          tournament.state === 'REGISTRATION' ? "default" :
                          tournament.state === 'ACTIVE' ? "success" :
                          tournament.state === 'FINISHED' ? "warning" : "destructive"
                        } />
                        {tournament.name}
                      </CardTitle>
                      <Badge className={cn("text-white", getStateColor(tournament.state))}>
                        {getStateText(tournament.state)}
                      </Badge>
                    </div>

                    {tournament.state === 'REGISTRATION' && (
                      <Button
                        onClick={() => setSelectedTournament(tournament)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Join Tournament
                      </Button>
                    )}

                    {tournament.state === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/tournaments/${tournament.id}/live`}
                      >
                        Watch Live
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Entry Fee */}
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Entry Fee</p>
                        <p className="font-semibold">
                          <NumberFlow value={tournament.entryFee} suffix=" ETH" />
                        </p>
                      </div>
                    </div>

                    {/* Prize Pool */}
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Prize Pool</p>
                        <p className="font-semibold text-green-600">
                          <NumberFlow value={tournament.totalPrizePool} suffix=" ETH" />
                        </p>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Participants</p>
                        <p className="font-semibold">
                          {tournament.totalParticipants}/{tournament.maxParticipants}
                        </p>
                      </div>
                    </div>

                    {/* Groups */}
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Groups</p>
                        <p className="font-semibold">{tournament.groupCount}</p>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {tournament.state === 'REGISTRATION' ? 'Registration Ends' :
                           tournament.state === 'ACTIVE' ? 'Tournament Ends' : 'Completed'}
                        </p>
                        <p className="font-semibold text-blue-600">
                          {tournament.state === 'REGISTRATION' ?
                            formatTimeLeft(tournament.registrationEnd) :
                            tournament.state === 'ACTIVE' ?
                            formatTimeLeft(tournament.endTime) : 'Finished'}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold">
                          {Math.floor((tournament.endTime - tournament.startTime) / 60)} min
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Participants</span>
                      <span>{tournament.totalParticipants}/{tournament.maxParticipants}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(tournament.totalParticipants / tournament.maxParticipants) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bullet />
              HOW TOURNAMENTS WORK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🎯 Registration Phase</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Select 6 different cryptocurrencies for your squad</li>
                  <li>• Pay entry fee to join the tournament</li>
                  <li>• Players are automatically grouped (minimum 5 per group)</li>
                  <li>• Registration closes before tournament starts</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🏁 Tournament Phase</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Live price tracking using Pyth Network</li>
                  <li>• Squad score = sum of all 6 crypto percentage changes</li>
                  <li>• Real-time leaderboards within each group</li>
                  <li>• Tournament runs for fixed duration</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🏆 Rewards Phase</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Top 3 players in each group win prizes</li>
                  <li>• 1st: 50%, 2nd: 30%, 3rd: 20% of group prize pool</li>
                  <li>• Automatic prize distribution after finalization</li>
                  <li>• 5% creator fee from total prize pool</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">👥 Group System</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Players compete within their assigned group</li>
                  <li>• Each group has independent prize pool</li>
                  <li>• Fair competition with similar group sizes</li>
                  <li>• Multiple winners across all groups</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}