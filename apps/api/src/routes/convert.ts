import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticate, requireWallet } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';

const router = Router();

/**
 * Check Rise NFT eligibility for connected wallet
 */
router.get('/check-eligibility', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to check conversion eligibility'
    });
  }
});

/**
 * Initiate Rise to Roll NFT conversion
 */
router.post('/convert', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
  try {
    const walletAddress = req.wallet!.address;
    const userId = req.user!.id;
    const walletId = req.wallet!.id;

    // Check if user has available Rise NFTs
    const riseHolder = await prisma.riseNFTHolder.findUnique({
      where: { walletAddress }
    });

    if (!riseHolder) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address not found in Rise NFT holders list'
      });
    }

    if (riseHolder.remainingCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No Rise NFTs available for conversion'
      });
    }

    // Check if there's already a pending conversion for this wallet
    const pendingConversion = await prisma.riseConversion.findFirst({
      where: {
        walletAddress,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingConversion) {
      return res.status(400).json({
        success: false,
        error: 'There is already a pending conversion for this wallet'
      });
    }

    // Create conversion record and decrement remaining count in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create conversion record
      const conversion = await tx.riseConversion.create({
        data: {
          riseHolderId: riseHolder.id,
          walletAddress,
          userId,
          walletId,
          status: 'PENDING'
        }
      });

      // Decrement remaining count
      const updatedHolder = await tx.riseNFTHolder.update({
        where: { id: riseHolder.id },
        data: {
          remainingCount: riseHolder.remainingCount - 1
        }
      });

      return { conversion, updatedHolder };
    });

    // In a real implementation, this would:
    // 1. Interact with the smart contract to mint the Roll NFT
    // 2. Update the conversion with the transaction hash and token ID
    // 3. Update status to COMPLETED or FAILED based on the result

    // For now, simulate the process
    const mockTokenId = `roll_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;

    // Update conversion with mock data (in real app, this would happen after smart contract interaction)
    const completedConversion = await prisma.riseConversion.update({
      where: { id: result.conversion.id },
      data: {
        rollTokenId: mockTokenId,
        txHash: mockTxHash,
        status: 'COMPLETED'
      }
    });

    console.log(`Rise NFT conversion: ${walletAddress} converted 1 Rise NFT to Roll NFT ${mockTokenId}`);

    res.json({
      success: true,
      data: {
        conversion: completedConversion,
        remainingConversions: result.updatedHolder.remainingCount,
        rollTokenId: mockTokenId,
        txHash: mockTxHash,
        message: 'Rise NFT successfully converted to Roll NFT!'
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert Rise NFT'
    });
  }
});

/**
 * Get conversion history for connected wallet
 */
router.get('/history', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
  try {
    const walletAddress = req.wallet!.address;

    const conversions = await prisma.riseConversion.findMany({
      where: { walletAddress },
      include: {
        riseHolder: {
          select: {
            originalCount: true,
            remainingCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const riseHolder = await prisma.riseNFTHolder.findUnique({
      where: { walletAddress },
      select: {
        originalCount: true,
        remainingCount: true
      }
    });

    res.json({
      success: true,
      data: {
        conversions,
        summary: riseHolder ? {
          originalRiseNFTs: riseHolder.originalCount,
          remainingRiseNFTs: riseHolder.remainingCount,
          convertedCount: riseHolder.originalCount - riseHolder.remainingCount,
          totalConversions: conversions.length
        } : null
      }
    });
  } catch (error) {
    console.error('Get conversion history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversion history'
    });
  }
});

/**
 * Get conversion statistics (public)
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalRiseHolders,
      totalOriginalRiseNFTs,
      totalRemainingRiseNFTs,
      totalConversions,
      completedConversions
    ] = await Promise.all([
      prisma.riseNFTHolder.count(),
      prisma.riseNFTHolder.aggregate({
        _sum: { originalCount: true }
      }),
      prisma.riseNFTHolder.aggregate({
        _sum: { remainingCount: true }
      }),
      prisma.riseConversion.count(),
      prisma.riseConversion.count({
        where: { status: 'COMPLETED' }
      })
    ]);

    const conversionRate = totalOriginalRiseNFTs._sum.originalCount 
      ? ((totalOriginalRiseNFTs._sum.originalCount - (totalRemainingRiseNFTs._sum.remainingCount || 0)) / totalOriginalRiseNFTs._sum.originalCount * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalRiseHolders,
        totalOriginalRiseNFTs: totalOriginalRiseNFTs._sum.originalCount || 0,
        totalRemainingRiseNFTs: totalRemainingRiseNFTs._sum.remainingCount || 0,
        totalConversions,
        completedConversions,
        conversionRate: Math.round(conversionRate * 100) / 100 // Round to 2 decimal places
      }
    });
  } catch (error) {
    console.error('Get conversion stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversion statistics'
    });
  }
});

export default router;
