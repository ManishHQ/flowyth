import { supabase } from '@/lib/supabase';
import { TournamentContractService, ContractTournament, ContractParticipant } from './tournament-contract-service';
import { TOURNAMENT_UTILS, TournamentState } from '@/lib/contracts/tournament-contracts';

export interface Tournament {
  id: string;
  address: string;
  title: string;
  status: 'Registration' | 'Live' | 'Finished';
  prizePool: string;
  entryFee: string;
  participants: number;
  maxParticipants: number;
  startTime: number;
  endTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentParticipant {
  address: string;
  username?: string;
  joinedAt: string;
}

export interface Squad {
  id: string;
  tournamentAddress: string;
  playerAddress: string;
  tokens: {
    position: number;
    tokenId: string;
    category: 'striker' | 'midfielder' | 'defender';
  }[];
  createdAt: string;
}

export class TournamentService {
  // Initialize contract service
  static async initialize(provider: any) {
    await TournamentContractService.initialize(provider);
  }

  // Convert contract tournament to our interface
  private static contractToTournament(contractTournament: ContractTournament, participants: ContractParticipant[]): Tournament {
    return {
      id: contractTournament.id.toString(),
      address: `tournament-${contractTournament.id}`, // Use tournament ID as address for now
      title: contractTournament.name,
      status: TOURNAMENT_UTILS.getStateName(contractTournament.state) as Tournament['status'],
      prizePool: TOURNAMENT_UTILS.formatUSDC(contractTournament.totalPrizePool),
      entryFee: TOURNAMENT_UTILS.formatUSDC(contractTournament.entryFee),
      participants: participants.length,
      maxParticipants: contractTournament.maxParticipants,
      startTime: contractTournament.startTime * 1000, // Convert to milliseconds
      endTime: contractTournament.endTime * 1000,
      createdAt: new Date(contractTournament.registrationStart * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Get all tournaments
  static async getTournaments(): Promise<Tournament[]> {
    try {
      console.log('Fetching tournaments from contract...');
      
      // Get tournaments from contract
      const contractTournaments = await TournamentContractService.getTournaments();
      const tournaments: Tournament[] = [];

      // Get participants for each tournament
      for (const contractTournament of contractTournaments) {
        try {
          const participants = await TournamentContractService.getTournamentParticipants(contractTournament.id);
          const tournament = this.contractToTournament(contractTournament, participants);
          tournaments.push(tournament);
        } catch (error) {
          console.error(`Failed to get participants for tournament ${contractTournament.id}:`, error);
          // Still add tournament without participant count
          const tournament = this.contractToTournament(contractTournament, []);
          tournaments.push(tournament);
        }
      }

      console.log(`Fetched ${tournaments.length} tournaments from contract`);
      return tournaments;
    } catch (error) {
      console.error('Failed to fetch tournaments from contract:', error);
      
      // Fallback to mock data if contract fails
      console.log('Falling back to mock data...');
      return this.getMockTournaments();
    }
  }

  // Fallback mock data
  private static getMockTournaments(): Tournament[] {
    return [
      {
        id: '1',
        address: '0x1234567890123456789012345678901234567890',
        title: 'Crypto Champions League',
        status: 'Registration',
        prizePool: '5000',
        entryFee: '100',
        participants: 12,
        maxParticipants: 20,
        startTime: Date.now() + 3600000,
        endTime: Date.now() + 7200000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        address: '0x2345678901234567890123456789012345678901',
        title: 'DeFi Derby',
        status: 'Live',
        prizePool: '2500',
        entryFee: '50',
        participants: 16,
        maxParticipants: 16,
        startTime: Date.now() - 1800000,
        endTime: Date.now() + 1800000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        address: '0x3456789012345678901234567890123456789012',
        title: 'Altcoin Arena',
        status: 'Finished',
        prizePool: '1000',
        entryFee: '25',
        participants: 8,
        maxParticipants: 10,
        startTime: Date.now() - 7200000,
        endTime: Date.now() - 3600000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

  // Get tournament by address
  static async getTournament(address: string): Promise<Tournament | null> {
    try {
      // TODO: Replace with actual contract call
      const tournaments = await this.getTournaments();
      return tournaments.find(t => t.address === address) || null;
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      return null;
    }
  }

  // Get tournament participants
  static async getTournamentParticipants(tournamentAddress: string): Promise<TournamentParticipant[]> {
    try {
      // TODO: Replace with actual contract call
      const mockParticipants: TournamentParticipant[] = [
        { address: '0x1111111111111111111111111111111111111111', username: 'CryptoKing', joinedAt: new Date().toISOString() },
        { address: '0x2222222222222222222222222222222222222222', username: 'DeFiMaster', joinedAt: new Date().toISOString() },
        { address: '0x3333333333333333333333333333333333333333', username: 'BlockchainBoss', joinedAt: new Date().toISOString() },
      ];

      return mockParticipants;
    } catch (error) {
      console.error('Failed to fetch tournament participants:', error);
      throw new Error('Failed to fetch tournament participants');
    }
  }

  // Register for tournament
  static async registerForTournament(
    tournamentAddress: string,
    playerAddress: string,
    squad: Squad['tokens']
  ): Promise<void> {
    try {
      console.log('Registering for tournament:', {
        tournamentAddress,
        playerAddress,
        squad
      });

      // Extract tournament ID from address (assuming format "tournament-{id}")
      const tournamentId = parseInt(tournamentAddress.replace('tournament-', ''));
      
      if (isNaN(tournamentId)) {
        throw new Error('Invalid tournament address format');
      }

      // Get tournament details to get entry fee
      const tournament = await TournamentContractService.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Convert squad tokens to Pyth IDs
      const squadPythIds = squad.map(token => {
        // Map token symbols to Pyth IDs
        return TOURNAMENT_UTILS.symbolToPythId(token.tokenId);
      }).filter(id => id !== '');

      if (squadPythIds.length !== 6) {
        throw new Error('Squad must have exactly 6 valid crypto assets');
      }

      console.log('Squad Pyth IDs:', squadPythIds);
      console.log('Entry fee:', tournament.entryFee.toString());

      // Register with contract
      const txHash = await TournamentContractService.registerForTournament(
        tournamentId,
        squadPythIds,
        tournament.entryFee
      );

      console.log('Successfully registered for tournament, tx:', txHash);
    } catch (error) {
      console.error('Failed to register for tournament:', error);
      throw new Error(`Failed to register for tournament: ${error}`);
    }
  }

  // Save squad to database
  static async saveSquad(squad: Omit<Squad, 'id' | 'createdAt'>): Promise<Squad> {
    try {
      const { data, error } = await supabase
        .from('tournament_squads')
        .insert({
          tournament_address: squad.tournamentAddress,
          player_address: squad.playerAddress,
          tokens: squad.tokens,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save squad: ${error.message}`);
      }

      return {
        id: data.id,
        tournamentAddress: data.tournament_address,
        playerAddress: data.player_address,
        tokens: data.tokens,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Failed to save squad:', error);
      throw new Error('Failed to save squad');
    }
  }

  // Get squad for player in tournament
  static async getSquad(tournamentAddress: string, playerAddress: string): Promise<Squad | null> {
    try {
      const { data, error } = await supabase
        .from('tournament_squads')
        .select()
        .eq('tournament_address', tournamentAddress)
        .eq('player_address', playerAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No squad found
        }
        throw new Error(`Failed to fetch squad: ${error.message}`);
      }

      return {
        id: data.id,
        tournamentAddress: data.tournament_address,
        playerAddress: data.player_address,
        tokens: data.tokens,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Failed to fetch squad:', error);
      return null;
    }
  }

  // Create tournament (for future use)
  static async createTournament(params: {
    title: string;
    entryFee: string;
    maxParticipants: number;
    startTime: number;
    endTime: number;
  }): Promise<Tournament> {
    try {
      console.log('Creating tournament:', params);

      // TODO: Deploy tournament contract and get address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

      const tournament: Tournament = {
        id: Math.random().toString(),
        address: mockAddress,
        title: params.title,
        status: 'Registration',
        prizePool: '0', // Will be calculated based on participants
        entryFee: params.entryFee,
        participants: 0,
        maxParticipants: params.maxParticipants,
        startTime: params.startTime,
        endTime: params.endTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return tournament;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw new Error('Failed to create tournament');
    }
  }
}
