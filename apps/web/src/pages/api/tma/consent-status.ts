/**
 * Get User's TMA Consent Status (Serverless)
 * File: apps/web/pages/api/tma/consent-status.ts
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
    const currentTMA = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentTMA) {
      return res.status(404).json({
        success: false,
        error: 'No active TMA found'
      });
    }

    const consents = await prisma.tMAConsent.findMany({
      where: { 
        userId: req.user!.id,
        version: currentTMA.version
      },
      include: {
        wallet: true
      }
    });

    return res.json({
      success: true,
      data: {
        currentVersion: currentTMA.version,
        hasConsented: consents.length > 0,
        consents: consents.map(consent => ({
          walletAddress: consent.wallet.address,
          timestamp: consent.timestamp,
          signature: consent.signature
        }))
      }
    });
  } catch (error) {
    console.error('Get TMA consent status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get consent status'
    });
  }
}

export default withAuth(handler);

