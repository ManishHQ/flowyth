import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Tournament {
  address: string;
  title: string;
  entryFee: string;
  startTime: number;
  endTime: number;
  participants: number;
  maxParticipants: number;
  status: 'Registration' | 'Live' | 'Finished' | 'Cancelled';
  groupsCreated: boolean;
  prizePool: string;
}

export interface TournamentParticipant {
  address: string;
  joinedAt?: number;
  user?: {
    id: string;
    username?: string;
    full_name?: string;
    photo_url?: string;
  };
}

export interface TournamentDetails {
  tournament: Tournament | null;
  participants: TournamentParticipant[];
  loading: boolean;
  lastFetched: number | null;
}

interface TournamentState {
  // Tournament list
  tournaments: Tournament[];
  tournamentsLoading: boolean;
  tournamentsLastFetched: number | null;

  // Tournament details cache
  tournamentDetails: Record<string, TournamentDetails>;

  // Actions
  fetchTournaments: () => Promise<void>;
  fetchTournamentDetails: (address: string, force?: boolean) => Promise<void>;
  updateTournamentParticipants: (address: string, count: number) => void;
  clearCache: () => void;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds

export const useTournamentStore = create<TournamentState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tournaments: [],
    tournamentsLoading: false,
    tournamentsLastFetched: null,
    tournamentDetails: {},

    // Actions
    fetchTournaments: async () => {
      const now = Date.now();
      const { tournamentsLastFetched, tournamentsLoading } = get();

      // Skip if recently fetched or already loading
      if (
        (tournamentsLastFetched && now - tournamentsLastFetched < CACHE_DURATION) ||
        tournamentsLoading
      ) {
        return;
      }

      set({ tournamentsLoading: true });

      try {
        // TODO: Implement real contract calls
        // For now, return empty array
        const tournaments: Tournament[] = [];

        set({
          tournaments,
          tournamentsLoading: false,
          tournamentsLastFetched: now,
        });
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
        set({ tournamentsLoading: false });
      }
    },

    fetchTournamentDetails: async (address: string, force = false) => {
      const now = Date.now();
      const { tournamentDetails } = get();
      const existingDetails = tournamentDetails[address];

      // Skip if recently fetched and not forced
      if (
        !force &&
        existingDetails?.lastFetched &&
        now - existingDetails.lastFetched < CACHE_DURATION &&
        !existingDetails.loading
      ) {
        return;
      }

      // Set loading state
      set({
        tournamentDetails: {
          ...tournamentDetails,
          [address]: {
            ...existingDetails,
            loading: true,
          },
        },
      });

      try {
        // TODO: Implement real contract calls
        const tournament: Tournament = {
          address,
          title: 'Sample Tournament',
          entryFee: '10',
          startTime: Date.now() + 3600000,
          endTime: Date.now() + 86400000,
          participants: 0,
          maxParticipants: 100,
          status: 'Registration',
          groupsCreated: false,
          prizePool: '0',
        };

        const participants: TournamentParticipant[] = [];

        set({
          tournamentDetails: {
            ...get().tournamentDetails,
            [address]: {
              tournament,
              participants,
              loading: false,
              lastFetched: now,
            },
          },
        });
      } catch (error) {
        console.error(`Failed to fetch tournament details for ${address}:`, error);
        set({
          tournamentDetails: {
            ...get().tournamentDetails,
            [address]: {
              tournament: null,
              participants: [],
              loading: false,
              lastFetched: now,
            },
          },
        });
      }
    },

    updateTournamentParticipants: (address: string, count: number) => {
      const { tournaments, tournamentDetails } = get();

      // Update tournaments list
      const updatedTournaments = tournaments.map(t =>
        t.address === address
          ? { ...t, participants: count, prizePool: (Number(t.entryFee) * count).toString() }
          : t
      );

      // Update tournament details if cached
      const updatedDetails = { ...tournamentDetails };
      if (updatedDetails[address]?.tournament) {
        updatedDetails[address] = {
          ...updatedDetails[address],
          tournament: {
            ...updatedDetails[address].tournament!,
            participants: count,
            prizePool: (Number(updatedDetails[address].tournament!.entryFee) * count).toString(),
          },
        };
      }

      set({
        tournaments: updatedTournaments,
        tournamentDetails: updatedDetails,
      });
    },

    clearCache: () => {
      set({
        tournaments: [],
        tournamentsLoading: false,
        tournamentsLastFetched: null,
        tournamentDetails: {},
      });
    },
  }))
);