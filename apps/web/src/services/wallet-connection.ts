/**
 * Modular Wallet Connection Service
 * 
 * Following Senior Developer Guidelines:
 * - Single Responsibility: Only handles wallet connections
 * - Fail-Safe: Comprehensive error handling
 * - Modular: Independent of React components
 * - Secure: Validates all inputs and connections
 */

import { ConnectedWallet, WalletAccount } from '@/types/wallet';
import { COREUM_CHAIN_INFO, suggestChain, enableChain } from '@/lib/coreum-config';
import { getWalletByName } from '@/lib/wallet-registry';
import { WalletStateManager } from '@/lib/wallet-state';
import { apiRequest } from '@/lib/api';

// Connection error types for proper error handling
export enum WalletConnectionError {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  USER_REJECTED = 'USER_REJECTED',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Custom error class for wallet connection errors
export class WalletConnectionException extends Error {
  constructor(
    public readonly type: WalletConnectionError,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'WalletConnectionException';
  }
}

// Wallet connection service
export class WalletConnectionService {
  /**
   * Connect to wallet extension
   */
  static async connectExtension(walletName: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 ConnectExtension called with wallet:', walletName, '- VERSION 2.0');
    }
    
    try {
      WalletStateManager.setConnecting(true);

      // Validate wallet name
      const walletInfo = getWalletByName(walletName);
      if (!walletInfo) {
        throw new WalletConnectionException(
          WalletConnectionError.WALLET_NOT_FOUND,
          `Wallet "${walletName}" not found in registry`
        );
      }

      // Get wallet object
      const wallet = this.getWalletObject(walletName);
      if (!wallet) {
        throw new WalletConnectionException(
          WalletConnectionError.WALLET_NOT_INSTALLED,
          `${walletInfo.prettyName} is not installed. Please install the extension and try again.`
        );
      }

      // Suggest chain if needed
      try {
        await suggestChain(wallet);
      } catch (error) {
        console.warn('Chain suggestion failed, continuing...', error);
      }

      // Enable chain (force fresh approval)
      try {
        // First try to disable to clear any cached permissions
        try {
          await wallet.disable?.(COREUM_CHAIN_INFO.chainId);
        } catch (e) {
          // Ignore disable errors - not all wallets support it
        }
        
        await enableChain(wallet, COREUM_CHAIN_INFO.chainId);
      } catch (error) {
        throw new WalletConnectionException(
          WalletConnectionError.USER_REJECTED,
          'Connection was denied or failed. Please try again.',
          error as Error
        );
      }

      // Get accounts with timeout
      const accounts = await this.getAccountsWithTimeout(wallet);
      if (!accounts || accounts.length === 0) {
        throw new WalletConnectionException(
          WalletConnectionError.ACCOUNT_NOT_FOUND,
          'No accounts found. Please ensure your wallet has accounts for the Coreum network.'
        );
      }

      // Get key info
      const key = await this.getKeyWithTimeout(wallet);

      // Create wallet data
      const walletData: ConnectedWallet = {
        name: walletName,
        address: accounts[0].address,
        isLedger: key.isNanoLedger || false,
        source: walletInfo.prettyName,
        isReadOnly: false,
        connectionType: 'extension',
      };

      // Authenticate with backend FIRST - don't show as connected until auth completes
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Starting wallet authentication for:', walletData.address);
      }
      
      try {
        await this.authenticateWallet(walletData.address, wallet);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Backend authentication successful');
        }
        
