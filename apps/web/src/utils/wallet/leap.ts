// apps/web/src/utils/wallet/leap.ts
import { COREUM_CHAIN_CONFIG } from '@/lib/coreum/chain';
import { createAuthSignDoc, generateNonce } from './adr36';
import { createError, ErrorCodes, mapWalletError } from '@/lib/errors';

// Leap wallet follows similar interface to Keplr
interface LeapWallet {
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<{
    name: string;
    algo: string;
    pubKey: Uint8Array;
    address: Uint8Array;
    bech32Address: string;
    isNanoLedger: boolean;
  }>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string
  ): Promise<{
    signature: string;
    pub_key: {
      type: string;
      value: string;
    };
  }>;
  experimentalSuggestChain(chainInfo: any): Promise<void>;
}

declare global {
  interface Window {
    leap?: LeapWallet;
  }
}

/**
 * Leap wallet connector
 */
export class LeapConnector {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.leap;
  }

  /**
   * Check if Leap is installed
   */
  isInstalled(): boolean {
    return this.isAvailable();
  }

  /**
   * Enable Leap for Coreum chain
   */
  async enable(): Promise<void> {
    if (!this.isAvailable()) {
      throw createError(
        ErrorCodes.WALLET_NOT_FOUND,
        'Leap wallet not found',
        'Please install the Leap browser extension'
      );
    }

    try {
      // Suggest chain if not added
      await window.leap!.experimentalSuggestChain(COREUM_CHAIN_CONFIG);
      
      // Enable the chain
      await window.leap!.enable(COREUM_CHAIN_CONFIG.chainId);
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Get user's address
   */
  async getAddress(): Promise<string> {
    if (!this.isAvailable()) {
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Leap wallet not found');
    }

    try {
      const key = await window.leap!.getKey(COREUM_CHAIN_CONFIG.chainId);
      return key.bech32Address;
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Get public key for signature verification
   */
  async getPublicKey(): Promise<string> {
    if (!this.isAvailable()) {
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Leap wallet not found');
    }

    try {
      const key = await window.leap!.getKey(COREUM_CHAIN_CONFIG.chainId);
      return Buffer.from(key.pubKey).toString('base64');
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Sign a message for authentication
   */
  async signAuth(): Promise<{
    signature: string;
    publicKey: string;
    address: string;
    nonce: string;
  }> {
    if (!this.isAvailable()) {
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Leap wallet not found');
    }

    try {
      const address = await this.getAddress();
      const publicKey = await this.getPublicKey();
      const nonce = generateNonce();
      
      const signDoc = createAuthSignDoc(
        COREUM_CHAIN_CONFIG.chainId,
        address,
        nonce
      );

      const signature = await window.leap!.signArbitrary(
        COREUM_CHAIN_CONFIG.chainId,
        address,
        JSON.stringify(signDoc)
      );

      return {
        signature: signature.signature,
        publicKey,
        address,
        nonce,
      };
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Get wallet info
   */
  getInfo() {
    return {
      name: 'Leap',
      logo: '/wallets/leap.svg',
      downloadUrl: 'https://chrome.google.com/webstore/detail/leap-cosmos-wallet/fcfcfllfndlomdhbehjjcoimbgofdncg',
    };
  }
}
