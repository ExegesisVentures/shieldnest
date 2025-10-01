/**
 * Token Metadata Service
 * Handles dynamic token metadata with database storage and caching
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const prisma = new PrismaClient();

export interface TokenMetadata {
  denom: string;
  symbol: string;
  name: string;
  decimals: number;
  imageUrl?: string;
  description?: string;
  website?: string;
  isNative: boolean;
  category: string;
  verified?: boolean;
  priority?: number;
  explorerUrl?: string;
}

/**
 * Get token metadata with database-first approach
 */
export async function getTokenMetadata(denom: string): Promise<TokenMetadata> {
  try {
    // First, try to get from database
    const dbToken = await prisma.tokenMetadata.findUnique({
      where: { denom }
    });

    if (dbToken) {
      return {
        denom: dbToken.denom,
        symbol: dbToken.symbol,
        name: dbToken.name,
        decimals: dbToken.decimals,
        imageUrl: dbToken.imageUrl || '/tokens/default.svg',
        description: dbToken.description || undefined,
        website: dbToken.website || undefined,
        isNative: dbToken.isNative,
        category: dbToken.category,
        verified: dbToken.verified,
        priority: dbToken.priority,
        explorerUrl: dbToken.explorerUrl || undefined
      };
    }

    // If not in database, fall back to hardcoded registry and then create DB entry
    const fallbackMetadata = getFallbackTokenMetadata(denom);
    
    // Store in database for future use
    await prisma.tokenMetadata.create({
      data: {
        denom: fallbackMetadata.denom,
        symbol: fallbackMetadata.symbol,
        name: fallbackMetadata.name,
        decimals: fallbackMetadata.decimals,
        imageUrl: fallbackMetadata.imageUrl,
        description: fallbackMetadata.description,
        website: fallbackMetadata.website,
        isNative: fallbackMetadata.isNative,
        category: fallbackMetadata.category,
        verified: false, // New tokens start as unverified
        priority: 0
      }
    }).catch((e) => {
      // Ignore duplicate key errors (race conditions)
      if (!e.code || e.code !== 'P2002') {
        console.error('Error creating token metadata:', e);
      }
    });

    return fallbackMetadata;
    
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return getFallbackTokenMetadata(denom);
  }
}

/**
 * Create or update token metadata
 */
export async function upsertTokenMetadata(metadata: TokenMetadata): Promise<void> {
  await prisma.tokenMetadata.upsert({
    where: { denom: metadata.denom },
    update: {
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: metadata.decimals,
      imageUrl: metadata.imageUrl,
      description: metadata.description,
      website: metadata.website,
      isNative: metadata.isNative,
      category: metadata.category,
      verified: metadata.verified || false,
      priority: metadata.priority || 0,
      explorerUrl: metadata.explorerUrl,
      lastUpdated: new Date()
    },
    create: {
      denom: metadata.denom,
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: metadata.decimals,
      imageUrl: metadata.imageUrl,
      description: metadata.description,
      website: metadata.website,
      isNative: metadata.isNative,
      category: metadata.category,
      verified: metadata.verified || false,
      priority: metadata.priority || 0,
      explorerUrl: metadata.explorerUrl
    }
  });
}

/**
 * Cache token image from external URL
 */
export async function cacheTokenImage(imageUrl: string, symbol: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    
    // Determine file extension from content type
    const contentType = response.headers['content-type'];
    let extension = '.svg';
    if (contentType?.includes('png')) extension = '.png';
    else if (contentType?.includes('jpg') || contentType?.includes('jpeg')) extension = '.jpg';
    else if (contentType?.includes('webp')) extension = '.webp';
    
    // Save to public tokens directory
    const fileName = `${symbol.toLowerCase()}${extension}`;
    const filePath = path.join(process.cwd(), '../../web/public/tokens', fileName);
    
    fs.writeFileSync(filePath, imageBuffer);
    
    return `/tokens/${fileName}`;
  } catch (error) {
    console.error('Error caching token image:', error);
    return '/tokens/default.svg';
  }
}

/**
 * Get all verified tokens for display
 */
export async function getVerifiedTokens(): Promise<TokenMetadata[]> {
  const tokens = await prisma.tokenMetadata.findMany({
    where: { verified: true },
    orderBy: [
      { priority: 'desc' },
      { symbol: 'asc' }
    ]
  });

  return tokens.map(token => ({
    denom: token.denom,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    imageUrl: token.imageUrl || '/tokens/default.svg',
    description: token.description || undefined,
    website: token.website || undefined,
    isNative: token.isNative,
    category: token.category,
    verified: token.verified,
    priority: token.priority,
    explorerUrl: token.explorerUrl || undefined
  }));
}

