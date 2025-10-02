/**
 * Claim Rewards (Serverless)
 * File: apps/web/pages/api/rewards/claim.ts
 */

import { NextApiResponse } from 'next';
import { withAuth, requireWallet } from '@/lib/api-shared/middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check wallet requirement
  if (!requireWallet(req, res)) {
    return; // Response already sent
  }

  try {
    const walletAddress = req.wallet!.address;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // In real implementation, this would:
    // 1. Verify the amount is claimable
    // 2. Initiate blockchain transaction
    // 3. Update database records
    // 4. Return transaction hash

    // Mock successful claim
    const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    return res.json({
      success: true,
      data: {
        amount,
        transactionHash: mockTransactionHash,
        walletAddress,
        claimedAt: new Date(),
        message: 'Rewards claim transaction submitted successfully'
      }
    });
  } catch (error) {
    console.error('Claim rewards error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to claim rewards'
    });
  }
}

export default withAuth(handler);

