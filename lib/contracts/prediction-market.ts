import { getContract, Address, formatUnits, parseUnits } from 'viem';
import { flowTestnet } from 'viem/chains';

// Contract addresses on Flow EVM testnet
export const PREDICTION_MARKET_ADDRESS = '0x704B8B3B9E32675Df0E5659AB16dDEfEa569C697' as Address;
export const MOCK_USDC_ADDRESS = '0xa84c00A7761D4951FBF8146A5f3754ee659BDc76' as Address;

// ABI for PredictionMarket contract
export const PREDICTION_MARKET_ABI = [
  // Read functions
  {
    "inputs": [{"internalType": "uint256", "name": "_marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "string", "name": "question", "type": "string"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "string", "name": "imageUrl", "type": "string"},
        {"internalType": "uint256", "name": "endTime", "type": "uint256"},
        {"internalType": "uint256", "name": "totalYesAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "totalNoAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "totalVolume", "type": "uint256"},
        {"internalType": "bool", "name": "resolved", "type": "bool"},
        {"internalType": "bool", "name": "outcome", "type": "bool"},
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
        {"internalType": "bool", "name": "active", "type": "bool"}
      ],
      "internalType": "struct PredictionMarket.Market",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveMarkets",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "string", "name": "question", "type": "string"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "string", "name": "imageUrl", "type": "string"},
        {"internalType": "uint256", "name": "endTime", "type": "uint256"},
        {"internalType": "uint256", "name": "totalYesAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "totalNoAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "totalVolume", "type": "uint256"},
        {"internalType": "bool", "name": "resolved", "type": "bool"},
        {"internalType": "bool", "name": "outcome", "type": "bool"},
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
        {"internalType": "bool", "name": "active", "type": "bool"}
      ],
      "internalType": "struct PredictionMarket.Market[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_marketId", "type": "uint256"}],
    "name": "getMarketOdds",
    "outputs": [
      {"internalType": "uint256", "name": "yesPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "noPrice", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_marketId", "type": "uint256"},
      {"internalType": "bool", "name": "_prediction", "type": "bool"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "calculatePayout",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_marketId", "type": "uint256"},
      {"internalType": "address", "name": "_user", "type": "address"}
    ],
    "name": "getUserMarketBets",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "marketId", "type": "uint256"},
        {"internalType": "address", "name": "bettor", "type": "address"},
        {"internalType": "bool", "name": "prediction", "type": "bool"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "bool", "name": "claimed", "type": "bool"},
        {"internalType": "uint256", "name": "potentialPayout", "type": "uint256"}
      ],
      "internalType": "struct PredictionMarket.Bet[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalMarkets",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Write functions
  {
    "inputs": [
      {"internalType": "string", "name": "_question", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "string", "name": "_imageUrl", "type": "string"},
      {"internalType": "uint256", "name": "_durationDays", "type": "uint256"}
    ],
    "name": "createMarket",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_marketId", "type": "uint256"},
      {"internalType": "bool", "name": "_prediction", "type": "bool"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_marketId", "type": "uint256"},
      {"internalType": "bool", "name": "_outcome", "type": "bool"}
    ],
    "name": "resolveMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_marketId", "type": "uint256"}],
    "name": "claimAllWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "question", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"}
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "bettor", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "prediction", "type": "bool"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "potentialPayout", "type": "uint256"}
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "outcome", "type": "bool"},
      {"indexed": false, "internalType": "uint256", "name": "totalVolume", "type": "uint256"}
    ],
    "name": "MarketResolved",
    "type": "event"
  }
] as const;

// MockUSDC ABI (simplified)
export const MOCK_USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// TypeScript types
export interface Market {
  id: bigint;
  question: string;
  description: string;
  imageUrl: string;
  endTime: bigint;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
  totalVolume: bigint;
  resolved: boolean;
  outcome: boolean;
  creator: Address;
  createdAt: bigint;
  active: boolean;
}

export interface Bet {
  marketId: bigint;
  bettor: Address;
  prediction: boolean;
  amount: bigint;
  timestamp: bigint;
  claimed: boolean;
  potentialPayout: bigint;
}

export interface MarketOdds {
  yesPrice: number;
  noPrice: number;
}

// Helper functions
export const formatMarket = (market: any): Market => ({
  id: market.id,
  question: market.question,
  description: market.description,
  imageUrl: market.imageUrl,
  endTime: market.endTime,
  totalYesAmount: market.totalYesAmount,
  totalNoAmount: market.totalNoAmount,
  totalVolume: market.totalVolume,
  resolved: market.resolved,
  outcome: market.outcome,
  creator: market.creator,
  createdAt: market.createdAt,
  active: market.active,
});

export const formatUSDCAmount = (amount: bigint): number => {
  return parseFloat(formatUnits(amount, 6)); // USDC has 6 decimals
};

export const parseUSDCAmount = (amount: number): bigint => {
  return parseUnits(amount.toString(), 6);
};

export const calculateMarketOdds = (market: Market): MarketOdds => {
  const totalPool = market.totalYesAmount + market.totalNoAmount;

  if (totalPool === 0n) {
    return { yesPrice: 50, noPrice: 50 }; // 50/50 odds if no bets
  }

  const yesPrice = Number((market.totalYesAmount * 100n) / totalPool);
  const noPrice = Number((market.totalNoAmount * 100n) / totalPool);

  return { yesPrice, noPrice };
};

export const getMarketStatus = (market: Market): 'active' | 'ended' | 'resolved' => {
  if (market.resolved) return 'resolved';
  if (Date.now() / 1000 > Number(market.endTime)) return 'ended';
  return 'active';
};

// Contract interaction helpers
export const getPredictionMarketContract = (client: any) => {
  return getContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    client,
  });
};

export const getMockUSDCContract = (client: any) => {
  return getContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    client,
  });
};