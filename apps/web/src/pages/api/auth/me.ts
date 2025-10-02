/**
 * Get Current User Endpoint (Serverless)
 * File: apps/web/pages/api/auth/me.ts
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
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        wallets: true,
        tmaConsents: {
          where: { tma: { isActive: true } },
          include: { tma: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          wallets: user.wallets.map(w => ({
            id: w.id,
            address: w.address,
            chain: w.chain,
            verifiedAt: w.verifiedAt
          })),
          hasActiveTMA: user.tmaConsents.length > 0,
          tmaConsents: user.tmaConsents.map(consent => ({
            version: consent.version,
            timestamp: consent.timestamp
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
}

export default withAuth(handler);

