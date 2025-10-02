/**
 * Database Connection Test Endpoint
 * File: apps/web/src/pages/api/test-db-connection.ts
 * 
 * Tests Prisma database connection and shows connection details
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Show what DATABASE_URL looks like (without password)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    const connectionInfo = {
      user: urlParts?.[1] || 'unknown',
      host: urlParts?.[3] || 'unknown',
      port: urlParts?.[4] || 'unknown',
      database: urlParts?.[5]?.split('?')[0] || 'unknown',
      params: urlParts?.[5]?.split('?')[1] || 'none',
      passwordSet: !!urlParts?.[2],
      fullUrlSet: !!process.env.DATABASE_URL
    };

    console.log('🔍 Connection Info:', connectionInfo);

    // Try to connect
    const prisma = new PrismaClient({
      log: ['error', 'warn', 'info', 'query'],
    });

    await prisma.$connect();
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Database connection successful!',
      connectionInfo,
      testQuery: result
    });
  } catch (error: any) {
    console.error('❌ Database connection error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta,
      connectionInfo: {
        dbUrlSet: !!process.env.DATABASE_URL,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
      }
    });
  }
}

