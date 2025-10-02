/**
 * Get Current Active PMA Document (Serverless)
 * File: apps/web/pages/api/pma/current.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/api-shared/db';
import { withMiddleware } from '../../../src/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const pma = await prisma.pMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!pma) {
      return res.status(404).json({
        success: false,
        error: 'No active PMA document found'
      });
    }

    return res.json({
      success: true,
      data: pma
    });
  } catch (error) {
    console.error('Error fetching PMA:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch PMA document'
    });
  }
}

export default withMiddleware(handler);

