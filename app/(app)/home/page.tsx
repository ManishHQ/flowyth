'use client';

import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GamingNav from '@/components/gaming-nav';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  useEffect(() => {
    console.log('Dashboard page loaded successfully!');
  }, []);

  return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6">
          <div className="max-w-4xl w-full space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">🏆 Crypto Fantasy League</h1>
              <p className="text-muted-foreground text-lg">
                Welcome! You're successfully authenticated and ready to start trading fantasy crypto.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/tournaments">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">🏆</div>
                    <h3 className="font-semibold text-lg">Tournaments</h3>
                    <p className="text-sm text-muted-foreground">Join fantasy crypto tournaments</p>
                  </div>
                </Card>
              </Link>

              <Link href="/pvp">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">⚔️</div>
                    <h3 className="font-semibold text-lg">PvP Trading</h3>
                    <p className="text-sm text-muted-foreground">Real-time crypto battles</p>
                  </div>
                </Card>
              </Link>

              <Link href="/solo">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">🎯</div>
                    <h3 className="font-semibold text-lg">Solo Play</h3>
                    <p className="text-sm text-muted-foreground">Prediction markets and solo challenges</p>
                  </div>
                </Card>
              </Link>

              <Link href="/profile">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">👤</div>
                    <h3 className="font-semibold text-lg">Profile</h3>
                    <p className="text-sm text-muted-foreground">Manage your account settings</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
  );
}