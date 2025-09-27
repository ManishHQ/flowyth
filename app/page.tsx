
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DynamicEmbeddedWidget from "@/components/dynamic/dynamic-embedded-widget";
import { useIsLoggedIn } from "@/lib/dynamic";

export default function Main() {
  const isLoggedIn = useIsLoggedIn();

  if (isLoggedIn) {
    // Redirect to dashboard if already logged in
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome back!</h1>
          <p className="text-muted-foreground mb-6">You're already logged in. Ready to play?</p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating particles for game atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full opacity-30 animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-primary rounded-full opacity-30 animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-primary rounded-full opacity-30 animate-ping" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-6xl flex-col gap-8">

          {/* Hero Section with Auth Widget */}
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
            <div className="mb-6">
              <h1 className="text-6xl md:text-8xl font-black text-primary mb-4" style={{ fontFamily: 'var(--font-rebels), serif' }}>
                FLOWYTH
              </h1>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                CRYPTO FANTASY LEAGUE
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Build your ultimate crypto squad and dominate the leaderboards in real-time fantasy tournaments!
              </p>
            </div>

            {/* Authentication Widget */}
            <div className="max-w-sm mx-auto mb-8">
              <DynamicEmbeddedWidget />
            </div>

            <p className="text-sm text-muted-foreground">
              Connect your wallet to enter the arena and start trading crypto fantasy!
            </p>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center shadow">
              <div className="text-2xl font-bold text-primary">1,247</div>
              <div className="text-sm text-muted-foreground">ACTIVE PLAYERS</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center shadow">
              <div className="text-2xl font-bold text-primary">₿ 12.5</div>
              <div className="text-sm text-muted-foreground">TOTAL PRIZES</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center shadow">
              <div className="text-2xl font-bold text-primary">45</div>
              <div className="text-sm text-muted-foreground">TOURNAMENTS</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center shadow">
              <div className="text-2xl font-bold text-primary">LIVE</div>
              <div className="text-sm text-muted-foreground">STATUS</div>
            </div>
          </div>

          {/* Game Rules */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                ⚽ SQUAD FORMATION
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-yellow-500 text-yellow-50 font-bold">GK</Badge>
                  <span className="font-semibold">1 Goalkeeper</span>
                  <span className="text-primary font-bold">10x</span>
                  <span className="text-sm text-muted-foreground">Stablecoins</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500 text-blue-50 font-bold">DEF</Badge>
                  <span className="font-semibold">2 Defenders</span>
                  <span className="text-primary font-bold">5x</span>
                  <span className="text-sm text-muted-foreground">Blue Chips</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-500 text-purple-50 font-bold">MID</Badge>
                  <span className="font-semibold">2 Midfielders</span>
                  <span className="text-primary font-bold">3x</span>
                  <span className="text-sm text-muted-foreground">Altcoins</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-500 text-red-50 font-bold">STR</Badge>
                  <span className="font-semibold">1 Striker</span>
                  <span className="text-primary font-bold">1x</span>
                  <span className="text-sm text-muted-foreground">Meme Coins</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                🏆 PRIZE POOL
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥇</span>
                    <span className="font-semibold">1st Place</span>
                  </div>
                  <span className="text-primary font-bold text-xl">60%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥈</span>
                    <span className="font-semibold">2nd Place</span>
                  </div>
                  <span className="text-primary font-bold text-xl">25%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥉</span>
                    <span className="font-semibold">3rd Place</span>
                  </div>
                  <span className="text-primary font-bold text-xl">10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <h3 className="text-3xl font-bold text-center text-primary mb-8" style={{ fontFamily: 'var(--font-rebels), serif' }}>
              ⚡ POWERED BY NEXT-GEN TECH
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="font-bold text-lg text-primary mb-2">Pyth Network</h4>
                <p className="text-sm text-muted-foreground">Ultra-fast, high-fidelity price feeds for accurate scoring</p>
              </div>
              <div className="text-center p-6 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="text-4xl mb-4">🌊</div>
                <h4 className="font-bold text-lg text-primary mb-2">Flow Blockchain</h4>
                <p className="text-sm text-muted-foreground">Developer-friendly, fast, and environmentally sustainable</p>
              </div>
              <div className="text-center p-6 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="text-4xl mb-4">🔗</div>
                <h4 className="font-bold text-lg text-primary mb-2">Dynamic Labs</h4>
                <p className="text-sm text-muted-foreground">Seamless multi-wallet authentication and onboarding</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'var(--font-rebels), serif' }}>
              READY TO DOMINATE?
            </h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of players in the ultimate crypto fantasy experience. Build your squad, climb the ranks, and claim your share of the prize pool!
            </p>
            <p className="text-primary font-semibold">
              Connect your wallet above to get started! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}