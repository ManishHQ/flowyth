'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext, useIsLoggedIn } from '@/lib/dynamic';
import { useUserStore } from '@/lib/stores/user-store';
import type { User } from '@/lib/supabase';

interface UserProfile {
  full_name?: string;
  username?: string;
  email?: string;
  photo_url?: string;
  created_at?: string;
}

interface MissingFields {
  username: boolean;
  fullName: boolean;
  email: boolean;
}

export function useDynamicUser() {
  const { user, primaryWallet } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  
  return {
    user,
    primaryWallet,
    isLoggedIn,
    walletAddress: primaryWallet?.address,
  };
}

export function useUserProfile() {
  const { user, primaryWallet, isLoggedIn } = useDynamicContext();
  const { user: profile, loadUser, checkUserExists } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = primaryWallet?.address;

  // Load user profile when wallet address changes
  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      const loadProfile = async () => {
        try {
          setIsLoading(true);
          setError(null);
          console.log('Loading profile for wallet:', walletAddress);
          const userExists = await checkUserExists(walletAddress);
          console.log('User exists:', userExists);
        } catch (err) {
          console.error('Failed to load profile:', err);
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
          setIsLoading(false);
        }
      };

      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, walletAddress, checkUserExists]);

  // Get email from Dynamic user
  const dynamicEmail = user?.email;

  // Generate display name
  const displayName = profile?.full_name || 
                     profile?.username || 
                     dynamicEmail || 
                     (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Anonymous');

  // Check profile completeness
  const missingFields: MissingFields = {
    username: !profile?.username,
    fullName: !profile?.full_name,
    email: false, // Email is not required for profile completion
  };

  const isComplete = !missingFields.username && !missingFields.fullName;

  console.log('useUserProfile returning:', {
    profile,
    walletAddress,
    displayName,
    dynamicEmail,
    isComplete,
    missingFields,
    isLoading,
    error,
    isLoggedIn,
  });

  return {
    profile,
    walletAddress,
    displayName,
    dynamicEmail,
    isComplete,
    missingFields,
    isLoading,
    error,
    isLoggedIn,
  };
}