        // ONLY NOW update state - connection AND authentication successful
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Setting wallet as connected after authentication');
        }
        WalletStateManager.setConnected(walletData, accounts);
        
      } catch (authError) {
        // Authentication failed - don't connect the wallet
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Authentication failed:', authError);
        }
        throw new WalletConnectionException(
          WalletConnectionError.AUTHENTICATION_FAILED,
          'Failed to authenticate with backend. Please try again.',
          authError as Error
        );
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Wallet connected successfully:', walletData.address);
      }

    } catch (error) {
      if (error instanceof WalletConnectionException) {
        WalletStateManager.setError(error.message);
        throw error;
      } else {
        const unknownError = new WalletConnectionException(
          WalletConnectionError.UNKNOWN_ERROR,
          'An unexpected error occurred during connection',
          error as Error
        );
        WalletStateManager.setError(unknownError.message);
        throw unknownError;
      }
    }
  }

  /**
   * Connect with manual address (read-only)
   */
  static async connectManual(address: string): Promise<void> {
    try {
      WalletStateManager.setConnecting(true);

      // Validate address format
      if (!this.isValidCoreumAddress(address)) {
        throw new WalletConnectionException(
          WalletConnectionError.INVALID_ADDRESS,
          'Invalid Coreum address format. Address must start with "core1" and be 39 characters long.'
        );
      }

      // Create read-only wallet data
      const walletData: ConnectedWallet = {
        name: 'manual-address',
        address: address,
        isLedger: false,
        source: 'Manual Input',
        isReadOnly: true,
        connectionType: 'manual',
      };

      // Create dummy account for compatibility
      const dummyAccount: WalletAccount = {
        address: address,
        algo: 'secp256k1',
        pubkey: new Uint8Array(33), // Empty pubkey for read-only
      };

      // Update state - connection successful
      WalletStateManager.setConnected(walletData, [dummyAccount]);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Manual address connected successfully:', address);
      }

    } catch (error) {
      if (error instanceof WalletConnectionException) {
        WalletStateManager.setError(error.message);
        throw error;
      } else {
        const unknownError = new WalletConnectionException(
          WalletConnectionError.UNKNOWN_ERROR,
          'An unexpected error occurred during manual connection',
          error as Error
        );
        WalletStateManager.setError(unknownError.message);
        throw unknownError;
      }
    }
  }

  /**
   * Disconnect wallet
   */
  static disconnect(): void {
    WalletStateManager.setDisconnected();
    
    // Clear wallet-related localStorage
    // Note: Keep auth_token as user authentication should persist independently of wallet connection
    if (typeof window !== 'undefined') {
      localStorage.removeItem('connected_wallet');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Wallet disconnected and localStorage cleared');
    }
  }

  /**
   * Auto-reconnect from localStorage (only for manual/read-only connections)
   */
  static async autoReconnect(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 AutoReconnect called');
    }
    
    try {
      if (typeof window === 'undefined') {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 AutoReconnect: window undefined, skipping');
        }
        return;
      }

      const savedWallet = localStorage.getItem('connected_wallet');
      if (!savedWallet) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 AutoReconnect: no saved wallet, skipping');
        }
        return;
      }

      const walletData = JSON.parse(savedWallet);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 AutoReconnect: checking saved wallet:', walletData);
      }

      // Try to auto-reconnect both extension and manual connections
      if (walletData.isReadOnly || walletData.connectionType === 'manual') {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 AutoReconnect: reconnecting manual address:', walletData.address);
        }
        await this.connectManual(walletData.address);
      } else {
        // Try to silently reconnect extension wallet
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 AutoReconnect: attempting silent extension reconnect:', walletData.name);
        }
        
        try {
          // Test if wallet is still accessible without user interaction
          const wallet = this.getWalletObject(walletData.name);
          if (wallet) {
            // Try to get the key - this will succeed if wallet is unlocked and connected
            const key = await wallet.getKey(COREUM_CHAIN_INFO.chainId);
            if (key && key.bech32Address === walletData.address) {
              // Wallet is still accessible, restore connection
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 AutoReconnect: extension wallet still accessible, restoring connection');
              }
              await this.connectExtension(walletData.name);
              return;
            }
          }
        } catch (error) {
          // Silent failure - wallet is locked or disconnected
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 AutoReconnect: extension wallet not accessible, clearing localStorage');
          }
        }
        
        // Clear extension wallet data if not accessible
        localStorage.removeItem('connected_wallet');
      }

    } catch (error) {
      console.warn('🔄 AutoReconnect failed:', error);
      // Clear invalid stored data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('connected_wallet');
      }
    }
  }

  // Private helper methods

  private static getWalletObject(walletName: string): any {
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

  private static async getAccountsWithTimeout(wallet: any): Promise<WalletAccount[]> {
    const offlineSigner = wallet.getOfflineSigner(COREUM_CHAIN_INFO.chainId);
    
    const accountsPromise = offlineSigner.getAccounts();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Account retrieval timeout')), 10000)
    );

    return await Promise.race([accountsPromise, timeoutPromise]);
  }

  private static async getKeyWithTimeout(wallet: any): Promise<any> {
    const keyPromise = wallet.getKey(COREUM_CHAIN_INFO.chainId);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Key retrieval timeout')), 5000)
    );

    return await Promise.race([keyPromise, timeoutPromise]);
  }

  private static async authenticateWallet(address: string, wallet: any): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Creating authentication message for signing...');
    }
    
    const message = `Authenticate wallet ${address} for ShieldNest Dashboard\n\nTimestamp: ${Date.now()}`;

    const signDoc = {
      chain_id: COREUM_CHAIN_INFO.chainId,
      account_number: '0',
      sequence: '0',
      fee: { gas: '0', amount: [] },
      msgs: [],
      memo: message,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Requesting signature from wallet...');
    }
    const signature = await wallet.signAmino(COREUM_CHAIN_INFO.chainId, address, signDoc);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Signature received, getting public key...');
    }
    const key = await wallet.getKey(COREUM_CHAIN_INFO.chainId);
    const publicKey = Buffer.from(key.pubKey).toString('base64');

    const response = await apiRequest('api/auth/wallet-auth', {
      method: 'POST',
      body: JSON.stringify({
        address,
        chain: 'coreum',
        signature: signature.signature.signature,
        message,
        publicKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    const data = await response.json();
    
    // Store auth token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.data.token);
    }
  }

  private static isValidCoreumAddress(address: string): boolean {
    return /^core1[a-z0-9]{38}$/.test(address);
  }
}
