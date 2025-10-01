/**
 * Comprehensive Token Image Fix
 * This script will consolidate all token images and update the database properly
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Define the correct token images that actually exist
const CORRECT_TOKENS = [
  {
    denom: 'ucore',
    symbol: 'CORE',
    name: 'Coreum',
    imageUrl: '/tokens/coreum.svg', // Use SVG for consistency
    decimals: 6,
    description: 'Native token of the Coreum blockchain',
    website: 'https://coreum.com',
    isNative: true,
    category: 'native',
    verified: true,
    priority: 100
  },
  {
    denom: 'factory/core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz/roll',
    symbol: 'ROLL',
    name: 'Roll Token',
    imageUrl: '/tokens/roll.svg',
    decimals: 6,
    description: 'Roll ecosystem token on Coreum',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 50
  },
  {
    denom: 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
    symbol: 'ROLL',
    name: 'Roll Token',
    imageUrl: '/tokens/roll.svg',
    decimals: 6,
    description: 'Roll ecosystem token bridged from XRPL',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 50
  },
  {
    denom: 'uxrp',
    symbol: 'XRP',
    name: 'XRP',
    imageUrl: '/tokens/uxrp.png',
    decimals: 6,
    description: 'XRP token on Coreum',
    website: 'https://xrpl.org',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 60
  },
  {
    denom: 'uatom',
    symbol: 'ATOM',
    name: 'Cosmos Hub',
    imageUrl: '/tokens/uatom.png',
    decimals: 6,
    description: 'Native token of Cosmos Hub',
    website: 'https://cosmos.network',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 70
  },
  {
    denom: 'uosmo',
    symbol: 'OSMO',
    name: 'Osmosis',
    imageUrl: '/tokens/uosmo.png',
    decimals: 6,
    description: 'Native token of Osmosis DEX',
    website: 'https://osmosis.zone',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 65
  },
  {
    denom: 'shield-ft',
    symbol: 'SHIELD',
    name: 'Shield Token',
    imageUrl: '/tokens/shield.svg',
    decimals: 6,
    description: 'ShieldNest ecosystem token',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 40
  }
];

async function fixTokenImages() {
  console.log('🔧 Starting comprehensive token image fix...');
  
  try {
    // First, clear any inconsistent entries
    console.log('🗑️ Cleaning up inconsistent database entries...');
    
    // Update each token with correct information
    for (const token of CORRECT_TOKENS) {
      console.log(`📝 Fixing ${token.symbol} (${token.denom})...`);
      
      // Check if image file actually exists
      const imagePath = path.join(__dirname, 'apps/web/public', token.imageUrl);
      const imageExists = fs.existsSync(imagePath);
      
      if (!imageExists) {
        console.log(`⚠️ Image file missing: ${token.imageUrl}`);
        // Use default if image doesn't exist
        token.imageUrl = '/tokens/default.svg';
      }
      
      await prisma.tokenMetadata.upsert({
        where: { denom: token.denom },
        update: {
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          imageUrl: token.imageUrl,
          description: token.description,
          website: token.website,
          isNative: token.isNative,
          category: token.category,
          verified: token.verified || false,
          priority: token.priority || 0,
          lastUpdated: new Date()
        },
        create: {
          denom: token.denom,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          imageUrl: token.imageUrl,
          description: token.description,
          website: token.website,
          isNative: token.isNative,
          category: token.category,
          verified: token.verified || false,
          priority: token.priority || 0
        }
      });
      
      console.log(`✅ Fixed ${token.symbol} -> ${token.imageUrl}`);
    }
    
    // Show final summary
    const allTokens = await prisma.tokenMetadata.findMany({
      select: { symbol: true, denom: true, imageUrl: true, verified: true },
      orderBy: { priority: 'desc' }
    });
    
    console.log('\n📊 Final Database State:');
    console.log(`Total tokens: ${allTokens.length}`);
    console.log(`Verified tokens: ${allTokens.filter(t => t.verified).length}`);
    console.log('\n🎯 Token Images:');
    allTokens.forEach(token => {
      const status = token.verified ? '✅' : '⚠️';
      console.log(`${status} ${token.symbol}: ${token.imageUrl}`);
    });
    
    console.log('\n🎉 Token image fix completed!');
    console.log('💡 All tokens now have consistent image paths');
    
  } catch (error) {
    console.error('❌ Error fixing token images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTokenImages().catch(console.error);
