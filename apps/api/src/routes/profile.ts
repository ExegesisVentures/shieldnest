import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticate } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';
import * as balanceUtils from './balances';

const router = Router();

/**
 * Get user profile
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        wallets: {
          select: {
            id: true,
            chain: true,
            address: true,
            verifiedAt: true,
            createdAt: true
          }
        },
        userWallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            label: true,
            isDefault: true,
            addedAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Debug log for troubleshooting
    console.log('📊 Profile API Response for:', user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      hasFirstName: !!user.firstName,
      hasLastName: !!user.lastName,
      walletsCount: user.wallets.length,
      userWalletsCount: user.userWallets.length
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        profileSettings: user.profileSettings,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        wallets: user.wallets,
        userWallets: user.userWallets
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * Update user profile
 */
router.put('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { firstName, lastName, email, avatarUrl, profileSettings } = req.body;

    // Validate avatar URL if provided
    if (avatarUrl && typeof avatarUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL must be a string'
      });
    }

    // Validate email if provided
    if (email && typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email must be a string'
      });
    }

    // Validate profile settings if provided
    if (profileSettings && typeof profileSettings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Profile settings must be an object'
      });
    }

    // Check if user is updating from wallet-only account
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    const isWalletOnlyUser = currentUser?.email?.includes('@wallet.local');

    // If updating email from wallet.local, ensure new email doesn't already exist
    if (email && isWalletOnlyUser && email !== currentUser?.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).json({
          success: false,
          error: 'Email address is already registered'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        name: firstName && lastName ? `${firstName} ${lastName}` : firstName || undefined,
        email: email || undefined,
        avatarUrl: avatarUrl || undefined,
        profileSettings: profileSettings || undefined
      },
      include: {
        wallets: {
          select: {
            id: true,
            chain: true,
            address: true,
            verifiedAt: true,
            createdAt: true
          }
        },
        userWallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            label: true,
            isDefault: true,
            addedAt: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        emailVerified: updatedUser.emailVerified,
        profileSettings: updatedUser.profileSettings,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
        wallets: updatedUser.wallets,
        userWallets: updatedUser.userWallets
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * Add wallet address to user profile (read-only access)
 */
router.post('/wallets', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { address, chain = 'coreum', label, isDefault = false } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid wallet address is required'
      });
    }

    // Validate Coreum address format (basic validation)
    if (chain === 'coreum' && !address.startsWith('core1')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Check if wallet already exists for this user
    const existingWallet = await prisma.userWallet.findUnique({
      where: {
        userId_address_chain: {
          userId: req.user!.id,
          address,
          chain
        }
      }
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address already added to your profile'
      });
    }

    // If this is set as default, remove default from other wallets
    if (isDefault) {
      await prisma.userWallet.updateMany({
        where: {
          userId: req.user!.id,
          chain
        },
        data: {
          isDefault: false
        }
      });
    }

    const userWallet = await prisma.userWallet.create({
      data: {
        userId: req.user!.id,
        address,
        chain,
        label: label || null,
        isDefault
      }
    });

    res.json({
      success: true,
      data: userWallet,
      message: 'Wallet address added to your profile'
    });

  } catch (error) {
    console.error('Add user wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add wallet address'
    });
  }
});

/**
 * Update user wallet (label, default status)
 */
router.put('/wallets/:walletId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { walletId } = req.params;
    const { label, isDefault } = req.body;

    // Verify wallet belongs to user
    const userWallet = await prisma.userWallet.findUnique({
      where: { id: walletId }
    });

    if (!userWallet || userWallet.userId !== req.user!.id) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // If setting as default, remove default from other wallets
    if (isDefault) {
      await prisma.userWallet.updateMany({
        where: {
          userId: req.user!.id,
          chain: userWallet.chain,
          id: { not: walletId }
        },
        data: {
          isDefault: false
        }
      });
    }

    const updatedWallet = await prisma.userWallet.update({
      where: { id: walletId },
      data: {
        label: label !== undefined ? label : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined
      }
    });

    res.json({
      success: true,
      data: updatedWallet,
      message: 'Wallet updated successfully'
    });

  } catch (error) {
    console.error('Update user wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wallet'
    });
  }
});

