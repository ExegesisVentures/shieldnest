import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  CurrencyDollarIcon,
  BanknotesIcon,
  ClockIcon,
  TrophyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CoreumTokenData } from '@/types/balance';
import { getTokenMetadata, getTokenImageUrl } from '@/lib/token-registry';
// import { getCachedTokenMetadata } from '@/lib/token-cache';

interface TokenBalanceCardProps {
  tokenData?: CoreumTokenData;
  isLoading?: boolean;
}

export default function TokenBalanceCard({ tokenData, isLoading }: TokenBalanceCardProps) {
  console.log('🪙 TokenBalanceCard render:', { 
    tokenData, 
    isLoading, 
    hasTokenData: !!tokenData,
    coreumAmount: tokenData?.amount,
    usdValues: tokenData?.usdValues,
    prices: tokenData?.prices
  });
  
  if (isLoading || !tokenData) {
    console.log('🔄 Showing skeleton because:', { isLoading, hasTokenData: !!tokenData });
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const coreumMetadata = getTokenMetadata('ucore');

  return (
    <div className="card">
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">COREUM</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatUSD(tokenData.usdValues.total)} Total
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Price</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatUSD(tokenData.prices.usd)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Available Balance */}
        <div className="flex items-center justify-between p-3 glass-card border-green-200/50 dark:border-green-700/50">
          <div className="flex items-center">
            <div className="p-1.5 bg-green-100/80 dark:bg-green-900/50 rounded-md mr-3">
              <BanknotesIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Available</p>
              <p className="text-xs text-green-600 dark:text-green-400">Ready to use</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              {formatAmount(tokenData.amount.available)} CORE
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {formatUSD(tokenData.usdValues.available)}
            </p>
          </div>
        </div>

        {/* Staked Balance */}
        <div className="flex items-center justify-between p-3 glass-card border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100/80 dark:bg-blue-900/50 rounded-md mr-3">
              <TrophyIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Staked</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Earning rewards</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {formatAmount(tokenData.amount.staked)} CORE
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {formatUSD(tokenData.usdValues.staked)}
            </p>
          </div>
        </div>

        {/* Unbonding Balance */}
        {parseFloat(tokenData.amount.unbonding) > 0 && (
          <div className="flex items-center justify-between p-3 glass-card border-yellow-200/50 dark:border-yellow-700/50">
            <div className="flex items-center">
              <div className="p-1.5 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-md mr-3">
                <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Unbonding</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">In progress</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                {formatAmount(tokenData.amount.unbonding)} CORE
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                {formatUSD(tokenData.usdValues.unbonding)}
              </p>
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between p-3 glass-card border-purple-200/50 dark:border-purple-700/50">
          <div className="flex items-center">
            <div className="p-1.5 bg-purple-100/80 dark:bg-purple-900/50 rounded-md mr-3">
              <ArrowPathIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Rewards</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Claimable</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              {formatAmount(tokenData.amount.rewards)} CORE
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {formatUSD(tokenData.usdValues.rewards)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Updated: {new Date(tokenData.prices.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
