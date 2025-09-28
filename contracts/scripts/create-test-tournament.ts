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

// Contract addresses
const GROUP_TOURNAMENT_ADDRESS = '0x9cCC7c4BAd107Dc5Dc52c1E85C8a889944D63B26';

// ABI for creating tournaments
const GROUP_TOURNAMENT_ABI = [
  {
    name: 'tournamentCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
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
  },
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
  }
] as const;

async function createTestTournament() {
  console.log('🏆 Creating Test Tournament...\n');

  // You'll need to set your private key as an environment variable
  const privateKey = process.env.FLOW_TESTNET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Please set FLOW_TESTNET_PRIVATE_KEY environment variable');
    return;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  // Create clients
  const publicClient = createPublicClient({
    chain: flowTestnet,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: flowTestnet,
    transport: http()
  });

  try {
    // Check current tournament count
    console.log('📊 Checking current tournament count...');
    const currentCount = await publicClient.readContract({
      address: GROUP_TOURNAMENT_ADDRESS,
      abi: GROUP_TOURNAMENT_ABI,
      functionName: 'tournamentCounter'
    });
    console.log(`✅ Current tournament count: ${currentCount}\n`);

    // Create a test tournament
    console.log('🚀 Creating new tournament...');
    const tournamentParams = {
      name: 'Test Tournament - Crypto Champions',
      entryFee: parseEther('0.01'), // 0.01 FLOW entry fee
      registrationDuration: BigInt(3600), // 1 hour registration
      tournamentDuration: BigInt(86400), // 24 hours tournament
      maxParticipants: BigInt(20),
      minParticipantsPerGroup: BigInt(5)
    };

    console.log('Tournament parameters:', {
      name: tournamentParams.name,
      entryFee: formatEther(tournamentParams.entryFee) + ' FLOW',
      registrationDuration: Number(tournamentParams.registrationDuration) / 3600 + ' hours',
      tournamentDuration: Number(tournamentParams.tournamentDuration) / 3600 + ' hours',
      maxParticipants: Number(tournamentParams.maxParticipants),
      minParticipantsPerGroup: Number(tournamentParams.minParticipantsPerGroup)
    });

    const hash = await walletClient.writeContract({
      address: GROUP_TOURNAMENT_ADDRESS,
      abi: GROUP_TOURNAMENT_ABI,
      functionName: 'createTournament',
      args: [
        tournamentParams.name,
        tournamentParams.entryFee,
        tournamentParams.registrationDuration,
        tournamentParams.tournamentDuration,
        tournamentParams.maxParticipants,
        tournamentParams.minParticipantsPerGroup
      ]
    });

    console.log(`✅ Tournament creation transaction sent: ${hash}`);

    // Wait for confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}\n`);

    // Check new tournament count
    console.log('📊 Checking new tournament count...');
    const newCount = await publicClient.readContract({
      address: GROUP_TOURNAMENT_ADDRESS,
      abi: GROUP_TOURNAMENT_ABI,
      functionName: 'tournamentCounter'
    });
    console.log(`✅ New tournament count: ${newCount}\n`);

    // Read the created tournament details
    const tournamentId = newCount - 1n; // Latest tournament
    console.log(`🔍 Reading tournament ${tournamentId} details...`);
    
    const tournament = await publicClient.readContract({
      address: GROUP_TOURNAMENT_ADDRESS,
      abi: GROUP_TOURNAMENT_ABI,
      functionName: 'tournaments',
      args: [tournamentId]
    });

    console.log('✅ Tournament created successfully!');
    console.log('\n📝 Tournament Details:');
    console.log(`   - ID: ${tournament[0]}`);
    console.log(`   - Name: ${tournament[1]}`);
    console.log(`   - Entry Fee: ${formatEther(tournament[2])} FLOW`);
    console.log(`   - Registration Start: ${new Date(Number(tournament[3]) * 1000).toLocaleString()}`);
    console.log(`   - Registration End: ${new Date(Number(tournament[4]) * 1000).toLocaleString()}`);
    console.log(`   - Tournament Start: ${new Date(Number(tournament[5]) * 1000).toLocaleString()}`);
    console.log(`   - Tournament End: ${new Date(Number(tournament[6]) * 1000).toLocaleString()}`);
    console.log(`   - Max Participants: ${tournament[8]}`);
    console.log(`   - Min Per Group: ${tournament[9]}`);
    console.log(`   - State: ${tournament[10]} (0=Registration, 1=Active, 2=Finished, 3=Finalized)`);
    console.log(`   - Total Prize Pool: ${formatEther(tournament[12])} FLOW`);

    console.log('\n🎉 Tournament contract is fully functional!');
    console.log(`\n🌐 View on Explorer: https://evm-testnet.flowscan.io/tx/${hash}`);

  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  }
}

// Run the test
createTestTournament().catch(console.error);
