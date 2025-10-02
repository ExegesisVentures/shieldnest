/**
 * Wallet Balance Endpoint (Serverless)
 * File: apps/web/src/pages/api/balances/wallet.ts
 * 
 * Get balances, staking info, and rewards for a wallet address
 */

import { NextApiRequest, NextApiResponse } from 'next';
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
    return 0;
  }
}

async function fetchAccountBalances(address: string): Promise<any> {
  const url = `${config.restEndpoint}/cosmos/bank/v1beta1/balances/${address}`;
  console.log(`🌐 Fetching balances from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ShieldNest-Portfolio-App/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch balances: ${response.status}`);
  }
  
  return await response.json();
}

async function fetchDelegations(address: string): Promise<any> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/staking/v1beta1/delegations/${address}`
  );
  if (!response.ok) throw new Error('Failed to fetch delegations');
  return await response.json();
}

async function fetchStakingRewards(address: string): Promise<any> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`
  );
  if (!response.ok) throw new Error('Failed to fetch rewards');
  return await response.json();
}

async function fetchUnbondingDelegations(address: string): Promise<any> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`
  );
  if (!response.ok) throw new Error('Failed to fetch unbonding');
  return await response.json();
}

function convertMicroToCore(microAmount: string): string {
  return (parseFloat(microAmount) / 1_000_000).toFixed(6);
}

async function handler(req: NextApiRequest | AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    let targetAddress = address;

    // If no address provided, try to get from authenticated user
    if (!address || typeof address !== 'string') {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user && authReq.wallet) {
        targetAddress = authReq.wallet.address;
        console.log('📊 Using authenticated wallet address:', targetAddress);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Address parameter is required or user must be authenticated'
        });
      }
    }

    if (!targetAddress || typeof targetAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid address is required'
      });
    }

    console.log('📊 Fetching wallet data for:', targetAddress);

    // Fetch all data in parallel
    const [
      balancesData,
      delegationsData,
      rewardsData,
      unbondingData,
      corePrice
    ] = await Promise.all([
      fetchAccountBalances(targetAddress),
      fetchDelegations(targetAddress),
      fetchStakingRewards(targetAddress),
      fetchUnbondingDelegations(targetAddress),
      getCoreumPrice()
    ]);

    // Process available balance
    const coreBalance = balancesData.balances?.find(
      (bal: any) => bal.denom === 'ucore'
    );
    const availableCore = coreBalance ? convertMicroToCore(coreBalance.amount) : '0';

    // Process staked amount
    let totalStaked = '0';
    const validators: any[] = [];
    if (delegationsData.delegation_responses) {
      let stakedMicro = 0;
      delegationsData.delegation_responses.forEach((delegation: any) => {
        const amount = parseFloat(delegation.balance?.amount || '0');
        stakedMicro += amount;
        validators.push({
          operatorAddress: delegation.delegation?.validator_address,
          moniker: 'Validator',
          delegatedAmount: convertMicroToCore(delegation.balance?.amount || '0'),
          rewards: '0'
        });
      });
      totalStaked = convertMicroToCore(stakedMicro.toString());
    }

    // Process rewards
    let totalRewards = '0';
    if (rewardsData.total) {
      const coreReward = rewardsData.total.find((r: any) => r.denom === 'ucore');
      if (coreReward) {
        totalRewards = convertMicroToCore(coreReward.amount.split('.')[0]);
      }
    }

    // Process unbonding
    let totalUnbonding = '0';
    const unbondingEntries: any[] = [];
    if (unbondingData.unbonding_responses) {
      let unbondingMicro = 0;
      unbondingData.unbonding_responses.forEach((unbonding: any) => {
        unbonding.entries?.forEach((entry: any) => {
          unbondingMicro += parseFloat(entry.balance || '0');
          unbondingEntries.push({
            validatorAddress: unbonding.validator_address,
            amount: convertMicroToCore(entry.balance || '0'),
            completionTime: entry.completion_time
          });
        });
      });
      totalUnbonding = convertMicroToCore(unbondingMicro.toString());
    }

    // Process other tokens
    const otherTokens = balancesData.balances?.filter((bal: any) =>
      bal.denom !== 'ucore' && parseFloat(bal.amount) > 0
    ).map((token: any) => ({
      denom: token.denom,
      symbol: token.denom.includes('/') ? token.denom.split('/').pop()?.toUpperCase() : token.denom.toUpperCase(),
      amount: token.amount,
      decimals: 6,
      usdValue: 0,
      usdPrice: 0
    })) || [];

    // Calculate USD values
    const availableUsd = parseFloat(availableCore) * corePrice;
    const stakedUsd = parseFloat(totalStaked) * corePrice;
    const unbondingUsd = parseFloat(totalUnbonding) * corePrice;
    const rewardsUsd = parseFloat(totalRewards) * corePrice;
    const totalUsd = availableUsd + stakedUsd + unbondingUsd + rewardsUsd;

    res.json({
      success: true,
      data: {
        balances: {
          coreum: {
            amount: {
              available: availableCore,
              staked: totalStaked,
              unbonding: totalUnbonding,
              rewards: totalRewards
            },
            prices: {
              usd: corePrice,
              lastUpdated: new Date()
            },
            usdValues: {
              available: availableUsd,
              staked: stakedUsd,
              unbonding: unbondingUsd,
              rewards: rewardsUsd,
              total: totalUsd
            }
          },
          tokens: otherTokens
        },
        stakingInfo: {
          validators,
          totalDelegated: totalStaked,
          totalRewards: totalRewards,
          unbondingEntries
        }
      }
    });

  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balances'
    });
  }
}

// Custom middleware that allows both authenticated and unauthenticated access
const customMiddleware = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('🔐 [DEBUG] Custom middleware called:', {
    hasAuthHeader: !!req.headers.authorization,
    authHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'none',
    method: req.method,
    url: req.url
  });

  // Try to authenticate, but don't fail if no auth provided
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('🔐 [DEBUG] Attempting authentication...');
    // User is trying to authenticate, run auth middleware
    try {
      const authResult = await authenticate(req as AuthenticatedRequest, res);
      console.log('🔐 [DEBUG] Authentication result:', authResult);
      if (authResult === false) {
        console.log('🔐 [DEBUG] Authentication failed, response sent');
        return; // Auth failed, response already sent
      }
      // Auth succeeded, continue with authenticated request
      console.log('🔐 [DEBUG] Authentication succeeded, calling handler with auth');
      await handler(req as AuthenticatedRequest, res);
      return;
    } catch (authError) {
      console.error('🔐 [ERROR] Authentication failed in custom middleware:', authError);
      // If auth fails, try to continue without auth (for backward compatibility)
    }
  }
  
  // Continue to handler without authentication
  console.log('🔐 [DEBUG] Calling handler without authentication');
  await handler(req, res);
};

export default withMiddleware(customMiddleware);

