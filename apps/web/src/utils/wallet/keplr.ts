// apps/web/src/utils/wallet/keplr.ts
import { Window as KeplrWindow } from '@keplr-wallet/types';
import { COREUM_CHAIN_CONFIG } from '@/lib/coreum/chain';
import { createAuthSignDoc, generateNonce } from './adr36';
import { createError, ErrorCodes, mapWalletError } from '@/lib/errors';

declare global {
  interface Window extends KeplrWindow {}
}

/**
 * Keplr wallet connector
 */
export class KeplrConnector {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.keplr;
  }

  /**
   * Check if Keplr is installed
   */
  isInstalled(): boolean {
    return this.isAvailable();
  }

  /**
   * Enable Keplr for Coreum chain
   */
  async enable(): Promise<void> {
    if (!this.isAvailable()) {
      throw createError(
        ErrorCodes.WALLET_NOT_FOUND,
        'Keplr wallet not found',
        'Please install the Keplr browser extension'
      );
    }

    try {
      // Suggest chain if not added
      await window.keplr!.experimentalSuggestChain(COREUM_CHAIN_CONFIG);
      
      // Enable the chain
      await window.keplr!.enable(COREUM_CHAIN_CONFIG.chainId);
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Get user's address
   */
  async getAddress(): Promise<string> {
    if (!this.isAvailable()) {
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Keplr wallet not found');
    }

    try {
      const key = await window.keplr!.getKey(COREUM_CHAIN_CONFIG.chainId);
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
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Keplr wallet not found');
    }

    try {
      const key = await window.keplr!.getKey(COREUM_CHAIN_CONFIG.chainId);
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
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Keplr wallet not found');
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

      const signature = await window.keplr!.signArbitrary(
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
      name: 'Keplr',
      logo: '/wallets/keplr.svg',
      downloadUrl: 'https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap',
    };
  }
}
