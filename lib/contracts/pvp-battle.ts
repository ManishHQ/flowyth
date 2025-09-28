import { ethers } from 'ethers';

// ABI for PvP Battle Factory contract
export const PVP_BATTLE_FACTORY_ABI = [
  // Main functions
  "function deployBattleContract(string calldata roomId) returns (address)",
  "function getBattleContract(string calldata roomId) view returns (address)",
  "function getRoomId(address battleContract) view returns (string)",
  "function battleContractExists(string calldata roomId) view returns (bool)",
  "function getDeployedContractsCount() view returns (uint256)",
  "function getDeployedContract(uint256 index) view returns (address)",

  // Events
  "event BattleContractDeployed(string indexed roomId, address indexed battleContract, address indexed creator)"
];

// ABI for individual PvP Battle contract
export const PVP_BATTLE_ABI = [
  // Read functions
  "function getBattle(uint256 battleId) view returns (tuple(uint256 id, address creator, address opponent, uint256 betAmount, uint256 totalPrizePool, uint256 duration, string creatorCoin, string opponentCoin, uint256 createdAt, uint256 startedAt, uint256 finishedAt, uint8 status, address winner, string inviteCode, uint256 creatorStartPrice, uint256 creatorEndPrice, uint256 opponentStartPrice, uint256 opponentEndPrice, bool creatorClaimed, bool opponentClaimed))",
  "function getBattleByInviteCode(string calldata inviteCode) view returns (tuple(uint256 id, address creator, address opponent, uint256 betAmount, uint256 totalPrizePool, uint256 duration, string creatorCoin, string opponentCoin, uint256 createdAt, uint256 startedAt, uint256 finishedAt, uint8 status, address winner, string inviteCode, uint256 creatorStartPrice, uint256 creatorEndPrice, uint256 opponentStartPrice, uint256 opponentEndPrice, bool creatorClaimed, bool opponentClaimed))",
  "function getUserBattles(address user) view returns (uint256[])",
  "function getCurrentBattleId() view returns (uint256)",
  "function getRoomId() view returns (string)",
  "function BET_AMOUNT() view returns (uint256)",
  "function TOTAL_PRIZE() view returns (uint256)",

  // Write functions - Updated for fixed $5 bet
  "function createBattle(uint256 duration, string calldata inviteCode) returns (uint256)",
  "function joinBattle(string calldata inviteCode) returns (uint256)",
  "function claimPrize(uint256 battleId)",
  "function cancelBattle(uint256 battleId)",

  // Oracle functions (for backend)
  "function startBattle(uint256 battleId, string calldata creatorCoin, string calldata opponentCoin, uint256 creatorStartPrice, uint256 opponentStartPrice)",
  "function finishBattle(uint256 battleId, uint256 creatorEndPrice, uint256 opponentEndPrice)",

  // Events
  "event BattleCreated(uint256 indexed battleId, address indexed creator, uint256 betAmount, uint256 duration, string inviteCode)",
  "event BattleJoined(uint256 indexed battleId, address indexed opponent, uint256 startTime)",
  "event BattleStarted(uint256 indexed battleId, string creatorCoin, string opponentCoin, uint256 creatorStartPrice, uint256 opponentStartPrice)",
  "event BattleFinished(uint256 indexed battleId, address indexed winner, uint256 creatorEndPrice, uint256 opponentEndPrice, uint256 finishedAt)",
  "event PrizeClaimed(uint256 indexed battleId, address indexed winner, uint256 amount)"
];

// USDC ABI (simplified)
export const USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function faucet()", // For MockUSDC testing
];

// Battle status enum
export enum BattleStatus {
  Created = 0,
  WaitingOpponent = 1,
  Active = 2,
  Finished = 3,
  Cancelled = 4,
  Claimed = 5
}

