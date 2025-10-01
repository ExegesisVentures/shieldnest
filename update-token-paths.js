/**
 * Update Token Paths Script
 * Updates all database entries to use the new token path (../../tokens/)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTokenPaths() {
  console.log('🔄 Updating token paths in database...');
  
  try {
    // Get all tokens with old paths
    const tokens = await prisma.tokenMetadata.findMany({
      where: {
        imageUrl: {
          startsWith: '/tokens/'
        }
      }
    });

    console.log(`📊 Found ${tokens.length} tokens with old paths`);

    // Update each token
    for (const token of tokens) {
      const oldPath = token.imageUrl;
      const newPath = oldPath.replace('/tokens/', '../../tokens/');
      
      await prisma.tokenMetadata.update({
        where: { id: token.id },
        data: { imageUrl: newPath }
      });
      
      console.log(`✅ Updated ${token.symbol}: ${oldPath} → ${newPath}`);
    }

    console.log('🎉 All token paths updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating token paths:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTokenPaths();
