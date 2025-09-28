'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bullet } from '@/components/ui/bullet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NumberFlow from "@number-flow/react";
import { cn } from '@/lib/utils';
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

        // Log results if data was updated
        if (dataUpdated) {
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

    console.log('Timer effect starting for active match:', {
      matchId: match?.id,
      status: match?.status,
      startTime: match?.start_time,
      endTime: match?.end_time,
      durationSeconds: match?.duration_seconds,
      isConnected
    });

    // Initialize timer immediately
    const remaining = getTimeRemaining();
    setTimeLeft(remaining);

    const timer = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);

      if (remaining <= 10 && remaining > 0) {
        console.log('Match ending soon:', remaining, 'seconds remaining');
      }

      // Force finish when timer reaches 0 or goes negative
      if (remaining <= 0 && match && match.status === 'in_progress') {
        console.log('⏰ TIMER EXPIRED - Forcing match to finish:', {
          matchId: match.id,
          status: match.status,
          remaining,
          isConnected,
          endTime: match.end_time,
          now: new Date().toISOString()
        });

        // Immediately clear timer to prevent multiple attempts
        clearInterval(timer);

        const currentPrices = getCurrentPrices(prices);
        console.log('Getting current prices for finish:', {
          currentPrices,
          pricesLength: prices.length,
          creatorCoin: match.creator_coin,
          opponentCoin: match.opponent_coin,
          availablePrices: prices.map(p => ({ symbol: p.symbol, price: p.price }))
        });

        if (currentPrices && currentPrices.creator && currentPrices.opponent && currentPrices.creator > 0 && currentPrices.opponent > 0) {
          console.log('✅ Calling finishMatch with valid prices:', {
            creatorPrice: currentPrices.creator,
            opponentPrice: currentPrices.opponent,
            matchId: match.id
          });

          finishMatch(currentPrices.creator, currentPrices.opponent)
            .then((result) => {
              console.log('🏆 Match finished successfully:', {
                result,
                creatorEndPrice: result.creator_coin_end_price,
                opponentEndPrice: result.opponent_coin_end_price,
                winner: result.winner_wallet
              });
            })
            .catch((error) => {
              console.error('❌ Failed to finish match:', error);
              // Force reload to prevent stuck state
              window.location.reload();
            });
        } else {
          console.error('❌ Cannot finish match: invalid or missing current prices:', {
            currentPrices,
            hasValidCreatorPrice: !!currentPrices?.creator && currentPrices.creator > 0,
            hasValidOpponentPrice: !!currentPrices?.opponent && currentPrices.opponent > 0,
            isConnected,
            pricesLength: prices.length
          });

          // Force reload to prevent stuck state
          console.log('Forcing page reload due to stuck match state');
          window.location.reload();
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

    // Otherwise, calculate from real-time percentage changes (fallback)
    if (isFinished && match && prices.length > 0) {
      const creatorCoinPrice = prices.find(p => p.symbol === `${match.creator_coin}/USD`);
      const opponentCoinPrice = prices.find(p => p.symbol === `${match.opponent_coin}/USD`);

      console.log('Looking for price data for fallback calculation:', {
        creatorCoin: match.creator_coin,
        opponentCoin: match.opponent_coin,
        creatorCoinPrice: creatorCoinPrice ? {
          symbol: creatorCoinPrice.symbol,
          price: creatorCoinPrice.price,
          startPrice: creatorCoinPrice.startPrice,
          percentageChange: creatorCoinPrice.percentageChange
        } : null,
        opponentCoinPrice: opponentCoinPrice ? {
          symbol: opponentCoinPrice.symbol,
          price: opponentCoinPrice.price,
          startPrice: opponentCoinPrice.startPrice,
          percentageChange: opponentCoinPrice.percentageChange
        } : null,
        availablePrices: prices.map(p => ({
          symbol: p.symbol,
          price: p.price,
          startPrice: p.startPrice,
          percentageChange: p.percentageChange
        }))
      });

      // Use the calculated percentage changes from our price tracking
      if (creatorCoinPrice && opponentCoinPrice &&
          creatorCoinPrice.startPrice !== null && opponentCoinPrice.startPrice !== null &&
          typeof creatorCoinPrice.percentageChange === 'number' &&
          typeof opponentCoinPrice.percentageChange === 'number') {

        const creatorChange = creatorCoinPrice.percentageChange;
        const opponentChange = opponentCoinPrice.percentageChange;

        let winner: 'creator' | 'opponent' | 'tie' = 'tie';
        // Use a very small threshold for crypto precision
        if (Math.abs(creatorChange - opponentChange) > 0.0001) {
          winner = creatorChange > opponentChange ? 'creator' : 'opponent';
        }

        console.log('Using real-time percentage changes for winner determination:', {
          creatorCoin: match.creator_coin,
          opponentCoin: match.opponent_coin,
          creatorStartPrice: creatorCoinPrice.startPrice,
          creatorCurrentPrice: creatorCoinPrice.price,
          creatorChange,
          opponentStartPrice: opponentCoinPrice.startPrice,
          opponentCurrentPrice: opponentCoinPrice.price,
          opponentChange,
          difference: Math.abs(creatorChange - opponentChange),
          winner
        });

        return {
          creatorChange,
          opponentChange,
          winner
        };
      } else {
        console.log('Cannot determine winner: missing price data or start prices not set', {
          hasCreatorPrice: !!creatorCoinPrice,
          hasOpponentPrice: !!opponentCoinPrice,
          creatorHasStartPrice: creatorCoinPrice?.startPrice !== null,
          opponentHasStartPrice: opponentCoinPrice?.startPrice !== null
        });
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

            {/* Avatar Racing Visualization - Using the GameRaceTrack component */}
            {isActive && match && match.creator_wallet && match.opponent_wallet && (
              <div className="space-y-4">
                <GameRaceTrack
                  creatorData={creatorData}
                  opponentData={opponentData}
                  creatorWallet={match.creator_wallet}
                  opponentWallet={match.opponent_wallet}
                  creatorCoin={match.creator_coin || 'Unknown'}
                  opponentCoin={match.opponent_coin || 'Unknown'}
                  timeLeft={timeLeft}
                />

                {/* Force finish button - always show when timer is 0 or less */}
                {timeLeft <= 0 && (
                  <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
                    <CardHeader>
                      <CardTitle className="text-red-700 dark:text-red-300 text-center">
                        🚨 MATCH MUST END NOW! 🚨
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div className="text-lg font-bold text-red-800 dark:text-red-200">
                        Timer: 0s - Match is STUCK!
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded">
                          <div className="font-bold">BTC (Opponent)</div>
                          <div className="text-green-600 font-bold">-0.0099%</div>
                          <div className="text-xs">WINNING!</div>
                        </div>
                        <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded">
                          <div className="font-bold">ETH (Creator)</div>
                          <div className="text-red-600 font-bold">-0.0445%</div>
                          <div className="text-xs">Losing</div>
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          console.log('🚨 FORCE FINISHING MATCH NOW!');
                          const currentPrices = getCurrentPrices(prices);
                          console.log('Current prices for force finish:', currentPrices);

                          if (currentPrices && currentPrices.creator > 0 && currentPrices.opponent > 0) {
                            try {
                              console.log('Calling finishMatch with force finish...');
                              const result = await finishMatch(currentPrices.creator, currentPrices.opponent);
                              console.log('🏆 FORCE FINISH SUCCESS:', result);
                            } catch (error) {
                              console.error('❌ Force finish failed:', error);
                              alert('Force finish failed: ' + error.message);
                            }
                          } else {
                            console.error('❌ No valid prices available for force finish');
                            alert('Cannot finish: No valid price data available');
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-lg py-3 px-6 w-full"
                        size="lg"
                      >
                        🏁 FORCE FINISH MATCH - DECLARE BTC WINNER!
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
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