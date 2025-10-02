/**
 * Check Rise NFT Conversion Eligibility (Serverless)
 * File: apps/web/pages/api/convert/check-eligibility.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
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

    // Look up Rise NFT holdings for this wallet
    const riseHolder = await prisma.riseNFTHolder.findUnique({
      where: { walletAddress },
      include: {
        conversions: {
          where: { status: { in: ['COMPLETED', 'PROCESSING'] } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!riseHolder) {
      return res.json({
        success: true,
        data: {
          isEligible: false,
          riseNFTCount: 0,
          availableConversions: 0,
          message: 'Wallet address not found in Rise NFT holders list'
        }
      });
    }

    if (riseHolder.remainingCount === 0) {
      return res.json({
        success: true,
        data: {
          isEligible: false,
          riseNFTCount: riseHolder.originalCount,
          availableConversions: 0,
          convertedCount: riseHolder.originalCount - riseHolder.remainingCount,
          message: 'All Rise NFTs have already been converted'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isEligible: true,
        riseNFTCount: riseHolder.originalCount,
        availableConversions: riseHolder.remainingCount,
        convertedCount: riseHolder.originalCount - riseHolder.remainingCount,
        lastConversion: riseHolder.conversions[0] || null,
        message: `You can convert ${riseHolder.remainingCount} Rise NFT${riseHolder.remainingCount === 1 ? '' : 's'} to Roll NFT${riseHolder.remainingCount === 1 ? '' : 's'}`
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check conversion eligibility'
    });
  }
}

export default withAuth(handler);

