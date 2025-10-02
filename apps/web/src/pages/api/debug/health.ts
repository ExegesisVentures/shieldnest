/**
 * Debug Health Check Endpoint
 * File: apps/web/src/pages/api/debug/health.ts
 * 
 * Simple health check to verify API infrastructure
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    // Test database connection
    let dbStatus = 'unknown';
    try {
      const { prisma } = await import('@/lib/api-shared/db');
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = 'error';
      console.error('Database connection test failed:', dbError);
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        environment: envCheck,
        database: dbStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      debug: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withMiddleware(handler);
