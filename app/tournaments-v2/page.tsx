'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Timer, Users, Trophy, Zap, Clock, DollarSign } from 'lucide-react';
import { useCryptoFantasyLeagueV2, formatCountdown } from '@/lib/hooks/use-crypto-fantasy-league-v2';
import { TOURNAMENT_CONFIG } from '@/lib/contracts/crypto-fantasy-league-v2';
import { SquadSelectionV2 } from '@/components/squad-selection-v2';
import { TournamentCountdown } from '@/components/tournament-countdown';
import { LivePrices } from '@/components/live-prices';

export default function TournamentsV2Page() {
  const { address } = useAccount();
  const {
    tournamentCounter,
    timeUntilNext,
    useTournamentInfo,
    createAutoTournament,
    registerForTournament,
    isWritePending
  } = useCryptoFantasyLeagueV2();

  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [isSquadValid, setIsSquadValid] = useState(false);
  const [currentTournamentId, setCurrentTournamentId] = useState<number>(0);

  // Get current tournament info
  const { data: tournamentInfo, refetch: refetchTournament } = useTournamentInfo(currentTournamentId);

  // Update current tournament ID when counter changes
  useEffect(() => {
    if (tournamentCounter > 0) {
      setCurrentTournamentId(tournamentCounter - 1);
    }
  }, [tournamentCounter]);

  // Auto-refresh tournament info
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTournament();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchTournament]);

  const handleCreateTournament = async () => {
    try {
      await createAutoTournament();
      // Refetch will happen automatically via event listener
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  const handleRegisterForTournament = async () => {
    if (!isSquadValid || selectedSquad.length !== 6) {
      alert('Please select a valid squad of 6 cryptos');
      return;
    }

    try {
      await registerForTournament(currentTournamentId, selectedSquad);
      // Clear squad after successful registration
      setSelectedSquad([]);
      setIsSquadValid(false);
    } catch (error) {
      console.error('Failed to register for tournament:', error);
    }
  };

  const getTournamentStatus = () => {
    if (!tournamentInfo) return 'unknown';

    const now = Math.floor(Date.now() / 1000);

    if (!tournamentInfo.hasStarted && now < Number(tournamentInfo.registrationDeadline)) {
      return 'registration';
    } else if (tournamentInfo.hasStarted && !tournamentInfo.isFinalized) {
      return 'active';
    } else if (tournamentInfo.isFinalized) {
      return 'finished';
    } else {
      return 'waiting';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registration':
        return <Badge className="bg-blue-500">Registration Open</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Live Tournament</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500">Finished</Badge>;
      case 'waiting':
        return <Badge className="bg-yellow-500">Starting Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const status = getTournamentStatus();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">🏆 Crypto Fantasy League V2</h1>
          <p className="text-muted-foreground">
            15-minute crypto tournaments every 2 hours • Pick any 6 cryptos • Pure performance
          </p>
        </div>

        {/* Auto-Tournament Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Auto-Tournament System
            </CardTitle>
            <CardDescription>
              Tournaments auto-create every 2 hours with 30-min registration periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">{tournamentCounter}</div>
                <div className="text-sm text-muted-foreground">Total Tournaments</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {timeUntilNext > 0 ? formatCountdown(timeUntilNext) : '00:00:00'}
                </div>
                <div className="text-sm text-muted-foreground">Next Auto-Tournament</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">{TOURNAMENT_CONFIG.ENTRY_FEE} ETH</div>
                <div className="text-sm text-muted-foreground">Entry Fee</div>
              </div>
            </div>

            {timeUntilNext === 0 && (
              <div className="text-center">
                <Button onClick={handleCreateTournament} disabled={isWritePending} size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Create Auto-Tournament Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Tournament */}
        {tournamentInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament #{currentTournamentId}
                </span>
                {getStatusBadge(status)}
              </CardTitle>
              <CardDescription>
                {status === 'registration' && 'Registration is open! Join now to compete.'}
                {status === 'active' && 'Tournament is live! Crypto prices are being tracked.'}
                {status === 'finished' && 'Tournament has finished. Check results!'}
                {status === 'waiting' && 'Tournament will start soon.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Participants
                  </div>
                  <div className="text-muted-foreground">
                    {Number(tournamentInfo.participantCount)}/{TOURNAMENT_CONFIG.MAX_PARTICIPANTS}
                  </div>
                </div>
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Prize Pool
                  </div>
                  <div className="text-muted-foreground">
                    {(Number(tournamentInfo.prizePool) / 1e18).toFixed(3)} ETH
                  </div>
                </div>
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </div>
                  <div className="text-muted-foreground">15 minutes</div>
                </div>
                <div>
                  <div className="font-medium">Registration</div>
                  <div className="text-muted-foreground">
                    <TournamentCountdown
                      targetTime={Number(tournamentInfo.registrationDeadline) * 1000}
                      label="closes in"
                    />
                  </div>
                </div>
              </div>

              {status === 'active' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                    <Zap className="w-4 h-4" />
                    Tournament Live!
                  </div>
                  <div className="text-green-700 text-sm">
                    Started: {new Date(Number(tournamentInfo.startTime) * 1000).toLocaleString()}
                  </div>
                  <div className="text-green-700 text-sm">
                    Ends: {new Date(Number(tournamentInfo.endTime) * 1000).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Squad Selection */}
        {status === 'registration' && (
          <Card>
            <CardHeader>
              <CardTitle>Build Your Squad</CardTitle>
              <CardDescription>
                Select any 6 cryptocurrencies. No position restrictions - pure performance competition!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SquadSelectionV2
                onSquadChange={setSelectedSquad}
                onSquadValid={setIsSquadValid}
                disabled={isWritePending}
              />

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Entry Fee: {TOURNAMENT_CONFIG.ENTRY_FEE} ETH
                </div>
                <Button
                  onClick={handleRegisterForTournament}
                  disabled={!isSquadValid || isWritePending || !address}
                  size="lg"
                >
                  {isWritePending ? 'Registering...' : 'Register for Tournament'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Prices */}
        <Card>
          <CardHeader>
            <CardTitle>Live Crypto Prices</CardTitle>
            <CardDescription>
              Real-time prices from Pyth Network • Updates every 10 seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LivePrices />
          </CardContent>
        </Card>

        {/* Tournament Rules */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Tournament Schedule</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• New tournament every 2 hours</li>
                  <li>• 30-minute registration period</li>
                  <li>• 15-minute live competition</li>
                  <li>• Maximum 20 participants per tournament</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Scoring & Prizes</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Score = Sum of % price changes</li>
                  <li>• 1st place: 50% of prize pool</li>
                  <li>• 2nd place: 30% of prize pool</li>
                  <li>• 3rd place: 20% of prize pool</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}