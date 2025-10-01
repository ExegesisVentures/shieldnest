import React, { useState } from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { StakingInfo } from '@/types/balance';

interface StakingDetailsCardProps {
  stakingInfo?: StakingInfo;
  isLoading?: boolean;
}

export default function StakingDetailsCard({ stakingInfo, isLoading }: StakingDetailsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading || !stakingInfo) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
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

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  const hasStaking = parseFloat(stakingInfo.totalDelegated) > 0;
  const hasUnbonding = stakingInfo.unbondingEntries.length > 0;
  const hasRewards = parseFloat(stakingInfo.totalRewards) > 0;

  if (!hasStaking && !hasUnbonding && !hasRewards) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <TrophyIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Staking Activity</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start staking your COREUM tokens to earn rewards and help secure the network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="p-2 bg-blue-100/80 dark:bg-blue-900/50 rounded-lg mr-3">
            <TrophyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Staking</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stakingInfo.validators.length} validator{stakingInfo.validators.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* Summary Always Visible */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 glass-card border-blue-200/50 dark:border-blue-700/50">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Delegated</p>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            {formatAmount(stakingInfo.totalDelegated)} CORE
          </p>
        </div>
        <div className="text-center p-3 glass-card border-purple-200/50 dark:border-purple-700/50">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Rewards</p>
          <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">
            {formatAmount(stakingInfo.totalRewards)} CORE
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-6 space-y-4">
          {/* Validators */}
          {stakingInfo.validators.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <UsersIcon className="h-4 w-4 mr-2" />
                Validators ({stakingInfo.validators.length})
              </h4>
              <div className="space-y-2">
                {stakingInfo.validators.map((validator, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-card">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {validator.moniker}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {shortenAddress(validator.operatorAddress)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatAmount(validator.delegatedAmount)} CORE
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        +{formatAmount(validator.rewards)} rewards
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unbonding Entries */}
          {hasUnbonding && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                Unbonding ({stakingInfo.unbondingEntries.length})
              </h4>
              <div className="space-y-2">
                {stakingInfo.unbondingEntries.map((entry, index) => {
                  const completionDate = new Date(entry.completionTime);
                  const isCompleted = completionDate <= new Date();
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 glass-card border-yellow-200/50 dark:border-yellow-700/50">
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {formatAmount(entry.amount)} CORE
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {shortenAddress(entry.validatorAddress)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          {isCompleted ? 'Ready' : 'Unbonding'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {completionDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
