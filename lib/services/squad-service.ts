import { supabase, type Tournament, type Squad, type SquadInsert, type SquadUpdate, type AvailableToken, type User } from '../supabase';

/**
 * Squad service for managing tournament squads with Dynamic.xyz authentication
 */
export class SquadService {

  /**
   * Get all available tokens for squad building
   */
  static async getAvailableTokens(): Promise<AvailableToken[]> {
    const { data, error } = await supabase
      .from('available_tokens')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('symbol', { ascending: true });

    if (error) {
      throw new Error(`Failed to get available tokens: ${error.message}`);
    }

    return data;
  }

  /**
   * Get available tokens by category
   */
  static async getTokensByCategory(category: 'striker' | 'midfielder' | 'defender'): Promise<AvailableToken[]> {
    const { data, error } = await supabase
      .from('available_tokens')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('symbol', { ascending: true });

    if (error) {
      throw new Error(`Failed to get ${category} tokens: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user profiles by wallet addresses (optimized batch query)
   */
  static async getUserProfilesByWallets(walletAddresses: string[]): Promise<User[]> {
    if (walletAddresses.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, wallet_address, username, full_name, photo_url, email, created_at, updated_at')
      .in('wallet_address', walletAddresses);

    if (error) {
      throw new Error(`Failed to get user profiles: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all tournaments
   */
  static async getTournaments(status?: Tournament['status']): Promise<Tournament[]> {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get tournaments: ${error.message}`);
    }

    return data;
  }

  /**
   * Get tournament by ID
   */
  static async getTournament(tournamentId: string): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get tournament: ${error.message}`);
    }

    return data;
  }

  /**
   * Get active tournaments (registration open)
   */
  static async getActiveTournaments(): Promise<Tournament[]> {
    return this.getTournaments('registration_open');
  }

  /**
   * Create a squad for a tournament
   */
  static async createSquad(squadData: SquadInsert): Promise<Squad> {
    // Validate squad composition (application-level validation)
    this.validateSquadComposition(squadData);

    const { data, error } = await supabase
      .from('squads')
      .insert(squadData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('You already have a squad in this tournament');
      }
      throw new Error(`Failed to create squad: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's squad for a tournament
   */
  static async getUserSquad(tournamentId: string, walletAddress: string): Promise<Squad | null> {
    const { data, error } = await supabase
      .from('squads')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user squad: ${error.message}`);
    }

    return data;
  }

  /**
   * Update squad
   */
  static async updateSquad(squadId: string, updates: SquadUpdate, walletAddress: string): Promise<Squad> {
    // Security: Verify the squad belongs to the user (application-level check)
    const existingSquad = await this.getSquadById(squadId);
    if (!existingSquad || existingSquad.user_wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Unauthorized: Squad does not belong to user');
    }

    const { data, error } = await supabase
      .from('squads')
      .update(updates)
      .eq('id', squadId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update squad: ${error.message}`);
    }

    return data;
  }

  /**
   * Get squad by ID
   */
  static async getSquadById(squadId: string): Promise<Squad | null> {
    const { data, error } = await supabase
      .from('squads')
      .select('*')
      .eq('id', squadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get squad: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all squads for a tournament (for leaderboard)
   */
  static async getTournamentSquads(tournamentId: string): Promise<Squad[]> {
    const { data, error } = await supabase
      .from('squads')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('total_score', { ascending: false }); // Highest score first

    if (error) {
      throw new Error(`Failed to get tournament squads: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark squad entry fee as paid
   */
  static async markEntryFeePaid(squadId: string, txHash: string, walletAddress: string): Promise<Squad> {
    return this.updateSquad(squadId, {
      entry_fee_paid: true,
      payment_tx_hash: txHash
    }, walletAddress);
  }

  /**
   * Update squad scores (for tournament settlement)
   */
  static async updateSquadScore(squadId: string, score: number, rank?: number): Promise<Squad> {
    const { data, error } = await supabase
      .from('squads')
      .update({
        total_score: score,
        rank_in_tournament: rank
      })
      .eq('id', squadId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update squad score: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate squad composition (application-level validation)
   */
  private static validateSquadComposition(squadData: SquadInsert): void {
    // Check that all required positions are filled
    const requiredFields = [
      'striker_1_symbol', 'striker_2_symbol',
      'midfielder_1_symbol', 'midfielder_2_symbol',
      'defender_1_symbol', 'defender_2_symbol'
    ];

    for (const field of requiredFields) {
      if (!squadData[field as keyof SquadInsert] || (squadData[field as keyof SquadInsert] as string).trim() === '') {
        throw new Error(`Invalid squad: ${field} is required`);
      }
    }

    // Check for duplicate tokens
    const allTokens = [
      squadData.striker_1_symbol,
      squadData.striker_2_symbol,
      squadData.midfielder_1_symbol,
      squadData.midfielder_2_symbol,
      squadData.defender_1_symbol,
      squadData.defender_2_symbol
    ];

    const uniqueTokens = new Set(allTokens.map(t => t.toUpperCase()));
    if (uniqueTokens.size !== 6) {
      throw new Error('Invalid squad: All tokens must be unique');
    }

    // Validate squad name
    if (!squadData.squad_name || squadData.squad_name.trim().length < 3) {
      throw new Error('Squad name must be at least 3 characters long');
    }
  }

  /**
   * Get tournament leaderboard with user details
   */
  static async getTournamentLeaderboard(tournamentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('squads')
      .select(`
        *,
        users!inner(username, full_name)
      `)
      .eq('tournament_id', tournamentId)
      .eq('entry_fee_paid', true)
      .order('total_score', { ascending: false })
      .order('created_at', { ascending: true }); // Tie-breaker: earlier registration wins

    if (error) {
      throw new Error(`Failed to get tournament leaderboard: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if user can register for tournament
   */
  static async canUserRegister(tournamentId: string, walletAddress: string): Promise<{
    canRegister: boolean;
    reason?: string;
  }> {
    // Check if tournament exists and is open for registration
    const tournament = await this.getTournament(tournamentId);
    if (!tournament) {
      return { canRegister: false, reason: 'Tournament not found' };
    }

    if (tournament.status !== 'registration_open') {
      return { canRegister: false, reason: 'Registration is closed' };
    }

    // Check if registration deadline has passed
    const now = new Date();
    const deadline = new Date(tournament.registration_deadline);
    if (now > deadline) {
      return { canRegister: false, reason: 'Registration deadline has passed' };
    }

    // Check if tournament is full
    if (tournament.current_participants >= tournament.max_participants) {
      return { canRegister: false, reason: 'Tournament is full' };
    }

    // Check if user already has a squad
    const existingSquad = await this.getUserSquad(tournamentId, walletAddress);
    if (existingSquad) {
      return { canRegister: false, reason: 'You already have a squad in this tournament' };
    }

    return { canRegister: true };
  }
}

// Helper types for squad building
export interface SquadPosition {
  position: 'striker' | 'midfielder' | 'defender';
  tokens: AvailableToken[];
  maxTokens: number;
  multiplier: number;
}

export interface SquadComposition {
  strikers: AvailableToken[];
  midfielders: AvailableToken[];
  defenders: AvailableToken[];
}
