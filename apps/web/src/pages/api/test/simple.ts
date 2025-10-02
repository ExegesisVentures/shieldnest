/**
 * Simple Test Endpoint
 * File: apps/web/src/pages/api/test/simple.ts
 * 
 * Basic test to verify API infrastructure is working
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    res.json({
      success: true,
      message: 'API infrastructure is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
