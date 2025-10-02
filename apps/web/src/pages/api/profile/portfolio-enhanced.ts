/**
 * Enhanced Portfolio Endpoint (Serverless)
 * File: apps/web/src/pages/api/profile/portfolio-enhanced.ts
 * 
 * Get enhanced portfolio data for user's wallets with token breakdown
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { config } from '@/lib/api-shared/config';
import { withMiddleware, authenticate } from '@/lib/api-shared/middleware';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

// Helper functions
async function getCoreumPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=coreum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.coreum?.usd || 0;
  } catch (error) {
    console.warn('Failed to fetch CORE price:', error);
    return 0.15; // Fallback
  }
}

async function fetchAccountBalances(address: string): Promise<any> {
  const url = `${config.restEndpoint}/cosmos/bank/v1beta1/balances/${address}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ShieldNest-Portfolio-App/1.0'
    }
  });
  if (!response.ok) throw new Error(`Failed to fetch balances: ${response.status}`);
  return await response.json();
}

async function fetchDelegations(address: string): Promise<any> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/staking/v1beta1/delegations/${address}`
  );
  if (!response.ok) throw new Error('Failed to fetch delegations');
  return await response.json();
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Enhanced portfolio endpoint called');
    const userId = req.user!.id;
    console.log(`📊 Fetching enhanced portfolio for user: ${userId}`);

    // Get all wallets (manual + connected)
    const userWallets = await prisma.userWallet.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { addedAt: 'asc' }
      ]
    });

    const allWallets = [...userWallets.map(w => ({
      address: w.address,
      chain: w.chain,
      type: 'manual' as const,
      label: w.label,
      isDefault: w.isDefault
    }))];

    // Add connected wallet if exists
    const connectedWallet = await prisma.wallet.findFirst({
      where: { userId }
    });

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

    // Fetch balance data for all wallets in parallel
    const walletPromises = allWallets.map(async (wallet) => {
      try {
        console.log(`🔍 Fetching data for wallet ${wallet.address}`);
        const [balanceData, delegationData] = await Promise.all([
          fetchAccountBalances(wallet.address),
          fetchDelegations(wallet.address)
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

        const corePrice = await getCoreumPrice();

        return {
          address: wallet.address,
          chain: wallet.chain,
          type: wallet.type,
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
        console.error(`❌ Failed to fetch data for ${wallet.address}:`, error);
        return {
          address: wallet.address,
          chain: wallet.chain,
          type: wallet.type,
          label: wallet.label || null,
          isDefault: wallet.isDefault || false,
          balances: {
            available: 0,
            staked: 0,
            total: 0
          },
          tokens: [],
          success: false,
          error: error instanceof Error ? error.message : 'Network error'
        };
      }
    });

    const walletResults = await Promise.all(walletPromises);
    const corePrice = await getCoreumPrice();

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

    console.log(`✅ Portfolio completed: ${aggregatedData.successfulWallets}/${aggregatedData.totalWallets} successful`);

    res.json({
      success: true,
      data: portfolioData
    });

  } catch (error) {
    console.error('❌ Enhanced portfolio error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch portfolio data'
    });
  }
}

export default withMiddleware(authenticate(handler));

