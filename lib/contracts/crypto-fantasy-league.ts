import { Address } from 'viem';

export const CRYPTO_FANTASY_LEAGUE_ADDRESS: Address = '0x278d970D518F2c9199897cbBCa0d6f2B4C2712Ea';

export const CRYPTO_FANTASY_LEAGUE_ABI = [
  {
    "type": "constructor",
    "inputs": [{"name": "_pyth", "type": "address", "internalType": "address"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createTournament",
    "inputs": [
      {"name": "entryFee", "type": "uint256", "internalType": "uint256"},
      {"name": "duration", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerForTournament",
    "inputs": [
      {"name": "tournamentId", "type": "uint256", "internalType": "uint256"},
      {"name": "squadCryptoIds", "type": "bytes32[6]", "internalType": "bytes32[6]"}
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getTournamentInfo",
    "inputs": [{"name": "tournamentId", "type": "uint256", "internalType": "uint256"}],
    "outputs": [
      {"name": "id", "type": "uint256", "internalType": "uint256"},
      {"name": "entryFee", "type": "uint256", "internalType": "uint256"},
      {"name": "startTime", "type": "uint256", "internalType": "uint256"},
      {"name": "endTime", "type": "uint256", "internalType": "uint256"},
      {"name": "prizePool", "type": "uint256", "internalType": "uint256"},
      {"name": "participantCount", "type": "uint256", "internalType": "uint256"},
      {"name": "isActive", "type": "bool", "internalType": "bool"},
      {"name": "isFinalized", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSquad",
    "inputs": [
      {"name": "tournamentId", "type": "uint256", "internalType": "uint256"},
      {"name": "participant", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "bytes32[6]", "internalType": "bytes32[6]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCryptoAssetsByPosition",
    "inputs": [{"name": "position", "type": "uint8", "internalType": "enum CryptoFantasyLeague.Position"}],
    "outputs": [{"name": "", "type": "bytes32[]", "internalType": "bytes32[]"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tournamentCounter",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TournamentCreated",
    "inputs": [
      {"name": "tournamentId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "entryFee", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "startTime", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "endTime", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PlayerRegistered",
    "inputs": [
      {"name": "tournamentId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "player", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "squad", "type": "bytes32[6]", "indexed": false, "internalType": "bytes32[6]"}
    ],
    "anonymous": false
  }
] as const;

export enum Position {
  GOALKEEPER = 0,
  DEFENDER = 1,
  MIDFIELDER = 2,
  STRIKER = 3
}

export const CRYPTO_ASSETS = {
  [Position.GOALKEEPER]: [
    { id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', symbol: 'USDC', name: 'USD Coin' },
    { id: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b', symbol: 'USDT', name: 'Tether USD' },
    { id: '0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd', symbol: 'DAI', name: 'Dai Stablecoin' }
  ],
  [Position.DEFENDER]: [
    { id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', symbol: 'BTC', name: 'Bitcoin' },
    { id: '0x0000000000000000000000000000000000000000000000000000000000000001', symbol: 'ETH', name: 'Ethereum' }
  ],
  [Position.MIDFIELDER]: [
    { id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', symbol: 'SOL', name: 'Solana' },
    { id: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f', symbol: 'ADA', name: 'Cardano' },
    { id: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221', symbol: 'LINK', name: 'Chainlink' },
    { id: '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6', symbol: 'DOT', name: 'Polkadot' },
    { id: '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52', symbol: 'MATIC', name: 'Polygon' },
    { id: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', symbol: 'AVAX', name: 'Avalanche' }
  ],
  [Position.STRIKER]: [
    { id: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c', symbol: 'DOGE', name: 'Dogecoin' },
    { id: '0x0000000000000000000000000000000000000000000000000000000000000002', symbol: 'SHIB', name: 'Shiba Inu' },
    { id: '0x0000000000000000000000000000000000000000000000000000000000000003', symbol: 'PEPE', name: 'Pepe' }
  ]
};

export const POSITION_NAMES = {
  [Position.GOALKEEPER]: 'Goalkeeper',
  [Position.DEFENDER]: 'Defender',
  [Position.MIDFIELDER]: 'Midfielder',
  [Position.STRIKER]: 'Striker'
};

export const POSITION_MULTIPLIERS = {
  [Position.GOALKEEPER]: '10x',
  [Position.DEFENDER]: '5x',
  [Position.MIDFIELDER]: '3x',
  [Position.STRIKER]: '1x'
};

export const FORMATION_REQUIREMENTS = {
  [Position.GOALKEEPER]: 1,
  [Position.DEFENDER]: 2,
  [Position.MIDFIELDER]: 2,
  [Position.STRIKER]: 1
};