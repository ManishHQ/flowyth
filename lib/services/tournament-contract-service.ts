import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  formatUnits, 
  parseUnits,
  getContract,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash
} from 'viem';
import { TOURNAMENT_CONTRACTS, TournamentState, TOURNAMENT_UTILS, CRYPTO_ASSETS } from '@/lib/contracts/tournament-contracts';

export interface ContractTournament {
  id: number;
  name: string;
  entryFee: bigint;
  registrationStart: number;
  registrationEnd: number;
  startTime: number;
  endTime: number;
  maxParticipants: number;
  minParticipantsPerGroup: number;
  state: TournamentState;
  groupCount: number;
  totalPrizePool: bigint;
  prizePerGroup: bigint;
}

export interface ContractParticipant {
  address: string;
  groupId: number;
  squad: string[]; // Array of Pyth IDs
  registrationTime?: number;
}

export interface ContractGroup {
  id: number;
  participants: string[];
  isFinalized: boolean;
  winners?: string[];
  prizes?: bigint[];
}

export class TournamentContractService {
  private static publicClient: PublicClient | null = null;
  private static walletClient: WalletClient | null = null;

  // Initialize clients
  static async initialize(walletProvider: any) {
    // Create public client for reading
    this.publicClient = createPublicClient({
      transport: custom(walletProvider)
    });

    // Create wallet client for transactions
    this.walletClient = createWalletClient({
      transport: custom(walletProvider)
    });
  }

  // Get tournament contract for reading
  private static getTournamentContract() {
    if (!this.publicClient) {
      throw new Error('Public client not initialized');
    }

    return getContract({
      address: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.address as Address,
      abi: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.abi,
      client: this.publicClient
    });
  }

  // Get tournament contract for writing
  private static getTournamentContractForWrite() {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    return getContract({
      address: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.address as Address,
      abi: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.abi,
      client: this.walletClient
    });
  }

  // Get USDC contract for reading
  private static getUSDCContract() {
    if (!this.publicClient) {
      throw new Error('Public client not initialized');
    }

    return getContract({
      address: TOURNAMENT_CONTRACTS.MOCK_USDC.address as Address,
      abi: TOURNAMENT_CONTRACTS.MOCK_USDC.abi,
      client: this.publicClient
    });
  }

  // Get USDC contract for writing
  private static getUSDCContractForWrite() {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized');
    }

