import { supabase, type User, type UserInsert, type UserUpdate } from '../supabase';

/**
 * User service for managing user profiles with Dynamic.xyz authentication
 */
export class UserService {

  /**
   * Get user by wallet address
   */
  static async getUserByWallet(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't exist
        return null;
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  /**
   * Create or update user profile (upsert)
   */
  static async upsertUser(userData: UserInsert): Promise<User> {
    // Normalize wallet address to lowercase
    const normalizedData = {
      ...userData,
      wallet_address: userData.wallet_address.toLowerCase(),
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(normalizedData, {
        onConflict: 'wallet_address',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert user: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to upsert user: No data returned');
    }

    return data;
  }

  /**
   * Update user profile
   */
  static async updateUser(walletAddress: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update user: No data returned');
    }

    return data;
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string, excludeWallet?: string): Promise<boolean> {
    let query = supabase
      .from('users')
      .select('username')
      .eq('username', username);

    if (excludeWallet) {
      query = query.neq('wallet_address', excludeWallet.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check username: ${error.message}`);
    }

    return data.length === 0;
  }

  /**
   * Upload user photo to Supabase storage
   */
  static async uploadUserPhoto(
    walletAddress: string,
    file: File
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${walletAddress.toLowerCase()}/profile.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(fileName, file, {
        upsert: true, // Overwrite existing
      });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Delete user photo
   */
  static async deleteUserPhoto(walletAddress: string): Promise<void> {
    const { error } = await supabase.storage
      .from('user-photos')
      .remove([`${walletAddress.toLowerCase()}/profile`]);

    if (error) {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  /**
   * Get all users (for leaderboards, etc.)
   */
  static async getAllUsers(limit = 100): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    return data;
  }

  /**
   * Search users by username
   */
  static async searchUsers(query: string, limit = 10): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data;
  }
}