/**
 * Remove user wallet
 */
router.delete('/wallets/:walletId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { walletId } = req.params;

    // Verify wallet belongs to user
    const userWallet = await prisma.userWallet.findUnique({
      where: { id: walletId }
    });

    if (!userWallet || userWallet.userId !== req.user!.id) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    await prisma.userWallet.delete({
      where: { id: walletId }
    });

    res.json({
      success: true,
      message: 'Wallet removed from your profile'
    });

  } catch (error) {
    console.error('Remove user wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove wallet'
    });
  }
});

/**
 * Test endpoint for debugging
 */
router.get('/portfolio-enhanced-test', async (req, res) => {
  try {
    const testAddress = req.query.address as string || 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj';
    
    console.log(`🧪 Testing portfolio for address: ${testAddress}`);
    
    const [balanceData, delegationData] = await Promise.all([
      balanceUtils.fetchAccountBalances(testAddress),
      balanceUtils.fetchDelegations(testAddress)
    ]);

    // Process core balance
    const coreBalance = balanceData.balances?.find((bal: any) => bal.denom === 'ucore');
    const availableCore = coreBalance ? parseFloat(coreBalance.amount) / 1_000_000 : 0;

    // Process staked amount
    let totalStaked = 0;
    if (delegationData.delegation_responses) {
      totalStaked = delegationData.delegation_responses.reduce((sum: number, delegation: any) => {
        return sum + (parseFloat(delegation.balance?.amount || '0') / 1_000_000);
      }, 0);
    }

    // Process other tokens
    const otherTokens = balanceData.balances?.filter((bal: any) => 
      bal.denom !== 'ucore' && parseFloat(bal.amount) > 0
    ).map((token: any) => ({
      denom: token.denom,
      symbol: token.denom.includes('/') ? token.denom.split('/').pop()?.toUpperCase() : token.denom.toUpperCase(),
      amount: token.amount,
      decimals: 6,
      usdValue: 0,
      usdPrice: 0
    })) || [];

    const result = {
      address: testAddress,
      chain: 'coreum',
      type: 'manual',
      label: 'Test Address',
      isDefault: false,
      balances: {
        available: availableCore,
        staked: totalStaked,
        total: availableCore + totalStaked
      },
      tokens: otherTokens,
      success: true,
      rawData: {
        balanceData,
        delegationData
      }
    };

    console.log(`🧪 Test result:`, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    });
  }
});

/**
 * Get enhanced portfolio data for user's wallets with token breakdown
 */
