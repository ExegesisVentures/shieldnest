/**
 * Check Mint Eligibility (Serverless)
 * File: apps/web/pages/api/mint/eligibility.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withAuth, requireWallet } from '@/lib/api-shared/middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check wallet requirement
  if (!requireWallet(req, res)) {
    return; // Response already sent
  }

  try {
    const userId = req.user!.id;
    const walletAddress = req.wallet!.address;

    // Check if user has signed current TMA
    const currentTMA = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentTMA) {
      return res.status(400).json({
        success: false,
        error: 'No active Terms & Membership Agreement found'
      });
    }

    const tmaConsent = await prisma.tMAConsent.findFirst({
      where: {
        userId,
        version: currentTMA.version
      }
    });

    if (!tmaConsent) {
      return res.json({
        success: true,
        data: {
          isEligible: false,
          reason: 'TMA_NOT_SIGNED',
          message: 'You must sign the Terms & Membership Agreement before minting',
          requiresTMA: true,
          tmaVersion: currentTMA.version
        }
      });
    }

    // Check if user already has a pending claim
    const pendingClaim = await prisma.claim.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingClaim) {
      return res.json({
        success: true,
        data: {
          isEligible: false,
          reason: 'PENDING_CLAIM',
          message: 'You have a pending mint claim. Please wait for it to complete.',
          pendingClaimId: pendingClaim.id
        }
      });
    }

    // User is eligible to mint
    return res.json({
      success: true,
      data: {
        isEligible: true,
        message: 'You are eligible to mint a Roll NFT',
        walletAddress
      }
    });
  } catch (error) {
    console.error('Check mint eligibility error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check mint eligibility'
    });
  }
}

export default withAuth(handler);

