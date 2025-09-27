'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { DynamicWidget } from '@/lib/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SquadFormation } from '@/components/squad-formation';
import {
  useTournamentCounter,
  useTournamentData,
  useCreateTournament,
  useRegisterForTournament,
  useOwner
} from '@/hooks/use-crypto-fantasy-league';

export default function TournamentsPage() {
  const { address, isConnected } = useAccount();
  const { data: tournamentCounter } = useTournamentCounter();
  const { data: owner } = useOwner();

  // Current tournament state
  const currentTournamentId = tournamentCounter && Number(tournamentCounter) > 0 ? Number(tournamentCounter) - 1 : undefined;
  const { tournament, userSquad, isLoading } = useTournamentData(currentTournamentId);

  // Form states
  const [entryFee, setEntryFee] = useState('0.05');
  const [duration, setDuration] = useState('24');
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [isSquadValid, setIsSquadValid] = useState(false);

  // Contract interactions
  const {
    createTournament,
    isPending: isCreatingTournament,
    isSuccess: tournamentCreated,
    error: createError
  } = useCreateTournament();

  const {
    registerForTournament,
    isPending: isRegistering,
    isSuccess: registrationSuccess,
    error: registrationError
  } = useRegisterForTournament();

  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase();

  const handleCreateTournament = () => {
    createTournament(entryFee, parseInt(duration));
  };

  const handleRegisterForTournament = () => {
    if (!tournament || !isSquadValid) return;
    registerForTournament(tournament.id, selectedSquad, tournament.entryFee);
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTournamentStatus = () => {
    if (!tournament) return 'No tournament';

    const now = new Date();
    if (now < tournament.startTime) return 'Registration Open';
    if (now < tournament.endTime) return 'Live';
    if (!tournament.isFinalized) return 'Ended - Awaiting Results';
    return 'Completed';
  };

  const isRegistrationOpen = tournament && new Date() < tournament.startTime && tournament.isActive;
  const hasUserRegistered = userSquad && userSquad.some((id: string) => id !== '0x0000000000000000000000000000000000000000000000000000000000000000');

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Crypto Fantasy League</CardTitle>
            <CardDescription>
              Connect your wallet to participate in fantasy crypto tournaments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DynamicWidget />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Crypto Fantasy League ⚽</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Build your crypto squad and compete in fantasy tournaments based on real price performance!
        </p>
        <div className="flex justify-center">
          <DynamicWidget />
        </div>
      </div>

      {/* Debug Info - Collapsible */}
      {address && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            🔧 Debug Info (click to expand)
          </summary>
          <Card className="mt-2 bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm space-y-1">
                <p>Tournament Counter: {tournamentCounter ? Number(tournamentCounter).toString() : 'Loading...'}</p>
                <p>Current Tournament ID: {currentTournamentId ?? 'None'}</p>
                <p>Is Owner: {isOwner ? 'Yes' : 'No'}</p>
                <p>Owner Address: {owner ?? 'Loading...'}</p>
              </div>
            </CardContent>
          </Card>
        </details>
      )}

      {/* Current Tournament Status */}
      {!isLoading && tournament && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tournament #{tournament.id}</CardTitle>
                <CardDescription>
                  {tournament.startTime.toLocaleString()} - {tournament.endTime.toLocaleString()}
                </CardDescription>
              </div>
              <Badge variant={tournament.isActive ? 'default' : 'secondary'}>
                {getTournamentStatus()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{tournament.entryFeeFormatted} FLOW</p>
                <p className="text-sm text-muted-foreground">Entry Fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{tournament.prizePoolFormatted} FLOW</p>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{tournament.participantCount}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Date() < tournament.startTime
                    ? formatTimeRemaining(tournament.startTime)
                    : formatTimeRemaining(tournament.endTime)
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date() < tournament.startTime ? 'Until Start' : 'Remaining'}
                </p>
              </div>
            </div>

            {hasUserRegistered && (
              <Alert>
                <AlertDescription>
                  ✅ You are registered for this tournament with your squad!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Tournament State - Prominent CTA */}
      {!isLoading && !tournament && (
        <div className="space-y-6">
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardHeader className="text-center pb-4">
              <div className="text-6xl mb-4">🏆</div>
              <CardTitle className="text-2xl">No Tournaments Yet!</CardTitle>
              <CardDescription className="text-lg">
                Be the first to create a crypto fantasy tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickEntryFee">Entry Fee (FLOW)</Label>
                    <Input
                      id="quickEntryFee"
                      type="number"
                      step="0.01"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      placeholder="0.05"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickDuration">Duration (Hours)</Label>
                    <Input
                      id="quickDuration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="24"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateTournament}
                  disabled={isCreatingTournament}
                  className="w-full"
                  size="lg"
                >
                  {isCreatingTournament ? 'Creating Tournament...' : '🚀 Create First Tournament'}
                </Button>

                {!isOwner && (
                  <Alert>
                    <AlertDescription className="text-center">
                      ⚠️ <strong>Testing Mode:</strong> Anyone can create tournaments for testing
                    </AlertDescription>
                  </Alert>
                )}

                {createError && (
                  <Alert>
                    <AlertDescription>
                      <strong>Error:</strong> {createError.message.includes('Not owner')
                        ? 'Only the contract owner can create tournaments. The contract needs to be updated to allow public tournament creation for testing.'
                        : createError.message
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {tournamentCreated && (
                  <Alert>
                    <AlertDescription>
                      🎉 Tournament created successfully! Refresh to see it.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">⚽ Squad Formation (1-2-2-1)</h4>
                  <ul className="space-y-2 text-sm">
                    <li>🥅 <strong>1 Goalkeeper:</strong> Stablecoin (10x multiplier)</li>
                    <li>🛡️ <strong>2 Defenders:</strong> Blue Chips (5x multiplier)</li>
                    <li>⚽ <strong>2 Midfielders:</strong> Altcoins (3x multiplier)</li>
                    <li>🎯 <strong>1 Striker:</strong> Meme Coins (1x multiplier)</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">🏆 Prize Distribution</h4>
                  <ul className="space-y-2 text-sm">
                    <li>🥇 <strong>1st Place:</strong> 60% of prize pool</li>
                    <li>🥈 <strong>2nd Place:</strong> 25% of prize pool</li>
                    <li>🥉 <strong>3rd Place:</strong> 10% of prize pool</li>
                    <li>💼 <strong>Creator Fee:</strong> 5% of prize pool</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tournament Exists - Show Tabs */}
      {!isLoading && tournament && (
        <Tabs defaultValue="participate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="participate">Participate</TabsTrigger>
            <TabsTrigger value="manage">
              Manage {!isOwner && '(Testing)'}
            </TabsTrigger>
          </TabsList>

          {/* Participation Tab */}
          <TabsContent value="participate" className="space-y-6">
            {!isRegistrationOpen ? (
              <Card>
                <CardHeader>
                  <CardTitle>Registration Closed</CardTitle>
                  <CardDescription>
                    Registration is closed for the current tournament.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : hasUserRegistered ? (
            <Card>
              <CardHeader>
                <CardTitle>Already Registered! 🎉</CardTitle>
                <CardDescription>
                  You're all set for Tournament #{tournament.id}. Good luck!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Register for Tournament #{tournament.id}</CardTitle>
                  <CardDescription>
                    Entry Fee: {tournament.entryFeeFormatted} FLOW • Registration closes in {formatTimeRemaining(tournament.startTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleRegisterForTournament}
                    disabled={!isSquadValid || isRegistering}
                    className="w-full"
                    size="lg"
                  >
                    {isRegistering ? 'Registering...' : `Register for ${tournament.entryFeeFormatted} FLOW`}
                  </Button>

                  {registrationError && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        Error: {registrationError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {registrationSuccess && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        🎉 Successfully registered! Good luck in the tournament!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <SquadFormation
                onSquadChange={setSelectedSquad}
                onSquadValid={setIsSquadValid}
                disabled={isRegistering}
              />
            </div>
          )}
        </TabsContent>

        {/* Management Tab (Owner Only) */}
        <TabsContent value="manage" className="space-y-6">
          {!isOwner && (
            <Alert>
              <AlertDescription>
                ⚠️ <strong>Testing Mode:</strong> In production, only the contract owner can create tournaments.
                Contract Owner: {owner || 'Loading...'}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Create New Tournament</CardTitle>
              <CardDescription>
                Set up a new fantasy crypto tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee (FLOW)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    step="0.01"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="0.05"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="24"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateTournament}
                disabled={isCreatingTournament}
                className="w-full"
              >
                {isCreatingTournament ? 'Creating Tournament...' : 'Create Tournament (Testing)'}
              </Button>

              {createError && (
                <Alert>
                  <AlertDescription>
                    Error: {createError.message}
                  </AlertDescription>
                </Alert>
              )}

              {tournamentCreated && (
                <Alert>
                  <AlertDescription>
                    🎉 Tournament created successfully!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}