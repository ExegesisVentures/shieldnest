/**
 * Remove Wallet from User Profile (Serverless)
 * File: apps/web/pages/api/users/wallets/[walletId].ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withAuth } from '@/lib/api-shared/middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const walletId = req.query.walletId;

    if (typeof walletId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID'
      });
    }

    // Verify the wallet belongs to the user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: req.user!.id
      }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found or does not belong to you'
      });
    }

    await prisma.wallet.delete({
      where: { id: walletId }
    });

    return res.json({
      success: true,
      message: 'Wallet removed successfully'
    });
  } catch (error) {
    console.error('Error removing wallet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove wallet'
    });
  }
}

export default withAuth(handler);

