/**
 * Clean Wallet Connection Hook
 * 
 * Following Senior Developer Guidelines:
 * - Single Responsibility: Only provides wallet connection interface
 * - Modular: Uses separate services for business logic
 * - Type Safe: Full TypeScript support
 * - Fail-Safe: Comprehensive error handling
 */

import { useCallback, useEffect, useRef } from 'react';
import { useWalletState, WalletStateManager } from '@/lib/wallet-state';
import { WalletConnectionService, WalletConnectionException } from '@/services/wallet-connection';
import { ConnectedWallet, WalletAccount, SigningResult } from '@/types/wallet';
import { SigningStargateClient } from '@cosmjs/stargate';
import { COREUM_CHAIN_INFO } from '@/lib/coreum-config';
import { useAuth } from '@/contexts/AuthContext';

export interface UseWalletConnectReturn {
  // State (from global state manager)
  isConnecting: boolean;
  isConnected: boolean;
  connectedWallet: ConnectedWallet | null;
  accounts: WalletAccount[];
  error: string | null;

  // Actions
  connectExtension: (walletName: string) => Promise<void>;
  connectManual: (address: string) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;

  // Wallet operations (only available when connected)
  signMessage: (message: string) => Promise<SigningResult>;
  getSigningClient: () => Promise<SigningStargateClient>;
}

/**
 * Main wallet connection hook
 */
export function useWalletConnect(): UseWalletConnectReturn {
  // Get state from global state manager
  const walletState = useWalletState();
  // Get auth context for syncing wallet authentication
  const { refreshUser } = useAuth();

  // Auto-reconnect on mount (with ref to prevent multiple calls)
  const hasAttemptedRef = useRef(false);
  useEffect(() => {
    const attemptAutoReconnect = async () => {
      if (hasAttemptedRef.current) return;
      hasAttemptedRef.current = true;
      
      try {
        await WalletConnectionService.autoReconnect();
        
        // If auto-reconnect succeeds and we have a token, refresh user state
        if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Refreshing user state after auto-reconnect');
          }
          await refreshUser();
        }
      } catch (error) {
        // Auto-reconnect failure is not critical
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto-reconnect skipped or failed:', error);
        }
      }
    };

    attemptAutoReconnect();
  }, [refreshUser]);

  // Connection actions
  const connectExtension = useCallback(async (walletName: string) => {
    try {
      await WalletConnectionService.connectExtension(walletName);
      
      // After successful wallet connection and authentication, refresh user state
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Refreshing user state after wallet authentication');
      }
      await refreshUser();
    } catch (error) {
      if (error instanceof WalletConnectionException) {
        // Error already handled by service
        throw error;
      } else {
        throw new Error('Failed to connect wallet');
      }
    }
  }, [refreshUser]);

  const connectManual = useCallback(async (address: string) => {
    try {
      await WalletConnectionService.connectManual(address);
    } catch (error) {
      if (error instanceof WalletConnectionException) {
        // Error already handled by service
        throw error;
      } else {
        throw new Error('Failed to connect with manual address');
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    WalletConnectionService.disconnect();
  }, []);

  const clearError = useCallback(() => {
    WalletStateManager.clearError();
  }, []);

  // Wallet operations (only available when connected)
  const signMessage = useCallback(async (message: string): Promise<SigningResult> => {
    if (!walletState.connectedWallet) {
      throw new Error('No wallet connected');
    }

    if (walletState.connectedWallet.isReadOnly) {
      throw new Error('Cannot sign messages with read-only connection. Please connect with a wallet extension.');
    }

    try {
      const wallet = getWalletObject(walletState.connectedWallet.name);
      if (!wallet) {
        throw new Error('Wallet not available');
      }

      const key = await wallet.getKey(COREUM_CHAIN_INFO.chainId);
      
      const signDoc = {
        chain_id: COREUM_CHAIN_INFO.chainId,
        account_number: '0',
        sequence: '0',
        fee: { gas: '0', amount: [] },
        msgs: [],
        memo: message,
      };

      const signature = await wallet.signAmino(
        COREUM_CHAIN_INFO.chainId,
        walletState.connectedWallet.address,
        signDoc
      );

      return {
        signature: signature.signature.signature,
        publicKey: Buffer.from(key.pubKey).toString('base64'),
        address: walletState.connectedWallet.address,
      };
    } catch (error) {
      throw new Error(`Failed to sign message: ${(error as Error).message}`);
    }
  }, [walletState.connectedWallet]);

  const getSigningClient = useCallback(async (): Promise<SigningStargateClient> => {
    if (!walletState.connectedWallet) {
      throw new Error('No wallet connected');
    }

    if (walletState.connectedWallet.isReadOnly) {
      throw new Error('Cannot create signing client with read-only connection. Please connect with a wallet extension.');
    }

    try {
      const wallet = getWalletObject(walletState.connectedWallet.name);
      if (!wallet) {
        throw new Error('Wallet not available');
      }

      const offlineSigner = wallet.getOfflineSigner(COREUM_CHAIN_INFO.chainId);
      return await SigningStargateClient.connectWithSigner(
        COREUM_CHAIN_INFO.rpc,
        offlineSigner
      );
    } catch (error) {
      throw new Error(`Failed to get signing client: ${(error as Error).message}`);
    }
  }, [walletState.connectedWallet]);

  return {
    // State
    isConnecting: walletState.isConnecting,
    isConnected: walletState.isConnected,
    connectedWallet: walletState.connectedWallet,
    accounts: walletState.accounts,
    error: walletState.error,

    // Actions
    connectExtension,
    connectManual,
    disconnect,
    clearError,

    // Wallet operations
    signMessage,
    getSigningClient,
  };
}

// Helper function to get wallet object
function getWalletObject(walletName: string): any {
  if (typeof window === 'undefined') return null;

  switch (walletName) {
    case 'keplr-extension':
      return (window as any).keplr;
    case 'leap-extension':
      return (window as any).leap;
    case 'cosmostation-extension':
      return (window as any).cosmostation?.providers?.keplr;
    default:
      return null;
  }
}

// Import moved to top for better organization
