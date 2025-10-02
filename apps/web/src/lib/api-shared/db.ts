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
    await prisma.$connect();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma };

