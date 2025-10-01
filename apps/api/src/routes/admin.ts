import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticate } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// Simple admin check - in production, this should be more robust
const requireAdmin = (req: AuthenticatedRequest, res: any, next: any) => {
  // For now, check if user email contains "admin" or specific admin emails
  // In production, you'd have proper admin role management
  const adminEmails = [
    'admin@roll-nft.com',
    'mj@roll-nft.com', // Add your admin email
    // Add more admin emails as needed
  ];

  // Also check admin wallet addresses
  const adminWallets = [
    'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj', // Your specified admin wallet
  ];
  
  const userEmail = req.user?.email;
  const userWallets = req.user?.wallets?.map(w => w.address) || [];
  
  const isAdminEmail = userEmail && adminEmails.includes(userEmail);
  const isAdminWallet = userWallets.some(address => adminWallets.includes(address));
  
  if (!isAdminEmail && !isAdminWallet) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};

/**
 * Get all Rise NFT holders
 */
router.get('/rise-holders', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
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

    res.json({
      success: true,
      data: {
        holders,
        summary
      }
    });
  } catch (error) {
    console.error('Get Rise holders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Rise NFT holders'
    });
  }
});

/**
 * Add a new Rise NFT holder
 */
router.post('/rise-holders', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
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

    res.json({
      success: true,
      data: holder,
      message: 'Rise NFT holder added successfully'
    });
  } catch (error) {
    console.error('Add Rise holder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add Rise NFT holder'
    });
  }
});

/**
 * Update a Rise NFT holder
 */
router.put('/rise-holders/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { remainingCount, notes } = req.body;

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
        error: 'Remaining count must be between 0 and original count'
      });
    }

    const holder = await prisma.riseNFTHolder.update({
      where: { id },
      data: {
        ...(remainingCount !== undefined && { remainingCount }),
        ...(notes !== undefined && { notes }),
      }
    });

    console.log(`Rise NFT holder updated: ${holder.walletAddress} by ${req.user!.email}`);

    res.json({
      success: true,
      data: holder,
      message: 'Rise NFT holder updated successfully'
    });
  } catch (error) {
    console.error('Update Rise holder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Rise NFT holder'
    });
  }
});

/**
 * Delete a Rise NFT holder
 */
