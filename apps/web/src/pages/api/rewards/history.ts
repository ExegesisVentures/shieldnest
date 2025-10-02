/**
 * Get User's Rewards History (Serverless)
 * File: apps/web/pages/api/rewards/history.ts
 */

import { NextApiResponse } from 'next';
import { withAuth, requireWallet } from '../../../src/lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check wallet requirement
  if (!requireWallet(req, res)) {
    return; // Response already sent
  }

  try {
    const walletAddress = req.wallet!.address;
    
    // Mock data - in real app this would come from database/blockchain
    const rewardsHistory = [
      {
        epoch: 11,
        amount: '85.30',
        date: new Date('2024-01-15'),
        status: 'claimed',
        transactionHash: '0x1234...5678'
      },
      {
        epoch: 10,
        amount: '92.15',
        date: new Date('2024-01-08'),
        status: 'claimed',
        transactionHash: '0x2345...6789'
      },
      {
        epoch: 9,
        amount: '76.80',
        date: new Date('2024-01-01'),
        status: 'claimed',
        transactionHash: '0x3456...7890'
      },
      {
        epoch: 8,
        amount: '88.40',
        date: new Date('2023-12-25'),
        status: 'claimed',
        transactionHash: '0x4567...8901'
      }
    ];

    return res.json({
      success: true,
      data: {
        walletAddress,
        history: rewardsHistory,
        totalClaimed: rewardsHistory.reduce((sum, reward) => sum + parseFloat(reward.amount), 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get rewards history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rewards history'
    });
  }
}

export default withAuth(handler);

