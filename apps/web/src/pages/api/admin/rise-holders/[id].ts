/**
 * Update Rise NFT Holder (Serverless)
 * File: apps/web/pages/api/admin/rise-holders/[id].ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../src/lib/api-shared/db';
import { withAuth } from '../../../../src/lib/api-shared/middleware';
import { requireAdmin } from '../../../../src/lib/api-shared/admin-middleware';
import { AuthenticatedRequest } from '../../../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Check admin permission
  if (!requireAdmin(req, res)) {
    return; // Response already sent
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { remainingCount, notes } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid holder ID'
      });
    }

    const existingHolder = await prisma.riseNFTHolder.findUnique({
      where: { id }
    });

    if (!existingHolder) {
      return res.status(404).json({
        success: false,
        error: 'Rise NFT holder not found'
      });
    }

    if (remainingCount !== undefined && (remainingCount < 0 || remainingCount > existingHolder.originalCount)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid remaining count'
      });
    }

    const updatedHolder = await prisma.riseNFTHolder.update({
      where: { id },
      data: {
        remainingCount: remainingCount !== undefined ? remainingCount : undefined,
        notes: notes !== undefined ? notes : undefined
      }
    });

    console.log(`Rise NFT holder updated: ${updatedHolder.walletAddress} by ${req.user!.email}`);

    return res.json({
      success: true,
      data: updatedHolder,
      message: 'Rise NFT holder updated successfully'
    });
  } catch (error) {
    console.error('Update Rise holder error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update Rise NFT holder'
    });
  }
}

export default withAuth(handler);

