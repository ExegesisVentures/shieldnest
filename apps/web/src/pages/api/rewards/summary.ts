/**
 * Get User's Rewards Summary (Serverless)
 * File: apps/web/pages/api/rewards/summary.ts
 */

import { NextApiResponse } from 'next';
import { withAuth, requireWallet } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

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
    
    // Mock data - in real app this would query blockchain for NFT holdings and rewards
    const userNFTCount = 2; // Would be fetched from smart contract
    const rewardsPerNFT = 53.19;
    
    const rewardsSummary = {
      walletAddress,
      nftCount: userNFTCount,
      claimableRewards: (userNFTCount * rewardsPerNFT * 0.6).toFixed(2), // 60% of pending
      pendingRewards: (userNFTCount * rewardsPerNFT).toFixed(2),
      totalEarned: (userNFTCount * rewardsPerNFT * 12).toFixed(2), // 12 epochs
      lastClaimDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      yourShare: ((userNFTCount / 47) * 100).toFixed(2) + '%'
    };

    return res.json({
      success: true,
      data: rewardsSummary
    });
  } catch (error) {
    console.error('Get rewards summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get rewards summary'
    });
  }
}

export default withAuth(handler);

