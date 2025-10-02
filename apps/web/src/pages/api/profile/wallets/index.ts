/**
 * Add Wallet Address to Profile (Serverless)
 * File: apps/web/pages/api/profile/wallets/index.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/api-shared/db';
import { withAuth } from '../../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address, chain = 'coreum', label, isDefault = false } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid wallet address is required'
      });
    }

    // Validate Coreum address format (basic validation)
    if (chain === 'coreum' && !address.startsWith('core1')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Check if wallet already exists for this user
    const existingWallet = await prisma.userWallet.findUnique({
      where: {
        userId_address_chain: {
          userId: req.user!.id,
          address,
          chain
        }
      }
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address already added to your profile'
      });
    }

    // If this is set as default, remove default from other wallets
    if (isDefault) {
      await prisma.userWallet.updateMany({
        where: {
          userId: req.user!.id,
          chain
        },
        data: {
          isDefault: false
        }
      });
    }

    const userWallet = await prisma.userWallet.create({
      data: {
        userId: req.user!.id,
        address,
        chain,
        label: label || null,
        isDefault
      }
    });

    return res.json({
      success: true,
      data: userWallet,
      message: 'Wallet address added to your profile'
    });

  } catch (error) {
    console.error('Add user wallet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add wallet address'
    });
  }
}

export default withAuth(handler);

