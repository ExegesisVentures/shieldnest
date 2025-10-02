/**
 * Link Wallet Address to User Profile (Serverless)
 * File: apps/web/pages/api/users/wallets.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { withAuth } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { walletAddress, chain = 'coreum' } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid wallet address is required'
      });
    }

    // Validate Coreum address format
    if (chain === 'coreum' && (!walletAddress.startsWith('core1') || walletAddress.length < 39)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Check if wallet is already linked to another user
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        address_chain: {
          address: walletAddress,
          chain: chain
        }
      }
    });

    if (existingWallet && existingWallet.userId !== req.user!.id) {
      return res.status(409).json({
        success: false,
        error: 'Wallet address already linked to another account'
      });
    }

    // Create or update wallet link
    const wallet = await prisma.wallet.upsert({
      where: {
        address_chain: {
          address: walletAddress,
          chain: chain
        }
      },
      update: {
        userId: req.user!.id,
        verifiedAt: new Date() // Auto-verify for now
      },
      create: {
        userId: req.user!.id,
        address: walletAddress,
        chain: chain,
        verifiedAt: new Date() // Auto-verify for now
      }
    });

    return res.json({
      success: true,
      data: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        verifiedAt: wallet.verifiedAt,
        createdAt: wallet.createdAt
      }
    });
  } catch (error) {
    console.error('Error linking wallet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to link wallet'
    });
  }
}

export default withAuth(handler);