router.delete('/rise-holders/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const existingHolder = await prisma.riseNFTHolder.findUnique({
      where: { id },
      include: { conversions: true }
    });

    if (!existingHolder) {
      return res.status(404).json({
        success: false,
        error: 'Rise NFT holder not found'
      });
    }

    if (existingHolder.conversions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete holder with existing conversions. Set remaining count to 0 instead.'
      });
    }

    await prisma.riseNFTHolder.delete({
      where: { id }
    });

    console.log(`Rise NFT holder deleted: ${existingHolder.walletAddress} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Rise NFT holder deleted successfully'
    });
  } catch (error) {
    console.error('Delete Rise holder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Rise NFT holder'
    });
  }
});

/**
 * Bulk import Rise NFT holders
 */
router.post('/rise-holders/bulk-import', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { holders } = req.body;

    if (!Array.isArray(holders) || holders.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Holders array is required'
      });
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const holder of holders) {
      try {
        const { walletAddress, nftCount, notes } = holder;

        if (!walletAddress || !nftCount || nftCount < 1) {
          results.errors.push(`Invalid data for ${walletAddress || 'unknown address'}`);
          continue;
        }

        // Check if already exists
        const existing = await prisma.riseNFTHolder.findUnique({
          where: { walletAddress }
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.riseNFTHolder.create({
          data: {
            walletAddress,
            originalCount: nftCount,
            remainingCount: nftCount,
            addedBy: req.user!.email!,
            notes: notes || null
          }
        });

        results.added++;
      } catch (error) {
        results.errors.push(`Error adding ${holder.walletAddress}: ${error}`);
      }
    }

    console.log(`Bulk import completed: ${results.added} added, ${results.skipped} skipped, ${results.errors.length} errors by ${req.user!.email}`);

    res.json({
      success: true,
      data: results,
      message: `Bulk import completed: ${results.added} added, ${results.skipped} skipped`
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk import Rise NFT holders'
    });
  }
});

/**
 * Get conversion history
 */
router.get('/conversions', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const conversions = await prisma.riseConversion.findMany({
      include: {
        riseHolder: true,
        user: {
          select: { email: true, name: true }
        },
        wallet: {
          select: { address: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 conversions
    });

    const summary = {
      totalConversions: conversions.length,
      completedConversions: conversions.filter(c => c.status === 'COMPLETED').length,
      pendingConversions: conversions.filter(c => c.status === 'PENDING').length,
      failedConversions: conversions.filter(c => c.status === 'FAILED').length
    };

    res.json({
      success: true,
      data: {
        conversions,
        summary
      }
    });
  } catch (error) {
    console.error('Get conversions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversion history'
    });
  }
});

/**
 * Get all users with their profiles and wallet info
 */
router.get('/users', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        wallets: {
          select: {
            address: true,
            chain: true,
            verifiedAt: true,
            createdAt: true
          }
        },
        userWallets: {
          select: {
            address: true,
            chain: true,
            label: true,
            isDefault: true,
            addedAt: true
          }
        },
        claims: {
          select: {
            type: true,
            status: true,
            tokenId: true,
            createdAt: true
          }
        },
        rewardClaims: {
          select: {
            amount: true,
            claimed: true,
            claimedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalUsers: users.length,
      emailUsers: users.filter(u => !u.email?.includes('@wallet.local')).length,
      walletOnlyUsers: users.filter(u => u.email?.includes('@wallet.local')).length,
      verifiedUsers: users.filter(u => u.emailVerified).length,
      usersWithNFTs: users.filter(u => u.claims?.some(c => c.status === 'COMPLETED')).length
    };

    res.json({
      success: true,
      data: {
        users,
        summary
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

/**
 * Update user profile (admin only)
 */
router.put('/users/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, name, notes } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(name !== undefined && { name }),
        ...(notes !== undefined && {
          profileSettings: {
            ...((existingUser.profileSettings as any) || {}),
            adminNotes: notes,
            lastAdminUpdate: new Date().toISOString(),
            updatedBy: req.user!.email
          }
        })
      },
      include: {
        wallets: true,
        userWallets: true
      }
    });

    console.log(`User profile updated: ${updatedUser.email} by ${req.user!.email}`);

    res.json({
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

/**
 * Create support ticket for user
 */
router.post('/users/:id/support', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { issue, priority, notes } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // For now, store in user's profileSettings - in production you'd have a separate tickets table
    const supportTicket = {
      id: `ticket_${Date.now()}`,
      issue,
      priority: priority || 'medium',
      notes,
      status: 'open',
      createdBy: req.user!.email,
      createdAt: new Date().toISOString(),
      userEmail: user.email,
      userWallets: user.wallets.map(w => w.address)
    };

    const currentSettings = (user.profileSettings as any) || {};
    const existingTickets = currentSettings.supportTickets || [];

    await prisma.user.update({
      where: { id },
      data: {
        profileSettings: {
          ...currentSettings,
          supportTickets: [...existingTickets, supportTicket]
        }
      }
    });

    console.log(`Support ticket created for user ${user.email} by ${req.user!.email}`);

    res.json({
      success: true,
      data: supportTicket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

/**
 * Admin dashboard stats
 */
router.get('/stats', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const [
      totalUsers,
      totalWallets,
      totalRiseHolders,
      totalConversions,
      totalRemainingRiseNFTs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.wallet.count(),
      prisma.riseNFTHolder.count(),
      prisma.riseConversion.count(),
      prisma.riseNFTHolder.aggregate({
        _sum: { remainingCount: true }
      })
    ]);

    const recentActivity = await prisma.riseConversion.findMany({
      include: {
        riseHolder: true,
        user: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalWallets,
          totalRiseHolders,
          totalConversions,
          totalRemainingRiseNFTs: totalRemainingRiseNFTs._sum.remainingCount || 0
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin statistics'
    });
  }
});

/**
 * Pool Management - Create pools on Coreum DEX
 */

/**
 * Get available pool configurations
 */
router.get('/pools/configs', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    // Get the same pool configs from the pools route
    const poolConfigs = [
      {
        id: 'shld-core',
        name: 'SHLD/CORE',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'CORE', denom: 'ucore' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-roll',
        name: 'SHLD/ROLL',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'ROLL', denom: 'roll-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'core-roll',
        name: 'CORE/ROLL',
        token0: { symbol: 'CORE', denom: 'ucore' },
        token1: { symbol: 'ROLL', denom: 'roll-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'solo-roll',
        name: 'SOLO/ROLL',
        token0: { symbol: 'SOLO', denom: 'solo-ft' },
        token1: { symbol: 'ROLL', denom: 'roll-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-solo',
        name: 'SHLD/SOLO',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'SOLO', denom: 'solo-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-cat',
        name: 'SHLD/CAT',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'CAT', denom: 'ucat' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-cozy',
        name: 'SHLD/COZY',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'COZY', denom: 'cozy-ft' },
        fee: 0.3,
        isNew: true
      }
    ];

    // Check which pools already exist on Coreum DEX
    const poolsWithStatus = await Promise.all(
      poolConfigs.map(async (config) => {
        try {
          // For now, all pools are not created yet (will be implemented when DEX is ready)
          const exists = false; // await checkPoolExists(config.token0.denom, config.token1.denom);
          return {
            ...config,
            exists,
            status: exists ? 'active' : 'not_created'
          };
        } catch (error) {
          return {
            ...config,
            exists: false,
            status: 'not_created',
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        pools: poolsWithStatus,
        summary: {
          total: poolsWithStatus.length,
          active: poolsWithStatus.filter(p => p.exists).length,
          pending: poolsWithStatus.filter(p => !p.exists).length
        }
      }
    });
  } catch (error) {
    console.error('Get pool configs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pool configurations'
    });
  }
});

/**
 * Create a new pool on Coreum DEX
 */
router.post('/pools/create', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      poolId, 
      token0Amount, 
      token1Amount, 
      walletAddress,
      slippage = 0.5 
    } = req.body;

    if (!poolId || !token0Amount || !token1Amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Pool ID, token amounts, and wallet address are required'
      });
    }

    // Get pool configuration
    const poolConfigs = [
      { id: 'shld-core', name: 'SHLD/CORE', token0: { symbol: 'SHLD', denom: 'shield-ft' }, token1: { symbol: 'CORE', denom: 'ucore' }, fee: 0.3 },
      { id: 'shld-roll', name: 'SHLD/ROLL', token0: { symbol: 'SHLD', denom: 'shield-ft' }, token1: { symbol: 'ROLL', denom: 'roll-ft' }, fee: 0.3 },
      { id: 'core-roll', name: 'CORE/ROLL', token0: { symbol: 'CORE', denom: 'ucore' }, token1: { symbol: 'ROLL', denom: 'roll-ft' }, fee: 0.3 },
      { id: 'solo-roll', name: 'SOLO/ROLL', token0: { symbol: 'SOLO', denom: 'solo-ft' }, token1: { symbol: 'ROLL', denom: 'roll-ft' }, fee: 0.3 },
      { id: 'shld-solo', name: 'SHLD/SOLO', token0: { symbol: 'SHLD', denom: 'shield-ft' }, token1: { symbol: 'SOLO', denom: 'solo-ft' }, fee: 0.3 },
      { id: 'shld-cat', name: 'SHLD/CAT', token0: { symbol: 'SHLD', denom: 'shield-ft' }, token1: { symbol: 'CAT', denom: 'ucat' }, fee: 0.3 },
      { id: 'shld-cozy', name: 'SHLD/COZY', token0: { symbol: 'SHLD', denom: 'shield-ft' }, token1: { symbol: 'COZY', denom: 'cozy-ft' }, fee: 0.3 }
    ];

    const poolConfig = poolConfigs.find(p => p.id === poolId);
    if (!poolConfig) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pool ID'
      });
    }

    // Check if pool already exists (for now, assume none exist)
    const poolExists = false; // await checkPoolExists(poolConfig.token0.denom, poolConfig.token1.denom);
    if (poolExists) {
      return res.status(400).json({
        success: false,
        error: 'Pool already exists on Coreum DEX'
      });
    }

    // Validate amounts
    const amount0 = parseFloat(token0Amount);
    const amount1 = parseFloat(token1Amount);
    
    if (!Number.isFinite(amount0) || !Number.isFinite(amount1) || amount0 <= 0 || amount1 <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Token amounts must be positive numbers'
      });
    }

    // Generate pool creation transaction data
    const poolCreationData = {
      poolId: poolConfig.id,
      poolName: poolConfig.name,
      token0: {
        denom: poolConfig.token0.denom,
        amount: Math.floor(amount0 * 1_000_000).toString() // Convert to micro units
      },
      token1: {
        denom: poolConfig.token1.denom,
        amount: Math.floor(amount1 * 1_000_000).toString() // Convert to micro units
      },
      fee: poolConfig.fee,
      slippage,
      creator: walletAddress,
      createdBy: req.user!.email,
      createdAt: new Date().toISOString()
    };

    // TODO: In production, this would create the actual transaction
    // For now, we'll return the transaction data that needs to be signed
    const transactionData = {
      type: 'create_pool',
      chainId: 'coreum-mainnet-1',
      msgs: [
        {
          typeUrl: '/coreum.dex.v1.MsgCreatePool',
          value: {
            creator: walletAddress,
            token0: poolCreationData.token0.denom,
            token1: poolCreationData.token1.denom,
            token0Amount: poolCreationData.token0.amount,
            token1Amount: poolCreationData.token1.amount,
            fee: Math.floor(poolConfig.fee * 10000).toString() // Convert percentage to basis points
          }
        }
      ],
      fee: {
        amount: [{ denom: 'ucore', amount: '5000' }], // 0.005 CORE fee
        gas: '200000'
      },
      memo: `ShieldNest Pool Creation: ${poolConfig.name}`
    };

    console.log(`Pool creation initiated: ${poolConfig.name} by ${req.user!.email}`);
    console.log(`Amounts: ${amount0} ${poolConfig.token0.symbol}, ${amount1} ${poolConfig.token1.symbol}`);

    res.json({
      success: true,
      data: {
        poolCreationData,
        transactionData,
        instructions: {
          step1: 'Sign the transaction with your Coreum wallet',
          step2: 'Broadcast the transaction to Coreum network',
          step3: 'Pool will be automatically detected once created',
          note: 'Make sure you have sufficient token balances and CORE for fees'
        }
      },
      message: `Pool creation transaction prepared for ${poolConfig.name}`
    });

  } catch (error) {
    console.error('Create pool error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pool transaction'
    });
  }
});

/**
 * Get pool creation history/logs
 */
router.get('/pools/history', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    // In production, this would fetch from a pool_creation_logs table
    // For now, return mock data structure
    const mockHistory = [
      {
        id: 'log_1',
        poolName: 'SHLD/CORE',
        status: 'pending',
        createdBy: req.user!.email,
        createdAt: new Date().toISOString(),
        token0Amount: '1000',
        token1Amount: '500',
        txHash: null
      }
    ];

    res.json({
      success: true,
      data: {
        history: mockHistory,
        summary: {
          total: mockHistory.length,
          pending: mockHistory.filter(h => h.status === 'pending').length,
          completed: mockHistory.filter(h => h.status === 'completed').length,
          failed: mockHistory.filter(h => h.status === 'failed').length
        }
      }
    });
  } catch (error) {
    console.error('Get pool history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pool creation history'
    });
  }
});

// Helper function to check if pool exists (placeholder)
async function checkPoolExists(token0Denom: string, token1Denom: string): Promise<boolean> {
  try {
    // This would be the actual Coreum DEX API call
    // For now, return false to indicate no pools exist yet
    return false;
    
    /* PRODUCTION CODE:
    const response = await fetch(
      `${config.restEndpoint}/coreum/dex/v1/pools/${token0Denom}/${token1Denom}`,
      { timeout: 5000 }
    );
    return response.ok;
    */
  } catch (error) {
    console.warn(`Pool existence check failed for ${token0Denom}/${token1Denom}:`, error);
    return false;
  }
}

export default router;
