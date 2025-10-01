/**
 * Price data security utilities for enhanced validation and protection
 * File: apps/api/src/utils/price-security.ts
 */

import { SecureLogger } from './security';

export interface PriceDataValidation {
  isValid: boolean;
  confidence: number; // 0-1 score
  warnings: string[];
  sanitizedPrice: number;
}

export interface TokenSecurityCheck {
  isKnownToken: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
  shouldProcess: boolean;
}

/**
 * Enhanced price data validation and security
 */
export class PriceDataSecurity {
  
  private static readonly MAX_REASONABLE_PRICE = 1000000; // $1M per token
  private static readonly MIN_REASONABLE_PRICE = 0.000001; // $0.000001 per token
  private static readonly KNOWN_STABLE_TOKENS = ['USDT', 'USDC', 'DAI', 'BUSD'];
  
  /**
   * Validate price data for security and reasonableness
   */
  static validatePriceData(symbol: string, price: number, source: string): PriceDataValidation {
    const warnings: string[] = [];
    let confidence = 1.0;
    let isValid = true;
    let sanitizedPrice = price;

    // Check for obviously invalid prices
    if (price < 0) {
      warnings.push('Negative price detected');
      sanitizedPrice = 0;
      confidence = 0;
      isValid = false;
    }

    // Check for suspiciously high prices
    if (price > this.MAX_REASONABLE_PRICE) {
      warnings.push(`Unusually high price: $${price.toLocaleString()}`);
      confidence *= 0.3;
      
      // Cap the price for security
      sanitizedPrice = this.MAX_REASONABLE_PRICE;
      SecureLogger.logSecure('warn', 'Suspicious high price detected', {
        symbol,
        originalPrice: price,
        cappedPrice: sanitizedPrice,
        source
      });
    }

    // Check for suspiciously low prices for known tokens
    if (this.KNOWN_STABLE_TOKENS.includes(symbol.toUpperCase()) && price < 0.8) {
      warnings.push(`Stable token with unusual price: $${price}`);
      confidence *= 0.5;
    }

    // Source reliability scoring
    const sourceConfidence = this.getSourceConfidence(source);
    confidence *= sourceConfidence;

    // Special handling for zero prices
    if (price === 0) {
      warnings.push('No price data available');
      confidence = 0.1; // Low confidence but not necessarily invalid
    }

    return {
      isValid,
      confidence,
      warnings,
      sanitizedPrice
    };
  }

  /**
   * Security check for token processing
   */
  static checkTokenSecurity(denom: string, symbol: string, amount: string): TokenSecurityCheck {
    const warnings: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let shouldProcess = true;

    // Check for known token patterns
    const isKnownToken = this.isKnownTokenPattern(denom, symbol);
    
    // Check for suspicious patterns
    if (denom.includes('test') || denom.includes('fake') || denom.includes('scam')) {
      warnings.push('Token name contains suspicious keywords');
      riskLevel = 'HIGH';
      shouldProcess = false;
    }

    // Check for extremely long token names (potential buffer overflow attempts)
    if (denom.length > 200) {
      warnings.push('Extremely long token denomination');
      riskLevel = 'HIGH';
      shouldProcess = false;
    }

    // Check for unusual characters
    if (!/^[a-zA-Z0-9\-_]+$/.test(symbol)) {
      warnings.push('Token symbol contains unusual characters');
      riskLevel = 'MEDIUM';
    }

    // Check for suspiciously large amounts (potential overflow)
    try {
      const numAmount = parseFloat(amount);
      if (numAmount > Number.MAX_SAFE_INTEGER) {
        warnings.push('Amount exceeds safe integer limits');
        riskLevel = 'HIGH';
        shouldProcess = false;
      }
    } catch (error) {
      warnings.push('Invalid amount format');
      riskLevel = 'HIGH';
      shouldProcess = false;
    }

    if (warnings.length > 0) {
      SecureLogger.logSecure('warn', 'Token security check warnings', {
        denom: denom.substring(0, 50), // Truncate for logging
        symbol,
        warnings,
        riskLevel
      });
    }

    return {
      isKnownToken,
      riskLevel,
      warnings,
      shouldProcess
    };
  }

  /**
   * Get confidence score for price data source
   */
  private static getSourceConfidence(source: string): number {
    const sourceReliability: Record<string, number> = {
      'coingecko': 0.9,
      'coinmarketcap': 0.9,
      'coreum-dex': 0.8,
      'osmosis': 0.8,
      'manual': 0.3,
      'unknown': 0.1
    };

    return sourceReliability[source.toLowerCase()] || 0.1;
  }

  /**
   * Check if token follows known patterns
   */
  private static isKnownTokenPattern(denom: string, symbol: string): boolean {
    // Coreum native token patterns
    if (denom === 'ucore' && symbol === 'CORE') return true;
    
    // Common Coreum token patterns
    if (denom.startsWith('u') && denom.includes('core1')) {
      // Standard Coreum token format: u{symbol}-core1{contract_address}
      return true;
    }

    // IBC tokens
    if (denom.startsWith('ibc/')) return true;

    // Known token mappings
    const knownTokens = ['CAT', 'COZY', 'KONG', 'LP', 'MART', 'XRP'];
    if (knownTokens.includes(symbol.toUpperCase())) return true;

    return false;
  }

  /**
   * Sanitize token data for safe processing
   */
  static sanitizeTokenData(tokenData: any): any {
    return {
      denom: String(tokenData.denom || '').substring(0, 200), // Limit length
      symbol: String(tokenData.symbol || '').substring(0, 20).replace(/[^a-zA-Z0-9\-_]/g, ''),
      amount: String(tokenData.amount || '0').replace(/[^0-9.]/g, ''),
      tokenAmount: String(tokenData.tokenAmount || '0').replace(/[^0-9.]/g, ''),
      price: String(tokenData.price || '$0').substring(0, 20),
      usdValue: String(tokenData.usdValue || '$0.00').substring(0, 20)
    };
  }

  /**
   * Rate limit price requests by IP and token
   */
  static shouldAllowPriceRequest(ip: string, symbol: string): boolean {
    // Simple in-memory rate limiting (in production, use Redis)
    const key = `price_request:${ip}:${symbol}`;
    const now = Date.now();
    
    // Allow 10 requests per minute per IP per token
    // This is a simplified implementation
    return true; // For now, allow all requests
  }
}

/**
 * Price data caching with security considerations
 */
export class SecurePriceCache {
  private static cache = new Map<string, { data: any; timestamp: number; confidence: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MIN_CONFIDENCE_TO_CACHE = 0.7;

  /**
   * Get cached price data if valid and reliable
   */
  static get(symbol: string): any | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    
    // Don't use cache if too old or low confidence
    if (age > this.CACHE_TTL || cached.confidence < this.MIN_CONFIDENCE_TO_CACHE) {
      this.cache.delete(symbol);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache price data with confidence score
   */
  static set(symbol: string, data: any, confidence: number): void {
    // Only cache high-confidence data
    if (confidence >= this.MIN_CONFIDENCE_TO_CACHE) {
      this.cache.set(symbol, {
        data: this.sanitizeForCache(data),
        timestamp: Date.now(),
        confidence
      });
    }

    // Cleanup old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Sanitize data before caching
   */
  private static sanitizeForCache(data: any): any {
    return {
      price: parseFloat(String(data.price || 0)),
      source: String(data.source || 'unknown').substring(0, 50),
      timestamp: Date.now()
    };
  }

  /**
   * Remove old cache entries
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}
