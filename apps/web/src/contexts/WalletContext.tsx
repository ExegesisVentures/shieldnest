// apps/web/src/contexts/WalletContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { KeplrConnector } from '@/utils/wallet/keplr';
import { LeapConnector } from '@/utils/wallet/leap';
import { CosmostationConnector } from '@/utils/wallet/cosmostation';
import { ShieldError } from '@/lib/errors';

/**
 * Supported wallet types
 */
export type WalletType = 'keplr' | 'leap' | 'cosmostation' | 'manual';

/**
 * Wallet connection state
 */
export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType | null;
  address: string | null;
  publicKey: string | null;
  error: ShieldError | null;
}

/**
 * Wallet actions
 */
type WalletAction =
  | { type: 'CONNECTING'; walletType: WalletType }
  | { type: 'CONNECTED'; walletType: WalletType; address: string; publicKey?: string }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR'; error: ShieldError }
  | { type: 'CLEAR_ERROR' };

/**
 * Wallet context value
 */
interface WalletContextValue {
  state: WalletState;
  connect: (walletType: WalletType) => Promise<void>;
  connectManual: (address: string) => Promise<void>;
  disconnect: () => void;
  signAuth: () => Promise<{
    signature: string;
    publicKey: string;
    address: string;
    nonce: string;
  } | null>;
  clearError: () => void;
  getSupportedWallets: () => Array<{
    type: WalletType;
    name: string;
    logo: string;
    isInstalled: boolean;
    downloadUrl?: string;
  }>;
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  walletType: null,
  address: null,
  publicKey: null,
  error: null,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'CONNECTING':
      return {
        ...state,
        isConnecting: true,
        walletType: action.walletType,
        error: null,
      };
    case 'CONNECTED':
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        walletType: action.walletType,
        address: action.address,
        publicKey: action.publicKey || null,
        error: null,
      };
    case 'DISCONNECTED':
      return {
        ...initialState,
      };
    case 'ERROR':
      return {
        ...state,
        isConnecting: false,
        error: action.error,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Wallet provider component
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Initialize wallet connectors
  const keplr = new KeplrConnector();
  const leap = new LeapConnector();
  const cosmostation = new CosmostationConnector();

  const getConnector = (walletType: WalletType) => {
    switch (walletType) {
      case 'keplr':
        return keplr;
      case 'leap':
        return leap;
      case 'cosmostation':
        return cosmostation;
      default:
        return null;
    }
  };

  const connect = useCallback(async (walletType: WalletType) => {
    dispatch({ type: 'CONNECTING', walletType });

    try {
      const connector = getConnector(walletType);
      if (!connector) {
        throw new Error('Unsupported wallet type');
      }

      await connector.enable();
      const address = await connector.getAddress();
      const publicKey = await connector.getPublicKey();

      dispatch({
        type: 'CONNECTED',
        walletType,
        address,
        publicKey,
      });
    } catch (error) {
      dispatch({
        type: 'ERROR',
        error: error as ShieldError,
      });
    }
  }, []);

  const connectManual = useCallback(async (address: string) => {
    dispatch({ type: 'CONNECTING', walletType: 'manual' });

    try {
      // TODO(v1): Validate address format
      dispatch({
        type: 'CONNECTED',
        walletType: 'manual',
        address,
      });
    } catch (error) {
      dispatch({
        type: 'ERROR',
        error: error as ShieldError,
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: 'DISCONNECTED' });
  }, []);

  const signAuth = useCallback(async () => {
    if (!state.isConnected || !state.walletType || state.walletType === 'manual') {
      return null;
    }

    try {
      const connector = getConnector(state.walletType);
      if (!connector) {
        return null;
      }

      return await connector.signAuth();
    } catch (error) {
      dispatch({
        type: 'ERROR',
        error: error as ShieldError,
      });
      return null;
    }
  }, [state.isConnected, state.walletType]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const getSupportedWallets = useCallback(() => {
    return [
      {
        type: 'keplr' as WalletType,
        ...keplr.getInfo(),
        isInstalled: keplr.isInstalled(),
      },
      {
        type: 'leap' as WalletType,
        ...leap.getInfo(),
        isInstalled: leap.isInstalled(),
      },
      {
        type: 'cosmostation' as WalletType,
        ...cosmostation.getInfo(),
        isInstalled: cosmostation.isInstalled(),
      },
    ];
  }, []);

  const value: WalletContextValue = {
    state,
    connect,
    connectManual,
    disconnect,
    signAuth,
    clearError,
    getSupportedWallets,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use wallet context
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
