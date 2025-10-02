/**
 * Get/Create Rise NFT Holders (Serverless)
 * File: apps/web/pages/api/admin/rise-holders/index.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withAuth } from '@/lib/api-shared/middleware';
import { requireAdmin } from '@/lib/api-shared/admin-middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Check admin permission
  if (!requireAdmin(req, res)) {
    return; // Response already sent
  }

  if (req.method === 'GET') {
    // Get all Rise NFT holders
    try {
      const holders = await prisma.riseNFTHolder.findMany({
        include: {
          conversions: {
            include: {
              user: {
                select: { email: true, name: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const summary = {
        totalHolders: holders.length,
        totalOriginalNFTs: holders.reduce((sum, h) => sum + h.originalCount, 0),
        totalRemainingNFTs: holders.reduce((sum, h) => sum + h.remainingCount, 0),
        totalConverted: holders.reduce((sum, h) => sum + (h.originalCount - h.remainingCount), 0)
      };

      return res.json({
        success: true,
        data: {
          holders,
          summary
        }
      });
    } catch (error) {
      console.error('Get Rise holders error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get Rise NFT holders'
      });
    }
  } else if (req.method === 'POST') {
    // Add a new Rise NFT holder
    try {
      const { walletAddress, nftCount, notes } = req.body;

      if (!walletAddress || !nftCount || nftCount < 1) {
        return res.status(400).json({
          success: false,
          error: 'Valid wallet address and NFT count (≥1) are required'
        });
      }

      // Check if holder already exists
      const existingHolder = await prisma.riseNFTHolder.findUnique({
        where: { walletAddress }
      });

      if (existingHolder) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address already exists in Rise NFT holders'
        });
      }

      const holder = await prisma.riseNFTHolder.create({
        data: {
          walletAddress,
          originalCount: nftCount,
          remainingCount: nftCount,
          addedBy: req.user!.email!,
          notes: notes || null
        }
      });

      console.log(`Rise NFT holder added: ${walletAddress} with ${nftCount} NFTs by ${req.user!.email}`);

      return res.json({
        success: true,
        data: holder,
        message: 'Rise NFT holder added successfully'
      });
    } catch (error) {
      console.error('Add Rise holder error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add Rise NFT holder'
      });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

export default withAuth(handler);

