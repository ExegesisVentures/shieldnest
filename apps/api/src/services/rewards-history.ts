/**
 * Comprehensive Rewards History Service for Coreum Staking
 * File: apps/api/src/services/rewards-history.ts
 */

import { config } from '@/lib/config';
import { SecureLogger } from '@/utils/security';

export interface RewardTransaction {
  transactionHash: string;
  blockHeight: number;
  timestamp: Date;
  validatorAddress: string;
  rewardAmount: string; // in ucore
  rewardAmountCore: string; // in CORE
}

export interface StakingRewardsHistory {
  walletAddress: string;
  totalEarnedAllTime: string; // Total CORE earned since wallet creation
  currentClaimableRewards: string; // Current unclaimed rewards
  totalDelegated: string; // Current delegated amount
  firstDelegationDate: Date | null;
  lastRewardClaimDate: Date | null;
  rewardTransactions: RewardTransaction[];
  estimatedApr: number;
  summary: {
    totalTransactions: number;
    totalValidators: number;
    averageRewardPerClaim: string;
    stakingDurationDays: number;
  };
}

export interface ValidatorRewardsBreakdown {
  validatorAddress: string;
  validatorMoniker: string;
  delegatedAmount: string;
  currentRewards: string;
  totalEarnedFromValidator: string;
  claimCount: number;
}

/**
 * Enhanced Rewards History Service
 */
export class RewardsHistoryService {
  
