/**
 * Health Check Endpoint (Serverless)
 * File: apps/web/pages/api/health.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { config } from '@/lib/api-shared/config';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return res.json({
      success: true,
      message: 'Roll NFT Dashboard API is healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      version: '1.0.0',
      deployment: 'serverless'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      success: false,
      error: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}

export default withMiddleware(handler);

