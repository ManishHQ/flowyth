import { Address } from 'viem';

// Contract addresses - TODO: Update after deployment
export const TOURNAMENT_FACTORY_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
export const MOCK_USDC_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

// Tournament Factory ABI - Basic functions
export const TOURNAMENT_FACTORY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_entropyAddress", "type": "address"},
      {"name": "_usdcAddress", "type": "address"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createTournament",
    "inputs": [
      {"name": "title", "type": "string"},
      {"name": "entryFee", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "registrationPeriod", "type": "uint256"},
      {"name": "maxParticipants", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAllTournaments",
    "inputs": [],
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTournamentCount",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TournamentCreated",
    "inputs": [
      {"name": "tournament", "type": "address", "indexed": false},
      {"name": "title", "type": "string", "indexed": false},
      {"name": "creator", "type": "address", "indexed": false}
    ]
  }
] as const;

// Tournament ABI - Basic functions
export const TOURNAMENT_ABI = [
  {
    "type": "function",
    "name": "register",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTournamentInfo",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "string"},    // title
      {"name": "", "type": "uint256"},   // entryFee
      {"name": "", "type": "uint256"},   // startTime
      {"name": "", "type": "uint256"},   // endTime
      {"name": "", "type": "uint256"},   // participants
      {"name": "", "type": "uint256"},   // maxParticipants
      {"name": "", "type": "bool"},      // groupsCreated
      {"name": "", "type": "bool"}       // isFinished
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getParticipants",
    "inputs": [],
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canCreateGroups",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "requestGroupCreation",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "setGroupWinners",
    "inputs": [
      {"name": "groupId", "type": "uint8"},
      {"name": "winners", "type": "address[3]"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "distributePrizes",
    "inputs": [{"name": "groupId", "type": "uint8"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ParticipantRegistered",
    "inputs": [
      {"name": "participant", "type": "address", "indexed": false}
    ]
  },
  {
    "type": "event",
    "name": "GroupsCreated",
    "inputs": [
      {"name": "totalGroups", "type": "uint8", "indexed": false},
      {"name": "randomNumber", "type": "bytes32", "indexed": false}
    ]
  }
] as const;

// Mock USDC ABI - Basic ERC20 + faucet
export const MOCK_USDC_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "account", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "faucet",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view"
  }
] as const;

// Helper functions
export const TOURNAMENT_UTILS = {
  formatUSDC: (wei: bigint): string => {
    return (Number(wei) / 1e6).toString();
  },

  parseUSDC: (amount: string): bigint => {
    return BigInt(Math.floor(Number(amount) * 1e6));
  },

  formatTime: (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  },

  getStatusText: (status: number): string => {
    const statusMap = ['Registration', 'Live', 'Finished', 'Cancelled'];
    return statusMap[status] || 'Unknown';
  }
};

// Contract addresses for different networks
export const CONTRACTS = {
  TOURNAMENT_FACTORY: {
    address: TOURNAMENT_FACTORY_ADDRESS,
    abi: TOURNAMENT_FACTORY_ABI
  },
  USDC: {
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI
  }
};