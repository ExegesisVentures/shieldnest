/**
 * Get Mint Status (Serverless)
 * File: apps/web/pages/api/mint/status/[claimId].ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { withAuth } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { claimId } = req.query;
    const userId = req.user!.id;

    if (typeof claimId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid claim ID'
      });
    }

    const claim = await prisma.claim.findFirst({
      where: {
        id: claimId,
        userId,
        type: 'PUBLIC'
      }
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    return res.json({
      success: true,
      data: {
        claimId: claim.id,
        status: claim.status,
        tokenId: claim.tokenId,
        txHash: claim.txHash,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        metadata: claim.metadata
      }
    });
  } catch (error) {
    console.error('Get mint status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get mint status'
    });
  }
}

export default withAuth(handler);

