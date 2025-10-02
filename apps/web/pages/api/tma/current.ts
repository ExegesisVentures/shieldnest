/**
 * Get Current Active TMA (Serverless)
 * File: apps/web/pages/api/tma/current.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/api-shared/db';
import { withMiddleware } from '../../../src/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const tma = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!tma) {
      return res.status(404).json({
        success: false,
        error: 'No active TMA found'
      });
    }

    return res.json({
      success: true,
      data: {
        version: tma.version,
        hash: tma.hash,
        body: tma.body,
        createdAt: tma.createdAt
      }
    });
  } catch (error) {
    console.error('Get TMA error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get TMA'
    });
  }
}

export default withMiddleware(handler);

