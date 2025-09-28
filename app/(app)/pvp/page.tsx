'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bullet } from '@/components/ui/bullet';
import { useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import DynamicWidget from '@/components/dynamic/dynamic-widget';

export default function PvPLobbyPage() {
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();

  // Removed automatic active match checking - let users navigate freely

  const createNewRoom = () => {
    // Generate a unique room ID (we'll use the match ID once created)
    const roomId = `room-${Date.now()}`;
    router.push(`/pvp/${roomId}`);
  };

  const joinExistingRoom = () => {
    // For now, let's create a new room. Later we can add room ID input
    createNewRoom();
  };

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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>
              🔥 PVP CRYPTO DUEL
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Real-time 1v1 crypto price battles powered by Flow chain and Pyth Network
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2.5">
                <Bullet variant="warning" />
                CONNECT WALLET TO PLAY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Connect your wallet to start creating and joining PvP matches with friends!
                </p>

                <div className="max-w-sm mx-auto">
                  <DynamicWidget />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-center">How PvP Works:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Create a match or join using an invite code</p>
                  <p>• Both players select a cryptocurrency to compete with</p>
                  <p>• Watch real-time price changes during the match duration</p>
                  <p>• Winner is determined by highest percentage gain!</p>
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>
            🔥 PVP CRYPTO DUEL
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Real-time 1v1 crypto price battles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">🎮 Battle Arena</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Choose your battle mode to get started!
            </p>

            <div className="grid gap-4">
              <Button
                onClick={createNewRoom}
                size="lg"
                className="h-16 text-lg"
              >
                🆕 Create New Battle Room
              </Button>

              <Button
                onClick={joinExistingRoom}
                variant="outline"
                size="lg"
                className="h-16 text-lg"
              >
                🎯 Quick Match
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Each battle gets its own unique room URL that you can share with friends!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}