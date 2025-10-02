/**
 * Get Admin Statistics (Serverless)
 * File: apps/web/pages/api/admin/stats.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withAuth } from '@/lib/api-shared/middleware';
import { requireAdmin } from '@/lib/api-shared/admin-middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Check admin permission
  if (!requireAdmin(req, res)) {
    return; // Response already sent
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get comprehensive stats
    const [
      totalUsers,
      totalWallets,
      totalClaims,
      completedClaims,
      totalConversions,
      completedConversions,
      activeTMAs,
      activePMAs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.wallet.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: 'COMPLETED' } }),
      prisma.riseConversion.count(),
      prisma.riseConversion.count({ where: { status: 'COMPLETED' } }),
      prisma.tMA.count({ where: { isActive: true } }),
      prisma.pMA.count({ where: { isActive: true } })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        withWallets: await prisma.user.count({
          where: {
            wallets: {
              some: {}
            }
          }
        })
      },
      wallets: {
        total: totalWallets,
        verified: await prisma.wallet.count({
          where: {
            verifiedAt: {
              not: null
            }
          }
        })
      },
      nfts: {
        totalClaims,
        completedClaims,
        totalConversions,
        completedConversions,
        totalSupply: completedClaims + completedConversions
      },
      legal: {
        activeTMAs,
        activePMAs,
        tmaConsents: await prisma.tMAConsent.count(),
        pmaConsents: await prisma.pMAConsent.count()
      }
    };

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
}

export default withAuth(handler);

