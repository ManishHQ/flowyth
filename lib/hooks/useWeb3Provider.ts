import { useEffect, useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { TournamentService } from '@/lib/services/tournament-service';
import { TournamentContractService } from '@/lib/services/tournament-contract-service';

export function useWeb3Provider() {
  const { primaryWallet } = useDynamicContext();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeProvider = async () => {
      try {
        setError(null);
        
        if (primaryWallet?.connector && walletClient) {
          console.log('Initializing Web3 provider...');
          
          // Get provider from Dynamic wallet
          const web3Provider = await primaryWallet.connector.getWalletConnection();
          
          if (web3Provider?.provider) {
            // Initialize contract services with the provider
            await TournamentService.initialize(web3Provider.provider);
            await TournamentContractService.initialize(web3Provider.provider);
            
            setIsInitialized(true);
            console.log('Web3 provider initialized successfully');
          } else {
            throw new Error('No provider available from wallet');
          }
        } else {
          // Reset if no wallet
          setIsInitialized(false);
        }
      } catch (err) {
        console.error('Failed to initialize Web3 provider:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Web3 provider');
        setIsInitialized(false);
      }
    };

    initializeProvider();
  }, [primaryWallet, walletClient]);

  return {
    walletClient,
    publicClient,
    isInitialized,
    error,
  };
}

// Hook for getting wallet client (equivalent to signer in ethers)
export function useWeb3Signer() {
  const { walletClient } = useWeb3Provider();
  return walletClient;
}

// Hook for contract interactions with loading states
export function useContractTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeTransaction = async <T>(
    transactionFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await transactionFn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      console.error('Transaction failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    executeTransaction,
    loading,
    error,
    clearError: () => setError(null),
  };
}
