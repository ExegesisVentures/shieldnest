import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Serverless-optimized Prisma client with connection pooling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Use global variable to prevent multiple instances in serverless
const prisma = globalThis.__prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful connection handling for serverless
export const connectDB = async () => {
  try {
    console.log('🗄️ [DEBUG] Attempting database connection...');
    console.log('🗄️ [DEBUG] Database URL present:', !!process.env.DATABASE_URL);
    console.log('🗄️ [DEBUG] Database URL preview:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'none');
    
    await prisma.$connect();
    console.log('🗄️ [DEBUG] Database connected successfully');
  } catch (error) {
    console.error('🗄️ [ERROR] Database connection error:', error);
    console.error('🗄️ [ERROR] Connection error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    throw error;
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma };

