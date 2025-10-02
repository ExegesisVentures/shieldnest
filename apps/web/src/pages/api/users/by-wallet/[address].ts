/**
 * Find User by Wallet Address (Serverless)
 * File: apps/web/pages/api/users/by-wallet/[address].ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const walletAddress = req.query.address;

    if (typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    // Validate address format
    if (!walletAddress.startsWith('core1') || walletAddress.length < 39) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        address_chain: {
          address: walletAddress,
          chain: 'coreum'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      }
    });

    if (!wallet || !wallet.user) {
      return res.status(404).json({
        success: false,
        error: 'No user found for this wallet address'
      });
    }

    return res.json({
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain,
          verifiedAt: wallet.verifiedAt
        },
        user: wallet.user
      }
    });
  } catch (error) {
    console.error('Error finding user by wallet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find user'
    });
  }
}

export default withMiddleware(handler);

