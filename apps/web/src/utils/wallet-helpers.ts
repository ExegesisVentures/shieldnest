import { WalletInfo } from '@/types/wallet';

/**
 * Validates a Coreum address format
 */
export function isValidCoreumAddress(address: string): boolean {
  return /^core1[a-z0-9]{38}$/.test(address);
}

/**
 * Truncates an address for display purposes
 */
export function truncateAddress(address: string, startChars = 5, endChars = 5): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Mobile-optimized address truncation
 */
export function truncateAddressMobile(address: string): string {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Gets the display name for a wallet
 */
export function getWalletDisplayName(wallet: WalletInfo | string): string {
  if (typeof wallet === 'string') {
    // Convert wallet name to display name
    switch (wallet) {
      case 'keplr-extension':
        return 'Keplr';
      case 'leap-extension':
        return 'Leap Cosmos';
      case 'cosmostation-extension':
        return 'Cosmostation';
      default:
        return wallet;
    }
  }
  return wallet.prettyName;
}

/**
 * Checks if a wallet is available in the browser
 */
export function isWalletAvailable(walletName: string): boolean {
  if (typeof window === 'undefined') return false;
  
  switch (walletName) {
    case 'keplr-extension':
      return !!(window as any).keplr;
    case 'leap-extension':
      return !!(window as any).leap;
    case 'cosmostation-extension':
      return !!(window as any).cosmostation;
    default:
      return false;
  }
}

/**
 * Gets wallet installation URL
 */
export function getWalletInstallUrl(walletName: string): string | null {
  switch (walletName) {
    case 'keplr-extension':
      return 'https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap';
    case 'leap-extension':
      return 'https://chrome.google.com/webstore/detail/leap-cosmos-wallet/fcfcfllfndlomdhbehjjcoimbgofdncg';
    case 'cosmostation-extension':
      return 'https://chrome.google.com/webstore/detail/cosmostation-wallet/fpkhgmpbidmiogeglndfbkegfdlnajnf';
    default:
      return null;
  }
}

/**
 * Formats wallet connection errors for user display
 */
export function formatWalletError(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  const errorMessage = error.message || error.toString();
  
  // Common error patterns
  if (errorMessage.includes('not installed')) {
    return 'Wallet extension not installed. Please install the wallet and try again.';
  }
  
  if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
    return 'Connection request was rejected. Please try again and approve the connection.';
  }
  
  if (errorMessage.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Connection timed out. Please try again.';
  }
  
  // Return original message if no pattern matches
  return errorMessage;
}

/**
 * Storage helpers for wallet connection persistence
 */
export const walletStorage = {
  save: (data: { name: string; address: string }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('connected_wallet', JSON.stringify(data));
    }
  },
  
  load: (): { name: string; address: string } | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('connected_wallet');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('connected_wallet');
      localStorage.removeItem('authToken');
    }
  },
};

/**
 * Wallet connection state types
 */
export type WalletConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticating'
  | 'authenticated'
  | 'error';

/**
 * Gets user-friendly connection state message
 */
export function getConnectionStateMessage(state: WalletConnectionState): string {
  switch (state) {
    case 'disconnected':
      return 'Not connected';
    case 'connecting':
      return 'Connecting to wallet...';
    case 'connected':
      return 'Wallet connected';
    case 'authenticating':
      return 'Authenticating with server...';
    case 'authenticated':
      return 'Fully authenticated';
    case 'error':
      return 'Connection failed';
    default:
      return 'Unknown state';
  }
}
