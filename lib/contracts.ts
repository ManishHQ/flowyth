// Contract configurations and ABIs
export const CONTRACTS = {
  // Your deployed Counter contract on Flow EVM Testnet
  COUNTER: {
    address: '0x4A7330a7FDD08DccaD07eECa3c8c4cFcb6d719b5' as const,
    abi: [
      {
        inputs: [],
        name: 'x',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'inc',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ name: 'by', type: 'uint256' }],
        name: 'incBy',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [{ indexed: false, name: 'by', type: 'uint256' }],
        name: 'Increment',
        type: 'event',
      }
    ] as const
  },

  // Pyth Entropy contract on Flow EVM Testnet
  PYTH_ENTROPY: {
    address: '0x2880aB155794e7179c9eE2e38200202908C17B43' as const,
    abi: [
      {
        inputs: [{ name: 'provider', type: 'address' }, { name: 'userCommitment', type: 'bytes32' }],
        name: 'requestWithCallback',
        outputs: [{ name: 'sequenceNumber', type: 'uint64' }],
        stateMutability: 'payable',
        type: 'function',
      },
      {
        inputs: [{ name: 'provider', type: 'address' }],
        name: 'getFee',
        outputs: [{ name: 'feeAmount', type: 'uint128' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const
  },

  // Simple Tournament Factory contract
  TOURNAMENT_FACTORY: {
    address: '0x270770E4f7Fd077F314a1fad5CA03C6328973157' as const, // Deployed on Flow EVM Testnet
    abi: [
      {
        inputs: [
          { name: 'title', type: 'string' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'duration', type: 'uint256' },
          { name: 'registrationPeriod', type: 'uint256' },
          { name: 'maxParticipants', type: 'uint256' }
        ],
        name: 'createTournament',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'getAllTournaments',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'getTournamentCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, name: 'tournament', type: 'address' },
          { indexed: false, name: 'title', type: 'string' },
          { indexed: false, name: 'creator', type: 'address' }
        ],
        name: 'TournamentCreated',
        type: 'event',
      }
    ] as const
  },

  // Mock USDC for testing on Flow EVM Testnet
  USDC: {
    address: '0x6630c4Ea1d21DA8464F69b35F1dFa8D3176b3BC9' as const, // Deployed on Flow EVM Testnet
    abi: [
      // Basic ERC20 functions
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'transferFrom',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'faucet',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      }
    ] as const
  },

  // Simple Tournament contract ABI (for individual tournaments)
  TOURNAMENT: {
    abi: [
      {
        inputs: [],
        name: 'register',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'createGroups',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'startTournament',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'endTournament',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { name: 'groupId', type: 'uint8' },
          { name: 'winners', type: 'address[3]' }
        ],
        name: 'setGroupWinners',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ name: 'groupId', type: 'uint8' }],
        name: 'distributePrizes',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'getParticipants',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ name: 'groupId', type: 'uint8' }],
        name: 'getGroupParticipants',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'getTournamentInfo',
        outputs: [
          { name: 'title', type: 'string' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'participantCount', type: 'uint256' },
          { name: 'maxParticipants', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'groupsCreated', type: 'bool' }
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ name: 'groupId', type: 'uint8' }],
        name: 'getGroupInfo',
        outputs: [
          { name: 'participants', type: 'address[]' },
          { name: 'prizePool', type: 'uint256' },
          { name: 'winners', type: 'address[3]' },
          { name: 'prizesDistributed', type: 'bool' }
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'canCreateGroups',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [{ indexed: false, name: 'participant', type: 'address' }],
        name: 'ParticipantRegistered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [{ indexed: false, name: 'totalGroups', type: 'uint8' }],
        name: 'GroupsCreated',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [],
        name: 'TournamentStarted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [],
        name: 'TournamentEnded',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, name: 'groupId', type: 'uint8' },
          { indexed: false, name: 'winners', type: 'address[3]' },
          { indexed: false, name: 'amounts', type: 'uint256[3]' }
        ],
        name: 'PrizesDistributed',
        type: 'event',
      }
    ] as const
  },

  // Ethereum Name Service (ENS) for testing read operations
  ENS_REGISTRY: {
    address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const,
    abi: [
      {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'owner',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      }
    ] as const
  }
} as const;

// Helper function to format token amounts
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fractional = amount % divisor;

  if (fractional === BigInt(0)) {
    return whole.toString();
  }

  const fractionalStr = fractional.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.replace(/0+$/, '');

  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

// Helper to parse token amounts
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole = '0', fractional = '0'] = amount.split('.');
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fractionalPadded);
}

// Helper functions for native token (Flow) operations
export const NATIVE_TOKEN = {
  // Flow token has 18 decimals
  DECIMALS: 18,
  SYMBOL: 'FLOW',
  NAME: 'Flow'
} as const;

// Format Flow amounts (18 decimals)
export function formatFlowAmount(amount: bigint): string {
  return formatTokenAmount(amount, NATIVE_TOKEN.DECIMALS);
}

// Parse Flow amounts (18 decimals)
export function parseFlowAmount(amount: string): bigint {
  return parseTokenAmount(amount, NATIVE_TOKEN.DECIMALS);
}

// Convert Flow to Wei (smallest unit)
export function flowToWei(amount: string): bigint {
  return parseFlowAmount(amount);
}

// Convert Wei to Flow
export function weiToFlow(amount: bigint): string {
  return formatFlowAmount(amount);
}

// Tournament utilities
export const TOURNAMENT_UTILS = {
  // USDC has 6 decimals typically
  USDC_DECIMALS: 6,

  // Format USDC amounts
  formatUSDC: (amount: bigint) => formatTokenAmount(amount, 6),

  // Parse USDC amounts
  parseUSDC: (amount: string) => parseTokenAmount(amount, 6),

  // Tournament status enum
  TOURNAMENT_STATUS: {
    UPCOMING: 'upcoming',
    LIVE: 'live',
    FINISHED: 'finished',
    GROUPING: 'grouping'
  } as const,

  // Crypto token categories for lineup
  CRYPTO_CATEGORIES: {
    STRIKER: 'striker',
    MIDFIELDER: 'midfielder',
    DEFENDER: 'defender'
  } as const
} as const;