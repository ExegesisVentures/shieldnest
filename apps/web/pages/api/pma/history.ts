/**
 * Get User's PMA Consent History (Serverless)
 * File: apps/web/pages/api/pma/history.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/api-shared/db';
import { withAuth } from '../../../src/lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.user!.id;

    const consents = await prisma.pMAConsent.findMany({
      where: { userId },
      include: {
        pma: {
          select: {
            id: true,
            version: true,
            title: true,
            createdAt: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    console.error('Error fetching PMA history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch PMA history'
    });
  }
}

export default withAuth(handler);

