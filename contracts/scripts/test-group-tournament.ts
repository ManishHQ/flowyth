import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

// Define Flow EVM Testnet
const flowTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  network: 'flow-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Flow Testnet Explorer', url: 'https://evm-testnet.flowscan.io' },
  },
});

// Contract addresses from deployment
const GROUP_TOURNAMENT_ADDRESS = '0x9cCC7c4BAd107Dc5Dc52c1E85C8a889944D63B26';
const MOCK_USDC_ADDRESS = '0x3C6d07830cdfd72e1b0743885558F32e7eB184d3';

// Minimal ABI for testing
const GROUP_TOURNAMENT_ABI = [
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
  {
    name: 'supportedCryptos',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }]
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
  }
] as const;

const MOCK_USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'faucet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  }
] as const;

async function testGroupTournament() {
  console.log('🧪 Testing GroupTournament Contract...\n');

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: flowTestnet,
    transport: http()
  });

  try {
    // Test 1: Check tournament counter
    console.log('📊 Test 1: Reading tournament counter...');
    const tournamentCount = await publicClient.readContract({
      address: GROUP_TOURNAMENT_ADDRESS,
      abi: GROUP_TOURNAMENT_ABI,
      functionName: 'tournamentCounter'
    });
    console.log(`✅ Tournament count: ${tournamentCount}\n`);

    // Test 2: Check contract owner
    console.log('👤 Test 2: Reading contract owner...');
    const owner = await publicClient.readContract({
      address: GROUP_TOURNAMENT_ADDRESS,
      abi: GROUP_TOURNAMENT_ABI,
      functionName: 'owner'
    });
    console.log(`✅ Contract owner: ${owner}\n`);

    // Test 3: Check supported cryptos
    console.log('🪙 Test 3: Reading supported crypto assets...');
    
    // Try to read the first few supported cryptos to see if any exist
    let cryptoCount = 0;
    const maxCryptos = 20; // Check up to 20 cryptos
    
    for (let i = 0; i < maxCryptos; i++) {
      try {
        const pythId = await publicClient.readContract({
          address: GROUP_TOURNAMENT_ADDRESS,
          abi: GROUP_TOURNAMENT_ABI,
          functionName: 'supportedCryptos',
          args: [BigInt(i)]
        });

        const asset = await publicClient.readContract({
          address: GROUP_TOURNAMENT_ADDRESS,
          abi: GROUP_TOURNAMENT_ABI,
          functionName: 'cryptoAssets',
          args: [pythId]
        });

        console.log(`   ${i + 1}. ${asset[1]} (${asset[2]}) - Active: ${asset[3]}`);
        cryptoCount++;
      } catch (error) {
        // No more cryptos available
        break;
      }
    }
    
    console.log(`✅ Found ${cryptoCount} supported crypto assets`);

    console.log('\n🎉 All contract read tests passed!');
    console.log('\n📝 Contract Summary:');
    console.log(`   - Contract Address: ${GROUP_TOURNAMENT_ADDRESS}`);
    console.log(`   - MockUSDC Address: ${MOCK_USDC_ADDRESS}`);
    console.log(`   - Owner: ${owner}`);
    console.log(`   - Tournament Count: ${tournamentCount}`);
    console.log(`   - Supported Cryptos: ${cryptoCount}`);

  } catch (error) {
    console.error('❌ Error testing contract:', error);
  }
}

// Run the test
testGroupTournament().catch(console.error);
