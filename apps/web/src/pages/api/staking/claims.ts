/**
 * Log Reward Claim (Serverless)
 * File: apps/web/pages/api/staking/claims.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withAuth } from '@/lib/api-shared/middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address, chain = 'coreum', amountCore, txHash, autoCompounded = false } = req.body;
    if (!address || amountCore === undefined) {
      return res.status(400).json({ success: false, error: 'address and amountCore are required' });
    }

    const tracked = await prisma.stakingTrackedWallet.findUnique({
      where: { address_chain: { address, chain } },
      include: { totals: true }
    });

    if (!tracked) {
      return res.status(404).json({ success: false, error: 'Tracked wallet not found' });
    }

    const amount = Number(amountCore);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'amountCore must be a positive number' });
    }

    // Create claim and update totals in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.stakingClaim.create({
        data: {
          trackedWalletId: tracked.id,
          userId: tracked.userId,
          amount,
          txHash,
          autoCompounded,
        }
      });

      const updatedTotals = await tx.stakingWalletTotal.update({
        where: { trackedWalletId: tracked.id },
        data: {
          totalClaimed: {
            increment: amount
          },
          lastClaimAt: new Date(),
        }
      });

      return { claim, totals: updatedTotals };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Create claim error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create claim' });
  }
}

export default withAuth(handler);

