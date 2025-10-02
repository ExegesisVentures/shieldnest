/**
 * Initiate Public Mint for New Users (Serverless)
 * File: apps/web/pages/api/mint/mint.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { config } from '../../../../lib/api-shared/config';
import { withAuth, requireWallet } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check wallet requirement
  if (!requireWallet(req, res)) {
    return; // Response already sent
  }

  try {
    const userId = req.user!.id;
    const walletId = req.wallet!.id;
    const walletAddress = req.wallet!.address;

    // Verify TMA consent
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
      return res.status(400).json({
        success: false,
        error: 'Terms & Membership Agreement must be signed before minting'
      });
    }

    // Check for existing pending claims
    const pendingClaim = await prisma.claim.findFirst({
      where: {
        userId,
        type: 'PUBLIC',
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingClaim) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending mint request'
      });
    }

    // Check supply limit
    const totalClaims = await prisma.claim.count({
      where: {
        status: 'COMPLETED',
        type: 'PUBLIC'
      }
    });

    const totalConversions = await prisma.riseConversion.count({
      where: {
        status: 'COMPLETED'
      }
    });

    const totalSupply = totalClaims + totalConversions;
    const maxSupply = config.supply.maxSupply;

    if (totalSupply >= maxSupply) {
      return res.status(400).json({
        success: false,
        error: 'Maximum supply reached. No more NFTs available for minting.'
      });
    }

    // Create mint claim
    const mintPrice = config.pricing.newRollMintPriceUsd;
    
    const claim = await prisma.claim.create({
      data: {
        userId,
        walletId,
        type: 'PUBLIC',
        status: 'PENDING',
        metadata: {
          mintPrice,
          walletAddress,
          timestamp: Date.now()
        }
      }
    });

    // In a real implementation, this would:
    // 1. Process payment (check for sufficient funds)
    // 2. Interact with smart contract to mint NFT
    // 3. Update claim with transaction hash and token ID
    // 4. Update status based on blockchain confirmation

    // For now, simulate the minting process
    const mockTokenId = `roll_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    // Simulate processing delay (in production, this would be handled by a background job)
    setTimeout(async () => {
      try {
        await prisma.claim.update({
          where: { id: claim.id },
          data: {
            status: 'COMPLETED',
            tokenId: mockTokenId,
            txHash: mockTxHash,
            metadata: {
              ...(claim.metadata as object),
              tokenId: mockTokenId,
              txHash: mockTxHash,
              completedAt: Date.now()
            }
          }
        });
        console.log(`Mock mint completed for claim ${claim.id}`);
      } catch (error) {
        console.error('Mock mint completion error:', error);
        await prisma.claim.update({
          where: { id: claim.id },
          data: { status: 'FAILED' }
        });
      }
    }, 3000);

    return res.json({
      success: true,
      message: 'Mint initiated successfully',
      data: {
        claimId: claim.id,
        status: 'PENDING',
        mintPrice,
        estimatedCompletion: '2-3 minutes'
      }
    });
  } catch (error) {
    console.error('Mint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate mint'
    });
  }
}

export default withAuth(handler);

