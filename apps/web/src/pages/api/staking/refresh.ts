/**
 * Refresh Current Claimable Amounts (Serverless)
 * File: apps/web/pages/api/staking/refresh.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { config } from '../../lib/api-shared/config';
import { withAuth } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

// Utils
function convertMicroToCore(microAmount: string): number {
  const amount = parseFloat(microAmount || '0') / 1_000_000;
  return Number.isFinite(amount) ? amount : 0;
}

async function fetchCurrentClaimableCore(address: string): Promise<number> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch rewards: ${response.statusText}`);
  }
  const data = await response.json();
  const total = data?.total?.find((t: any) => t.denom === 'ucore');
  return convertMicroToCore(total?.amount || '0');
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address, chain = 'coreum' } = req.body || {};

    const targets = address
      ? await prisma.stakingTrackedWallet.findMany({ where: { address, chain }, include: { totals: true } })
      : await prisma.stakingTrackedWallet.findMany({ include: { totals: true } });

    const results: any[] = [];
    for (const t of targets) {
      try {
        const currentClaimable = await fetchCurrentClaimableCore(t.address);
        const updated = await prisma.stakingWalletTotal.update({
          where: { trackedWalletId: t.id },
          data: {
            currentClaimable,
            lastClaimableUpdate: new Date()
          }
        });
        results.push({ address: t.address, currentClaimable: updated.currentClaimable });
      } catch (inner) {
        console.warn('Refresh claimable failed for', t.address, inner);
        results.push({ address: t.address, error: true });
      }
    }

    return res.json({ success: true, data: { count: results.length, results } });
  } catch (error) {
    console.error('Refresh totals error:', error);
    return res.status(500).json({ success: false, error: 'Failed to refresh totals' });
  }
}

export default withAuth(handler);