// Battle interface
export interface Battle {
  id: bigint;
  creator: string;
  opponent: string;
  betAmount: bigint;
  totalPrizePool: bigint;
  duration: bigint;
  creatorCoin: string;
  opponentCoin: string;
  createdAt: bigint;
  startedAt: bigint;
  finishedAt: bigint;
  status: BattleStatus;
  winner: string;
  inviteCode: string;
  creatorStartPrice: bigint;
  creatorEndPrice: bigint;
  opponentStartPrice: bigint;
  opponentEndPrice: bigint;
  creatorClaimed: boolean;
  opponentClaimed: boolean;
}

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  PVP_BATTLE_FACTORY: process.env.NEXT_PUBLIC_PVP_BATTLE_FACTORY_CONTRACT || "0x0000000000000000000000000000000000000000",
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_CONTRACT || "0xa84c00A7761D4951FBF8146A5f3754ee659BDc76", // Existing MockUSDC from deployments
};

// Utility functions
export const formatUSDC = (amount: bigint): string => {
  return ethers.formatUnits(amount, 6); // USDC has 6 decimals
};

export const parseUSDC = (amount: string): bigint => {
  return ethers.parseUnits(amount, 6);
};

export const formatBattleStatus = (status: BattleStatus): string => {
  switch (status) {
    case BattleStatus.Created:
      return "Created";
    case BattleStatus.WaitingOpponent:
      return "Waiting for Opponent";
    case BattleStatus.Active:
      return "Active";
    case BattleStatus.Finished:
      return "Finished";
    case BattleStatus.Cancelled:
      return "Cancelled";
    case BattleStatus.Claimed:
      return "Claimed";
    default:
      return "Unknown";
  }
};

