/**
 * Check if User Has Signed Current PMA (Serverless)
 * File: apps/web/pages/api/pma/status.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { withAuth } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.user!.id;

    const currentPMA = await prisma.pMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentPMA) {
      return res.json({
        success: true,
        data: {
          hasSigned: false,
          requiresSignature: false,
          message: 'No PMA document available'
        }
      });
    }

    const consent = await prisma.pMAConsent.findUnique({
      where: {
        userId_version: {
          userId,
          version: currentPMA.version
        }
      }
    });

    return res.json({
      success: true,
      data: {
        hasSigned: !!consent,
        requiresSignature: !consent,
        pmaVersion: currentPMA.version,
        signedAt: consent?.timestamp
      }
    });
  } catch (error) {
    console.error('Error checking PMA status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check PMA status'
    });
  }
}

export default withAuth(handler);

