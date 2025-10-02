/**
 * Create User Profile with Email for Manual Address (Serverless)
 * File: apps/web/pages/api/users/create-profile.ts
 * Note: No authentication required - public endpoint for profile creation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withMiddleware } from '../../../../lib/api-shared/middleware';
import { SecureTokenManager } from '../../../../lib/api-shared/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, name, walletAddress, chain = 'coreum' } = req.body;

    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

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

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email already in use'
      });
    }

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        address_chain: {
          address: walletAddress,
          chain: chain
        }
      }
    });

    if (existingWallet) {
      return res.status(409).json({
        success: false,
        error: 'Wallet address already linked to an account'
      });
    }

    // Create user and wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name
        }
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          address: walletAddress,
          chain: chain,
          verifiedAt: new Date()
        }
      });

      return { user, wallet };
    });

    // Generate JWT token for automatic login
    const token = SecureTokenManager.generateJWT({
      userId: result.user.id,
      walletId: result.wallet.id,
      purpose: 'email-auth'
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          createdAt: result.user.createdAt
        },
        wallet: {
          id: result.wallet.id,
          address: result.wallet.address,
          chain: result.wallet.chain,
          verifiedAt: result.wallet.verifiedAt
        },
        token: token
      }
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user profile'
    });
  }
}

export default withMiddleware(handler);

