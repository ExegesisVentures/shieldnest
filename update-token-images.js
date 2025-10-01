/**
 * Simple Token Image Update Script
 * Run this to populate correct token images in the database
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Correct token images - add more as you provide them
const CORRECT_TOKEN_IMAGES = [
  {
    denom: 'ucore',
    symbol: 'CORE',
    name: 'Coreum',
    imageUrl: '/tokens/coreum.svg',
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
  // Add more tokens here as you provide the correct images
];

async function updateTokenImages() {
  console.log('🚀 Starting token image update...');
  
  try {
    for (const token of CORRECT_TOKEN_IMAGES) {
      console.log(`📝 Updating ${token.symbol} (${token.denom})...`);
      
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
      
      console.log(`✅ Updated ${token.symbol}`);
    }
    
    // Show summary
    const totalTokens = await prisma.tokenMetadata.count();
    const verifiedTokens = await prisma.tokenMetadata.count({ where: { verified: true } });
    
    console.log('\n📊 Database Summary:');
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Verified tokens: ${verifiedTokens}`);
    console.log('✅ Token image update completed!');
    
  } catch (error) {
    console.error('❌ Error updating tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateTokenImages().catch(console.error);
