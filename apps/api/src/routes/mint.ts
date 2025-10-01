import { Router } from 'express';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { authenticate, requireWallet } from '@/middleware/auth';
import { AuthenticatedRequest, ApiResponse, NFTMetadata } from '@/types';

const router = Router();

/**
 * Get current mint information and stats
 */
router.get('/info', async (req, res) => {
  try {
    // Get current supply stats
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
    const mintPrice = config.pricing.newRollMintPriceUsd;
    const bookValue = config.pricing.backendBookValueUsd;
    const ogFloorPrice = config.pricing.ogMinListPriceUsd;

    // Get burned count (sellbacks)
    const burnedCount = await prisma.sellback.count({
      where: {
        status: 'CLAIMED'
      }
    });

    // Get current epoch info
    const currentEpoch = await prisma.epoch.findFirst({
      where: {
        finalized: false
      },
      orderBy: {
        number: 'desc'
      }
    });

    // Calculate average weekly rewards (mock data for now)
    const avgWeeklyRewards = 125; // This would be calculated from historical data

    res.json({
      success: true,
      data: {
        totalSupply,
        maxSupply,
        remaining: maxSupply - totalSupply,
        burned: burnedCount,
        mintPrice,
        bookValue,
        floorPrice: ogFloorPrice,
        scarcityPercentage: ((totalSupply / maxSupply) * 100).toFixed(1),
        currentEpoch: currentEpoch?.number || 0,
        avgWeeklyRewards,
        potentialAnnualROI: ((avgWeeklyRewards * 52 / mintPrice) * 100).toFixed(1),
        holdersCount: totalSupply - burnedCount
      }
    });
  } catch (error) {
    console.error('Get mint info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mint information'
    });
  }
});

/**
 * Check if user is eligible to mint
 */
router.get('/eligibility', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
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
          eligible: false,
          reason: 'TMA_NOT_SIGNED',
          requiresTMA: true,
          tmaVersion: currentTMA.version
        }
      });
    }

    // Check if user already has a pending mint
    const pendingClaim = await prisma.claim.findFirst({
      where: {
        userId,
        type: 'PUBLIC',
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingClaim) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'PENDING_MINT',
          pendingClaimId: pendingClaim.id
        }
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
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'SUPPLY_EXHAUSTED',
          totalSupply,
          maxSupply
        }
      });
    }

    res.json({
      success: true,
      data: {
        eligible: true,
        mintPrice: config.pricing.newRollMintPriceUsd,
        remainingSupply: maxSupply - totalSupply
      }
    });
  } catch (error) {
    console.error('Check mint eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check mint eligibility'
    });
  }
});

/**
 * Initiate public mint for new users
 */
router.post('/mint', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
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

    // Simulate processing delay
    setTimeout(async () => {
      try {
        await prisma.claim.update({
          where: { id: claim.id },
          data: {
            status: 'COMPLETED',
            tokenId: mockTokenId,
            txHash: mockTxHash,
            metadata: {
              ...claim.metadata as object,
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to initiate mint'
    });
  }
});

/**
 * Get mint status
 */
router.get('/status/:claimId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { claimId } = req.params;
    const userId = req.user!.id;

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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to get mint status'
    });
  }
});

export default router;
