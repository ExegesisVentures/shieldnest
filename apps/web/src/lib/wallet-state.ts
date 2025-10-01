/**
 * Modular Wallet State Manager
 * 
 * Following Senior Developer Guidelines:
 * - Single Responsibility: Only manages wallet state
 * - Modular Design: Can be used independently
 * - Fail-Safe: Graceful error handling
 * - Type Safety: Full TypeScript support
 */

import { ConnectedWallet, WalletAccount } from '@/types/wallet';

// Event system for state changes
export type WalletStateEventType = 'connection' | 'disconnection' | 'error';

export interface WalletStateEvent {
  type: WalletStateEventType;
  data: {
    isConnected: boolean;
    connectedWallet: ConnectedWallet | null;
    accounts: WalletAccount[];
    error: string | null;
  };
  timestamp: number;
}

// Core wallet state interface
export interface WalletState {
  isConnecting: boolean;
  isConnected: boolean;
  connectedWallet: ConnectedWallet | null;
  accounts: WalletAccount[];
  error: string | null;
}

// Initial state
const initialState: WalletState = {
  isConnecting: false,
  isConnected: false,
  connectedWallet: null,
  accounts: [],
  error: null,
};

// Global state holder
let currentState: WalletState = { ...initialState };
let listeners: Array<(state: WalletState) => void> = [];

/**
 * Pure state management functions
 */
export const WalletStateManager = {
  // Get current state
  getState(): WalletState {
    return { ...currentState };
  },

  // Subscribe to state changes
  subscribe(listener: (state: WalletState) => void): () => void {
    listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  // Update state and notify listeners
  setState(newState: Partial<WalletState>): void {
    const previousState = { ...currentState };
    currentState = { ...currentState, ...newState };
    
    // Notify all listeners
    listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in wallet state listener:', error);
      }
    });

    // Log state changes in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 WalletState updated:', {
        previous: {
          isConnected: previousState.isConnected,
          wallet: previousState.connectedWallet?.address,
        },
        current: {
          isConnected: currentState.isConnected,
          wallet: currentState.connectedWallet?.address,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Emit global event for external systems
    if (typeof window !== 'undefined') {
      const event: WalletStateEvent = {
        type: newState.isConnected ? 'connection' : 'disconnection',
        data: currentState,
        timestamp: Date.now(),
      };
      
      window.dispatchEvent(new CustomEvent('walletStateChange', { detail: event }));
    }
  },

  // Connection actions
  setConnecting(isConnecting: boolean): void {
    this.setState({ isConnecting, error: null });
  },

  setConnected(wallet: ConnectedWallet, accounts: WalletAccount[]): void {
    this.setState({
      isConnecting: false,
      isConnected: true,
      connectedWallet: wallet,
      accounts,
      error: null,
    });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('connected_wallet', JSON.stringify({
          name: wallet.name,
          address: wallet.address,
          isReadOnly: wallet.isReadOnly,
          connectionType: wallet.connectionType,
        }));
      } catch (error) {
        console.error('Failed to persist wallet state:', error);
      }
    }
  },

  setDisconnected(): void {
    this.setState({
      isConnecting: false,
      isConnected: false,
      connectedWallet: null,
      accounts: [],
      error: null,
    });

    // Clear wallet data from localStorage
    // Note: Keep auth_token as user authentication should persist independently of wallet connection
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('connected_wallet');
      } catch (error) {
        console.error('Failed to clear wallet state:', error);
      }
    }
  },

  setError(error: string): void {
    this.setState({
      isConnecting: false,
      error,
    });
  },

  clearError(): void {
    this.setState({ error: null });
  },

  // Reset to initial state
  reset(): void {
    currentState = { ...initialState };
    listeners = [];
    
    // Clear wallet data from localStorage
    // Note: Keep auth_token as user authentication should persist independently of wallet connection
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('connected_wallet');
      } catch (error) {
        console.error('Failed to clear wallet state:', error);
      }
    }
  },
};

// Add React import for the hook
import { useState, useEffect } from 'react';

/**
 * React hook for using wallet state
 */
export function useWalletState() {
  const [state, setState] = useState<WalletState>(() => {
    // Initialize with current state, but handle SSR
    if (typeof window === 'undefined') {
      return initialState;
    }
    return WalletStateManager.getState();
  });

  useEffect(() => {
    // Only subscribe on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Subscribe to state changes
    const unsubscribe = WalletStateManager.subscribe(setState);
    
    // Cleanup subscription
    return unsubscribe;
  }, []);

  return state;
}
