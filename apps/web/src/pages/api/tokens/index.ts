/**
 * Get Token Metadata Endpoint (Serverless)
 * File: apps/web/pages/api/tokens/index.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { withMiddleware } from '../../lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { denom, category } = req.query;

    // Build query filters
    const where: any = {};
    
    if (denom && typeof denom === 'string') {
      where.denom = denom;
    }
    
    if (category && typeof category === 'string') {
      where.category = category;
    }

    // Fetch token metadata
    const tokens = await prisma.tokenMetadata.findMany({
      where,
      orderBy: [
        { verified: 'desc' },
        { priority: 'desc' },
        { symbol: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error('Token metadata fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch token metadata'
    });
  }
}

export default withMiddleware(handler);

