import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll handle auth via Dynamic.xyz
    autoRefreshToken: false,
  },
});

// Database types (generated from schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          full_name: string;
          username: string;
          photo_url: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          full_name: string;
          username: string;
          photo_url?: string | null;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          full_name?: string | null;
          username?: string | null;
          photo_url?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          entry_fee_usdc: number;
          max_participants: number;
          current_participants: number;
          start_time: string;
          end_time: string;
          registration_deadline: string;
          status: 'upcoming' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';
          prize_pool_usdc: number;
          winner_wallet_address: string | null;
          settlement_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          entry_fee_usdc?: number;
          max_participants?: number;
          current_participants?: number;
          start_time: string;
          end_time: string;
          registration_deadline: string;
          status?: 'upcoming' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';
          prize_pool_usdc?: number;
          winner_wallet_address?: string | null;
          settlement_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          entry_fee_usdc?: number;
          max_participants?: number;
          current_participants?: number;
          start_time?: string;
          end_time?: string;
          registration_deadline?: string;
          status?: 'upcoming' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';
          prize_pool_usdc?: number;
          winner_wallet_address?: string | null;
          settlement_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      squads: {
        Row: {
          id: string;
          tournament_id: string;
          user_wallet_address: string;
          squad_name: string;
          striker_1_symbol: string;
          striker_1_price_at_start: number | null;
          striker_1_price_at_end: number | null;
          striker_2_symbol: string;
          striker_2_price_at_start: number | null;
          striker_2_price_at_end: number | null;
          midfielder_1_symbol: string;
          midfielder_1_price_at_start: number | null;
          midfielder_1_price_at_end: number | null;
          midfielder_2_symbol: string;
          midfielder_2_price_at_start: number | null;
          midfielder_2_price_at_end: number | null;
          defender_1_symbol: string;
          defender_1_price_at_start: number | null;
          defender_1_price_at_end: number | null;
          defender_2_symbol: string;
          defender_2_price_at_start: number | null;
          defender_2_price_at_end: number | null;
          total_score: number;
          rank_in_tournament: number | null;
          entry_fee_paid: boolean;
          payment_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_wallet_address: string;
          squad_name: string;
          striker_1_symbol: string;
          striker_1_price_at_start?: number | null;
          striker_1_price_at_end?: number | null;
          striker_2_symbol: string;
          striker_2_price_at_start?: number | null;
          striker_2_price_at_end?: number | null;
          midfielder_1_symbol: string;
          midfielder_1_price_at_start?: number | null;
          midfielder_1_price_at_end?: number | null;
          midfielder_2_symbol: string;
          midfielder_2_price_at_start?: number | null;
          midfielder_2_price_at_end?: number | null;
          defender_1_symbol: string;
          defender_1_price_at_start?: number | null;
          defender_1_price_at_end?: number | null;
          defender_2_symbol: string;
          defender_2_price_at_start?: number | null;
          defender_2_price_at_end?: number | null;
          total_score?: number;
          rank_in_tournament?: number | null;
          entry_fee_paid?: boolean;
          payment_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          user_wallet_address?: string;
          squad_name?: string;
          striker_1_symbol?: string;
          striker_1_price_at_start?: number | null;
          striker_1_price_at_end?: number | null;
          striker_2_symbol?: string;
          striker_2_price_at_start?: number | null;
          striker_2_price_at_end?: number | null;
          midfielder_1_symbol?: string;
          midfielder_1_price_at_start?: number | null;
          midfielder_1_price_at_end?: number | null;
          midfielder_2_symbol?: string;
          midfielder_2_price_at_start?: number | null;
          midfielder_2_price_at_end?: number | null;
          defender_1_symbol?: string;
          defender_1_price_at_start?: number | null;
          defender_1_price_at_end?: number | null;
          defender_2_symbol?: string;
          defender_2_price_at_start?: number | null;
          defender_2_price_at_end?: number | null;
          total_score?: number;
          rank_in_tournament?: number | null;
          entry_fee_paid?: boolean;
          payment_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      available_tokens: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          category: 'striker' | 'midfielder' | 'defender';
          multiplier: number;
          pyth_price_id: string | null;
          logo_emoji: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          category: 'striker' | 'midfielder' | 'defender';
          multiplier: number;
          pyth_price_id?: string | null;
          logo_emoji?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          name?: string;
          category?: 'striker' | 'midfielder' | 'defender';
          multiplier?: number;
          pyth_price_id?: string | null;
          logo_emoji?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      token_price_history: {
        Row: {
          id: string;
          tournament_id: string;
          token_symbol: string;
          price: number;
          confidence_interval: number | null;
          pyth_price_id: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          token_symbol: string;
          price: number;
          confidence_interval?: number | null;
          pyth_price_id?: string | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          token_symbol?: string;
          price?: number;
          confidence_interval?: number | null;
          pyth_price_id?: string | null;
          recorded_at?: string;
        };
      };
    };
  };
};

// Type helpers
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Tournament = Database['public']['Tables']['tournaments']['Row'];
export type TournamentInsert = Database['public']['Tables']['tournaments']['Insert'];
export type TournamentUpdate = Database['public']['Tables']['tournaments']['Update'];

export type Squad = Database['public']['Tables']['squads']['Row'];
export type SquadInsert = Database['public']['Tables']['squads']['Insert'];
export type SquadUpdate = Database['public']['Tables']['squads']['Update'];

export type AvailableToken = Database['public']['Tables']['available_tokens']['Row'];
export type AvailableTokenInsert = Database['public']['Tables']['available_tokens']['Insert'];
export type AvailableTokenUpdate = Database['public']['Tables']['available_tokens']['Update'];

export type TokenPriceHistory = Database['public']['Tables']['token_price_history']['Row'];
export type TokenPriceHistoryInsert = Database['public']['Tables']['token_price_history']['Insert'];
export type TokenPriceHistoryUpdate = Database['public']['Tables']['token_price_history']['Update'];