import crypto from 'crypto';
import { config } from '@/lib/config';
import { SecureLogger, CryptoUtils } from '@/utils/security';

/**
 * Secure Oracle service for price signing and verification
 * File: apps/api/src/services/oracle.ts
 */

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

export interface SignedPriceData extends PriceData {
  signature: string;
  publicKey: string;
}

export interface OracleConfig {
  privateKey: string;
  publicKey: string;
  maxPriceAge: number; // in milliseconds
  allowedSources: string[];
}

/**
 * Oracle service for secure price data signing and verification
 */
export class OracleService {
  private static instance: OracleService;
  private config: OracleConfig;

  private constructor() {
    this.config = {
      privateKey: config.oracle.privateKey,
      publicKey: config.oracle.publicKey,
      maxPriceAge: 5 * 60 * 1000, // 5 minutes
      allowedSources: ['coingecko', 'coinmarketcap', 'dex_aggregator']
    };

    this.validateConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): OracleService {
    if (!OracleService.instance) {
      OracleService.instance = new OracleService();
    }
    return OracleService.instance;
  }

  /**
   * Validate oracle configuration
   */
  private validateConfiguration(): void {
    if (!this.config.privateKey || this.config.privateKey.includes('your_oracle_signing_key')) {
      console.warn('⚠️  Oracle private key not configured properly');
    }

    if (!this.config.publicKey || this.config.publicKey.includes('your_oracle_public_key')) {
      console.warn('⚠️  Oracle public key not configured properly');
    }

    // Validate key format (should be hex)
    if (this.config.privateKey && !/^[a-fA-F0-9]+$/.test(this.config.privateKey)) {
      console.warn('⚠️  Oracle private key should be in hex format');
    }
  }

  /**
   * Sign price data with oracle private key
   */
  public signPriceData(priceData: PriceData): SignedPriceData {
    try {
      if (!this.isConfigured()) {
        throw new Error('Oracle not properly configured');
      }

      // Validate price data
      this.validatePriceData(priceData);

      // Create message to sign
      const message = this.createPriceMessage(priceData);
      
      // Sign the message
      const signature = this.signMessage(message);

      SecureLogger.logSecure('info', 'Price data signed', {
        symbol: priceData.symbol,
        price: priceData.price,
        timestamp: priceData.timestamp,
        source: priceData.source
      });

      return {
        ...priceData,
        signature,
        publicKey: this.config.publicKey
      };
    } catch (error) {
      SecureLogger.logSecure('error', 'Failed to sign price data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        symbol: priceData.symbol
      });
      throw new Error('Failed to sign price data');
    }
  }

  /**
   * Verify signed price data
   */
  public verifySignedPriceData(signedData: SignedPriceData): boolean {
    try {
      // Check if price data is too old
      const age = Date.now() - signedData.timestamp;
      if (age > this.config.maxPriceAge) {
        SecureLogger.logSecure('warn', 'Price data too old', {
          symbol: signedData.symbol,
          age: age,
          maxAge: this.config.maxPriceAge
        });
        return false;
      }

      // Validate price data structure
      this.validatePriceData(signedData);

      // Create message to verify
      const message = this.createPriceMessage(signedData);

      // Verify signature
      const isValid = this.verifySignature(message, signedData.signature, signedData.publicKey);

      if (!isValid) {
        SecureLogger.logSecure('warn', 'Invalid price data signature', {
          symbol: signedData.symbol,
          timestamp: signedData.timestamp
        });
      }

      return isValid;
    } catch (error) {
      SecureLogger.logSecure('error', 'Failed to verify price data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        symbol: signedData.symbol
      });
      return false;
    }
  }

  /**
   * Create TWAP (Time-Weighted Average Price) data
   */
  public async createTWAPData(symbol: string, prices: PriceData[]): Promise<SignedPriceData> {
    if (prices.length === 0) {
      throw new Error('No price data provided for TWAP calculation');
    }

    // Calculate time-weighted average
    let totalWeightedPrice = 0;
    let totalWeight = 0;

    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];
      const weight = i === 0 ? 1 : (price.timestamp - prices[i - 1].timestamp);
      totalWeightedPrice += price.price * weight;
      totalWeight += weight;
    }

    const twapPrice = totalWeightedPrice / totalWeight;

    const twapData: PriceData = {
      symbol,
      price: twapPrice,
      timestamp: Date.now(),
      source: 'backend_signed_TWAP'
    };

    return this.signPriceData(twapData);
  }

  /**
   * Validate price data structure
   */
  private validatePriceData(data: PriceData): void {
    if (!data.symbol || typeof data.symbol !== 'string') {
      throw new Error('Invalid symbol');
    }

    if (typeof data.price !== 'number' || data.price <= 0) {
      throw new Error('Invalid price');
    }

    if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
      throw new Error('Invalid timestamp');
    }

    if (!data.source || typeof data.source !== 'string') {
      throw new Error('Invalid source');
    }

    if (!this.config.allowedSources.includes(data.source)) {
      throw new Error(`Source '${data.source}' not allowed`);
    }
  }

  /**
   * Create a consistent message for signing/verification
   */
  private createPriceMessage(data: PriceData): string {
    return `${data.symbol}:${data.price}:${data.timestamp}:${data.source}`;
  }

  /**
   * Sign a message with the oracle private key
   */
  private signMessage(message: string): string {
    if (!this.config.privateKey || this.config.privateKey.includes('your_oracle_signing_key')) {
      throw new Error('Oracle private key not configured');
    }

    try {
      // Create HMAC signature (more secure than direct signing for this use case)
      const hmac = crypto.createHmac('sha256', this.config.privateKey);
      hmac.update(message);
      return hmac.digest('hex');
    } catch (error) {
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Verify a message signature
   */
  private verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      // For HMAC, we need the private key to verify (not ideal but common for oracle systems)
      // In production, consider using asymmetric cryptography
      const expectedSignature = this.signMessage(message);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if oracle is properly configured
   */
  public isConfigured(): boolean {
    return !!(
      this.config.privateKey && 
      !this.config.privateKey.includes('your_oracle_signing_key') &&
      this.config.publicKey &&
      !this.config.publicKey.includes('your_oracle_public_key')
    );
  }

  /**
   * Generate a nonce for price requests
   */
  public generateNonce(): string {
    return CryptoUtils.generateNonce();
  }

  /**
   * Get oracle configuration status (for debugging)
   */
  public getConfigStatus(): { configured: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!this.config.privateKey || this.config.privateKey.includes('your_oracle_signing_key')) {
      warnings.push('Oracle private key not configured');
    }

    if (!this.config.publicKey || this.config.publicKey.includes('your_oracle_public_key')) {
      warnings.push('Oracle public key not configured');
    }

    if (this.config.privateKey && !/^[a-fA-F0-9]+$/.test(this.config.privateKey)) {
      warnings.push('Oracle private key should be in hex format');
    }

    return {
      configured: this.isConfigured(),
      warnings
    };
  }
}

/**
 * Factory function to get oracle instance
 */
export const getOracleService = (): OracleService => {
  return OracleService.getInstance();
};

/**
 * Utility functions for oracle operations
 */
export class OracleUtils {
  /**
   * Generate secure oracle keys (for initial setup)
   */
  static generateOracleKeys(): { privateKey: string; publicKey: string } {
    const privateKey = CryptoUtils.generateSecureRandom(32);
    // For HMAC-based signing, public key is typically derived or same as private
    // In production, consider using asymmetric keys
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');

    return { privateKey, publicKey };
  }

  /**
   * Validate oracle key format
   */
  static isValidOracleKey(key: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(key);
  }
}
