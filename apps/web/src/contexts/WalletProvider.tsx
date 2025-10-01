/**
 * Clean Wallet Provider
 * 
 * Following Senior Developer Guidelines:
 * - Single Responsibility: Only provides wallet context
 * - Modular: Uses clean hook and state management
 * - Simple: No complex state synchronization
 * - Fail-Safe: Error boundaries and fallbacks
 */

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useWalletConnect, UseWalletConnectReturn } from '@/hooks/useWalletConnect';
import { debugLog } from '@/utils/debug';

// Context type is the same as the hook return type
type WalletContextType = UseWalletConnectReturn;

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Simple wallet provider that just exposes the clean hook
 */
export function WalletProvider({ children }: WalletProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const walletConnect = useWalletConnect();

  // Ensure this only runs on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => {
    // On server-side or if hook not ready, return default values
    if (!isClient || !walletConnect) {
      return {
        isConnected: false,
        connectedWallet: null,
        accounts: [],
        isConnecting: false,
        error: null,
        connectExtension: async () => { throw new Error('Wallet not initialized'); },
        connectManual: async () => { throw new Error('Wallet not initialized'); },
        disconnect: () => {},
        clearError: () => {},
        signMessage: async () => { throw new Error('Wallet not initialized'); },
        getSigningClient: async () => { throw new Error('Wallet not initialized'); }
      };
    }
    return walletConnect;
  }, [
    isClient,
    walletConnect?.isConnected,
    walletConnect?.connectedWallet?.address,
    walletConnect?.isConnecting,
    walletConnect?.error
  ]);

  // Production-safe debug logging - only on client
  React.useEffect(() => {
    if (isClient && walletConnect) {
      debugLog.state('WalletProvider', {
        isConnected: walletConnect.isConnected,
        connectedWallet: walletConnect.connectedWallet?.address,
        isConnecting: walletConnect.isConnecting,
        error: walletConnect.error
      });
    }
  }, [
    isClient,
    walletConnect?.isConnected,
    walletConnect?.connectedWallet?.address,
    walletConnect?.isConnecting,
    walletConnect?.error
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use wallet context
 */
export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  
  return context;
}

// Export the hook directly for convenience
export { useWalletConnect };
