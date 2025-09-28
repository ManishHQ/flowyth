// Tournament Contract Configuration
export const TOURNAMENT_CONTRACTS = {
  // Flow EVM Testnet addresses (update with actual deployed addresses)
  GROUP_TOURNAMENT: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Update with deployed address
    abi: [
      // Tournament Management
      {
        name: 'createTournament',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'name', type: 'string' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'registrationDuration', type: 'uint256' },
          { name: 'tournamentDuration', type: 'uint256' },
          { name: 'maxParticipants', type: 'uint256' },
          { name: 'minParticipantsPerGroup', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'registerForTournament',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { name: 'tournamentId', type: 'uint256' },
          { name: 'squadCryptoIds', type: 'bytes32[6]' }
        ],
        outputs: []
      },
      {
        name: 'startTournament',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { name: 'tournamentId', type: 'uint256' },
          { name: 'priceUpdateData', type: 'bytes[]' }
        ],
        outputs: []
      },
      {
        name: 'finishTournament',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { name: 'tournamentId', type: 'uint256' },
          { name: 'priceUpdateData', type: 'bytes[]' }
        ],
        outputs: []
      },
      // View Functions
      {
        name: 'tournaments',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'registrationStart', type: 'uint256' },
          { name: 'registrationEnd', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'duration', type: 'uint256' },
          { name: 'maxParticipants', type: 'uint256' },
          { name: 'minParticipantsPerGroup', type: 'uint256' },
          { name: 'state', type: 'uint8' },
          { name: 'groupCount', type: 'uint256' },
          { name: 'totalPrizePool', type: 'uint256' },
          { name: 'prizePerGroup', type: 'uint256' }
        ]
      },
      {
        name: 'getTournamentParticipants',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tournamentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address[]' }]
      },
      {
        name: 'getPlayerSquad',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'tournamentId', type: 'uint256' },
          { name: 'player', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bytes32[6]' }]
      },
      {
        name: 'getPlayerGroup',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'tournamentId', type: 'uint256' },
          { name: 'player', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'cryptoAssets',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'bytes32' }],
        outputs: [
          { name: 'pythId', type: 'bytes32' },
          { name: 'symbol', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'isActive', type: 'bool' }
        ]
      },
      {
        name: 'supportedCryptos',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [{ name: '', type: 'bytes32' }]
      },
      {
        name: 'getSupportedCryptosCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'tournamentCounter',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'owner',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }]
      },
      // Events
      {
        name: 'TournamentCreated',
        type: 'event',
        inputs: [
          { name: 'tournamentId', type: 'uint256', indexed: true },
          { name: 'name', type: 'string', indexed: false },
          { name: 'entryFee', type: 'uint256', indexed: false },
          { name: 'registrationStart', type: 'uint256', indexed: false },
          { name: 'registrationEnd', type: 'uint256', indexed: false },
          { name: 'startTime', type: 'uint256', indexed: false },
          { name: 'endTime', type: 'uint256', indexed: false },
          { name: 'maxParticipants', type: 'uint256', indexed: false }
        ]
      },
      {
        name: 'PlayerRegistered',
        type: 'event',
        inputs: [
          { name: 'tournamentId', type: 'uint256', indexed: true },
          { name: 'player', type: 'address', indexed: true },
          { name: 'groupId', type: 'uint256', indexed: false },
          { name: 'squad', type: 'bytes32[6]', indexed: false }
        ]
      }
    ] as const
  },
  
  TOURNAMENT_FACTORY: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Update with deployed address
    abi: [
      'function createTournament(string title, uint256 entryFee, uint256 registrationDuration, uint256 tournamentDuration, uint256 maxParticipants) external returns (address)',
      'function tournaments(uint256) external view returns (address)',
      'function tournamentCount() external view returns (uint256)',
      'function getUserTournaments(address user) external view returns (address[])',
      'event TournamentCreated(address indexed tournament, address indexed creator, string title)'
    ]
  },

  MOCK_USDC: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Update with deployed address
    abi: [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'transferFrom',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
      },
      {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      },
      {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      },
      // Mock functions for testing
      {
        name: 'mint',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: []
      },
      {
        name: 'faucet',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: []
      }
    ] as const
  }
};

// Tournament States
export enum TournamentState {
  REGISTRATION = 0,
  ACTIVE = 1,
  FINISHED = 2,
  FINALIZED = 3
}

// Crypto Asset mapping (Pyth Price Feed IDs to our token system)
export const CRYPTO_ASSETS = {
  // Major cryptocurrencies with Pyth price feed IDs
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  LINK: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  ADA: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  DOT: '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
  MATIC: '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
  AVAX: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  DOGE: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  USDT: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b'
};

// Reverse mapping for display purposes
export const PYTH_ID_TO_SYMBOL: { [key: string]: string } = Object.entries(CRYPTO_ASSETS).reduce(
  (acc, [symbol, pythId]) => {
    acc[pythId] = symbol;
    return acc;
  },
  {} as { [key: string]: string }
);

// Tournament utility functions
export const TOURNAMENT_UTILS = {
  // Convert USDC amount to wei (6 decimals)
  parseUSDC: (amount: string): bigint => {
    return BigInt(Math.floor(parseFloat(amount) * 1e6));
  },

  // Convert wei to USDC amount (6 decimals)
  formatUSDC: (wei: bigint): string => {
    return (Number(wei) / 1e6).toFixed(2);
  },

  // Convert symbol to Pyth ID
  symbolToPythId: (symbol: string): string => {
    return CRYPTO_ASSETS[symbol as keyof typeof CRYPTO_ASSETS] || '';
  },

  // Convert Pyth ID to symbol
  pythIdToSymbol: (pythId: string): string => {
    return PYTH_ID_TO_SYMBOL[pythId] || 'UNKNOWN';
  },

  // Convert squad tokens to Pyth IDs
  squadToPythIds: (squad: { tokenId: string; symbol?: string }[]): string[] => {
    return squad.map(token => {
      if (token.symbol) {
        return TOURNAMENT_UTILS.symbolToPythId(token.symbol);
      }
      // If no symbol, assume tokenId is already a Pyth ID or needs mapping
      return token.tokenId;
    }).filter(id => id !== '');
  },

  // Get tournament state name
  getStateName: (state: TournamentState): string => {
    switch (state) {
      case TournamentState.REGISTRATION:
        return 'Registration';
      case TournamentState.ACTIVE:
        return 'Live';
      case TournamentState.FINISHED:
        return 'Finished';
      case TournamentState.FINALIZED:
        return 'Finalized';
      default:
        return 'Unknown';
    }
  }
};

// Network configuration
export const NETWORK_CONFIG = {
  FLOW_EVM_TESTNET: {
    chainId: 545,
    name: 'Flow EVM Testnet',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    blockExplorer: 'https://evm-testnet.flowscan.io',
    nativeCurrency: {
      name: 'Flow',
      symbol: 'FLOW',
      decimals: 18
    }
  }
};