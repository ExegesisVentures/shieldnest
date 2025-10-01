/**
 * Universal Token Discovery Service
 * Automatically discovers, caches, and manages token metadata from multiple sources
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { upsertTokenMetadata, cacheTokenImage, type TokenMetadata } from './token-metadata.js';

const prisma = new PrismaClient();

interface CoreumAssetResponse {
  assets?: Array<{
    denom: string;
    symbol?: string;
    name?: string;
    decimals?: number;
    description?: string;
    image?: string;
    website?: string;
  }>;
}

interface CoingeckoTokenInfo {
  id: string;
  symbol: string;
  name: string;
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
  description?: {
    en?: string;
  };
  links?: {
    homepage?: string[];
  };
}

/**
 * Universal Token Discovery and Management Service
 */
export class TokenDiscoveryService {
  private static instance: TokenDiscoveryService;
  private isProcessing = false;
  private lastDiscoveryRun: Date | null = null;
  private readonly DISCOVERY_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

  static getInstance(): TokenDiscoveryService {
    if (!TokenDiscoveryService.instance) {
      TokenDiscoveryService.instance = new TokenDiscoveryService();
    }
    return TokenDiscoveryService.instance;
  }

  /**
   * Main discovery function - handles all tokens consistently
   */
  async discoverAndCacheTokens(options: {
    force?: boolean;
    specificDenoms?: string[];
    includeImages?: boolean;
  } = {}): Promise<{ discovered: number; cached: number; errors: string[] }> {
    
    if (this.isProcessing && !options.force) {
      throw new Error('Token discovery already in progress');
    }

    // Check if we need to run discovery
    if (!options.force && this.lastDiscoveryRun) {
      const timeSinceLastRun = Date.now() - this.lastDiscoveryRun.getTime();
      if (timeSinceLastRun < this.DISCOVERY_INTERVAL) {
        console.log('⏰ Token discovery skipped - ran recently');
        return { discovered: 0, cached: 0, errors: [] };
      }
    }

    this.isProcessing = true;
    let discovered = 0;
    let cached = 0;
    const errors: string[] = [];

    try {
      console.log('🔍 Starting universal token discovery...');

      // 1. Discover from Coreum API
      try {
        const coreumResults = await this.discoverFromCoreum(options.specificDenoms);
        discovered += coreumResults.discovered;
        cached += coreumResults.cached;
        errors.push(...coreumResults.errors);
      } catch (error) {
        console.error('Error discovering from Coreum:', error);
        errors.push(`Coreum discovery failed: ${error.message}`);
      }

      // 2. Discover from user transactions (unknown tokens)
      try {
        const unknownTokens = await this.findUnknownTokensFromTransactions();
        for (const denom of unknownTokens) {
          try {
            await this.processUnknownToken(denom, options.includeImages);
            discovered++;
          } catch (error) {
            errors.push(`Failed to process unknown token ${denom}: ${error.message}`);
          }
        }
      } catch (error) {
        console.error('Error discovering unknown tokens:', error);
        errors.push(`Unknown token discovery failed: ${error.message}`);
      }

      // 3. Cache images for tokens without images
      if (options.includeImages) {
        try {
          const imageCacheResults = await this.cacheExternalImages();
          cached += imageCacheResults.cached;
          errors.push(...imageCacheResults.errors);
        } catch (error) {
          console.error('Error caching external images:', error);
          errors.push(`Image caching failed: ${error.message}`);
        }
      }

      this.lastDiscoveryRun = new Date();
      console.log(`✅ Token discovery completed: ${discovered} discovered, ${cached} cached`);

      return { discovered, cached, errors };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Discover tokens from Coreum explorer/API
   */
  private async discoverFromCoreum(specificDenoms?: string[]): Promise<{ discovered: number; cached: number; errors: string[] }> {
    console.log('🔍 Discovering tokens from Coreum...');
    
    let discovered = 0;
    const cached = 0;
    const errors: string[] = [];

    try {
      // Try Coreum explorer API endpoints
      let response = null;
      
      // Try multiple Coreum API endpoints
      const coreumEndpoints = [
        'https://rest.mainnet-1.coreum.dev:1317/coreum/asset/ft/v1/tokens',
        'https://full-node.mainnet-1.coreum.dev:1317/coreum/asset/ft/v1/tokens',
        'https://api.coreum.dev/v1/tokens',
        'https://explorer-api.coreum.com/api/v1/tokens'
      ];
      
      for (const endpoint of coreumEndpoints) {
        try {
          console.log(`🔍 Trying Coreum endpoint: ${endpoint}`);
          response = await axios.get(endpoint, {
            timeout: 15000,
            headers: { 
              'User-Agent': 'ShieldNest-TokenDiscovery/1.0',
              'Accept': 'application/json'
            }
          });
          if (response?.data) {
            console.log(`✅ Successfully connected to: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Failed to connect to: ${endpoint}`);
          continue;
        }
      }

      if (response?.data?.assets) {
        for (const asset of response.data.assets) {
          if (specificDenoms && !specificDenoms.includes(asset.denom)) {
            continue;
          }

          try {
            const metadata: TokenMetadata = {
              denom: asset.denom,
              symbol: asset.symbol || this.extractSymbolFromDenom(asset.denom),
              name: asset.name || asset.symbol || this.extractSymbolFromDenom(asset.denom),
              decimals: asset.decimals || 6,
              imageUrl: asset.image ? await this.cacheExternalImage(asset.image, asset.symbol) : '/tokens/default.svg',
              description: asset.description || `Token: ${asset.symbol}`,
              website: asset.website,
              isNative: asset.denom === 'ucore',
              category: asset.denom === 'ucore' ? 'native' : 'fungible',
              verified: false, // New discoveries start as unverified
              priority: asset.denom === 'ucore' ? 100 : 0
            };

            await upsertTokenMetadata(metadata);
            discovered++;
            console.log(`✅ Discovered from Coreum: ${metadata.symbol} (${metadata.denom})`);
          } catch (error) {
            errors.push(`Failed to process Coreum asset ${asset.denom}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.warn('Coreum API not available, using fallback methods');
      
      // Fallback: Process known patterns
      const knownPatterns = [
        'ucore',
        'uxrp',
        'factory/**/roll*',
        'factory/**/shield*',
        'factory/**/cozy*'
      ];

      // This would be expanded with actual pattern matching logic
      console.log('📝 Using pattern-based discovery fallback');
    }

    return { discovered, cached, errors };
  }

  /**
   * Find unknown tokens from user transactions or balances
   */
  private async findUnknownTokensFromTransactions(): Promise<string[]> {
    // This would query your database for token denoms that aren't in token_metadata
    // For now, return empty array - you can expand this based on your transaction/balance data
    return [];
  }

  /**
   * Process an unknown token denomination
   */
  private async processUnknownToken(denom: string, includeImages = true): Promise<void> {
    console.log(`🔍 Processing unknown token: ${denom}`);

    const symbol = this.extractSymbolFromDenom(denom);
    let imageUrl = '/tokens/default.svg';

    // Try to find a suitable image
    if (includeImages) {
      imageUrl = await this.findTokenImage(symbol, denom);
    }

    const metadata: TokenMetadata = {
      denom,
      symbol,
      name: symbol,
      decimals: 6, // Default for Coreum
      imageUrl,
      description: `Auto-discovered token: ${symbol}`,
      isNative: denom === 'ucore',
      category: this.categorizeToken(denom),
      verified: false,
      priority: 0
    };

    await upsertTokenMetadata(metadata);
    console.log(`✅ Processed unknown token: ${symbol} (${denom})`);
  }

  /**
   * Cache external images for tokens that don't have local images
   */
  private async cacheExternalImages(): Promise<{ cached: number; errors: string[] }> {
    console.log('🖼️ Caching external token images...');
    
    let cached = 0;
    const errors: string[] = [];

    // Get tokens that might need image caching
    const tokensNeedingImages = await prisma.tokenMetadata.findMany({
      where: {
        OR: [
          { imageUrl: '/tokens/default.svg' },
          { imageUrl: null },
          { imageUrl: { startsWith: 'http' } } // External URLs to cache locally
        ]
      }
    });

    for (const token of tokensNeedingImages) {
      try {
        let newImageUrl = token.imageUrl;

        // Try to find a better image
        if (!token.imageUrl || token.imageUrl === '/tokens/default.svg') {
          newImageUrl = await this.findTokenImage(token.symbol, token.denom);
        }

        // Cache external URLs locally
        if (newImageUrl && newImageUrl.startsWith('http')) {
          newImageUrl = await cacheTokenImage(newImageUrl, token.symbol);
        }

        if (newImageUrl !== token.imageUrl) {
          await prisma.tokenMetadata.update({
            where: { id: token.id },
            data: { imageUrl: newImageUrl }
          });
          cached++;
          console.log(`🖼️ Cached image for ${token.symbol}: ${newImageUrl}`);
        }
      } catch (error) {
        errors.push(`Failed to cache image for ${token.symbol}: ${error.message}`);
      }
    }

    return { cached, errors };
  }

  /**
   * Find or generate an appropriate image for a token
   */
  private async findTokenImage(symbol: string, denom: string): Promise<string> {
    // 1. Check if we have a local image file
    const localImageChecks = [
      `/tokens/${symbol.toLowerCase()}.svg`,
      `/tokens/${symbol.toLowerCase()}.png`,
      `/tokens/${this.extractBaseName(denom)}.svg`
    ];

    // For now, return the first local check - in a real implementation,
    // you'd check if the file exists on the filesystem
    
    // 2. Try external sources (coingecko, etc.)
    try {
      const coingeckoImage = await this.findCoingeckoImage(symbol);
      if (coingeckoImage) {
        return coingeckoImage;
      }
    } catch (error) {
      console.warn(`Failed to find Coingecko image for ${symbol}:`, error);
    }

    // 3. Generate a default based on symbol
    return this.generateDefaultImage(symbol);
  }

  /**
   * Find token image from Coingecko API
   */
  private async findCoingeckoImage(symbol: string): Promise<string | null> {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/search?query=${symbol}`, {
        timeout: 5000
      });

      const coins = response.data?.coins;
      if (coins && coins.length > 0) {
        const coin = coins.find((c: any) => c.symbol.toLowerCase() === symbol.toLowerCase()) || coins[0];
        if (coin?.large) {
          return coin.large;
        }
      }
    } catch (error) {
      console.warn(`Coingecko lookup failed for ${symbol}:`, error);
    }
    return null;
  }

  /**
   * Cache an external image locally
   */
  private async cacheExternalImage(imageUrl: string, symbol: string): Promise<string> {
    try {
      return await cacheTokenImage(imageUrl, symbol);
    } catch (error) {
      console.warn(`Failed to cache external image for ${symbol}:`, error);
      return '/tokens/default.svg';
    }
  }

  /**
   * Extract symbol from denomination
   */
  private extractSymbolFromDenom(denom: string): string {
    // Handle different denom formats
    if (denom === 'ucore') return 'CORE';
    if (denom === 'uxrp') return 'XRP';
    
    if (denom.startsWith('factory/')) {
      const parts = denom.split('/');
      const subdenom = parts[parts.length - 1];
      
      // Clean up subdenom
      let symbol = subdenom.replace(/[-_]?ft$/i, ''); // Remove 'ft' suffix
      symbol = symbol.replace(/\d+$/g, ''); // Remove trailing numbers
      symbol = symbol.replace(/core$/i, ''); // Remove 'core' suffix
      
      return symbol.toUpperCase().slice(0, 8);
    }
    
    if (denom.startsWith('ibc/')) {
      const hash = denom.slice(4);
      return `IBC-${hash.slice(0, 6).toUpperCase()}`;
    }
    
    // For other formats, try to extract meaningful name
    return denom.toUpperCase().slice(0, 8);
  }

  /**
   * Extract base name from denom for image lookup
   */
  private extractBaseName(denom: string): string {
    if (denom.startsWith('factory/')) {
      const parts = denom.split('/');
      return parts[parts.length - 1].replace(/[-_]?ft$/i, '');
    }
    return denom;
  }

  /**
   * Categorize token based on denom
   */
  private categorizeToken(denom: string): string {
    if (denom === 'ucore') return 'native';
    if (denom.startsWith('ibc/')) return 'other';
    if (denom.includes('lp') || denom.includes('liquidity')) return 'other';
    return 'fungible';
  }

  /**
   * Generate a default image URL based on symbol
   */
  private generateDefaultImage(symbol: string): string {
    // For now, return default - could generate SVG with symbol text
    return '/tokens/default.svg';
  }

  /**
   * Schedule automatic token discovery
   */
  startAutoDiscovery(): void {
    console.log('⏰ Starting automatic token discovery scheduler...');
    
    setInterval(async () => {
      try {
        await this.discoverAndCacheTokens({ includeImages: true });
      } catch (error) {
        console.error('Scheduled token discovery failed:', error);
      }
    }, this.DISCOVERY_INTERVAL);
  }
}

// Export singleton instance
export const tokenDiscovery = TokenDiscoveryService.getInstance();
