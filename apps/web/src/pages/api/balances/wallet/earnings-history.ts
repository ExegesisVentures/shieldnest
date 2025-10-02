/**
 * Earnings History Endpoint (Serverless)
 * File: apps/web/src/pages/api/balances/wallet/earnings-history.ts
 * 
 * Get earnings history for a wallet address
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '@/lib/api-shared/middleware';
import { config } from '@/lib/api-shared/config';

async function fetchStakingRewards(address: string): Promise<any> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`
  );
  if (!response.ok) throw new Error('Failed to fetch rewards');
  return await response.json();
}

async function fetchDelegations(address: string): Promise<any> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/staking/v1beta1/delegations/${address}`
  );
  if (!response.ok) throw new Error('Failed to fetch delegations');
  return await response.json();
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required'
      });
    }

    // Validate Coreum address format
    if (!address.startsWith('core1')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    console.log('📈 Fetching earnings history for:', address);

    // Fetch current rewards and delegations
    const [rewardsData, delegationsData] = await Promise.all([
      fetchStakingRewards(address),
      fetchDelegations(address)
    ]);

    // Process current rewards
    let totalRewards = 0;
    const rewardBreakdown: any[] = [];
    
    if (rewardsData.total && rewardsData.total.length > 0) {
      rewardsData.total.forEach((reward: any) => {
        const amount = parseFloat(reward.amount) / 1_000_000; // Convert from ucore to CORE
        totalRewards += amount;
        rewardBreakdown.push({
          denom: reward.denom,
          amount: amount.toFixed(6),
          validator: 'All Validators'
        });
      });
    }

    // Process delegation history (simplified)
    const delegationHistory: any[] = [];
    if (delegationsData.delegation_responses) {
      delegationsData.delegation_responses.forEach((delegation: any) => {
        const amount = parseFloat(delegation.balance?.amount || '0') / 1_000_000;
        delegationHistory.push({
          validator: delegation.delegation?.validator_address || 'Unknown',
          amount: amount.toFixed(6),
          timestamp: new Date().toISOString() // Current timestamp as placeholder
        });
      });
    }

    const earningsHistory = {
      address,
      totalRewards: totalRewards.toFixed(6),
      rewardBreakdown,
      delegationHistory,
      lastUpdated: new Date().toISOString(),
      note: 'Historical data is limited by Coreum API capabilities'
    };

    res.json({
      success: true,
      data: earningsHistory
    });

  } catch (error) {
    console.error('Error fetching earnings history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings history'
    });
  }
}

export default withMiddleware(handler);