// Generate random invite code
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// PvP Battle Service Class - Now works with Factory pattern
export class PvPBattleService {
  private factoryContract: ethers.Contract;
  private usdcContract: ethers.Contract;
  private signer: ethers.Signer;
  private battleContracts: Map<string, ethers.Contract> = new Map();

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.factoryContract = new ethers.Contract(
      CONTRACT_ADDRESSES.PVP_BATTLE_FACTORY,
      PVP_BATTLE_FACTORY_ABI,
      signer
    );
    this.usdcContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDC,
      USDC_ABI,
      signer
    );
  }

  // Get or create battle contract instance for a room
  private async getBattleContract(roomId: string): Promise<ethers.Contract> {
    if (this.battleContracts.has(roomId)) {
      return this.battleContracts.get(roomId)!;
    }

    const contractAddress = await this.factoryContract.getBattleContract(roomId);
    if (contractAddress === ethers.ZeroAddress) {
      throw new Error(`No battle contract exists for room ${roomId}`);
    }

    const contract = new ethers.Contract(contractAddress, PVP_BATTLE_ABI, this.signer);
    this.battleContracts.set(roomId, contract);
    return contract;
  }

  // Factory functions
  async deployBattleContract(roomId: string): Promise<string> {
    const tx = await this.factoryContract.deployBattleContract(roomId);
    const receipt = await tx.wait();

    // Get the deployed contract address from events
    const event = receipt.logs.find((log: any) =>
      log.topics[0] === ethers.id("BattleContractDeployed(string,address,address)")
    );

    if (!event) {
      throw new Error("Failed to deploy battle contract");
    }

    const contractAddress = ethers.getAddress("0x" + event.topics[2].slice(-40));
    return contractAddress;
  }

  async getBattleContractAddress(roomId: string): Promise<string> {
    return await this.factoryContract.getBattleContract(roomId);
  }

  async battleContractExists(roomId: string): Promise<boolean> {
    return await this.factoryContract.battleContractExists(roomId);
  }

  // Battle contract functions
  async getBattle(roomId: string, battleId: number): Promise<Battle> {
    const contract = await this.getBattleContract(roomId);
    return await contract.getBattle(battleId);
  }

  async getBattleByInviteCode(roomId: string, inviteCode: string): Promise<Battle> {
    const contract = await this.getBattleContract(roomId);
    return await contract.getBattleByInviteCode(inviteCode);
  }

  async getUserBattles(roomId: string, userAddress: string): Promise<bigint[]> {
    const contract = await this.getBattleContract(roomId);
    return await contract.getUserBattles(userAddress);
  }

  async getCurrentBattleId(roomId: string): Promise<bigint> {
    const contract = await this.getBattleContract(roomId);
    return await contract.getCurrentBattleId();
  }

  // USDC functions
  async getUSDCBalance(address: string): Promise<bigint> {
    return await this.usdcContract.balanceOf(address);
  }

  async getUSDCAllowance(owner: string, spender: string): Promise<bigint> {
    return await this.usdcContract.allowance(owner, spender);
  }

  async approveUSDCForBattle(roomId: string, amount: bigint): Promise<ethers.ContractTransactionResponse> {
    const battleContractAddress = await this.getBattleContractAddress(roomId);
    return await this.usdcContract.approve(battleContractAddress, amount);
  }

  async claimFreeUSDC(): Promise<ethers.ContractTransactionResponse> {
    return await this.usdcContract.faucet();
  }

  // Write functions with fixed $5 bet amount
  async createBattle(
    roomId: string,
    duration: number,
    inviteCode: string
  ): Promise<ethers.ContractTransactionResponse> {
    // Deploy battle contract if it doesn't exist
    if (!(await this.battleContractExists(roomId))) {
      await this.deployBattleContract(roomId);
    }

    const contract = await this.getBattleContract(roomId);
    const BET_AMOUNT = ethers.parseUnits("5", 6); // $5 USDC

    // Check and approve USDC spending
    const allowance = await this.getUSDCAllowance(
      await this.signer.getAddress(),
      contract.target as string
    );

    if (allowance < BET_AMOUNT) {
      await this.approveUSDCForBattle(roomId, BET_AMOUNT * 2n); // Approve for multiple battles
    }

    return await contract.createBattle(duration, inviteCode);
  }

  async joinBattle(roomId: string, inviteCode: string): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getBattleContract(roomId);
    const BET_AMOUNT = ethers.parseUnits("5", 6); // $5 USDC

    // Check and approve USDC spending
    const allowance = await this.getUSDCAllowance(
      await this.signer.getAddress(),
      contract.target as string
    );

    if (allowance < BET_AMOUNT) {
      await this.approveUSDCForBattle(roomId, BET_AMOUNT);
    }

    return await contract.joinBattle(inviteCode);
  }

  async claimPrize(roomId: string, battleId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getBattleContract(roomId);
    return await contract.claimPrize(battleId);
  }

  async cancelBattle(roomId: string, battleId: number): Promise<ethers.ContractTransactionResponse> {
    const contract = await this.getBattleContract(roomId);
    return await contract.cancelBattle(battleId);
  }

  // Event listeners for factory
  onBattleContractDeployed(callback: (roomId: string, contractAddress: string, creator: string) => void) {
    this.factoryContract.on("BattleContractDeployed", callback);
  }

  // Event listeners for battle contracts (need room ID)
  async onBattleCreated(roomId: string, callback: (battleId: bigint, creator: string, betAmount: bigint, duration: bigint, inviteCode: string) => void) {
    const contract = await this.getBattleContract(roomId);
    contract.on("BattleCreated", callback);
  }

  async onBattleJoined(roomId: string, callback: (battleId: bigint, opponent: string, startTime: bigint) => void) {
    const contract = await this.getBattleContract(roomId);
    contract.on("BattleJoined", callback);
  }

  async onBattleFinished(roomId: string, callback: (battleId: bigint, winner: string, creatorEndPrice: bigint, opponentEndPrice: bigint, finishedAt: bigint) => void) {
    const contract = await this.getBattleContract(roomId);
    contract.on("BattleFinished", callback);
  }

  async onPrizeClaimed(roomId: string, callback: (battleId: bigint, winner: string, amount: bigint) => void) {
    const contract = await this.getBattleContract(roomId);
    contract.on("PrizeClaimed", callback);
  }

  // Cleanup
  removeAllListeners() {
    this.factoryContract.removeAllListeners();
    this.battleContracts.forEach(contract => {
      contract.removeAllListeners();
    });
  }
}