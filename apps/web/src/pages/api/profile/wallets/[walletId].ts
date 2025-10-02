/**
 * Update or Remove Wallet from Profile (Serverless)
 * File: apps/web/pages/api/profile/wallets/[walletId].ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/api-shared/db';
import { withAuth } from '../../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { walletId } = req.query;

  if (typeof walletId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet ID'
    });
  }

  if (req.method === 'PUT') {
    // Update user wallet (label, default status)
    try {
      const { label, isDefault } = req.body;

      // Verify wallet belongs to user
      const userWallet = await prisma.userWallet.findUnique({
        where: { id: walletId }
      });

      if (!userWallet || userWallet.userId !== req.user!.id) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found'
        });
      }

      // If setting as default, remove default from other wallets
      if (isDefault) {
        await prisma.userWallet.updateMany({
          where: {
            userId: req.user!.id,
            chain: userWallet.chain,
            id: { not: walletId }
          },
          data: {
            isDefault: false
          }
        });
      }

      const updatedWallet = await prisma.userWallet.update({
        where: { id: walletId },
        data: {
          label: label !== undefined ? label : undefined,
          isDefault: isDefault !== undefined ? isDefault : undefined
        }
      });

      return res.json({
        success: true,
        data: updatedWallet,
        message: 'Wallet updated successfully'
      });

    } catch (error) {
      console.error('Update user wallet error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update wallet'
      });
    }
  } else if (req.method === 'DELETE') {
    // Remove user wallet
    try {
      // Verify wallet belongs to user
      const userWallet = await prisma.userWallet.findUnique({
        where: { id: walletId }
      });

      if (!userWallet || userWallet.userId !== req.user!.id) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found'
        });
      }

      await prisma.userWallet.delete({
        where: { id: walletId }
      });

      return res.json({
        success: true,
        message: 'Wallet removed from your profile'
      });

    } catch (error) {
      console.error('Remove user wallet error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove wallet'
      });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

export default withAuth(handler);