router.get('/portfolio-enhanced', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🚀 Enhanced portfolio endpoint called');
    console.log('🔍 User object:', req.user);
    console.log('🔍 Auth header:', req.headers.authorization);
    const userId = req.user!.id;
    console.log(`📊 Fetching enhanced portfolio for user: ${userId}`);

    // Get all wallets (manual + connected)
    console.log(`🔍 Fetching userWallets for userId: ${userId}`);
    const userWallets = await prisma.userWallet.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { addedAt: 'asc' }
      ]
    });
    console.log(`🔍 Found ${userWallets.length} userWallets:`, userWallets.map(w => w.address));

    const allWallets = [...userWallets.map(w => ({
      address: w.address,
      chain: w.chain,
      type: 'manual' as const,
      label: w.label,
      isDefault: w.isDefault
    }))];

    // Add connected wallet if exists and not already in manual wallets
    console.log(`🔍 Fetching connected wallet for userId: ${userId}`);
    const connectedWallet = await prisma.wallet.findFirst({
      where: { userId }
    });
    console.log(`🔍 Connected wallet:`, connectedWallet?.address || 'none');

    if (connectedWallet) {
      const existingManual = allWallets.find(w => w.address === connectedWallet.address);
      if (!existingManual) {
        allWallets.unshift({
          address: connectedWallet.address,
          chain: connectedWallet.chain,
          type: 'connected' as const,
          label: 'Connected Wallet',
          isDefault: true
        });
      }
    }

    console.log(`📊 Aggregating enhanced portfolio for ${allWallets.length} wallet(s)`);

    // Fetch balance data for all wallets in parallel with token data
    const walletPromises = allWallets.map(async (wallet) => {
      try {
        console.log(`🔍 Enhanced portfolio: Fetching data for wallet ${wallet.address}`);
        const [balanceData, delegationData] = await Promise.all([
          balanceUtils.fetchAccountBalances(wallet.address),
          balanceUtils.fetchDelegations(wallet.address)
        ]);

        console.log(`📊 Enhanced portfolio: Balance data for ${wallet.address}:`, {
          hasBalances: !!balanceData.balances,
          balanceCount: balanceData.balances?.length || 0,
          balances: balanceData.balances
        });

        // Process core balance
        const coreBalance = balanceData.balances?.find((bal: any) => bal.denom === 'ucore');
        const availableCore = coreBalance ? parseFloat(coreBalance.amount) / 1_000_000 : 0;
        
        console.log(`💰 Enhanced portfolio: CORE balance for ${wallet.address}:`, {
          coreBalance,
          availableCore,
          rawAmount: coreBalance?.amount
        });

        // Process staked amount
        let totalStaked = 0;
        if (delegationData.delegation_responses) {
          totalStaked = delegationData.delegation_responses.reduce((sum: number, delegation: any) => {
            return sum + (parseFloat(delegation.balance?.amount || '0') / 1_000_000);
          }, 0);
        }

        // Process other tokens
        const otherTokens = balanceData.balances?.filter((bal: any) => 
          bal.denom !== 'ucore' && parseFloat(bal.amount) > 0
        ).map((token: any) => ({
          denom: token.denom,
          symbol: token.denom.includes('/') ? token.denom.split('/').pop()?.toUpperCase() : token.denom.toUpperCase(),
          amount: token.amount,
          decimals: 6, // Default decimals for Coreum tokens
          usdValue: 0, // TODO: Add token price fetching
          usdPrice: 0
        })) || [];

        const corePrice = await balanceUtils.getCoreumPrice().catch(() => 0.15);
        
        return {
          address: wallet.address,
          chain: wallet.chain,
          type: wallet.type as 'connected' | 'manual',
          label: wallet.label || null,
          isDefault: wallet.isDefault || false,
          balances: {
            available: availableCore,
            staked: totalStaked,
            total: availableCore + totalStaked,
            availableUSD: availableCore * corePrice,
            stakedUSD: totalStaked * corePrice,
            totalUSD: (availableCore + totalStaked) * corePrice
          },
          tokens: otherTokens,
          success: true
        };
      } catch (error) {
        console.error(`❌ Failed to fetch enhanced data for ${wallet.address}:`, error);
        return {
          address: wallet.address,
          chain: wallet.chain,
          type: wallet.type as 'connected' | 'manual',
          label: wallet.label || null,
          isDefault: wallet.isDefault || false,
          balances: {
            available: 0,
            staked: 0,
            total: 0
          },
          tokens: [],
          success: false,
          error: error instanceof Error ? error.message : 'Network error - please try again'
        };
      }
    });

    const walletResults = await Promise.all(walletPromises);
    const corePrice = await balanceUtils.getCoreumPrice().catch(() => 0.15); // Fallback price

    // Aggregate totals
    const totals = walletResults.reduce((acc, wallet) => {
      if (wallet.success) {
        acc.totalCore += wallet.balances.total;
        acc.totalAvailable += wallet.balances.available;
        acc.totalStaked += wallet.balances.staked;
      }
      return acc;
    }, {
      totalCore: 0,
      totalAvailable: 0,
      totalStaked: 0
    });

    const aggregatedData = {
      successfulWallets: walletResults.filter(w => w.success).length,
      failedWallets: walletResults.filter(w => !w.success).length,
      totalWallets: walletResults.length
    };

    const portfolioData = {
      wallets: walletResults,
      summary: {
        ...totals,
        totalValueUSD: totals.totalCore * corePrice,
        corePrice
      },
      aggregatedData,
      lastUpdated: new Date().toISOString(),
      message: `Enhanced portfolio data for ${aggregatedData.totalWallets} wallet(s) with token breakdown`
    };

    console.log(`✅ Enhanced portfolio aggregation completed: ${aggregatedData.successfulWallets}/${aggregatedData.totalWallets} wallets successful`);

    res.json({
      success: true,
      data: portfolioData
    });

  } catch (error) {
    console.error('❌ Enhanced portfolio fetch error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch enhanced portfolio data'
    });
  }
});

