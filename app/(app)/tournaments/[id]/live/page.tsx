'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bullet } from '@/components/ui/bullet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from "@number-flow/react";
import { Clock, Users, Trophy, Target, ArrowLeft, Crown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';

interface PriceData {
  id: string;
  price: number;
  startPrice: number | null;
  timestamp: number;
  symbol: string;
  percentageChange: number;
}

interface Participant {
  address: string;
  nickname: string;
  avatar: string;
  squad: string[];
  currentScore: number;
  rank: number;
  isWinner: boolean;
}

interface Group {
  id: number;
  participants: Participant[];
  prizePool: number;
}

interface Tournament {
  id: number;
  name: string;
  state: 'ACTIVE' | 'FINISHED';
  timeRemaining: number;
  groups: Group[];
  totalParticipants: number;
  totalPrizePool: number;
}

export default function LiveTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number>(0);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Chart data for racing visualization
  const [chartData, setChartData] = useState<{ [key: string]: number[] }>({});
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  const pricesRef = useRef<PriceData[]>([]);

  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Mock tournament data
  useEffect(() => {
    const mockTournament: Tournament = {
      id: Number(tournamentId),
      name: "Elite Traders Cup",
      state: 'ACTIVE',
      timeRemaining: 15 * 60, // 15 minutes
      totalParticipants: 64,
      totalPrizePool: 1.28,
      groups: [
        {
          id: 0,
          prizePool: 0.096,
          participants: [
            {
              address: "0x1234...abcd",
              nickname: "CryptoKing",
              avatar: "👑",
              squad: ["BTC", "ETH", "SOL", "LINK", "ADA", "DOT"],
              currentScore: 2.45,
              rank: 1,
              isWinner: false
            },
            {
              address: "0x5678...efgh",
              nickname: "MoonChaser",
              avatar: "🚀",
              squad: ["ETH", "SOL", "AVAX", "MATIC", "LINK", "DOGE"],
              currentScore: 1.82,
              rank: 2,
              isWinner: false
            },
            {
              address: "0x9abc...ijkl",
              nickname: "DiamondHands",
              avatar: "💎",
              squad: ["BTC", "ETH", "ADA", "DOT", "USDT", "AVAX"],
              currentScore: 0.67,
              rank: 3,
              isWinner: false
            },
            {
              address: "0xdef0...mnop",
              nickname: "HODLer",
              avatar: "🔒",
              squad: ["BTC", "LINK", "SOL", "MATIC", "DOGE", "USDT"],
              currentScore: -0.23,
              rank: 4,
              isWinner: false
            },
            {
              address: "0x2468...qrst",
              nickname: "AltcoinHunter",
              avatar: "🎯",
              squad: ["ADA", "DOT", "AVAX", "MATIC", "DOGE", "USDT"],
              currentScore: -1.15,
              rank: 5,
              isWinner: false
            }
          ]
        },
        {
          id: 1,
          prizePool: 0.096,
          participants: [
            {
              address: "0xabc1...uvwx",
              nickname: "DefiMaster",
              avatar: "⚡",
              squad: ["ETH", "LINK", "UNI", "AAVE", "COMP", "MKR"],
              currentScore: 3.12,
              rank: 1,
              isWinner: false
            },
            {
              address: "0xdef2...yzab",
              nickname: "YieldFarmer",
              avatar: "🌾",
              squad: ["ETH", "SOL", "AVAX", "MATIC", "LINK", "USDT"],
              currentScore: 2.88,
              rank: 2,
              isWinner: false
            },
            {
              address: "0x3456...cdef",
              nickname: "NFTWhale",
              avatar: "🐋",
              squad: ["ETH", "SOL", "FLOW", "AXS", "SAND", "MANA"],
              currentScore: 1.45,
              rank: 3,
              isWinner: false
            },
            {
              address: "0x7890...ghij",
              nickname: "MetaTrader",
              avatar: "🤖",
              squad: ["BTC", "ETH", "SOL", "LINK", "ADA", "DOT"],
              currentScore: 0.92,
              rank: 4,
              isWinner: false
            },
            {
              address: "0xabcd...klmn",
              nickname: "GasOptimizer",
              avatar: "⛽",
              squad: ["ETH", "MATIC", "AVAX", "FTM", "ONE", "NEAR"],
              currentScore: -0.78,
              rank: 5,
              isWinner: false
            }
          ]
        }
      ]
    };

    setTournament(mockTournament);

    // Start price streaming
    startStreaming();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [tournamentId]);

  // Price feed configuration
  const priceFeeds = [
    { id: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", symbol: "BTC/USD" },
    { id: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", symbol: "ETH/USD" },
    { id: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", symbol: "SOL/USD" },
    { id: "8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221", symbol: "LINK/USD" }
  ];

  const symbolLookup = React.useMemo(() => {
    const lookup: { [key: string]: string } = {};
    priceFeeds.forEach(feed => {
      lookup[feed.id] = feed.symbol;
    });
    return lookup;
  }, []);

  const startStreaming = () => {
    if (eventSource) {
      eventSource.close();
    }

    const priceIds = priceFeeds.map(feed => `0x${feed.id}`);
    const sseUrl = `https://hermes.pyth.network/v2/updates/price/stream?ids[]=${priceIds.join('&ids[]=')}`;

    const es = new EventSource(sseUrl);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.parsed && Array.isArray(data.parsed)) {
          setPrices(prev => {
            const updated = [...prev];

            data.parsed.forEach((item: any) => {
              const symbol = symbolLookup[item.id] || 'Unknown';
              const currentPrice = parseFloat(item.price.price) * Math.pow(10, item.price.expo);

              const existingIndex = updated.findIndex(p => p.id === item.id);

              if (existingIndex >= 0) {
                const existing = updated[existingIndex];
                const percentageChange = existing.startPrice ?
                  ((currentPrice - existing.startPrice) / existing.startPrice) * 100 : 0;

                updated[existingIndex] = {
                  ...existing,
                  price: currentPrice,
                  timestamp: item.price.publish_time,
                  percentageChange: percentageChange
                };
              } else {
                updated.push({
                  id: item.id,
                  price: currentPrice,
                  startPrice: currentPrice,
                  timestamp: item.price.publish_time,
                  symbol: symbol,
                  percentageChange: 0
                });
              }
            });

            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    setEventSource(es);
  };

  // Update chart data
  useEffect(() => {
    if (!tournament || prices.length === 0) return;

    const interval = setInterval(() => {
      const currentPrices = pricesRef.current;

      if (currentPrices.length > 0) {
        const newTimeLabel = new Date().toLocaleTimeString();
        setTimeLabels(prev => [...prev, newTimeLabel].slice(-20));

        // Update chart data for visualization
        const newChartData: { [key: string]: number[] } = {};

        currentPrices.forEach(priceData => {
          const symbol = priceData.symbol.replace('/USD', '');
          newChartData[symbol] = [...(chartData[symbol] || []), priceData.percentageChange].slice(-20);
        });

        setChartData(newChartData);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament, prices, chartData]);

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4" />;
      case 2: return <Star className="h-4 w-4" />;
      case 3: return <Zap className="h-4 w-4" />;
      default: return <span className="text-xs">{rank}</span>;
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tournament...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold">
                🏆 {tournament.name}
              </h1>
              <p className="text-muted-foreground">
                Live Tournament • {tournament.totalParticipants} participants
              </p>
            </div>
          </div>

          <div className="text-right">
            <Badge className="bg-green-500 text-white mb-2">
              <Bullet variant="success" className="mr-2" />
              LIVE
            </Badge>
            <div className="text-2xl font-mono font-bold">
              {formatTimeLeft(tournament.timeRemaining)}
            </div>
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Prize Pool</p>
              <p className="text-lg font-bold">
                <NumberFlow value={tournament.totalPrizePool} suffix=" ETH" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="text-lg font-bold">{tournament.totalParticipants}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Groups</p>
              <p className="text-lg font-bold">{tournament.groups.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Time Left</p>
              <p className="text-lg font-bold font-mono">
                {formatTimeLeft(tournament.timeRemaining)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Group Tabs */}
        <Tabs value={selectedGroup.toString()} onValueChange={(value) => setSelectedGroup(Number(value))}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
            {tournament.groups.map((group) => (
              <TabsTrigger key={group.id} value={group.id.toString()}>
                Group {group.id + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {tournament.groups.map((group) => (
            <TabsContent key={group.id} value={group.id.toString()} className="space-y-6">
              {/* Group Prize Pool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Group {group.id + 1} Leaderboard</span>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Group Prize Pool</p>
                      <p className="text-lg font-bold text-green-600">
                        <NumberFlow value={group.prizePool} suffix=" ETH" />
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.participants
                      .sort((a, b) => b.currentScore - a.currentScore)
                      .map((participant, index) => (
                        <motion.div
                          key={participant.address}
                          layout
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border transition-all",
                            index < 3 ? "bg-gradient-to-r" : "bg-muted/20",
                            index === 0 && "from-yellow-50 to-yellow-100 border-yellow-200",
                            index === 1 && "from-gray-50 to-gray-100 border-gray-200",
                            index === 2 && "from-amber-50 to-amber-100 border-amber-200"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("flex items-center justify-center", getRankColor(index + 1))}>
                              {getRankIcon(index + 1)}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{participant.avatar}</span>
                              <div>
                                <p className="font-semibold">{participant.nickname}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {participant.address}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={cn(
                              "text-lg font-bold",
                              participant.currentScore >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {participant.currentScore >= 0 ? '+' : ''}
                              <NumberFlow value={participant.currentScore} suffix="%" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Squad: {participant.squad.join(', ')}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Prize Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Prize Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">1st Place</p>
                      <p className="text-lg font-bold">
                        <NumberFlow value={group.prizePool * 0.5} suffix=" ETH" />
                      </p>
                      <p className="text-xs text-muted-foreground">50%</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">2nd Place</p>
                      <p className="text-lg font-bold">
                        <NumberFlow value={group.prizePool * 0.3} suffix=" ETH" />
                      </p>
                      <p className="text-xs text-muted-foreground">30%</p>
                    </div>

                    <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <Zap className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">3rd Place</p>
                      <p className="text-lg font-bold">
                        <NumberFlow value={group.prizePool * 0.2} suffix=" ETH" />
                      </p>
                      <p className="text-xs text-muted-foreground">20%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Live Price Feed Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bullet variant={isConnected ? "success" : "destructive"} />
              Live Price Feed {isConnected ? 'Connected' : 'Disconnected'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {prices.map((priceData) => (
                <div key={priceData.id} className="text-center p-3 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">{priceData.symbol}</p>
                  <p className="text-lg font-bold">
                    <NumberFlow value={priceData.price} prefix="$" />
                  </p>
                  <p className={cn(
                    "text-sm font-semibold",
                    priceData.percentageChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {priceData.percentageChange >= 0 ? '+' : ''}
                    <NumberFlow value={priceData.percentageChange} suffix="%" />
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}