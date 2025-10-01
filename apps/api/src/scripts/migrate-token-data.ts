/**
 * Migration script to populate token metadata database
 * Run this script to migrate existing hardcoded token data to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_TOKEN_DATA = [
  {
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
    priority: 100,
    explorerUrl: 'https://explorer.coreum.com'
  },
  {
    denom: 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
    symbol: 'ROLL',
    name: 'Roll Token',
    decimals: 6,
    imageUrl: '/tokens/roll.svg',
    description: 'Roll ecosystem token on Coreum',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 90,
    explorerUrl: 'https://explorer.coreum.com/coreum/assets/xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz'
  },
  {
    denom: 'roll-ft',
    symbol: 'ROLL',
    name: 'Roll Token',
    decimals: 6,
    imageUrl: '/tokens/roll.svg',
    description: 'Roll ecosystem token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 89
  },
  {
    denom: 'shield-ft',
    symbol: 'SHIELD',
    name: 'Shield Token',
    decimals: 6,
    imageUrl: '/tokens/shield.svg',
    description: 'ShieldNest ecosystem token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 85
  },
  {
    denom: 'cozy-ft',
    symbol: 'COZY',
    name: 'Cozy',
    decimals: 6,
    imageUrl: '/tokens/cozy.svg',
    description: 'Cozy ecosystem token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 50
  },
  {
    denom: 'ucat',
    symbol: 'CAT',
    name: 'Cat',
    decimals: 6,
    imageUrl: '/tokens/cat.svg',
    description: 'Cat themed token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 40
  },
  {
    denom: 'smart-ft',
    symbol: 'SMART',
    name: 'Smart',
    decimals: 6,
    imageUrl: '/tokens/smart.svg',
    description: 'Smart contract token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 40
  },
  {
    denom: 'kong-ft',
    symbol: 'KONG',
    name: 'Kong',
    decimals: 6,
    imageUrl: '/tokens/kong.svg',
    description: 'Kong ecosystem token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 40
  },
  {
    denom: 'solo-ft',
    symbol: 'SOLO',
    name: 'Solo',
    decimals: 6,
    imageUrl: '/tokens/solo.svg',
    description: 'Solo token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 40
  },
  {
    denom: 'uxrp',
    symbol: 'XRP',
    name: 'XRP',
    decimals: 6,
    imageUrl: '/tokens/xrp.svg',
    description: 'XRP token on Coreum',
    website: 'https://xrpl.org',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 60
  },
  {
    denom: 'mart-ft',
    symbol: 'MART',
    name: 'Mart',
    decimals: 6,
    imageUrl: '/tokens/mart.svg',
    description: 'Mart token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 40
  },
  {
    denom: 'lp-ft',
    symbol: 'LP',
    name: 'LP',
    decimals: 6,
    imageUrl: '/tokens/lp.svg',
    description: 'Liquidity Provider token',
    website: '',
    isNative: false,
    category: 'fungible',
    verified: false,
    priority: 30
  }
];

async function migrateTokenData() {
  console.log('🚀 Starting token metadata migration...');
  
  try {
    // Check if migration has already been run
    const existingTokens = await prisma.tokenMetadata.count();
    if (existingTokens > 0) {
      console.log(`ℹ️  Found ${existingTokens} existing tokens in database.`);
      console.log('⚠️  Skipping migration to avoid duplicates. Use --force to override.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const tokenData of INITIAL_TOKEN_DATA) {
      try {
        await prisma.tokenMetadata.create({
          data: tokenData
        });
        console.log(`✅ Created token: ${tokenData.symbol} (${tokenData.denom})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create token ${tokenData.symbol}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration completed:`);
    console.log(`   ✅ Success: ${successCount} tokens`);
    console.log(`   ❌ Errors: ${errorCount} tokens`);
    console.log(`   📁 Total processed: ${INITIAL_TOKEN_DATA.length} tokens`);

    if (errorCount === 0) {
      console.log('\n🎉 All tokens migrated successfully!');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function forceMigrateTokenData() {
  console.log('🔄 Force migrating token metadata (will update existing)...');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const tokenData of INITIAL_TOKEN_DATA) {
      try {
        await prisma.tokenMetadata.upsert({
          where: { denom: tokenData.denom },
          update: tokenData,
          create: tokenData
        });
        console.log(`✅ Upserted token: ${tokenData.symbol} (${tokenData.denom})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to upsert token ${tokenData.symbol}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Force migration completed:`);
    console.log(`   ✅ Success: ${successCount} tokens`);
    console.log(`   ❌ Errors: ${errorCount} tokens`);
    console.log(`   📁 Total processed: ${INITIAL_TOKEN_DATA.length} tokens`);

  } catch (error) {
    console.error('💥 Force migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force');

if (forceMode) {
  forceMigrateTokenData();
} else {
  migrateTokenData();
}
