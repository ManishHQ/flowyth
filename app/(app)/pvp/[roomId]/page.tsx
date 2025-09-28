'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bullet } from '@/components/ui/bullet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NumberFlow from "@number-flow/react";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePvpMatch } from '@/lib/hooks/usePvpMatch';
import { useDynamicContext, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import DynamicWidget from '@/components/dynamic/dynamic-widget';
import { GameRaceTrack } from '@/components/pvp/GameRaceTrack';
import { getUserAvatar, shortenAddress } from '@/lib/utils/avatar';
import type { AvailableToken } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PriceData {
  id: string;
  price: number;
  startPrice: number | null;
  timestamp: number;
  symbol: string;
  percentageChange: number;
}

interface PvPRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function PvPRoomPage({ params }: PvPRoomPageProps) {
  const { roomId } = React.use(params);
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const walletAddress = primaryWallet?.address;

  // PvP match state
  const [matchId, setMatchId] = useState<string | undefined>(undefined);
  const {
    match,
    availableCoins,
    loading,
    error,
    createMatch,
    joinMatch,
    selectCoin,
    startMatch,
    finishMatch,
    getMatchStats,
    getCurrentPrices,
    bothCoinsSelected,
    canStart,
    isActive,
    isFinished,
    getTimeRemaining,
    clearError
  } = usePvpMatch(matchId);

  // UI state
  const [gameMode, setGameMode] = useState<'menu' | 'create' | 'join' | 'match'>('menu');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);

  // Price streaming state
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Chart data
  const [creatorData, setCreatorData] = useState<number[]>([]);
  const [opponentData, setOpponentData] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  const pricesRef = useRef<PriceData[]>([]);

  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Get user role in match
  const getUserRole = () => {
    if (!match || !walletAddress) return null;
    if (match.creator_wallet === walletAddress) return 'creator';
    if (match.opponent_wallet === walletAddress) return 'opponent';
    return null;
  };

  // Auto-start price streaming and set start prices when match becomes active (for all users)
  useEffect(() => {
    if ((isActive || match?.status === 'in_progress') && !isConnected) {
      console.log('Match became active - starting price streaming for all users');
      startStreaming();
    }

    if (isActive && prices.length > 0 && prices.some(p => p.startPrice === null)) {
      console.log('Match became active - setting start prices for all users');
      setPrices(prev => prev.map(price => ({
        ...price,
        startPrice: price.startPrice || price.price, // Only set if not already set
        percentageChange: 0
      })));
    }
  }, [isActive, match?.status, isConnected, prices.length]);

  // Update chart data arrays during active matches
  useEffect(() => {
    // Check if match is in progress OR if we have start prices (which means match has started)
    const shouldCollectData = (
      (isActive || match?.status === 'in_progress') &&
      match?.creator_coin &&
      match?.opponent_coin &&
      prices.some(p => p.startPrice !== null) // Only start collecting if we have start prices
    );

    if (!shouldCollectData) {
      console.log('Chart data collection skipped:', {
        isActive,
        matchStatus: match?.status,
        creatorCoin: match?.creator_coin,
        opponentCoin: match?.opponent_coin,
        hasStartPrices: prices.some(p => p.startPrice !== null)
      });
      return;
    }

    console.log('Setting up chart data collection for match:', {
      creator_coin: match.creator_coin,
      opponent_coin: match.opponent_coin,
      userRole: getUserRole()
    });

    const interval = setInterval(() => {
      if (pricesRef.current.length > 0) {
        // Find prices for both coins (always collect both regardless of user role)
        const creatorCoinPrice = pricesRef.current.find(p =>
          p.symbol === `${match.creator_coin}/USD`
        );
        const opponentCoinPrice = pricesRef.current.find(p =>
          p.symbol === `${match.opponent_coin}/USD`
        );

        console.log('Chart data collection attempt:', {
          creatorCoin: match.creator_coin,
          opponentCoin: match.opponent_coin,
          creatorPrice: creatorCoinPrice ? {
            symbol: creatorCoinPrice.symbol,
            price: creatorCoinPrice.price,
            startPrice: creatorCoinPrice.startPrice,
            percentageChange: creatorCoinPrice.percentageChange
          } : null,
          opponentPrice: opponentCoinPrice ? {
            symbol: opponentCoinPrice.symbol,
            price: opponentCoinPrice.price,
            startPrice: opponentCoinPrice.startPrice,
            percentageChange: opponentCoinPrice.percentageChange
          } : null,
          allPrices: pricesRef.current.map(p => ({
            symbol: p.symbol,
            price: p.price,
            startPrice: p.startPrice,
            percentageChange: p.percentageChange
          }))
        });

        // Update chart lines independently - each coin updates its own line
        let dataUpdated = false;

        // Update creator data if available
        if (creatorCoinPrice &&
            typeof creatorCoinPrice.percentageChange === 'number' &&
            !isNaN(creatorCoinPrice.percentageChange)) {

          setCreatorData(prev => {
            const decimalChange = creatorCoinPrice.percentageChange / 100; // Convert percentage to decimal
            const newData = [...prev, decimalChange].slice(-20);
            console.log('Creator data updated:', newData.length, 'points, last:', creatorCoinPrice.percentageChange, '% =', decimalChange, 'decimal');
            return newData;
          });
          dataUpdated = true;
        }

        // Update opponent data if available
        if (opponentCoinPrice &&
            typeof opponentCoinPrice.percentageChange === 'number' &&
            !isNaN(opponentCoinPrice.percentageChange)) {

          setOpponentData(prev => {
            const decimalChange = opponentCoinPrice.percentageChange / 100; // Convert percentage to decimal
            const newData = [...prev, decimalChange].slice(-20);
            console.log('Opponent data updated:', newData.length, 'points, last:', opponentCoinPrice.percentageChange, '% =', decimalChange, 'decimal');
            return newData;
          });
          dataUpdated = true;
        }

        // Update time labels if any data was updated
        if (dataUpdated) {
          setTimeLabels(prev => [...prev, new Date().toLocaleTimeString()].slice(-20));

          console.log('Chart data collection results:', {
            creatorValid: !!creatorCoinPrice,
            opponentValid: !!opponentCoinPrice,
            creatorChange: creatorCoinPrice?.percentageChange,
            opponentChange: opponentCoinPrice?.percentageChange
          });
        } else {
          console.log('Data collection skipped - missing or invalid percentage data');
        }
      }
    }, 1000); // Update every 1 second

    return () => {
      console.log('Cleaning up chart data collection interval');
      clearInterval(interval);
    };
  }, [isActive, match?.status, match?.creator_coin, match?.opponent_coin, prices.some(p => p.startPrice !== null)]);

  // Timer for active matches
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0 && match && isConnected) {
        // Auto-finish match when time runs out
        const currentPrices = getCurrentPrices(prices);
        console.log('Timer expired, attempting to finish match:', {
          matchId: match.id,
          currentPrices,
          pricesLength: prices.length,
          creatorCoin: match.creator_coin,
          opponentCoin: match.opponent_coin,
          availablePrices: prices.map(p => ({ symbol: p.symbol, price: p.price }))
        });

        if (currentPrices && currentPrices.creator > 0 && currentPrices.opponent > 0) {
          console.log('Calling finishMatch with valid prices:', {
            creatorPrice: currentPrices.creator,
            opponentPrice: currentPrices.opponent,
            matchId: match.id
          });
          finishMatch(currentPrices.creator, currentPrices.opponent)
            .then((result) => {
              console.log('Match finished successfully:', {
                result,
                creatorEndPrice: result.creator_coin_end_price,
                opponentEndPrice: result.opponent_coin_end_price,
                winner: result.winner_wallet
              });
            })
            .catch((error) => {
              console.error('Failed to finish match:', error);
            });
        } else {
          console.warn('Cannot finish match: invalid or missing current prices:', {
            currentPrices,
            hasValidCreatorPrice: currentPrices?.creator > 0,
            hasValidOpponentPrice: currentPrices?.opponent > 0
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, getTimeRemaining, match, isConnected, getCurrentPrices, prices, finishMatch]);

  // Switch to match view when match is created/joined
  useEffect(() => {
    if (match && gameMode !== 'match') {
      setGameMode('match');
      setMatchId(match.id);
    }
  }, [match, gameMode]);

  // Handle room initialization and recovery
  useEffect(() => {
    const handleRoomInitialization = async () => {
      if (isLoggedIn && walletAddress && !match && !loading) {
        try {
          console.log('Initializing room:', roomId);

          // Import PvpService dynamically
          const { PvpService } = await import('@/lib/services/pvp-service');

          // Check if roomId is an actual match ID (UUID format)
          const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

          if (isUuidFormat) {
            // Check if this match actually exists first
            console.log('UUID format detected, checking if match exists:', roomId);
            const existingMatch = await PvpService.getMatch(roomId);

            if (existingMatch) {
              console.log('Match found, loading existing match:', existingMatch);
              setMatchId(roomId);
            } else {
              console.log('Match not found, treating as new room - ready for match creation');
              setGameMode('menu');
            }
          } else {
            // Not UUID format - definitely a new room
            console.log('New room - ready for match creation or joining:', roomId);
            setGameMode('menu');
          }
        } catch (error) {
          console.error('Failed to initialize room:', error);
          // On error, default to menu mode
          setGameMode('menu');
        }
      }
    };

    // Small delay to let authentication settle
    const timer = setTimeout(handleRoomInitialization, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, walletAddress, match, loading, roomId, router]);

  // Use the same price feeds as the working implementation
  const priceFeeds = [
    {
      id: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      symbol: "BTC/USD"
    },
    {
      id: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
      symbol: "ETH/USD"
    },
    {
      id: "8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221",
      symbol: "LINK/USD"
    }
  ];

  // Create lookup map for O(1) symbol retrieval
  const symbolLookup = React.useMemo(() => {
    const lookup: { [key: string]: string } = {};
    priceFeeds.forEach(feed => {
      lookup[feed.id] = feed.symbol;
    });
    return lookup;
  }, []);

  // Create temporary available coins for selection (matching the three price feeds)
  const tempAvailableCoins = [
    { 
      id: 'btc', 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      category: 'midfielder' as const, 
      multiplier: 1.0, 
      logo_emoji: '₿', 
      pyth_price_id: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 'eth', 
      symbol: 'ETH', 
      name: 'Ethereum', 
      category: 'midfielder' as const, 
      multiplier: 1.0, 
      logo_emoji: 'Ξ', 
      pyth_price_id: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 'link', 
      symbol: 'LINK', 
      name: 'Chainlink', 
      category: 'midfielder' as const, 
      multiplier: 1.0, 
      logo_emoji: '🔗', 
      pyth_price_id: '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  const startStreaming = () => {
    if (eventSource) {
      eventSource.close();
    }

    // Create SSE connection to Pyth using hardcoded price feeds
    const priceIds = priceFeeds.map(feed => `0x${feed.id}`);
    
    console.log('Price feeds:', priceFeeds);
    console.log('Price IDs for streaming:', priceIds);

    // Use the exact same URL format as the working implementation
    const sseUrl = `https://hermes.pyth.network/v2/updates/price/stream?ids[]=${priceIds.join('&ids[]=')}`;
    console.log('SSE URL:', sseUrl);

    const es = new EventSource(sseUrl);

    es.onopen = () => {
      console.log('Connected to Pyth price stream');
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
                // Update existing price
                const existing = updated[existingIndex];
                const percentageChange = existing.startPrice ? ((currentPrice - existing.startPrice) / existing.startPrice) * 100 : 0;

                updated[existingIndex] = {
                  ...existing,
                  price: currentPrice,
                  timestamp: item.price.publish_time,
                  percentageChange: percentageChange
                };
              } else {
                // Add new price (first time receiving this price)
                // Set startPrice if match is already active
                const startPrice = (isActive || match?.status === 'in_progress') ? currentPrice : null;
                updated.push({
                  id: item.id,
                  price: currentPrice,
                  startPrice: startPrice,
                  timestamp: item.price.publish_time,
                  symbol: symbol,
                  percentageChange: 0
                });
              }
            });

            console.log('Price update received:', updated.map(p => ({ symbol: p.symbol, price: p.price, change: p.percentageChange })));
            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    es.onerror = (error) => {
      console.error('SSE Error:', error);
      console.error('EventSource readyState:', es.readyState);
      console.error('EventSource URL:', es.url);
      setIsConnected(false);
      
      // Log the error for debugging
      console.error('SSE connection failed - check network or Pyth service status');
      
      // Try to reconnect after a delay if the connection was lost
      if (es.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed, will retry in 5 seconds...');
        setTimeout(() => {
          if (!isConnected) {
            console.log('Attempting to reconnect to price stream...');
            startStreaming();
          }
        }, 5000);
      }
    };

    setEventSource(es);
  };


  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
      console.log('Disconnected from price stream');
    }
  };

  // PvP handlers
  const handleCreateMatch = async () => {
    if (!walletAddress) return;

    try {
      const newMatch = await createMatch(walletAddress, selectedDuration);
      setMatchId(newMatch.id);

      // Redirect to the actual match ID URL for better URL management
      if (newMatch.id !== roomId) {
        console.log('Redirecting to match URL:', newMatch.id);
        router.replace(`/pvp/${newMatch.id}`);
      }
    } catch (err) {
      console.error('Failed to create match:', err);
      alert('Failed to create match. Please try again.');
    }
  };

  const handleJoinMatch = async () => {
    if (!walletAddress || !inviteCodeInput.trim()) {
      alert('Please enter invite code');
      return;
    }

    try {
      const joinedMatch = await joinMatch(inviteCodeInput.toUpperCase(), walletAddress);
      setMatchId(joinedMatch.id);
      setInviteCodeInput('');

      // Redirect to the actual match ID URL for better URL management
      if (joinedMatch.id !== roomId) {
        console.log('Redirecting to joined match URL:', joinedMatch.id);
        router.replace(`/pvp/${joinedMatch.id}`);
      }
    } catch (err) {
      console.error('Failed to join match:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      // Provide specific error messages
      if (errorMessage.includes('not found') || errorMessage.includes('no longer available')) {
        alert('Match not found. Please check the invite code and try again.');
      } else if (errorMessage.includes('Cannot join your own match')) {
        alert('You cannot join your own match. Please use a different invite code.');
      } else {
        alert(`Failed to join match: ${errorMessage}`);
      }
    }
  };

  const handleCoinSelect = async (coin: AvailableToken) => {
    if (!walletAddress) return;

    console.log('Selecting coin:', {
      coin: coin.symbol,
      walletAddress,
      userRole,
      match: match?.id
    });

    try {
      await selectCoin(walletAddress, coin.symbol);
      console.log('Coin selected successfully');
    } catch (err) {
      console.error('Failed to select coin:', err);
      alert('Failed to select coin. Please try again.');
    }
  };

  const handleStartMatch = async () => {
    if (!match) {
      alert('No match available');
      return;
    }

    try {
      // Start price streaming if not already connected
      if (!isConnected) {
        console.log('Starting price streaming automatically...');
        startStreaming();

        // Wait a moment for prices to be received
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const currentPrices = getCurrentPrices(prices);
      if (!currentPrices) {
        alert('Price data not yet available, please wait a moment and try again');
        return;
      }

      // Set current prices as start prices for all coins
      setPrices(prev => prev.map(price => ({
        ...price,
        startPrice: price.price,
        percentageChange: 0
      })));

      console.log('Match starting with prices:', {
        creatorCoin: match.creator_coin,
        opponentCoin: match.opponent_coin,
        startPrices: currentPrices
      });

      await startMatch(currentPrices.creator, currentPrices.opponent);
    } catch (err) {
      console.error('Failed to start match:', err);
      alert('Failed to start match. Please try again.');
    }
  };

  const resetToMenu = () => {
    // Stop any active streaming
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
    }

    // Reset all state
    setGameMode('menu');
    setMatchId(undefined);
    setCreatorData([]);
    setOpponentData([]);
    setTimeLabels([]);
    setTimeLeft(0);
    setPrices([]); // Clear all prices to start fresh
    clearError();

    // Navigate back to lobby for a fresh start
    router.push('/pvp');

    console.log('Reset to menu - navigating to lobby');
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  // Clear chart data when match ends or changes
  useEffect(() => {
    if (!match || match.status === 'finished') {
      setCreatorData([]);
      setOpponentData([]);
    }
  }, [match?.status, match?.id]);

  const userRole = getUserRole();
  // Get match stats, but if database end prices aren't available, use real-time data
  const matchStats = (() => {
    const dbStats = getMatchStats();

    console.log('Winner determination debug info:', {
      isFinished,
      hasMatch: !!match,
      matchId: match?.id,
      status: match?.status,
      creatorEndPrice: match?.creator_coin_end_price,
      opponentEndPrice: match?.opponent_coin_end_price,
      creatorStartPrice: match?.creator_coin_start_price,
      opponentStartPrice: match?.opponent_coin_start_price,
      dbStats,
      pricesCount: prices.length
    });

    // If database has proper end prices, use those
    if (dbStats && match?.creator_coin_end_price && match?.opponent_coin_end_price) {
      console.log('Using database stats for winner determination:', dbStats);
      return dbStats;
    }

    // Otherwise, calculate from real-time percentage changes
    if (isFinished && match && prices.length > 0) {
      const creatorCoinPrice = prices.find(p => p.symbol === `${match.creator_coin}/USD`);
      const opponentCoinPrice = prices.find(p => p.symbol === `${match.opponent_coin}/USD`);

      console.log('Looking for price data:', {
        creatorCoin: match.creator_coin,
        opponentCoin: match.opponent_coin,
        creatorCoinPrice,
        opponentCoinPrice,
        availablePrices: prices.map(p => ({ symbol: p.symbol, price: p.price, percentageChange: p.percentageChange }))
      });

      if (creatorCoinPrice && opponentCoinPrice &&
          typeof creatorCoinPrice.percentageChange === 'number' &&
          typeof opponentCoinPrice.percentageChange === 'number') {

        const creatorChange = creatorCoinPrice.percentageChange;
        const opponentChange = opponentCoinPrice.percentageChange;

        let winner: 'creator' | 'opponent' | 'tie' = 'tie';
        if (Math.abs(creatorChange - opponentChange) > 0.0001) { // Avoid floating point precision issues
          if (creatorChange > opponentChange) {
            winner = 'creator';
          } else {
            winner = 'opponent';
          }
        }

        console.log('Using real-time percentage changes for winner determination:', {
          creatorChange,
          opponentChange,
          winner,
          difference: Math.abs(creatorChange - opponentChange)
        });

        return {
          creatorChange,
          opponentChange,
          winner
        };
      } else {
        console.log('Cannot determine winner: missing price data');
      }
    }

    console.log('Falling back to database stats (might be null):', dbStats);
    return dbStats; // Fallback to database stats
  })();

  // Render different screens based on game mode
  const renderContent = () => {
    switch (gameMode) {
      case 'menu':
  return (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <Bullet />
                  CREATE OR JOIN MATCH
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create Match */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Create New Match</h3>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Match Duration (seconds)</Label>
                      <select
                        id="duration"
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={120}>2 minutes</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleCreateMatch}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Creating...' : 'Create Match'}
                    </Button>
        </div>

                  {/* Join Match */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Join Existing Match</h3>
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        placeholder="Enter 6-character code"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        maxLength={6}
                      />
                    </div>
                    <Button 
                      onClick={handleJoinMatch} 
                      disabled={loading || !inviteCodeInput.trim()}
                      className="w-full"
                    >
                      {loading ? 'Joining...' : 'Join Match'}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );

      case 'match':
        return (
          <>
            {/* Match Info */}
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <Bullet variant={isActive ? "success" : match?.status === 'finished' ? "destructive" : "warning"} />
                  PVP MATCH - {match?.invite_code}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{match?.status?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{match?.duration_seconds}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time Remaining</p>
                    <p className="font-semibold text-lg">{isActive ? `${timeLeft}s` : '-'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={resetToMenu} variant="outline">
                    Leave Match
                  </Button>
                  {match?.status === 'waiting_for_opponent' && (
                    <Button onClick={() => navigator.clipboard.writeText(match.invite_code)}>
                      Copy Invite Code
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coin Selection */}
            {match?.status === 'selecting_coins' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Coin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tempAvailableCoins.map((coin) => {
                      const isSelected = userRole === 'creator' ?
                        match?.creator_coin === coin.symbol :
                        match?.opponent_coin === coin.symbol;

                      // Check if the coin is already taken by the other player
                      const isAlreadyTaken = userRole === 'creator' ?
                        match?.opponent_coin === coin.symbol :
                        match?.creator_coin === coin.symbol;

                      return (
                        <Button
                          key={coin.id}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleCoinSelect(coin)}
                          disabled={loading || isAlreadyTaken}
                          className={cn(
                            "h-16 flex flex-col",
                            isAlreadyTaken && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-2xl">{coin.logo_emoji}</span>
                          <span className="text-sm">{coin.symbol}</span>
                          {isAlreadyTaken && (
                            <span className="text-xs text-muted-foreground">Taken</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {bothCoinsSelected && (
                    <div className="mt-4 p-4 bg-accent rounded-lg">
                      <p className="text-center mb-4">Both players selected coins!</p>
                      <div className="flex justify-center gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Creator</p>
                          <p className="font-bold">{match?.creator_coin}</p>
                        </div>
                        <div className="text-2xl">VS</div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Opponent</p>
                          <p className="font-bold">{match?.opponent_coin}</p>
                        </div>
                      </div>
                      {canStart && (
                        <div className="text-center">
                          <Button onClick={handleStartMatch} size="lg" className="animate-pulse">
                            🚀 Start Battle!
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {!isConnected ? 'Price streaming will start automatically' : 'Ready to battle!'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Connection Status (for active matches) */}
            {(isActive || isConnected) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5">
                    <Bullet variant={isConnected ? "success" : "warning"} />
                    LIVE PRICE DATA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? '🟢 Connected to Pyth Network - receiving real-time prices'
                      : '🟡 Connecting to price feeds...'}
                  </p>
                </CardContent>
              </Card>
            )}


            {/* Avatar Racing Visualization */}
            {isActive && match && match.creator_wallet && match.opponent_wallet && (
              <Card>
                <CardHeader>
                  <CardTitle>🏁 Avatar Racing Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg overflow-hidden">
                    {/* Racing Track Background */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                    {(() => {
                      // Smart auto-scaling Y-axis calculation with dynamic zero line
                      const allValues = [...creatorData, ...opponentData].filter(v => v !== undefined && v !== null);

                      if (allValues.length === 0) {
                        // Default when no data - zero line in middle
                        return (
                          <>
                            <div className="absolute left-0 right-0 top-0 h-1/2 bg-green-100 opacity-30"></div>
                            <span className="absolute left-2 top-2 text-xs text-green-600">+0.050%</span>
                            <div className="absolute left-0 right-0 bottom-0 h-1/2 bg-red-100 opacity-30"></div>
                            <span className="absolute left-2 bottom-2 text-xs text-red-600">-0.050%</span>
                            {/* Zero Line - centered */}
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-400 transform -translate-y-1/2"></div>
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-white px-1">0%</span>
                          </>
                        );
                      }

                      // Calculate actual min/max from data
                      const minValue = Math.min(...allValues);
                      const maxValue = Math.max(...allValues);
                      const dataRange = maxValue - minValue;

                      // Add smart padding (20% of range, minimum 0.001% for crypto volatility)
                      const padding = Math.max(dataRange * 0.2, 0.001);
                      const yMin = minValue - padding;
                      const yMax = maxValue + padding;

                      // Ensure minimum range for visibility (larger for crypto)
                      const finalRange = Math.max(yMax - yMin, 0.01);
                      const center = (yMax + yMin) / 2;
                      const finalYMax = center + finalRange / 2;
                      const finalYMin = center - finalRange / 2;

                      // Calculate where 0% should be positioned
                      const zeroNormalized = (0 - finalYMin) / (finalYMax - finalYMin); // Normalize 0% to 0-1
                      const zeroPosition = 95 - (zeroNormalized * 90); // Convert to percentage from top

                      // Determine zones based on actual zero position
                      const isZeroVisible = zeroPosition >= 5 && zeroPosition <= 95;

                      return (
                        <>
                          {/* Positive Zone - above zero line */}
                          {finalYMax > 0 && (
                            <div
                              className="absolute left-0 right-0 bg-green-100 opacity-30"
                              style={{
                                top: '5%',
                                height: isZeroVisible ? `${Math.max(zeroPosition - 5, 0)}%` : '45%'
                              }}
                            ></div>
                          )}
                          <span className="absolute left-2 top-2 text-xs text-green-600 bg-white bg-opacity-80 px-1 rounded">
                            +{finalYMax.toFixed(3)}%
                          </span>

                          {/* Negative Zone - below zero line */}
                          {finalYMin < 0 && (
                            <div
                              className="absolute left-0 right-0 bg-red-100 opacity-30"
                              style={{
                                bottom: '5%',
                                height: isZeroVisible ? `${Math.max(95 - zeroPosition, 0)}%` : '45%'
                              }}
                            ></div>
                          )}
                          <span className="absolute left-2 bottom-2 text-xs text-red-600 bg-white bg-opacity-80 px-1 rounded">
                            {finalYMin.toFixed(3)}%
                          </span>

                          {/* Dynamic Zero Line - positioned based on actual 0% */}
                          {isZeroVisible && (
                            <>
                              <div
                                className="absolute left-0 right-0 h-0.5 bg-gray-400 transform -translate-y-1/2 z-10"
                                style={{ top: `${zeroPosition}%` }}
                              ></div>
                              <span
                                className="absolute left-2 transform -translate-y-1/2 text-xs text-gray-600 bg-white bg-opacity-90 px-1 rounded font-medium z-10"
                                style={{ top: `${zeroPosition}%` }}
                              >
                                0%
                              </span>
                            </>
                          )}

                          {/* Additional scale reference lines */}
                          {finalRange > 0.05 && (
                            <>
                              {/* Quarter lines */}
                              <div className="absolute left-0 right-0 h-px bg-gray-300 opacity-30" style={{ top: '27.5%' }}></div>
                              <span className="absolute left-2 text-xs text-gray-400 bg-white bg-opacity-60 px-1 rounded text-[10px]" style={{ top: '26%' }}>
                                {(finalYMax * 0.75 + finalYMin * 0.25).toFixed(3)}%
                              </span>
                              <div className="absolute left-0 right-0 h-px bg-gray-300 opacity-30" style={{ top: '72.5%' }}></div>
                              <span className="absolute left-2 text-xs text-gray-400 bg-white bg-opacity-60 px-1 rounded text-[10px]" style={{ top: '71%' }}>
                                {(finalYMax * 0.25 + finalYMin * 0.75).toFixed(3)}%
                              </span>
                            </>
                          )}
                        </>
                      );
                    })()}

                    {/* Racing Avatars Following Chart Curve */}
                    {(() => {
                      // Use same smart auto-scaling logic for positioning
                      const allValues = [...creatorData, ...opponentData].filter(v => v !== undefined && v !== null);

                      // Default scale when no data
                      if (allValues.length === 0) {
                        var yMin = -0.05;
                        var yMax = 0.05;
                      } else {
                        // Calculate actual min/max from data
                        const minValue = Math.min(...allValues);
                        const maxValue = Math.max(...allValues);
                        const dataRange = maxValue - minValue;

                        // Add smart padding (20% of range, minimum 0.001% for crypto volatility)
                        const padding = Math.max(dataRange * 0.2, 0.001);
                        const tempYMin = minValue - padding;
                        const tempYMax = maxValue + padding;

                        // Ensure minimum range for visibility (larger for crypto)
                        const finalRange = Math.max(tempYMax - tempYMin, 0.01);
                        const center = (tempYMax + tempYMin) / 2;
                        var yMax = center + finalRange / 2;
                        var yMin = center - finalRange / 2;
                      }

                      // Create player data for PvP (2 players instead of 3 coins)
                      const players = [
                        {
                          data: creatorData,
                          wallet: match.creator_wallet,
                          coin: match.creator_coin || '',
                          color: '#FB923C',
                          index: 0,
                          currentChange: creatorData.length > 0 ? creatorData[creatorData.length - 1] : 0
                        },
                        {
                          data: opponentData,
                          wallet: match.opponent_wallet,
                          coin: match.opponent_coin || '',
                          color: '#3B82F6',
                          index: 1,
                          currentChange: opponentData.length > 0 ? opponentData[opponentData.length - 1] : 0
                        }
                      ];

                      return players.map((player) => {
                        // Get the data array for this player
                        const dataArray = player.data;

                        // Use the maximum data length across all arrays for consistent progression
                        const maxDataLength = Math.max(creatorData.length, opponentData.length, 1);

                        // Calculate avatar position (should be at the END of the curve)
                        let avatarX, avatarY;
                        if (dataArray.length > 0) {
                          // Position avatar at the last data point
                          avatarX = 15 + ((dataArray.length - 1) / Math.max(19, 1)) * 70;
                          const lastValue = dataArray[dataArray.length - 1];
                          // Use smart scaling for Y position
                          const normalizedY = (lastValue - yMin) / (yMax - yMin); // Normalize to 0-1
                          avatarY = 95 - (normalizedY * 90); // Convert to percentage from top (5% margin top/bottom)
                        } else {
                          // No data yet, start at beginning
                          avatarX = 15;
                          avatarY = 50; // Center at 0%
                        }

                        // Create smooth curve path using quadratic bezier curves
                        const createSmoothPath = (points: { x: number; y: number }[]) => {
                          if (points.length < 2) return '';

                          let path = `M ${points[0].x} ${points[0].y}`;

                          for (let i = 1; i < points.length; i++) {
                            const prev = points[i - 1];
                            const curr = points[i];

                            if (i === 1) {
                              // First curve - start smoothly
                              const midX = (prev.x + curr.x) / 2;
                              const midY = (prev.y + curr.y) / 2;
                              path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
                            } else {
                              // Smooth curves using control points
                              const next = points[i + 1];
                              if (next) {
                                // Calculate control point for smooth transition
                                const controlX = curr.x;
                                const controlY = curr.y;
                                const endX = (curr.x + next.x) / 2;
                                const endY = (curr.y + next.y) / 2;
                                path += ` Q ${controlX} ${controlY} ${endX} ${endY}`;
                              } else {
                                // Last point - end smoothly
                                path += ` Q ${curr.x} ${curr.y} ${curr.x} ${curr.y}`;
                              }
                            }
                          }
                          return path;
                        };

                        // Convert data to smooth curve points using smart scaling
                        const curvePoints = dataArray.map((value, idx) => {
                          const x = 15 + (idx / Math.max(19, 1)) * 70;
                          // Use smart scaling for Y position
                          const normalizedY = (value - yMin) / (yMax - yMin); // Normalize to 0-1
                          const y = 95 - (normalizedY * 90); // Convert to percentage from top (5% margin)
                          return { x, y };
                        });

                        const smoothPath = createSmoothPath(curvePoints);

                        // Get coin emoji based on symbol
                        const getCoinEmoji = (symbol: string) => {
                          switch(symbol) {
                            case 'BTC': return '₿';
                            case 'ETH': return 'Ξ';
                            case 'LINK': return '🔗';
                            default: return symbol.charAt(0);
                          }
                        };

                        return (
                          <div key={player.wallet}>
                            {/* Smooth Curve Path */}
                            {dataArray.length > 1 && smoothPath && (
                              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id={`gradient-${player.index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={player.color} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={player.color} stopOpacity="0.8" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d={smoothPath}
                                  fill="none"
                                  stroke={player.color}
                                  strokeWidth="0.8"
                                  opacity="0.9"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  vectorEffect="non-scaling-stroke"
                                />
                                {/* Add glow effect */}
                                <path
                                  d={smoothPath}
                                  fill="none"
                                  stroke={`url(#gradient-${player.index})`}
                                  strokeWidth="1.5"
                                  opacity="0.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </svg>
                            )}

                            {/* Avatar */}
                            <div
                              className="absolute transition-all duration-1000 ease-out transform z-10"
                              style={{
                                left: `${avatarX}%`,
                                top: `${avatarY}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className="relative">
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 w-10 h-10 rounded-full blur-sm opacity-30`}
                                     style={{ backgroundColor: player.color }}></div>

                                {/* Avatar */}
                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white`}
                                     style={{ backgroundColor: player.color, color: 'white' }}>
                                  {getCoinEmoji(player.coin)}
                                </div>

                                {/* Performance Label */}
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full shadow-sm ${
                                    player.currentChange >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                  }`}>
                                    {player.currentChange >= 0 ? '+' : ''}
                                    {(player.currentChange * 100).toFixed(4)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-400"></div>
                      <span className="text-sm font-medium">{match.creator_coin}/USD - {shortenAddress(match.creator_wallet)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-medium">{match.opponent_coin}/USD - {shortenAddress(match.opponent_wallet)}</span>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="flex justify-center mt-4">
                    <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full">
                      <span className="text-lg font-bold">{timeLeft}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Match Results */}
            {isFinished && match && matchStats && (
              <Card className="border-yellow-500 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40">
            <CardHeader>
                  <CardTitle className="text-center text-2xl text-warning-readable">
                    🏆 MATCH FINISHED! 🏆
                  </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="text-center space-y-4">
                    {matchStats.winner === 'tie' ? (
                      <div>
                        <h3 className="text-xl font-bold">It's a Tie!</h3>
                        <p>Both players had the same performance</p>
                </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-bold">
                          {matchStats.winner === 'creator' ?
                            (userRole === 'creator' ? 'You Win!' : 'Creator Wins!') :
                            (userRole === 'opponent' ? 'You Win!' : 'Opponent Wins!')
                          }
                </h3>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          {/* Creator Result */}
                          <div className={cn(
                            "p-6 rounded-lg relative overflow-hidden",
                            matchStats.winner === 'creator' ?
                              'bg-green-100 dark:bg-green-900/40 border-2 border-green-500 ring-4 ring-green-200 dark:ring-green-800' :
                              'bg-red-100 dark:bg-red-900/40 border-2 border-red-500'
                          )}>
                            {matchStats.winner === 'creator' && (
                              <div className="absolute top-2 right-2 text-2xl animate-bounce">
                                🏆
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={getUserAvatar(match.creator_wallet || '')}
                                alt="Creator avatar"
                                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                              />
                              <div>
                                <div className="text-sm font-semibold text-muted-foreground">Creator</div>
                                <div className="text-xs">{shortenAddress(match.creator_wallet || '')}</div>
                              </div>
                            </div>
                            <div className={cn(
                              "text-lg font-bold mb-1",
                              matchStats.winner === 'creator' ? 'text-success-readable' : 'text-error-readable'
                            )}>{match.creator_coin}</div>
                            <div className={cn(
                              "text-3xl font-bold",
                              matchStats.winner === 'creator' ? 'text-success-readable' : 'text-error-readable'
                            )}>
                              {matchStats.creatorChange >= 0 ? '+' : ''}{matchStats.creatorChange.toFixed(4)}%
                            </div>
                          </div>

                          {/* Opponent Result */}
                          <div className={cn(
                            "p-6 rounded-lg relative overflow-hidden",
                            matchStats.winner === 'opponent' ?
                              'bg-green-100 dark:bg-green-900/40 border-2 border-green-500 ring-4 ring-green-200 dark:ring-green-800' :
                              'bg-red-100 dark:bg-red-900/40 border-2 border-red-500'
                          )}>
                            {matchStats.winner === 'opponent' && (
                              <div className="absolute top-2 right-2 text-2xl animate-bounce">
                                🏆
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={getUserAvatar(match.opponent_wallet || '')}
                                alt="Opponent avatar"
                                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                              />
                              <div>
                                <div className="text-sm font-semibold text-muted-foreground">Opponent</div>
                                <div className="text-xs">{shortenAddress(match.opponent_wallet || '')}</div>
                              </div>
                            </div>
                            <div className={cn(
                              "text-lg font-bold mb-1",
                              matchStats.winner === 'opponent' ? 'text-success-readable' : 'text-error-readable'
                            )}>{match.opponent_coin}</div>
                            <div className={cn(
                              "text-3xl font-bold",
                              matchStats.winner === 'opponent' ? 'text-success-readable' : 'text-error-readable'
                            )}>
                              {matchStats.opponentChange >= 0 ? '+' : ''}{matchStats.opponentChange.toFixed(4)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Button onClick={resetToMenu} className="mt-4">
                      Play Again
                    </Button>
              </div>
            </CardContent>
          </Card>
        )}

            {/* Current Prices Display */}
            {prices.length > 0 && (
          <Card>
            <CardHeader>
                  <CardTitle>Current Prices</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {prices.map((priceData) => (
                      <div key={priceData.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {availableCoins.find(c => `${c.symbol}/USD` === priceData.symbol)?.logo_emoji || '💰'}
                      </span>
                          <span className="font-semibold">{priceData.symbol}</span>
                </div>
                        <div className="text-xl font-bold">
                          <NumberFlow value={priceData.price} prefix="$" locales="en-US" />
                    </div>
                      {priceData.startPrice && (
                          <div className={cn(
                            "text-sm font-semibold",
                            priceData.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {priceData.percentageChange >= 0 ? '+' : ''}
                            {priceData.percentageChange.toFixed(4)}%
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
                      )}
                    </>
                  );

      default:
        return null;
    }
  };

  // Show login screen if not authenticated
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>🔥 PVP CRYPTO DUEL</h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Real-time 1v1 crypto price battles powered by Pyth Network & Supabase
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
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-1 sm:px-0">
        <div className="text-center space-y-2 sm:space-y-4 px-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2" style={{ fontFamily: 'var(--font-rebels), serif' }}>🔥 PVP CRYPTO DUEL</h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Real-time 1v1 crypto price battles powered by Pyth Network
          </p>
        </div>

        {renderContent()}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <Bullet />
              HOW IT WORKS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Create a match or join using an invite code
            </p>
            <p className="text-sm text-muted-foreground">
              • Both players select a cryptocurrency to compete with
            </p>
            <p className="text-sm text-muted-foreground">
              • Watch real-time price changes during the match duration
            </p>
            <p className="text-sm text-muted-foreground">
              • Winner is determined by highest percentage gain!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}