/**
 * Get Admin List of Tracked Members (Serverless)
 * File: apps/web/pages/api/staking/members.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const tracked = await prisma.stakingTrackedWallet.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, firstName: true, lastName: true } },
        totals: true,
      }
    });

    const rows = tracked.map((t) => {
      const totalClaimed = Number(t.totals?.totalClaimed || 0);
      const currentClaimable = Number(t.totals?.currentClaimable || 0);
      const adminTake = totalClaimed * 0.2; // fixed 20%
      return {
        trackedWalletId: t.id,
        user: t.user,
        address: t.address,
        chain: t.chain,
        startDate: t.startDate,
        investedUsd: t.investedUsd,
        totals: {
          totalClaimed,
          currentClaimable,
          lastClaimAt: t.totals?.lastClaimAt || null,
          lastClaimableUpdate: t.totals?.lastClaimableUpdate || null,
        },
        adminTake,
      };
    });

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('List members error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list members' });
  }
}

export default withAuth(handler);

