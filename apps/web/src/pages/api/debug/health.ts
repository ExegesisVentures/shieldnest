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
    let dbError = null;
    try {
      console.log('🗄️ [DEBUG] Testing database connection...');
      const { prisma } = await import('@/lib/api-shared/db');
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      console.log('🗄️ [DEBUG] Database connection test successful');
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown error';
      console.error('🗄️ [ERROR] Database connection test failed:', error);
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        environment: envCheck,
        database: {
          status: dbStatus,
          error: dbError
        },
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