/**
 * Get aggregated portfolio data for user's wallets (original endpoint)
 */
router.get('/portfolio', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('📊 Portfolio endpoint called for user:', req.user?.id);
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        userWallets: true,
        wallets: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Combine both connected wallets and manual wallet addresses
    const allWallets = [
      ...user.wallets.map(w => ({ address: w.address, chain: w.chain, type: 'connected' as const, verifiedAt: w.verifiedAt })),
      ...user.userWallets.map(w => ({ address: w.address, chain: w.chain, type: 'manual' as const, label: w.label, isDefault: w.isDefault }))
    ];

    if (allWallets.length === 0) {
      return res.json({
        success: true,
        data: {
          wallets: [],
          totalValue: 0,
          totalCore: 0,
          totalStaked: 0,
          aggregatedData: null,
          message: 'No wallet addresses added to your profile yet'
        }
      });
    }

    // Balance fetching functions imported at top of file
    
    console.log(`📊 Aggregating portfolio for ${allWallets.length} wallet(s)`);

    // Fetch balance data for all wallets in parallel
    const walletPromises = allWallets.map(async (wallet) => {
      try {
        const [balanceData, delegationData] = await Promise.all([
          balanceUtils.fetchAccountBalances(wallet.address),
          balanceUtils.fetchDelegations(wallet.address)
        ]);

        // Process core balance
        const coreBalance = balanceData.balances?.find((bal: any) => bal.denom === 'ucore');
        const availableCore = coreBalance ? parseFloat(coreBalance.amount) / 1_000_000 : 0;

        // Process staked amount
        let totalStaked = 0;
        if (delegationData.delegation_responses) {
          totalStaked = delegationData.delegation_responses.reduce((sum: number, delegation: any) => {
            return sum + (parseFloat(delegation.balance?.amount || '0') / 1_000_000);
          }, 0);
        }

        return {
          address: wallet.address,
          chain: wallet.chain,
          type: wallet.type,
          label: (wallet as any).label || null,
          isDefault: (wallet as any).isDefault || false,
          balances: {
            available: availableCore,
            staked: totalStaked,
            total: availableCore + totalStaked
          },
          success: true
        };
      } catch (error) {
        console.error(`❌ Failed to fetch data for ${wallet.address}:`, error);
        return {
          address: wallet.address,
          chain: wallet.chain,
          type: wallet.type,
          label: (wallet as any).label || null,
          isDefault: (wallet as any).isDefault || false,
          balances: {
            available: 0,
            staked: 0,
            total: 0
          },
          success: false,
          error: error instanceof Error ? error.message : 'Network error - please try again'
        };
      }
    });

    const walletResults = await Promise.all(walletPromises);
    const corePrice = await balanceUtils.getCoreumPrice().catch(() => 0.15); // Fallback price

    // Aggregate totals
    const totals = walletResults.reduce((acc, wallet) => {
      if (wallet.success) {
        acc.totalCore += wallet.balances.total;
        acc.totalAvailable += wallet.balances.available;
        acc.totalStaked += wallet.balances.staked;
      }
      return acc;
    }, { totalCore: 0, totalAvailable: 0, totalStaked: 0 });

    const portfolioData = {
      wallets: walletResults,
      summary: {
        totalCore: totals.totalCore,
        totalAvailable: totals.totalAvailable,
        totalStaked: totals.totalStaked,
        totalValueUSD: totals.totalCore * corePrice,
        corePrice: corePrice
      },
      aggregatedData: {
        successfulWallets: walletResults.filter(w => w.success).length,
        failedWallets: walletResults.filter(w => !w.success).length,
        totalWallets: walletResults.length
      },
      lastUpdated: new Date(),
      message: allWallets.length > 1 ? 
        `Portfolio aggregated from ${allWallets.length} wallet addresses` : 
        'Single wallet portfolio data'
    };

    res.json({
      success: true,
      data: portfolioData
    });

  } catch (error) {
    console.error('❌ Get portfolio error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
