// apps/web/src/utils/wallet/cosmostation.ts
import { COREUM_CHAIN_CONFIG } from '@/lib/coreum/chain';
import { createAuthSignDoc, generateNonce } from './adr36';
import { createError, ErrorCodes, mapWalletError } from '@/lib/errors';

// Cosmostation wallet interface
interface CosmostationWallet {
  cosmos: {
    request(params: {
      method: string;
      params?: any;
    }): Promise<any>;
  };
}

declare global {
  interface Window {
    cosmostation?: CosmostationWallet;
  }
}

/**
 * Cosmostation wallet connector
 */
export class CosmostationConnector {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.cosmostation?.cosmos;
  }

  /**
   * Check if Cosmostation is installed
   */
  isInstalled(): boolean {
    return this.isAvailable();
  }

  /**
   * Enable Cosmostation for Coreum chain
   */
  async enable(): Promise<void> {
    if (!this.isAvailable()) {
      throw createError(
        ErrorCodes.WALLET_NOT_FOUND,
        'Cosmostation wallet not found',
        'Please install the Cosmostation browser extension'
      );
    }

    try {
      // Add chain if not present
      await window.cosmostation!.cosmos.request({
        method: 'cos_addChain',
        params: COREUM_CHAIN_CONFIG,
      });
    } catch (error) {
      // Chain might already be added, continue
      console.warn('Chain add failed, might already exist:', error);
    }

    try {
      // Request account access
      await window.cosmostation!.cosmos.request({
        method: 'cos_requestAccount',
        params: { chainName: COREUM_CHAIN_CONFIG.chainId },
      });
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Get user's address
   */
  async getAddress(): Promise<string> {
    if (!this.isAvailable()) {
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Cosmostation wallet not found');
    }

    try {
      const account = await window.cosmostation!.cosmos.request({
        method: 'cos_account',
        params: { chainName: COREUM_CHAIN_CONFIG.chainId },
      });
      
      return account.address;
    } catch (error) {
      throw mapWalletError(error);
    }
  }

  /**
   * Get public key for signature verification
   */
  async getPublicKey(): Promise<string> {
    if (!this.isAvailable()) {
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Cosmostation wallet not found');
    }

    try {
      const account = await window.cosmostation!.cosmos.request({
        method: 'cos_account',
        params: { chainName: COREUM_CHAIN_CONFIG.chainId },
      });
      
      return account.publicKey;
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
      throw createError(ErrorCodes.WALLET_NOT_FOUND, 'Cosmostation wallet not found');
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

      const response = await window.cosmostation!.cosmos.request({
        method: 'cos_signArbitrary',
        params: {
          chainName: COREUM_CHAIN_CONFIG.chainId,
          signer: address,
          data: JSON.stringify(signDoc),
        },
      });

      return {
        signature: response.signature,
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
      name: 'Cosmostation',
      logo: '/wallets/cosmostation.svg',
      downloadUrl: 'https://chrome.google.com/webstore/detail/cosmostation-wallet/fpkhgmpbidmiogeglndfbkegfdlnajnf',
    };
  }
}