/**
 * Fallback token metadata (hardcoded registry)
 */
function getFallbackTokenMetadata(denom: string): TokenMetadata {
  // Hardcoded registry for known tokens
  const knownTokens: Record<string, TokenMetadata> = {
    'ucore': {
      denom: 'ucore',
      symbol: 'CORE',
      name: 'Coreum',
      decimals: 6,
      imageUrl: '/tokens/coreum.svg',
      description: 'Native token of the Coreum blockchain',
      website: 'https://coreum.com',
      isNative: true,
      category: 'native',
      verified: true,
      priority: 100
    },
    'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz': {
      denom: 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
      symbol: 'ROLL',
      name: 'Roll Token',
      decimals: 6,
      imageUrl: '/tokens/roll.svg',
      description: 'Roll ecosystem token on Coreum',
      isNative: false,
      category: 'fungible',
      verified: true,
      priority: 90,
      explorerUrl: 'https://explorer.coreum.com/coreum/assets/xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz'
    },
    'roll-ft': {
      denom: 'roll-ft',
      symbol: 'ROLL',
      name: 'Roll Token',
      decimals: 6,
      imageUrl: '/tokens/roll.svg',
      description: 'Roll ecosystem token',
      isNative: false,
      category: 'fungible',
      verified: true,
      priority: 89
    }
  };

  // Check if we have exact match
  const exactMatch = knownTokens[denom];
  if (exactMatch) return exactMatch;

  // Parse factory tokens
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    const subdenom = parts[parts.length - 1];
    
    return parseFactoryToken(denom, subdenom);
  }

  // Parse IBC tokens
  if (denom.startsWith('ibc/')) {
    const hash = denom.slice(4);
    const shortHash = hash.slice(0, 8).toUpperCase();
    
    return {
      denom,
      symbol: `IBC-${shortHash}`,
      name: `IBC Token ${shortHash}`,
      decimals: 6,
      imageUrl: '/tokens/ibc.svg',
      description: 'Inter-Blockchain Communication token',
      isNative: false,
      category: 'other'
    };
  }

  // Generic fallback
  return {
    denom,
    symbol: denom.toUpperCase().slice(0, 8),
    name: `Token ${denom.slice(0, 10)}`,
    decimals: 6,
    imageUrl: '/tokens/default.svg',
    description: 'Unknown token',
    isNative: false,
    category: 'other'
  };
}

/**
 * Parse factory token metadata
 */
function parseFactoryToken(denom: string, subdenom: string): TokenMetadata {
  let cleanSymbol = subdenom;
  
  // Clean up the subdenom
  cleanSymbol = cleanSymbol.replace(/core$/i, '');
  cleanSymbol = cleanSymbol.replace(/1g?$/i, '');
  cleanSymbol = cleanSymbol.replace(/ft$/i, '');
  cleanSymbol = cleanSymbol.replace(/\d+$/g, '');

  let imageUrl = '/tokens/default.svg';
  
  // Match known token patterns
  if (cleanSymbol.toLowerCase().includes('cozy')) {
    cleanSymbol = 'COZY';
    imageUrl = '/tokens/cozy.svg';
  } else if (cleanSymbol.toLowerCase().includes('kong')) {
    cleanSymbol = 'KONG';
    imageUrl = '/tokens/kong.svg';
  } else if (cleanSymbol.toLowerCase().includes('cat')) {
    cleanSymbol = 'CAT';
    imageUrl = '/tokens/cat.svg';
  } else if (cleanSymbol.toLowerCase().includes('roll') || denom.includes('xrpl11f82115a5')) {
    cleanSymbol = 'ROLL';
    imageUrl = '/tokens/roll.svg';
  } else if (cleanSymbol.toLowerCase().includes('shield')) {
    cleanSymbol = 'SHIELD';
    imageUrl = '/tokens/shield.svg';
  } else {
    cleanSymbol = cleanSymbol.toUpperCase().slice(0, 8);
  }

  return {
    denom,
    symbol: cleanSymbol || 'TOKEN',
    name: cleanSymbol || 'Token',
    decimals: 6,
    imageUrl,
    description: `Token: ${cleanSymbol}`,
    isNative: false,
    category: 'fungible'
  };
}
