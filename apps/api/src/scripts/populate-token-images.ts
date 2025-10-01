/**
 * Token Image Population Script
 * 
 * This script allows you to easily populate the token database with correct images
 * from reliable sources like Coreum DEX, explorer, or manual uploads.
 */

import { PrismaClient } from '@prisma/client';
import { upsertTokenMetadata, cacheTokenImage, type TokenMetadata } from '../services/token-metadata.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface TokenImageData {
  denom: string;
  symbol: string;
  name: string;
  imageUrl: string;
  decimals?: number;
  description?: string;
  website?: string;
  verified?: boolean;
  priority?: number;
}

/**
 * Coreum Token Image Registry
 * Add correct token images here - these will be stored in Supabase
 */
const COREUM_TOKEN_IMAGES: TokenImageData[] = [
  // Native CORE token
  {
    denom: 'ucore',
    symbol: 'CORE',
    name: 'Coreum',
    imageUrl: 'https://raw.githubusercontent.com/CoreumFoundation/token-registry/main/mainnet/coreum/images/core.svg',
    decimals: 6,
    description: 'Native token of the Coreum blockchain',
    website: 'https://coreum.com',
    verified: true,
    priority: 100
  },
  
  // Add more tokens here as you provide them
  // Example format:
  // {
  //   denom: 'factory/core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz/roll',
  //   symbol: 'ROLL',
  //   name: 'Roll Token',
  //   imageUrl: 'https://correct-image-url-here.svg',
  //   decimals: 6,
  //   description: 'Roll ecosystem token',
  //   verified: true,
  //   priority: 50
  // },
];

/**
 * Fetch token images from Coreum explorer/DEX API
 */
async function fetchFromCoreumAPI(): Promise<TokenImageData[]> {
  const tokens: TokenImageData[] = [];
  
  try {
    // Try Coreum REST API for token metadata
    const response = await axios.get('https://rest.mainnet-1.coreum.dev:1317/coreum/asset/ft/v1/tokens', {
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.data?.tokens) {
      for (const token of response.data.tokens) {
        if (token.denom && token.symbol) {
          tokens.push({
            denom: token.denom,
            symbol: token.symbol,
            name: token.name || token.symbol,
            imageUrl: token.uri || token.image || `/tokens/${token.symbol.toLowerCase()}.svg`,
            decimals: token.precision || 6,
            description: token.description || `${token.symbol} token on Coreum`,
            website: token.website,
            verified: false,
            priority: token.denom === 'ucore' ? 100 : 10
          });
        }
      }
    }
    
    console.log(`✅ Fetched ${tokens.length} tokens from Coreum API`);
  } catch (error: any) {
    console.warn('⚠️ Could not fetch from Coreum API:', error.message);
  }
  
  return tokens;
}

/**
 * Download and cache external image
 */
async function downloadAndCacheImage(imageUrl: string, symbol: string): Promise<string> {
  try {
    console.log(`📥 Downloading image for ${symbol}: ${imageUrl}`);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'ShieldNest-TokenImageCache/1.0'
      }
    });
    
    const imageBuffer = Buffer.from(response.data);
    
    // Determine file extension
    const contentType = response.headers['content-type'];
    let extension = '.svg';
    if (contentType?.includes('png')) extension = '.png';
    else if (contentType?.includes('jpg') || contentType?.includes('jpeg')) extension = '.jpg';
    else if (contentType?.includes('webp')) extension = '.webp';
    
    // Save to public tokens directory
    const fileName = `${symbol.toLowerCase()}${extension}`;
    const publicDir = path.join(process.cwd(), '../../web/public/tokens');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);
    
    console.log(`✅ Cached image: /tokens/${fileName}`);
    return `/tokens/${fileName}`;
    
  } catch (error: any) {
    console.error(`❌ Failed to download image for ${symbol}:`, error.message);
    return `/tokens/default.svg`;
  }
}

/**
 * Populate token metadata in database
 */
async function populateTokenMetadata(tokenData: TokenImageData[]): Promise<void> {
  console.log(`🚀 Populating ${tokenData.length} tokens in database...`);
  
  for (const token of tokenData) {
    try {
      // Download and cache the image if it's external
      let imageUrl = token.imageUrl;
      if (imageUrl.startsWith('http')) {
        imageUrl = await downloadAndCacheImage(imageUrl, token.symbol);
      }
      
      const metadata: TokenMetadata = {
        denom: token.denom,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals || 6,
        imageUrl,
        description: token.description,
        website: token.website,
        isNative: token.denom === 'ucore',
        category: token.denom === 'ucore' ? 'native' : 'fungible',
        verified: token.verified || false,
        priority: token.priority || 0
      };
      
      await upsertTokenMetadata(metadata);
      console.log(`✅ Updated: ${token.symbol} (${token.denom})`);
      
    } catch (error: any) {
      console.error(`❌ Failed to update ${token.symbol}:`, error.message);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎯 Starting token image population...');
    
    // 1. Start with hardcoded registry (your provided images)
    let allTokens = [...COREUM_TOKEN_IMAGES];
    
    // 2. Try to fetch additional tokens from Coreum API
    const apiTokens = await fetchFromCoreumAPI();
    
    // 3. Merge tokens (hardcoded takes priority)
    for (const apiToken of apiTokens) {
      const exists = allTokens.find(t => t.denom === apiToken.denom);
      if (!exists) {
        allTokens.push(apiToken);
      }
    }
    
    // 4. Populate database
    await populateTokenMetadata(allTokens);
    
    console.log(`🎉 Token population completed! Updated ${allTokens.length} tokens.`);
    
    // 5. Show summary
    const dbTokens = await prisma.tokenMetadata.findMany({
      select: { symbol: true, denom: true, imageUrl: true, verified: true }
    });
    
    console.log('\n📊 Database Summary:');
    console.log(`Total tokens: ${dbTokens.length}`);
    console.log(`Verified tokens: ${dbTokens.filter(t => t.verified).length}`);
    console.log(`Tokens with images: ${dbTokens.filter(t => t.imageUrl && !t.imageUrl.includes('default')).length}`);
    
  } catch (error) {
    console.error('❌ Population failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Add a single token (utility function)
 */
export async function addSingleToken(tokenData: TokenImageData): Promise<void> {
  await populateTokenMetadata([tokenData]);
}

/**
 * Bulk add tokens from array
 */
export async function addBulkTokens(tokens: TokenImageData[]): Promise<void> {
  await populateTokenMetadata(tokens);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { TokenImageData, main as populateTokenImages };
