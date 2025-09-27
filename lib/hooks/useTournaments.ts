'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

// TODO: Import actual contract ABIs and addresses
// import { TOURNAMENT_FACTORY_ABI, TOURNAMENT_FACTORY_ADDRESS } from '@/lib/contracts/tournament-factory';
// import { MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from '@/lib/contracts/mock-usdc';

export function useTournamentActions() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createTournament = async (params: {
    title: string;
    entryFee: string; // in USDC
    duration: number; // in seconds
    registrationPeriod: number; // in seconds
    maxParticipants: number;
  }) => {
    try {
      // TODO: Implement contract call
      // const entryFeeWei = parseUnits(params.entryFee, 6); // USDC has 6 decimals

      // await writeContract({
      //   address: TOURNAMENT_FACTORY_ADDRESS,
      //   abi: TOURNAMENT_FACTORY_ABI,
      //   functionName: 'createTournament',
      //   args: [
      //     params.title,
      //     entryFeeWei,
      //     BigInt(params.duration),
      //     BigInt(params.registrationPeriod),
      //     BigInt(params.maxParticipants)
      //   ]
      // });

      console.log('Creating tournament with params:', params);
      throw new Error('Tournament creation not yet implemented');
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw error;
    }
  };

  const joinTournament = async (tournamentAddress: string, entryFee: string) => {
    try {
      // TODO: First approve USDC, then join tournament
      // const entryFeeWei = parseUnits(entryFee, 6);

      // Step 1: Approve USDC
      // await writeContract({
      //   address: MOCK_USDC_ADDRESS,
      //   abi: MOCK_USDC_ABI,
      //   functionName: 'approve',
      //   args: [tournamentAddress, entryFeeWei]
      // });

      // Step 2: Join tournament
      // await writeContract({
      //   address: tournamentAddress,
      //   abi: TOURNAMENT_ABI,
      //   functionName: 'register',
      //   args: []
      // });

      console.log('Joining tournament:', tournamentAddress, 'with entry fee:', entryFee);
      throw new Error('Tournament joining not yet implemented');
    } catch (error) {
      console.error('Failed to join tournament:', error);
      throw error;
    }
  };

  const getUSDCFaucet = async () => {
    try {
      // TODO: Implement USDC faucet call
      // await writeContract({
      //   address: MOCK_USDC_ADDRESS,
      //   abi: MOCK_USDC_ABI,
      //   functionName: 'faucet',
      //   args: []
      // });

      console.log('Getting USDC from faucet');
      throw new Error('USDC faucet not yet implemented');
    } catch (error) {
      console.error('Failed to get USDC faucet:', error);
      throw error;
    }
  };

  return {
    createTournament,
    joinTournament,
    getUSDCFaucet,
    isPending: isPending || isConfirming,
    isSuccess
  };
}