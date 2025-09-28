import { useState, useCallback, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ethers } from 'ethers';
import {
  PvPBattleService,
  Battle,
  BattleStatus,
  formatUSDC,
  parseUSDC,
  generateInviteCode,
  CONTRACT_ADDRESSES
} from '@/lib/contracts/pvp-battle';

interface UsePvPBattleContract {
  // State
  battles: Battle[];
  currentBattle: Battle | null;
  usdcBalance: string;
  isLoading: boolean;
  error: string | null;
  roomId: string | null;
  contractAddress: string | null;

  // Contract service
  service: PvPBattleService | null;

  // Actions
  initializeRoom: (roomId: string) => Promise<void>;
  createBattle: (durationSeconds: number) => Promise<string>;
  joinBattle: (inviteCode: string) => Promise<void>;
  claimPrize: (battleId: number) => Promise<void>;
  cancelBattle: (battleId: number) => Promise<void>;
  claimFreeUSDC: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshBattles: () => Promise<void>;
  getBattleByCode: (inviteCode: string) => Promise<Battle | null>;

  // Utilities
  formatUSDCAmount: (amount: bigint) => string;
  parseUSDCAmount: (amount: string) => bigint;
  getFixedBetAmount: () => string; // Returns "5" for $5 USDC
}

export function usePvPBattleContract(): UsePvPBattleContract {
  const { primaryWallet } = useDynamicContext();

  const [battles, setBattles] = useState<Battle[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<PvPBattleService | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  // Initialize service when wallet connects
  useEffect(() => {
    if (primaryWallet?.connector) {
      try {
        const provider = new ethers.BrowserProvider(primaryWallet.connector);
        provider.getSigner().then(signer => {
          const battleService = new PvPBattleService(signer);
          setService(battleService);

          // Set up factory event listener
          battleService.onBattleContractDeployed((roomId, contractAddress, creator) => {
            console.log('Battle contract deployed:', { roomId, contractAddress, creator });
            if (roomId === roomId) {
              setContractAddress(contractAddress);
            }
          });
        });
      } catch (err) {
        console.error('Failed to initialize PvP Battle service:', err);
        setError('Failed to initialize contract service');
      }
    } else {
      setService(null);
    }

    return () => {
      service?.removeAllListeners();
    };
  }, [primaryWallet?.connector]);

  // Refresh USDC balance
  const refreshBalance = useCallback(async () => {
    if (!service || !primaryWallet?.address) return;

    try {
      const balance = await service.getUSDCBalance(primaryWallet.address);
      setUsdcBalance(formatUSDC(balance));
    } catch (err) {
      console.error('Failed to refresh USDC balance:', err);
    }
  }, [service, primaryWallet?.address]);

  // Initialize room
  const initializeRoom = useCallback(async (newRoomId: string): Promise<void> => {
    if (!service) throw new Error('Service not initialized');

    try {
      setIsLoading(true);
      setError(null);
      setRoomId(newRoomId);

      // Check if battle contract exists for this room
      const contractExists = await service.battleContractExists(newRoomId);
      if (contractExists) {
        const address = await service.getBattleContractAddress(newRoomId);
        setContractAddress(address);
        console.log('Battle contract already exists for room:', newRoomId, 'at', address);
      } else {
        console.log('No battle contract exists for room:', newRoomId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Refresh user battles
  const refreshBattles = useCallback(async () => {
    if (!service || !primaryWallet?.address || !roomId) return;

    try {
      setIsLoading(true);
      const battleIds = await service.getUserBattles(roomId, primaryWallet.address);
      const battlePromises = battleIds.map(id => service.getBattle(roomId, Number(id)));
      const userBattles = await Promise.all(battlePromises);
      setBattles(userBattles);
    } catch (err) {
      console.error('Failed to refresh battles:', err);
      setError('Failed to load battles');
    } finally {
      setIsLoading(false);
    }
  }, [service, primaryWallet?.address, roomId]);

  // Initial load
  useEffect(() => {
    if (service && primaryWallet?.address) {
      refreshBalance();
      refreshBattles();
    }
  }, [service, primaryWallet?.address, refreshBalance, refreshBattles]);

  // Create battle with fixed $5 bet
  const createBattle = useCallback(async (durationSeconds: number): Promise<string> => {
    if (!service || !roomId) throw new Error('Service not initialized or room not set');

    try {
      setIsLoading(true);
      setError(null);

      const inviteCode = generateInviteCode();

      // This will deploy contract if it doesn't exist and create the battle
      const tx = await service.createBattle(roomId, durationSeconds, inviteCode);
      await tx.wait();

      // Update contract address if it was just deployed
      if (!contractAddress) {
        const address = await service.getBattleContractAddress(roomId);
        setContractAddress(address);
      }

      await refreshBalance();
      await refreshBattles();

      return inviteCode;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create battle';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, roomId, contractAddress, refreshBalance, refreshBattles]);

  // Join battle
  const joinBattle = useCallback(async (inviteCode: string): Promise<void> => {
    if (!service || !roomId) throw new Error('Service not initialized or room not set');

    try {
      setIsLoading(true);
      setError(null);

      const tx = await service.joinBattle(roomId, inviteCode);
      await tx.wait();

      await refreshBalance();
      await refreshBattles();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to join battle';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, roomId, refreshBalance, refreshBattles]);

  // Claim prize
  const claimPrize = useCallback(async (battleId: number): Promise<void> => {
    if (!service || !roomId) throw new Error('Service not initialized or room not set');

    try {
      setIsLoading(true);
      setError(null);

      const tx = await service.claimPrize(roomId, battleId);
      await tx.wait();

      await refreshBalance();
      await refreshBattles();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to claim prize';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, roomId, refreshBalance, refreshBattles]);

  // Cancel battle
  const cancelBattle = useCallback(async (battleId: number): Promise<void> => {
    if (!service || !roomId) throw new Error('Service not initialized or room not set');

    try {
      setIsLoading(true);
      setError(null);

      const tx = await service.cancelBattle(roomId, battleId);
      await tx.wait();

      await refreshBalance();
      await refreshBattles();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel battle';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, roomId, refreshBalance, refreshBattles]);

  // Claim free USDC (faucet)
  const claimFreeUSDC = useCallback(async (): Promise<void> => {
    if (!service) throw new Error('Service not initialized');

    try {
      setIsLoading(true);
      setError(null);

      const tx = await service.claimFreeUSDC();
      await tx.wait();

      await refreshBalance();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to claim free USDC';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, refreshBalance]);

  // Get battle by invite code
  const getBattleByCode = useCallback(async (inviteCode: string): Promise<Battle | null> => {
    if (!service || !roomId) return null;

    try {
      const battle = await service.getBattleByInviteCode(roomId, inviteCode);
      return battle;
    } catch (err) {
      console.error('Failed to get battle by code:', err);
      return null;
    }
  }, [service, roomId]);

  // Get fixed bet amount
  const getFixedBetAmount = useCallback((): string => {
    return "5"; // Fixed $5 USDC bet
  }, []);

  return {
    // State
    battles,
    currentBattle,
    usdcBalance,
    isLoading,
    error,
    service,
    roomId,
    contractAddress,

    // Actions
    initializeRoom,
    createBattle,
    joinBattle,
    claimPrize,
    cancelBattle,
    claimFreeUSDC,
    refreshBalance,
    refreshBattles,
    getBattleByCode,

    // Utilities
    formatUSDCAmount: formatUSDC,
    parseUSDCAmount: parseUSDC,
    getFixedBetAmount,
  };
}