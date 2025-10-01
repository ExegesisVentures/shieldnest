import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticate, requireWallet } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';

const router = Router();

/**
 * Get current epoch information
 */
router.get('/epoch', async (req, res) => {
  try {
    // Mock data - in real app this would come from blockchain/smart contract
    const currentEpoch = {
      number: 12,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      totalDistribution: '2500.00',
      participatingNFTs: 47,
      rewardsPerNFT: '53.19'
    };

    const timeUntilNext = currentEpoch.endDate.getTime() - Date.now();
    const daysUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60 * 24));
    const hoursUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    res.json({
      success: true,
      data: {
        currentEpoch: currentEpoch.number,
        nextEpochIn: `${daysUntilNext} days, ${hoursUntilNext} hours`,
        weeklyDistribution: currentEpoch.totalDistribution,
        participatingNFTs: currentEpoch.participatingNFTs,
        rewardsPerNFT: currentEpoch.rewardsPerNFT,
        startDate: currentEpoch.startDate,
        endDate: currentEpoch.endDate
      }
    });
  } catch (error) {
    console.error('Get epoch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get epoch information'
    });
  }
});

/**
 * Get user's rewards summary
 */
router.get('/summary', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
  try {
    const walletAddress = req.wallet!.address;
    
    // Mock data - in real app this would query blockchain for NFT holdings and rewards
    const userNFTCount = 2; // Would be fetched from smart contract
    const rewardsPerNFT = 53.19;
    
    const rewardsSummary = {
      walletAddress,
      nftCount: userNFTCount,
      claimableRewards: (userNFTCount * rewardsPerNFT * 0.6).toFixed(2), // 60% of pending
      pendingRewards: (userNFTCount * rewardsPerNFT).toFixed(2),
      totalEarned: (userNFTCount * rewardsPerNFT * 12).toFixed(2), // 12 epochs
      lastClaimDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      yourShare: ((userNFTCount / 47) * 100).toFixed(2) + '%'
    };

    res.json({
      success: true,
      data: rewardsSummary
    });
  } catch (error) {
    console.error('Get rewards summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rewards summary'
    });
  }
});

/**
 * Get user's rewards history
 */
router.get('/history', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
  try {
    const walletAddress = req.wallet!.address;
    
    // Mock data - in real app this would come from database/blockchain
    const rewardsHistory = [
      {
        epoch: 11,
        amount: '85.30',
        date: new Date('2024-01-15'),
        status: 'claimed',
        transactionHash: '0x1234...5678'
      },
      {
        epoch: 10,
        amount: '92.15',
        date: new Date('2024-01-08'),
        status: 'claimed',
        transactionHash: '0x2345...6789'
      },
      {
        epoch: 9,
        amount: '76.80',
        date: new Date('2024-01-01'),
        status: 'claimed',
        transactionHash: '0x3456...7890'
      },
      {
        epoch: 8,
        amount: '88.40',
        date: new Date('2023-12-25'),
        status: 'claimed',
        transactionHash: '0x4567...8901'
      }
    ];

    res.json({
      success: true,
      data: {
        walletAddress,
        history: rewardsHistory,
        totalClaimed: rewardsHistory.reduce((sum, reward) => sum + parseFloat(reward.amount), 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get rewards history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rewards history'
    });
  }
});

/**
 * Claim rewards
 */
router.post('/claim', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
  try {
    const walletAddress = req.wallet!.address;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // In real app, this would:
    // 1. Verify user has claimable rewards
    // 2. Interact with smart contract to claim
    // 3. Record transaction in database
    // 4. Return transaction hash

    // Mock response
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
    
    // Log for development
    console.log(`Rewards claim: Wallet ${walletAddress}, Amount ${amount}, TxHash ${mockTxHash}`);

    res.json({
      success: true,
      data: {
        transactionHash: mockTxHash,
        amount,
        walletAddress,
        timestamp: new Date(),
        message: 'Rewards claimed successfully'
      }
    });
  } catch (error) {
    console.error('Claim rewards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim rewards'
    });
  }
});

/**
 * Get global rewards statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Mock data - in real app this would aggregate from database/blockchain
    const globalStats = {
      totalDistributed: '15750.00',
      totalEpochs: 12,
      activeParticipants: 28,
      averageRewardPerEpoch: '1312.50',
      nextDistributionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      rewardPool: {
        current: '2500.00',
        accumulated: '890.50'
      }
    };

    res.json({
      success: true,
      data: globalStats
    });
  } catch (error) {
    console.error('Get rewards stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rewards statistics'
    });
  }
});

export default router;