  /**
   * Get comprehensive rewards history for a wallet address
   */
  static async getCompleteRewardsHistory(address: string): Promise<StakingRewardsHistory> {
    try {
      console.log(`🔍 Fetching complete rewards history for: ${address}`);
      
      // Get current state
      const [currentRewards, currentDelegations, transactionHistory] = await Promise.all([
        this.fetchCurrentRewards(address),
        this.fetchCurrentDelegations(address),
        this.fetchRewardTransactionHistory(address)
      ]);

      // Calculate total earned
      const totalEarnedFromTransactions = transactionHistory.reduce((sum, tx) => {
        return sum + parseFloat(tx.rewardAmountCore);
      }, 0);

      // Add current unclaimed rewards to total
      const currentClaimable = this.convertMicroToCore(currentRewards.total?.[0]?.amount || '0');
      const totalEarnedAllTime = totalEarnedFromTransactions + parseFloat(currentClaimable);

      // Calculate staking duration
      const firstDelegation = transactionHistory.length > 0 
        ? new Date(Math.min(...transactionHistory.map(tx => tx.timestamp.getTime())))
        : null;
      
      const stakingDurationDays = firstDelegation 
        ? Math.floor((Date.now() - firstDelegation.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate estimated APR based on current position and total earned
      const currentDelegatedCore = this.convertMicroToCore(
        currentDelegations.delegation_responses?.reduce((sum: number, del: any) => {
          return sum + parseFloat(del.balance?.amount || '0');
        }, 0).toString() || '0'
      );

      const estimatedApr = stakingDurationDays > 0 && parseFloat(currentDelegatedCore) > 0
        ? ((totalEarnedAllTime / parseFloat(currentDelegatedCore)) * (365 / stakingDurationDays)) * 100
        : 0;

      // Get validator info
      const validatorAddresses = [...new Set(transactionHistory.map(tx => tx.validatorAddress))];

      const result: StakingRewardsHistory = {
        walletAddress: address,
        totalEarnedAllTime: totalEarnedAllTime.toFixed(6),
        currentClaimableRewards: currentClaimable,
        totalDelegated: currentDelegatedCore,
        firstDelegationDate: firstDelegation,
        lastRewardClaimDate: transactionHistory.length > 0 
          ? new Date(Math.max(...transactionHistory.map(tx => tx.timestamp.getTime())))
          : null,
        rewardTransactions: transactionHistory.slice(0, 100), // Limit for response size
        estimatedApr: Number(estimatedApr.toFixed(2)),
        summary: {
          totalTransactions: transactionHistory.length,
          totalValidators: validatorAddresses.length,
          averageRewardPerClaim: transactionHistory.length > 0 
            ? (totalEarnedFromTransactions / transactionHistory.length).toFixed(6)
            : '0',
          stakingDurationDays
        }
      };

      console.log(`✅ Rewards history calculated:`, {
        address: address.substring(0, 20) + '...',
        totalEarned: result.totalEarnedAllTime,
        transactions: result.summary.totalTransactions,
        stakingDays: result.summary.stakingDurationDays
      });

      return result;

    } catch (error) {
      console.error('Error fetching rewards history:', error);
      throw new Error(`Failed to fetch rewards history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get validator-specific rewards breakdown
   */
  static async getValidatorRewardsBreakdown(address: string): Promise<ValidatorRewardsBreakdown[]> {
    try {
      const [currentRewards, currentDelegations, transactionHistory] = await Promise.all([
        this.fetchCurrentRewards(address),
        this.fetchCurrentDelegations(address),
        this.fetchRewardTransactionHistory(address)
      ]);

      const validatorBreakdown: Map<string, ValidatorRewardsBreakdown> = new Map();

      // Process current delegations and rewards
      if (currentDelegations.delegation_responses) {
        for (const delegation of currentDelegations.delegation_responses) {
          const validatorAddr = delegation.delegation.validator_address;
          const delegatedAmount = this.convertMicroToCore(delegation.balance.amount);
          
          // Find current rewards for this validator
          const validatorReward = currentRewards.rewards?.find((r: any) => 
            r.validator_address === validatorAddr
          );
          const currentValidatorRewards = validatorReward?.reward?.find((r: any) => r.denom === 'ucore')?.amount || '0';
          
          validatorBreakdown.set(validatorAddr, {
            validatorAddress: validatorAddr,
            validatorMoniker: `Validator ${validatorAddr.slice(-8)}`, // Would need validator registry for real names
            delegatedAmount,
            currentRewards: this.convertMicroToCore(currentValidatorRewards),
            totalEarnedFromValidator: '0', // Will be calculated below
            claimCount: 0
          });
        }
      }

      // Process historical transactions
      for (const tx of transactionHistory) {
        const breakdown = validatorBreakdown.get(tx.validatorAddress);
        if (breakdown) {
          breakdown.totalEarnedFromValidator = (
            parseFloat(breakdown.totalEarnedFromValidator) + parseFloat(tx.rewardAmountCore)
          ).toFixed(6);
          breakdown.claimCount++;
        }
      }

      return Array.from(validatorBreakdown.values());

    } catch (error) {
      console.error('Error fetching validator breakdown:', error);
      throw error;
    }
  }

  /**
   * Fetch current rewards from Coreum API
   */
  private static async fetchCurrentRewards(address: string): Promise<any> {
    const response = await fetch(
      `${config.restEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch current rewards: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch current delegations from Coreum API
   */
  private static async fetchCurrentDelegations(address: string): Promise<any> {
    const response = await fetch(
      `${config.restEndpoint}/cosmos/staking/v1beta1/delegations/${address}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch delegations: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch transaction history for reward claims
   * Note: This is a placeholder implementation. In a real system, you would:
   * 1. Use a blockchain indexer service (like BigQuery, The Graph, or custom indexer)
   * 2. Parse transaction logs for reward distribution events
   * 3. Store historical data in your own database for faster access
   */
  private static async fetchRewardTransactionHistory(address: string): Promise<RewardTransaction[]> {
    try {
      // For now, we'll simulate transaction history based on current staking position
      // In production, you would query an indexer or parse blockchain events
      
      console.log(`📜 Simulating transaction history for ${address}`);
      
      // Get current rewards to estimate historical patterns
      const currentRewards = await this.fetchCurrentRewards(address);
      const currentDelegations = await this.fetchCurrentDelegations(address);
      
      if (!currentDelegations.delegation_responses?.length) {
        return [];
      }

      // Estimate historical transactions based on current staking
      const mockTransactions: RewardTransaction[] = [];
      const validatorAddr = currentDelegations.delegation_responses[0].delegation.validator_address;
      const currentRewardAmount = currentRewards.total?.[0]?.amount || '0';
      
      // Simulate monthly reward claims over the past year
      // This is a placeholder - replace with real transaction parsing
      const monthsBack = 12;
      const baseRewardPerMonth = parseFloat(currentRewardAmount) / 3; // Assume 3 months accumulation
      
      for (let i = 0; i < monthsBack; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        // Simulate some variation in rewards
        const variation = 0.8 + (Math.random() * 0.4); // 80-120% of base
        const rewardAmount = Math.floor(baseRewardPerMonth * variation);
        
        if (rewardAmount > 1000000) { // Only include significant rewards (> 1 CORE)
          mockTransactions.push({
            transactionHash: `simulated_tx_${i}_${Math.random().toString(36).substring(7)}`,
            blockHeight: 10000000 - (i * 43200), // Approximate blocks per month
            timestamp: date,
            validatorAddress: validatorAddr,
            rewardAmount: rewardAmount.toString(),
            rewardAmountCore: this.convertMicroToCore(rewardAmount.toString())
          });
        }
      }

      console.log(`📊 Generated ${mockTransactions.length} simulated transactions`);
      return mockTransactions.reverse(); // Oldest first

    } catch (error) {
      console.error('Error simulating transaction history:', error);
      return [];
    }
  }

  /**
   * Convert microCORE to CORE
   */
  private static convertMicroToCore(microAmount: string): string {
    const amount = parseFloat(microAmount) / 1_000_000;
    return amount.toFixed(6);
  }

  /**
   * Get real-time rewards data for immediate display
   */
  static async getCurrentRewardsSnapshot(address: string): Promise<{
    totalRewards: string;
    totalDelegated: string;
    validatorCount: number;
    lastUpdated: Date;
  }> {
    try {
      const [rewards, delegations] = await Promise.all([
        this.fetchCurrentRewards(address),
        this.fetchCurrentDelegations(address)
      ]);

      const totalRewards = this.convertMicroToCore(rewards.total?.[0]?.amount || '0');
      const totalDelegated = this.convertMicroToCore(
        delegations.delegation_responses?.reduce((sum: number, del: any) => {
          return sum + parseFloat(del.balance?.amount || '0');
        }, 0).toString() || '0'
      );

      return {
        totalRewards,
        totalDelegated,
        validatorCount: delegations.delegation_responses?.length || 0,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error fetching current snapshot:', error);
      throw error;
    }
  }
}
