import { useState, useEffect, useCallback } from 'react';
import { TournamentService, Tournament, TournamentParticipant, Squad } from '@/lib/services/tournament-service';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tournamentsData = await TournamentService.getTournaments();
      setTournaments(tournamentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tournaments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return {
    tournaments,
    loading,
    error,
    refetch: fetchTournaments,
  };
}

export function useTournament(tournamentAddress: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournament = useCallback(async () => {
    if (!tournamentAddress) return;

    setLoading(true);
    setError(null);
    
    try {
      const [tournamentData, participantsData] = await Promise.all([
        TournamentService.getTournament(tournamentAddress),
        TournamentService.getTournamentParticipants(tournamentAddress)
      ]);

      setTournament(tournamentData);
      setParticipants(participantsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tournament';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tournamentAddress]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  return {
    tournament,
    participants,
    loading,
    error,
    refetch: fetchTournament,
  };
}

export function useTournamentRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerForTournament = useCallback(async (
    tournamentAddress: string,
    playerAddress: string,
    squad: Squad['tokens']
  ) => {
    setLoading(true);
    setError(null);

    try {
      await TournamentService.registerForTournament(tournamentAddress, playerAddress, squad);
      
      // Also save squad to database
      await TournamentService.saveSquad({
        tournamentAddress,
        playerAddress,
        tokens: squad,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for tournament';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    registerForTournament,
    loading,
    error,
  };
}

export function useSquad(tournamentAddress: string, playerAddress: string) {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSquad = useCallback(async () => {
    if (!tournamentAddress || !playerAddress) return;

    setLoading(true);
    setError(null);
    
    try {
      const squadData = await TournamentService.getSquad(tournamentAddress, playerAddress);
      setSquad(squadData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch squad';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tournamentAddress, playerAddress]);

  const saveSquad = useCallback(async (tokens: Squad['tokens']) => {
    if (!tournamentAddress || !playerAddress) return;

    setLoading(true);
    setError(null);

    try {
      const savedSquad = await TournamentService.saveSquad({
        tournamentAddress,
        playerAddress,
        tokens,
      });
      setSquad(savedSquad);
      return savedSquad;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save squad';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tournamentAddress, playerAddress]);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  return {
    squad,
    loading,
    error,
    saveSquad,
    refetch: fetchSquad,
  };
}