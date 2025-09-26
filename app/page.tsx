
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicEmbeddedWidget from "@/components/dynamic/dynamic-embedded-widget";

export default function Main() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        {/* Hero Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold">Crypto Fantasy League ⚽</CardTitle>
            <CardDescription className="text-lg">
              Build your crypto squad and compete in fantasy tournaments based on real price performance!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/tournaments">
                  🏆 Join Tournament
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/tournaments">
                  📊 View Leaderboard
                </Link>
              </Button>
            </div>

            <div className="flex justify-center">
              <DynamicEmbeddedWidget />
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>⚽ Football-Style Formation</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>🥅 <strong>1 Goalkeeper:</strong> Stablecoin (10x multiplier)</li>
                <li>🛡️ <strong>2 Defenders:</strong> Blue Chips (5x multiplier)</li>
                <li>⚽ <strong>2 Midfielders:</strong> Altcoins (3x multiplier)</li>
                <li>🎯 <strong>1 Striker:</strong> Meme Coins (1x multiplier)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🏆 Prize Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>🥇 <strong>1st Place:</strong> 60% of prize pool</li>
                <li>🥈 <strong>2nd Place:</strong> 25% of prize pool</li>
                <li>🥉 <strong>3rd Place:</strong> 10% of prize pool</li>
                <li>💼 <strong>Creator Fee:</strong> 5% of prize pool</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Powered by Cutting-Edge Technology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <h4 className="font-semibold">📊 Pyth Price Feeds</h4>
                <p className="text-sm text-muted-foreground">Real-time, accurate crypto prices</p>
              </div>
              <div>
                <h4 className="font-semibold">🌊 Flow Blockchain</h4>
                <p className="text-sm text-muted-foreground">Fast, secure, and eco-friendly</p>
              </div>
              <div>
                <h4 className="font-semibold">🔗 Dynamic Auth</h4>
                <p className="text-sm text-muted-foreground">Easy wallet connection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}