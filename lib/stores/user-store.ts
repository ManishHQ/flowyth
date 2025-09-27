import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { UserService } from '../services/user-service';
import type { User } from '../supabase';

// User onboarding state
export type OnboardingStatus = 'idle' | 'checking' | 'onboarding' | 'completed';

interface UserState {
  // Current user data
  user: User | null;

  // Onboarding state
  onboardingStatus: OnboardingStatus;
  isOnboarding: boolean;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User management
  checkUserExists: (walletAddress: string) => Promise<boolean>;
  loadUser: (walletAddress: string) => Promise<void>;
  createUser: (userData: {
    wallet_address: string;
    full_name?: string;
    username?: string;
    email?: string;
  }) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;

  // Onboarding flow
  startOnboarding: () => void;
  completeOnboarding: () => void;

  // Reset state
  reset: () => void;
}

// Initial state
const initialState = {
  user: null,
  onboardingStatus: 'idle' as OnboardingStatus,
  isOnboarding: false,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Basic setters
    setUser: (user) => set({ user }),
    setOnboardingStatus: (status) => set({
      onboardingStatus: status,
      isOnboarding: status === 'onboarding'
    }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Check if user exists in database
    checkUserExists: async (walletAddress: string) => {
      try {
        set({ isLoading: true, error: null });
        const user = await UserService.getUserByWallet(walletAddress);
        const exists = user !== null;

        if (exists) {
          set({ user, onboardingStatus: 'completed' });
        } else {
          set({ onboardingStatus: 'onboarding', isOnboarding: true });
        }

        return exists;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check user';
        set({ error: errorMessage, onboardingStatus: 'idle' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    // Load user data
    loadUser: async (walletAddress: string) => {
      try {
        set({ isLoading: true, error: null });
        const user = await UserService.getUserByWallet(walletAddress);

        if (user) {
          set({
            user,
            onboardingStatus: 'completed',
            isOnboarding: false
          });
        } else {
          set({
            user: null,
            onboardingStatus: 'onboarding',
            isOnboarding: true
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load user';
        set({ error: errorMessage });
      } finally {
        set({ isLoading: false });
      }
    },

    // Create new user
    createUser: async (userData) => {
      try {
        set({ isLoading: true, error: null });
        // Ensure required fields have default values
        const userDataWithDefaults = {
          wallet_address: userData.wallet_address,
          full_name: userData.full_name || '',
          username: userData.username || '',
          email: userData.email || '',
        };
        const user = await UserService.upsertUser(userDataWithDefaults);
        set({
          user,
          onboardingStatus: 'completed',
          isOnboarding: false
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
        set({ error: errorMessage });
        throw error; // Re-throw for component handling
      } finally {
        set({ isLoading: false });
      }
    },

    // Update existing user
    updateUser: async (updates) => {
      const { user } = get();
      if (!user) throw new Error('No user to update');

      try {
        set({ isLoading: true, error: null });
        console.log('Updating user with data:', updates);
        const updatedUser = await UserService.updateUser(user.wallet_address, updates);
        console.log('User updated successfully:', updatedUser);
        set({ user: updatedUser });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
        console.error('Failed to update user:', error);
        set({ error: errorMessage });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    // Onboarding flow controls
    startOnboarding: () => set({
      onboardingStatus: 'onboarding',
      isOnboarding: true,
      error: null
    }),

    completeOnboarding: () => set({
      onboardingStatus: 'completed',
      isOnboarding: false
    }),

    // Reset all state
    reset: () => set(initialState),
  }))
);

// Utility hooks for common patterns
export const useUser = () => useUserStore((state) => state.user);
export const useIsOnboarding = () => useUserStore((state) => state.isOnboarding);
export const useUserLoading = () => useUserStore((state) => state.isLoading);
export const useUserError = () => useUserStore((state) => state.error);

// Hook for checking username availability
export const useUsernameAvailability = () => {
  const checkAvailability = async (username: string): Promise<boolean> => {
    try {
      return await UserService.isUsernameAvailable(username);
    } catch (error) {
      console.error('Failed to check username availability:', error);
      return false;
    }
  };

  return { checkAvailability };
};