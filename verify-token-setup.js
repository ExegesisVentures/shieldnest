/**
 * Verification script to test the token management system
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyTokenSetup() {
  console.log('🔍 Verifying Token Management System Setup...\n');

  try {
    // 1. Check database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful\n');

    // 2. Check if token_metadata table exists
    console.log('2️⃣ Checking token_metadata table...');
    const tokenCount = await prisma.tokenMetadata.count();
    console.log(`✅ Found ${tokenCount} tokens in database\n`);

    // 3. Verify ROLL token specifically
    console.log('3️⃣ Verifying ROLL token data...');
    const rollTokens = await prisma.tokenMetadata.findMany({
      where: { symbol: 'ROLL' }
    });
    
    if (rollTokens.length > 0) {
      console.log(`✅ Found ${rollTokens.length} ROLL token(s):`);
      rollTokens.forEach(token => {
        console.log(`   - ${token.symbol}: ${token.denom}`);
        console.log(`     Image: ${token.imageUrl}`);
        console.log(`     Verified: ${token.verified}`);
      });
    } else {
      console.log('❌ No ROLL tokens found in database');
    }
    console.log('');

    // 4. Check if ROLL image file exists
    console.log('4️⃣ Checking ROLL token image file...');
    const rollImagePath = path.join(__dirname, 'apps/web/public/tokens/roll.svg');
    
    if (fs.existsSync(rollImagePath)) {
      const stats = fs.statSync(rollImagePath);
      console.log(`✅ ROLL image file exists (${stats.size} bytes)`);
    } else {
      console.log('❌ ROLL image file not found at apps/web/public/tokens/roll.svg');
    }
    console.log('');

    // 5. Check all token images
    console.log('5️⃣ Checking token image files...');
    const tokensDir = path.join(__dirname, 'apps/web/public/tokens');
    
    if (fs.existsSync(tokensDir)) {
      const imageFiles = fs.readdirSync(tokensDir).filter(file => 
        file.endsWith('.svg') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp')
      );
      console.log(`✅ Found ${imageFiles.length} token image files:`);
      imageFiles.slice(0, 10).forEach(file => console.log(`   - ${file}`));
      if (imageFiles.length > 10) {
        console.log(`   ... and ${imageFiles.length - 10} more`);
      }
    } else {
      console.log('❌ Tokens directory not found');
    }
    console.log('');

    // 6. Test token metadata query
    console.log('6️⃣ Testing token metadata queries...');
    const coreToken = await prisma.tokenMetadata.findFirst({
      where: { denom: 'ucore' }
    });
    
    if (coreToken) {
      console.log(`✅ CORE token: ${coreToken.symbol} (${coreToken.imageUrl})`);
    } else {
      console.log('❌ CORE token not found');
    }

    const longRollToken = await prisma.tokenMetadata.findFirst({
      where: { denom: { contains: 'xrpl11f82115a5' } }
    });
    
    if (longRollToken) {
      console.log(`✅ Long ROLL token: ${longRollToken.symbol} (${longRollToken.imageUrl})`);
    } else {
      console.log('❌ Long ROLL token denomination not found');
    }
    console.log('');

    // 7. Summary
    console.log('📊 VERIFICATION SUMMARY:');
    console.log(`   Database: ✅ Connected`);
    console.log(`   Tokens: ✅ ${tokenCount} total`);
    console.log(`   ROLL tokens: ${rollTokens.length > 0 ? '✅' : '❌'} ${rollTokens.length} found`);
    console.log(`   Images: ${fs.existsSync(tokensDir) ? '✅' : '❌'} Directory exists`);
    console.log('');

    if (rollTokens.length > 0 && fs.existsSync(rollImagePath)) {
      console.log('🎉 ROLL TOKEN SETUP SUCCESSFUL!');
      console.log('   Your ROLL token should now display correctly across the app.');
    } else {
      console.log('⚠️  Some issues detected - please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTokenSetup();
