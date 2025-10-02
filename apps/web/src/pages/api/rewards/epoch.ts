/**
 * Get Current Epoch Information (Serverless)
 * File: apps/web/pages/api/rewards/epoch.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../../lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Mock data - in real app this would come from blockchain/smart contract
    const currentEpoch = {
      number: 12,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      totalDistribution: '2500.00',
      participatingNFTs: 47,
      rewardsPerNFT: '53.19'
    };

    const timeUntilNext = currentEpoch.endDate.getTime() - Date.now();
    const daysUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60 * 24));
    const hoursUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return res.json({
      success: true,
      data: {
        currentEpoch: currentEpoch.number,
        nextEpochIn: `${daysUntilNext} days, ${hoursUntilNext} hours`,
        weeklyDistribution: currentEpoch.totalDistribution,
        participatingNFTs: currentEpoch.participatingNFTs,
        rewardsPerNFT: currentEpoch.rewardsPerNFT,
        startDate: currentEpoch.startDate,
        endDate: currentEpoch.endDate
      }
    });
  } catch (error) {
    console.error('Get epoch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get epoch information'
    });
  }
}

export default withMiddleware(handler);

