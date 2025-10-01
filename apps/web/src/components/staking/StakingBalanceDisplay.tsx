import React from 'react';
import { 
  BanknotesIcon,
  TrophyIcon,
  ClockIcon,
  ArrowPathIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { WalletBalances } from '@/types/balance';
import { getTokenMetadata, getTokenImageUrl } from '@/lib/token-registry';

interface StakingBalanceDisplayProps {
  balances?: WalletBalances;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

/**
 * Staking Balance Display Component
 * 
 * Modular component following Senior Developer Guidelines:
 * - Single responsibility: Display staking-related balances
 * - Reuses existing styling patterns from TokenBalanceCard
 * - Graceful handling of loading and missing data
 * - Clear visual hierarchy and accessibility
 */
export default function StakingBalanceDisplay({ balances, isLoading, isRefreshing, onRefresh }: StakingBalanceDisplayProps) {
  if (isLoading || !balances?.balances?.coreum) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tokenData = balances.balances.coreum;
  const coreumMetadata = getTokenMetadata('ucore');

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const formatUSD = (amount: number) => {
    if (amount === 0) return '$0.00';
    if (amount < 0.01) return '<$0.01';
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="relative w-10 h-10 mr-3">
            <Image
              src={getTokenImageUrl(coreumMetadata)}
              alt="COREUM"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              COREUM Balance Overview
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Price</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatUSD(tokenData.prices.usd)}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn-secondary"
              title="Refresh balances"
              disabled={isRefreshing}
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing && <span className="ml-2 text-sm">Refreshing...</span>}
            </button>
          )}
        </div>
      </div>

      {/* Balance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="glass-card border-green-200/50 dark:border-green-700/50 text-center">
          <div className="p-2 bg-green-100/80 dark:bg-green-900/50 rounded-lg w-fit mx-auto mb-3">
            <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
            Available
          </p>
          <p className="text-lg font-bold text-green-800 dark:text-green-200 mb-1">
            {formatAmount(tokenData.amount.available)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {formatUSD(tokenData.usdValues.available)}
          </p>
        </div>

        {/* Staked Balance */}
        <div className="glass-card border-blue-200/50 dark:border-blue-700/50 text-center">
          <div className="p-2 bg-blue-100/80 dark:bg-blue-900/50 rounded-lg w-fit mx-auto mb-3">
            <TrophyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            Staked
          </p>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-1">
            {formatAmount(tokenData.amount.staked)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {formatUSD(tokenData.usdValues.staked)}
          </p>
        </div>

        {/* Available Staking Rewards */}
        <div className="glass-card border-purple-200/50 dark:border-purple-700/50 text-center">
          <div className="p-2 bg-purple-100/80 dark:bg-purple-900/50 rounded-lg w-fit mx-auto mb-3">
            <ArrowPathIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
            Available Staking Rewards
          </p>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-1">
            {formatAmount(tokenData.amount.rewards)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {formatUSD(tokenData.usdValues.rewards)}
          </p>
        </div>

        {/* Unbonding Balance */}
        <div className="glass-card border-yellow-200/50 dark:border-yellow-700/50 text-center">
          <div className="p-2 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg w-fit mx-auto mb-3">
            <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Unbonding
          </p>
          <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-1">
            {formatAmount(tokenData.amount.unbonding)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            {formatUSD(tokenData.usdValues.unbonding)}
          </p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Total Portfolio Value
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatUSD(tokenData.usdValues.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
