/**
 * Get All TMA Versions (Serverless)
 * File: apps/web/pages/api/tma/versions.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const tmas = await prisma.tMA.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: tmas.map(tma => ({
        version: tma.version,
        hash: tma.hash,
        isActive: tma.isActive,
        createdAt: tma.createdAt
      }))
    });
  } catch (error) {
    console.error('Get TMA versions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get TMA versions'
    });
  }
}

export default withMiddleware(handler);

