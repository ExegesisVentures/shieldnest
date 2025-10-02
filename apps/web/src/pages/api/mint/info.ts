/**
 * Get Mint Information and Stats (Serverless)
 * File: apps/web/pages/api/mint/info.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { config } from '../../../../lib/api-shared/config';
import { withMiddleware } from '../../../../lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get current supply stats
    const totalClaims = await prisma.claim.count({
      where: {
        status: 'COMPLETED',
        type: 'PUBLIC'
      }
    });

    const totalConversions = await prisma.riseConversion.count({
      where: {
        status: 'COMPLETED'
      }
    });

    const totalSupply = totalClaims + totalConversions;
    const maxSupply = config.supply.maxSupply;
    const mintPrice = config.pricing.newRollMintPriceUsd;
    const bookValue = config.pricing.backendBookValueUsd;
    const ogFloorPrice = config.pricing.ogMinListPriceUsd;

    // Get burned count (sellbacks)
    const burnedCount = await prisma.sellback.count({
      where: {
        status: 'CLAIMED'
      }
    });

    // Get current epoch info
    const currentEpoch = await prisma.epoch.findFirst({
      where: {
        finalized: false
      },
      orderBy: {
        number: 'desc'
      }
    });

    // Calculate average weekly rewards (mock data for now)
    const avgWeeklyRewards = 125; // This would be calculated from historical data

    return res.json({
      success: true,
      data: {
        totalSupply,
        maxSupply,
        remaining: maxSupply - totalSupply,
        burned: burnedCount,
        mintPrice,
        bookValue,
        floorPrice: ogFloorPrice,
        scarcityPercentage: ((totalSupply / maxSupply) * 100).toFixed(1),
        currentEpoch: currentEpoch?.number || 0,
        avgWeeklyRewards,
        potentialAnnualROI: ((avgWeeklyRewards * 52 / mintPrice) * 100).toFixed(1),
        holdersCount: totalSupply - burnedCount
      }
    });
  } catch (error) {
    console.error('Get mint info error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get mint information'
    });
  }
}

export default withMiddleware(handler);

