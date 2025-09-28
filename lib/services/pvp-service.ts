import { supabase } from '@/lib/supabase';
import type { PvpMatch, PvpMatchInsert, PvpMatchUpdate, AvailableToken } from '@/lib/supabase';

// Generate a 6-character invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class PvpService {
  // Create a new PvP match
  static async createMatch(creatorWallet: string, durationSeconds: number = 60): Promise<PvpMatch> {
    const inviteCode = generateInviteCode();
    
    const { data, error } = await supabase
      .from('pvp_matches')
      .insert({
        invite_code: inviteCode,
        creator_wallet: creatorWallet,
        duration_seconds: durationSeconds,
        status: 'waiting_for_opponent'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create match: ${error.message}`);
    }

    return data;
  }

  // Join a match using invite code
  static async joinMatch(inviteCode: string, opponentWallet: string): Promise<PvpMatch> {
    // First, check if the match exists and is available
    const { data: existingMatch, error: fetchError } = await supabase
      .from('pvp_matches')
      .select()
      .eq('invite_code', inviteCode)
      .eq('status', 'waiting_for_opponent')
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Match not found or no longer available');
      }
      throw new Error(`Failed to find match: ${fetchError.message}`);
    }

    if (!existingMatch) {
      throw new Error('Match not found or no longer available');
    }

    // Check if the opponent is trying to join their own match
    if (existingMatch.creator_wallet === opponentWallet) {
      throw new Error('Cannot join your own match');
    }

    // Now update the match
    const { data, error } = await supabase
      .from('pvp_matches')
      .update({
        opponent_wallet: opponentWallet,
        status: 'selecting_coins'
      })
      .eq('id', existingMatch.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to join match: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update match');
    }

    return data;
  }

  // Select a coin for a player
  static async selectCoin(matchId: string, playerWallet: string, coinSymbol: string): Promise<PvpMatch> {
    console.log('PvpService.selectCoin called:', { matchId, playerWallet, coinSymbol });
    
    // First get the match to determine if this is creator or opponent
    const { data: match, error: fetchError } = await supabase
      .from('pvp_matches')
      .select()
      .eq('id', matchId)
      .single();

    if (fetchError || !match) {
      throw new Error('Match not found');
    }

    const isCreator = match.creator_wallet === playerWallet;
    const isOpponent = match.opponent_wallet === playerWallet;

    console.log('Player role check:', { 
      isCreator, 
      isOpponent, 
      creatorWallet: match.creator_wallet, 
      opponentWallet: match.opponent_wallet,
      playerWallet 
    });

    if (!isCreator && !isOpponent) {
      throw new Error('Player not part of this match');
    }

    const updateData: Partial<PvpMatchUpdate> = {};
    if (isCreator) {
      updateData.creator_coin = coinSymbol;
    } else {
      updateData.opponent_coin = coinSymbol;
    }

    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('pvp_matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to select coin: ${error.message}`);
    }

    return data;
  }

  // Start the match when both players have selected coins
  static async startMatch(matchId: string, creatorStartPrice: number, opponentStartPrice: number): Promise<PvpMatch> {
    const startTime = new Date().toISOString();
    
    const { data: match, error: fetchError } = await supabase
      .from('pvp_matches')
      .select()
      .eq('id', matchId)
      .single();

    if (fetchError || !match) {
      throw new Error('Match not found');
    }

    const endTime = new Date(Date.now() + match.duration_seconds * 1000).toISOString();

    const { data, error } = await supabase
      .from('pvp_matches')
      .update({
        status: 'in_progress',
        start_time: startTime,
        end_time: endTime,
        creator_coin_start_price: creatorStartPrice,
        opponent_coin_start_price: opponentStartPrice
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start match: ${error.message}`);
    }

    return data;
  }

  // Finish the match and determine winner
  static async finishMatch(matchId: string, creatorEndPrice: number, opponentEndPrice: number): Promise<PvpMatch> {
    console.log('🏁 PvpService.finishMatch called:', {
      matchId,
      creatorEndPrice,
      opponentEndPrice
    });

    const { data: match, error: fetchError } = await supabase
      .from('pvp_matches')
      .select()
      .eq('id', matchId)
      .single();

    if (fetchError || !match) {
      console.error('❌ Match not found for finishing:', fetchError);
      throw new Error('Match not found');
    }

    console.log('📋 Current match state before finishing:', {
      id: match.id,
      creatorCoin: match.creator_coin,
      opponentCoin: match.opponent_coin,
      creatorStartPrice: match.creator_coin_start_price,
      opponentStartPrice: match.opponent_coin_start_price,
      status: match.status
    });

    // Calculate percentage changes
    const creatorChange = match.creator_coin_start_price
      ? ((creatorEndPrice - match.creator_coin_start_price) / match.creator_coin_start_price) * 100
      : 0;

    const opponentChange = match.opponent_coin_start_price
      ? ((opponentEndPrice - match.opponent_coin_start_price) / match.opponent_coin_start_price) * 100
      : 0;

    console.log('📊 Finishing match with calculations:', {
      creatorStartPrice: match.creator_coin_start_price,
      creatorEndPrice: creatorEndPrice,
      creatorChange: creatorChange.toFixed(6) + '%',
      opponentStartPrice: match.opponent_coin_start_price,
      opponentEndPrice: opponentEndPrice,
      opponentChange: opponentChange.toFixed(6) + '%',
      difference: Math.abs(creatorChange - opponentChange).toFixed(6) + '%'
    });

    // Always determine a winner - no ties!
    let winnerWallet: string;
    if (creatorChange >= opponentChange) {
      winnerWallet = match.creator_wallet;
      console.log('🏆 Creator wins!', creatorChange, '% >=', opponentChange, '%');
    } else {
      winnerWallet = match.opponent_wallet;
      console.log('🏆 Opponent wins!', opponentChange, '% >', creatorChange, '%');
    }

    console.log('💾 Updating database with:', {
      status: 'finished',
      creator_coin_end_price: creatorEndPrice,
      opponent_coin_end_price: opponentEndPrice,
      winner_wallet: winnerWallet
    });

    const { data, error } = await supabase
      .from('pvp_matches')
      .update({
        status: 'finished',
        creator_coin_end_price: creatorEndPrice,
        opponent_coin_end_price: opponentEndPrice,
        winner_wallet: winnerWallet
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update database:', error);
      throw new Error(`Failed to finish match: ${error.message}`);
    }

    console.log('✅ Match finished successfully in database:', {
      id: data.id,
      status: data.status,
      creatorEndPrice: data.creator_coin_end_price,
      opponentEndPrice: data.opponent_coin_end_price,
      winner: data.winner_wallet
    });

    return data;
  }

  // Get match by ID
  static async getMatch(matchId: string): Promise<PvpMatch | null> {
    const { data, error } = await supabase
      .from('pvp_matches')
      .select()
      .eq('id', matchId)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching match by ID:', error);
      return null;
    }

    return data;
  }

  // Get match by invite code
  static async getMatchByInviteCode(inviteCode: string): Promise<PvpMatch | null> {
    const { data, error } = await supabase
      .from('pvp_matches')
      .select()
      .eq('invite_code', inviteCode)
      .single();

    if (error) {
      // PGRST116 means no rows found, which is expected for invalid invite codes
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching match by invite code:', error);
      return null;
    }

    return data;
  }

  // Get available coins for PvP (tokens with Pyth price feeds)
  static async getAvailableCoins(): Promise<AvailableToken[]> {
    const { data, error } = await supabase
      .from('available_tokens')
      .select()
      .eq('is_active', true)
      .not('pyth_price_id', 'is', null)
      .order('symbol');

    if (error) {
      throw new Error(`Failed to fetch available coins: ${error.message}`);
    }

    return data || [];
  }

  // Subscribe to real-time match updates
  static subscribeToMatch(matchId: string, callback: (match: PvpMatch) => void) {
    console.log('Setting up real-time subscription for match:', matchId);

    const channel = supabase
      .channel(`pvp_match_${matchId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: matchId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'pvp_matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          if (payload.new) {
            callback(payload.new as PvpMatch);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to real-time updates');
        }
      });

    return channel;
  }

  // Get matches for a specific wallet (recent matches)
  static async getMatchesForWallet(walletAddress: string, limit: number = 10): Promise<PvpMatch[]> {
    const { data, error } = await supabase
      .from('pvp_matches')
      .select()
      .or(`creator_wallet.eq.${walletAddress},opponent_wallet.eq.${walletAddress}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch matches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find any active or recent matches for a user (for refresh recovery)
   */
  static async getActiveMatchForWallet(walletAddress: string): Promise<PvpMatch | null> {
    const { data, error } = await supabase
      .from('pvp_matches')
      .select()
      .or(`creator_wallet.eq.${walletAddress},opponent_wallet.eq.${walletAddress}`)
      .in('status', ['waiting_for_opponent', 'selecting_coins', 'active'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active match for wallet:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  }

  // Calculate match statistics
  static calculateMatchStats(match: PvpMatch): {
    creatorChange: number;
    opponentChange: number;
    winner: 'creator' | 'opponent';
  } {
    console.log('🔍 PvpService.calculateMatchStats called with match:', {
      id: match.id,
      creatorCoin: match.creator_coin,
      opponentCoin: match.opponent_coin,
      creatorStartPrice: match.creator_coin_start_price,
      creatorEndPrice: match.creator_coin_end_price,
      opponentStartPrice: match.opponent_coin_start_price,
      opponentEndPrice: match.opponent_coin_end_price,
      status: match.status,
      winnerWallet: match.winner_wallet
    });

    const creatorChange = match.creator_coin_start_price && match.creator_coin_end_price
      ? ((match.creator_coin_end_price - match.creator_coin_start_price) / match.creator_coin_start_price) * 100
      : 0;

    const opponentChange = match.opponent_coin_start_price && match.opponent_coin_end_price
      ? ((match.opponent_coin_end_price - match.opponent_coin_start_price) / match.opponent_coin_start_price) * 100
      : 0;

    console.log('📊 Calculated percentage changes:', {
      creatorChange: creatorChange.toFixed(6) + '%',
      opponentChange: opponentChange.toFixed(6) + '%',
      difference: Math.abs(creatorChange - opponentChange).toFixed(6) + '%',
      creatorBetter: creatorChange > opponentChange,
      opponentBetter: opponentChange > creatorChange,
      isExactTie: creatorChange === opponentChange
    });

    // Always declare a winner - no ties allowed!
    let winner: 'creator' | 'opponent' = creatorChange >= opponentChange ? 'creator' : 'opponent';

    console.log('🏆 Winner determination result:', {
      winner,
      creatorChange: creatorChange + '%',
      opponentChange: opponentChange + '%',
      reason: winner === 'creator' ? 'Creator performed better or equal' : 'Opponent performed better'
    });

    return {
      creatorChange,
      opponentChange,
      winner
    };
  }
}
