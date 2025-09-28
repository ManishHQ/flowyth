import { useState, useEffect, useCallback } from 'react';
import { PvpService } from '@/lib/services/pvp-service';
import type { PvpMatch, AvailableToken } from '@/lib/supabase';

export interface PriceData {
  id: string;
  symbol: string;
  price: number;
  timestamp: number;
}

export function usePvpMatch(matchId?: string) {
  const [match, setMatch] = useState<PvpMatch | null>(null);
  const [availableCoins, setAvailableCoins] = useState<AvailableToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available coins
  useEffect(() => {
    const loadCoins = async () => {
      try {
        console.log('Loading available coins...');
        const coins = await PvpService.getAvailableCoins();
        console.log('Loaded coins:', coins);
        setAvailableCoins(coins);
      } catch (err) {
        console.error('Failed to load available coins:', err);
        setError(err instanceof Error ? err.message : 'Failed to load coins');
      }
    };

    loadCoins();
  }, []);

  // Load and subscribe to match updates
  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      return;
    }

    let subscription: any = null;
    let isMounted = true;

    const loadMatch = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Loading match:', matchId);
        const matchData = await PvpService.getMatch(matchId);

        if (!isMounted) return;

        if (matchData) {
          console.log('Match loaded:', matchData);
          setMatch(matchData);

          // Subscribe to real-time updates
          console.log('Setting up real-time subscription...');
          subscription = PvpService.subscribeToMatch(matchId, (updatedMatch) => {
            console.log('Match updated via real-time:', updatedMatch);
            if (isMounted) {
              setMatch(updatedMatch);
            }
          });
        } else {
          setError('Match not found');
        }
      } catch (err) {
        console.error('Failed to load match:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load match');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMatch();

    // Cleanup subscription
    return () => {
      isMounted = false;
      if (subscription) {
        console.log('Cleaning up subscription for match:', matchId);
        subscription.unsubscribe();
      }
    };
  }, [matchId]);

  // Create a new match
  const createMatch = useCallback(async (creatorWallet: string, durationSeconds: number = 60) => {
    setLoading(true);
    setError(null);
    
    try {
      const newMatch = await PvpService.createMatch(creatorWallet, durationSeconds);
      setMatch(newMatch);
      return newMatch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create match';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Join a match
  const joinMatch = useCallback(async (inviteCode: string, opponentWallet: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const joinedMatch = await PvpService.joinMatch(inviteCode, opponentWallet);
      setMatch(joinedMatch);
      return joinedMatch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join match';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a coin
  const selectCoin = useCallback(async (playerWallet: string, coinSymbol: string) => {
    if (!match) throw new Error('No active match');
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedMatch = await PvpService.selectCoin(match.id, playerWallet, coinSymbol);
      setMatch(updatedMatch);
      return updatedMatch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select coin';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [match]);

  // Start the match
  const startMatch = useCallback(async (creatorStartPrice: number, opponentStartPrice: number) => {
    if (!match) throw new Error('No active match');
    
    setLoading(true);
    setError(null);
    
    try {
      const startedMatch = await PvpService.startMatch(match.id, creatorStartPrice, opponentStartPrice);
      setMatch(startedMatch);
      return startedMatch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start match';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [match]);

  // Finish the match
  const finishMatch = useCallback(async (creatorEndPrice: number, opponentEndPrice: number) => {
    if (!match) throw new Error('No active match');
    
    setLoading(true);
    setError(null);
    
    try {
      const finishedMatch = await PvpService.finishMatch(match.id, creatorEndPrice, opponentEndPrice);
      setMatch(finishedMatch);
      return finishedMatch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to finish match';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [match]);

  // Get match by invite code
  const getMatchByInviteCode = useCallback(async (inviteCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const foundMatch = await PvpService.getMatchByInviteCode(inviteCode);
      if (foundMatch) {
        setMatch(foundMatch);
      }
      return foundMatch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find match';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate match statistics
  const getMatchStats = useCallback(() => {
    if (!match) return null;
    return PvpService.calculateMatchStats(match);
  }, [match]);

  // Get current prices for match coins
  const getCurrentPrices = useCallback((prices: PriceData[]) => {
    if (!match || !match.creator_coin || !match.opponent_coin) return null;

    const creatorPrice = prices.find(p => p.symbol === `${match.creator_coin}/USD`);
    const opponentPrice = prices.find(p => p.symbol === `${match.opponent_coin}/USD`);

    return {
      creator: creatorPrice?.price || 0,
      opponent: opponentPrice?.price || 0
    };
  }, [match]);

  // Check if both players have selected coins
  const bothCoinsSelected = match?.creator_coin && match?.opponent_coin;

  // Check if match can start
  const canStart = bothCoinsSelected && match?.status === 'selecting_coins';

  // Check if match is active
  const isActive = match?.status === 'in_progress';

  // Check if match is finished
  const isFinished = match?.status === 'finished';

  // Get time remaining in match
  const getTimeRemaining = useCallback(() => {
    if (!match || !match.end_time || match.status !== 'in_progress') {
      console.log('getTimeRemaining early return:', {
        hasMatch: !!match,
        hasEndTime: !!match?.end_time,
        status: match?.status
      });
      return 0;
    }

    const endTime = new Date(match.end_time).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    if (remaining <= 5) {
      console.log('getTimeRemaining details:', {
        endTime: match.end_time,
        endTimeMs: endTime,
        nowMs: now,
        differenceMs: endTime - now,
        remaining
      });
    }

    return remaining;
  }, [match]);

  return {
    match,
    availableCoins,
    loading,
    error,
    createMatch,
    joinMatch,
    selectCoin,
    startMatch,
    finishMatch,
    getMatchByInviteCode,
    getMatchStats,
    getCurrentPrices,
    bothCoinsSelected,
    canStart,
    isActive,
    isFinished,
    getTimeRemaining,
    clearError: () => setError(null)
  };
}