    return getContract({
      address: TOURNAMENT_CONTRACTS.MOCK_USDC.address as Address,
      abi: TOURNAMENT_CONTRACTS.MOCK_USDC.abi,
      client: this.walletClient
    });
  }

  // Get all tournaments
  static async getTournaments(): Promise<ContractTournament[]> {
    try {
      const contract = this.getTournamentContract();
      const tournamentCount = await contract.read.tournamentCounter();
      const tournaments: ContractTournament[] = [];

      for (let i = 0; i < Number(tournamentCount); i++) {
        const tournament = await this.getTournament(i);
        if (tournament) {
          tournaments.push(tournament);
        }
      }

      return tournaments;
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      throw new Error('Failed to fetch tournaments from contract');
    }
  }

  // Get single tournament
  static async getTournament(tournamentId: number): Promise<ContractTournament | null> {
    try {
      const contract = this.getTournamentContract();
      const tournamentData = await contract.read.tournaments([BigInt(tournamentId)]);
      
      return {
        id: Number(tournamentData[0]), // id
        name: tournamentData[1], // name
        entryFee: tournamentData[2], // entryFee
        registrationStart: Number(tournamentData[3]), // registrationStart
        registrationEnd: Number(tournamentData[4]), // registrationEnd
        startTime: Number(tournamentData[5]), // startTime
        endTime: Number(tournamentData[6]), // endTime
        maxParticipants: Number(tournamentData[8]), // maxParticipants
        minParticipantsPerGroup: Number(tournamentData[9]), // minParticipantsPerGroup
        state: Number(tournamentData[10]) as TournamentState, // state
        groupCount: Number(tournamentData[11]), // groupCount
        totalPrizePool: tournamentData[12], // totalPrizePool
        prizePerGroup: tournamentData[13], // prizePerGroup
      };
    } catch (error) {
      console.error(`Failed to fetch tournament ${tournamentId}:`, error);
      return null;
    }
  }

  // Get tournament participants
  static async getTournamentParticipants(tournamentId: number): Promise<ContractParticipant[]> {
    try {
      const contract = this.getTournamentContract();
      const participantAddresses = await contract.read.getTournamentParticipants([BigInt(tournamentId)]);
      const participants: ContractParticipant[] = [];

      for (const address of participantAddresses) {
        const groupId = await contract.read.getPlayerGroup([BigInt(tournamentId), address as Address]);
        const squad = await contract.read.getPlayerSquad([BigInt(tournamentId), address as Address]);
        
        participants.push({
          address: address as string,
          groupId: Number(groupId),
          squad: squad.map((pythId: string) => pythId),
        });
      }

      return participants;
    } catch (error) {
      console.error(`Failed to fetch participants for tournament ${tournamentId}:`, error);
      throw new Error('Failed to fetch tournament participants');
    }
  }

  // Get player's squad
  static async getPlayerSquad(tournamentId: number, playerAddress: string): Promise<string[] | null> {
    try {
      const contract = this.getTournamentContract();
      const squad = await contract.read.getPlayerSquad([BigInt(tournamentId), playerAddress as Address]);
      return squad.map((pythId: string) => pythId);
    } catch (error) {
      console.error(`Failed to fetch squad for player ${playerAddress}:`, error);
      return null;
    }
  }

  // Register for tournament
  static async registerForTournament(
    tournamentId: number,
    squadPythIds: string[],
    entryFee: bigint
  ): Promise<Hash> {
    if (squadPythIds.length !== 6) {
      throw new Error('Squad must have exactly 6 crypto assets');
    }

    try {
      const contract = this.getTournamentContractForWrite();
      
      // Convert squad to bytes32 array
      const squadBytes32 = squadPythIds.map(id => id.startsWith('0x') ? id : `0x${id}`) as [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`];
      
      console.log('Registering for tournament:', {
        tournamentId,
        squadBytes32,
        entryFee: entryFee.toString()
      });

      // Call contract function
      const hash = await this.walletClient!.writeContract({
        address: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.address as Address,
        abi: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.abi,
        functionName: 'registerForTournament',
        args: [BigInt(tournamentId), squadBytes32],
        value: entryFee
      });

      console.log('Registration transaction sent:', hash);
      
      // Wait for confirmation
      if (this.publicClient) {
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log('Registration confirmed:', receipt.transactionHash);
      }

      return hash;
    } catch (error) {
      console.error('Failed to register for tournament:', error);
      throw new Error(`Failed to register for tournament: ${error}`);
    }
  }

  // Create tournament (owner only)
  static async createTournament(params: {
    name: string;
    entryFee: bigint;
    registrationDuration: number; // seconds
    tournamentDuration: number; // seconds
    maxParticipants: number;
    minParticipantsPerGroup: number;
  }): Promise<Hash> {
    try {
      const contract = this.getTournamentContractForWrite();
      
      console.log('Creating tournament:', params);

      const hash = await this.walletClient!.writeContract({
        address: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.address as Address,
        abi: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.abi,
        functionName: 'createTournament',
        args: [
          params.name,
          params.entryFee,
          BigInt(params.registrationDuration),
          BigInt(params.tournamentDuration),
          BigInt(params.maxParticipants),
          BigInt(params.minParticipantsPerGroup)
        ]
      });

      console.log('Tournament creation transaction sent:', hash);
      
      // Wait for confirmation
      if (this.publicClient) {
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log('Tournament creation confirmed:', receipt.transactionHash);
      }

      return hash;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw new Error(`Failed to create tournament: ${error}`);
    }
  }

  // Start tournament (owner only)
  static async startTournament(tournamentId: number, priceUpdateData: string[]): Promise<Hash> {
    try {
      const contract = this.getTournamentContractForWrite();
      
      // Get update fee from Pyth
      // TODO: Implement Pyth price update fee calculation
      const updateFee = parseUnits('0.01', 18); // Placeholder

      const hash = await this.walletClient!.writeContract({
        address: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.address as Address,
        abi: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.abi,
        functionName: 'startTournament',
        args: [BigInt(tournamentId), priceUpdateData as `0x${string}`[]],
        value: updateFee
      });

      // Wait for confirmation
      if (this.publicClient) {
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log('Tournament start confirmed:', receipt.transactionHash);
      }

      return hash;
    } catch (error) {
      console.error('Failed to start tournament:', error);
      throw new Error(`Failed to start tournament: ${error}`);
    }
  }

  // Finish tournament (owner only)
  static async finishTournament(tournamentId: number, priceUpdateData: string[]): Promise<Hash> {
    try {
      const contract = this.getTournamentContractForWrite();
      
      // Get update fee from Pyth
      const updateFee = parseUnits('0.01', 18); // Placeholder

      const hash = await this.walletClient!.writeContract({
        address: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.address as Address,
        abi: TOURNAMENT_CONTRACTS.GROUP_TOURNAMENT.abi,
        functionName: 'finishTournament',
        args: [BigInt(tournamentId), priceUpdateData as `0x${string}`[]],
        value: updateFee
      });

      // Wait for confirmation
      if (this.publicClient) {
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log('Tournament finish confirmed:', receipt.transactionHash);
      }

      return hash;
    } catch (error) {
      console.error('Failed to finish tournament:', error);
      throw new Error(`Failed to finish tournament: ${error}`);
    }
  }

  // USDC Functions
  static async getUSDCBalance(address: string): Promise<bigint> {
    try {
      const contract = this.getUSDCContract();
      const balance = await contract.read.balanceOf([address as Address]);
      return balance;
    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      return BigInt(0);
    }
  }

  static async approveUSDC(spender: string, amount: bigint): Promise<Hash> {
    try {
      const contract = this.getUSDCContractForWrite();
      
      const hash = await this.walletClient!.writeContract({
        address: TOURNAMENT_CONTRACTS.MOCK_USDC.address as Address,
        abi: TOURNAMENT_CONTRACTS.MOCK_USDC.abi,
        functionName: 'approve',
        args: [spender as Address, amount]
      });
      
      // Wait for confirmation
      if (this.publicClient) {
        await this.publicClient.waitForTransactionReceipt({ hash });
      }
      
      return hash;
    } catch (error) {
      console.error('Failed to approve USDC:', error);
      throw new Error(`Failed to approve USDC: ${error}`);
    }
  }

  static async getUSDCFaucet(): Promise<Hash> {
    try {
      const contract = this.getUSDCContractForWrite();
      
      const hash = await this.walletClient!.writeContract({
        address: TOURNAMENT_CONTRACTS.MOCK_USDC.address as Address,
        abi: TOURNAMENT_CONTRACTS.MOCK_USDC.abi,
        functionName: 'faucet',
        args: []
      });
      
      // Wait for confirmation
      if (this.publicClient) {
        await this.publicClient.waitForTransactionReceipt({ hash });
      }
      
      return hash;
    } catch (error) {
      console.error('Failed to get USDC from faucet:', error);
      throw new Error(`Failed to get USDC from faucet: ${error}`);
    }
  }

  // Get supported crypto assets
  static async getSupportedCryptos(): Promise<{ pythId: string; symbol: string; name: string }[]> {
    try {
      const contract = this.getTournamentContract();
      const cryptos = [];

      // Try to read supported cryptos by index until we hit an error
      for (let i = 0; i < 20; i++) { // Max 20 cryptos
        try {
          const pythId = await contract.read.supportedCryptos([BigInt(i)]);
          const asset = await contract.read.cryptoAssets([pythId]);
          
          cryptos.push({
            pythId: asset[0], // pythId
            symbol: asset[1], // symbol
            name: asset[2], // name
          });
        } catch (error) {
          // No more cryptos available
          break;
        }
      }

      return cryptos;
    } catch (error) {
      console.error('Failed to get supported cryptos:', error);
      return [];
    }
  }

  // Utility function to check if user is tournament owner
  static async isOwner(address: string): Promise<boolean> {
    try {
      const contract = this.getTournamentContract();
      const owner = await contract.read.owner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Failed to check owner:', error);
      return false;
    }
  }
}
