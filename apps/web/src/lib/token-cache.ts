/**
 * Token Metadata Caching Service
 * Provides efficient caching for token metadata with browser storage
 */

import { TokenMetadata } from './token-registry';

const CACHE_KEY = 'shieldnest_token_cache';
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours
const MAX_CACHE_SIZE = 100; // Maximum number of tokens to cache

interface CachedToken {
  metadata: TokenMetadata;
  timestamp: number;
  hits: number; // Track usage for LRU eviction
}

interface TokenCache {
  [denom: string]: CachedToken;
}

/**
 * Token metadata cache manager
 */
export class TokenCacheManager {
  private cache: TokenCache = {};
  private initialized = false;

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        this.cleanExpiredEntries();
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to load token cache from localStorage:', error);
      this.cache = {};
      this.initialized = true;
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    if (typeof window === 'undefined' || !this.initialized) return;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save token cache to localStorage:', error);
    }
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    for (const [denom, cached] of Object.entries(this.cache)) {
      if (now - cached.timestamp > expiry) {
        delete this.cache[denom];
      }
    }
  }

  /**
   * Ensure cache doesn't exceed max size using LRU eviction
   */
  private enforceMaxSize(): void {
    const entries = Object.entries(this.cache);
    if (entries.length <= MAX_CACHE_SIZE) return;

    // Sort by hits (ascending) and timestamp (ascending) for LRU
    entries.sort((a, b) => {
      if (a[1].hits !== b[1].hits) {
        return a[1].hits - b[1].hits;
      }
      return a[1].timestamp - b[1].timestamp;
    });

    // Remove oldest/least used entries
    const toRemove = entries.length - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      delete this.cache[entries[i][0]];
    }
  }

  /**
   * Get token metadata from cache
   */
  get(denom: string): TokenMetadata | null {
    const cached = this.cache[denom];
    if (!cached) return null;

    const now = Date.now();
    const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    // Check if expired
    if (now - cached.timestamp > expiry) {
      delete this.cache[denom];
      this.saveCacheToStorage();
      return null;
    }

    // Update hit count and timestamp
    cached.hits++;
    cached.timestamp = now;
    this.saveCacheToStorage();

    return cached.metadata;
  }

  /**
   * Store token metadata in cache
   */
  set(denom: string, metadata: TokenMetadata): void {
    this.cache[denom] = {
      metadata,
      timestamp: Date.now(),
      hits: 1
    };

    this.enforceMaxSize();
    this.saveCacheToStorage();
  }

  /**
   * Check if token is cached and not expired
   */
  has(denom: string): boolean {
    return this.get(denom) !== null;
  }

  /**
   * Clear all cached tokens
   */
  clear(): void {
    this.cache = {};
    this.saveCacheToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): { 
    size: number; 
    maxSize: number; 
    expiry: string;
    topTokens: Array<{ denom: string; symbol: string; hits: number }>;
  } {
    const entries = Object.entries(this.cache);
    const topTokens = entries
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, 10)
      .map(([denom, cached]) => ({
        denom,
        symbol: cached.metadata.symbol,
        hits: cached.hits
      }));

    return {
      size: entries.length,
      maxSize: MAX_CACHE_SIZE,
      expiry: `${CACHE_EXPIRY_HOURS} hours`,
      topTokens
    };
  }

  /**
   * Preload frequently used tokens
   */
  async preloadCommonTokens(): Promise<void> {
    // Only preload in browser environment
    if (typeof window === 'undefined') return;
    
    const commonDenoms = [
      'ucore',
      'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
      'roll-ft',
      'shield-ft'
    ];

    try {
      const response = await fetch('/api/tokens');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          for (const token of result.data) {
            if (commonDenoms.includes(token.denom)) {
              this.set(token.denom, token);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to preload common tokens:', error);
    }
  }
}

// Create singleton instance
export const tokenCache = new TokenCacheManager();

/**
 * Enhanced token metadata fetcher with caching
 */
export async function getCachedTokenMetadata(denom: string): Promise<TokenMetadata> {
  // Try cache first
  const cached = tokenCache.get(denom);
  if (cached) {
    return cached;
  }

  // Only try API calls in browser environment
  if (typeof window !== 'undefined') {
    try {
      // Fetch from API (use full URL to backend)
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:3001/api/tokens/${encodeURIComponent(denom)}`
        : `/api/tokens/${encodeURIComponent(denom)}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log(`✅ Fetched ${result.data.symbol} from database with image:`, result.data.imageUrl);
          // Cache the result
          tokenCache.set(denom, result.data);
          return result.data;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch token metadata from API:', error);
    }
  }

  // Fallback to synchronous registry lookup
  const { getTokenMetadata } = await import('./token-registry');
  const fallback = getTokenMetadata(denom);
  
  // Cache the fallback too (with lower priority) - only in browser
  if (typeof window !== 'undefined') {
    tokenCache.set(denom, fallback);
  }
  
  return fallback;
}

/**
 * Batch fetch multiple token metadata with caching
 */
export async function getCachedTokenMetadataBatch(denoms: string[]): Promise<TokenMetadata[]> {
  const results: TokenMetadata[] = [];
  const uncachedDenoms: string[] = [];

  // Check cache for each token
  for (const denom of denoms) {
    const cached = tokenCache.get(denom);
    if (cached) {
      results.push(cached);
    } else {
      uncachedDenoms.push(denom);
    }
  }

  // Fetch uncached tokens from API
  if (uncachedDenoms.length > 0) {
    const promises = uncachedDenoms.map(denom => getCachedTokenMetadata(denom));
    const uncachedResults = await Promise.all(promises);
    results.push(...uncachedResults);
  }

  return results;
}

/**
 * Initialize token cache with preloading
 */
export async function initializeTokenCache(): Promise<void> {
  await tokenCache.preloadCommonTokens();
}
