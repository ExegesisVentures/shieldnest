/**
 * Track Wallet for Staking Rewards (Serverless)
 * File: apps/web/pages/api/staking/track-wallet.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, address, chain = 'coreum', startDate, investedUsd } = req.body;

    if (!userId || !address || !startDate) {
      return res.status(400).json({ success: false, error: 'userId, address, startDate are required' });
    }

    // Upsert tracked wallet
    const tracked = await prisma.stakingTrackedWallet.upsert({
      where: { address_chain: { address, chain } },
      update: {
        userId,
        startDate: new Date(startDate),
        investedUsd: investedUsd !== undefined ? investedUsd : undefined,
      },
      create: {
        userId,
        address,
        chain,
        startDate: new Date(startDate),
        investedUsd,
      }
    });

    // Ensure totals row exists
    await prisma.stakingWalletTotal.upsert({
      where: { trackedWalletId: tracked.id },
      update: {},
      create: { trackedWalletId: tracked.id }
    });

    return res.json({ success: true, data: tracked });
  } catch (error) {
    console.error('Track wallet error:', error);
    return res.status(500).json({ success: false, error: 'Failed to track wallet' });
  }
}

export default withAuth(handler);

