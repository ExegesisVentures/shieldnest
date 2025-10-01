import React, { useState } from 'react';
import { 
  TrophyIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { WalletBalances } from '@/types/balance';
import StakingBalanceDisplay from './StakingBalanceDisplay';
import ValidatorSelector from './ValidatorSelector';
import StakingForm from './StakingForm';

interface StakingInterfaceProps {
  walletAddress?: string;
  balances?: WalletBalances;
  isLoading: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRefresh: () => void;
}

/**
 * Main Staking Interface Component
 * 
 * Modular design following Senior Developer Guidelines:
 * - Orchestrates staking-related components
 * - Handles high-level state management
 * - Provides error handling and loading states
 * - Maintains clean separation of concerns
 */
export default function StakingInterface({ 
  walletAddress, 
  balances, 
  isLoading, 
  isRefreshing,
  error, 
  onRefresh 
}: StakingInterfaceProps) {
  const [selectedValidator, setSelectedValidator] = useState<string>('');
  const [stakingAmount, setStakingAmount] = useState<string>('');

  // Error state
  if (error) {
    return (
      <div className="card text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Staking Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="btn-primary inline-flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Balance Display */}
      <StakingBalanceDisplay 
        balances={balances}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />

      {/* Validator Selection & Staking Form */}
      <div className="grid lg:grid-cols-2 gap-8">
        <ValidatorSelector 
          selectedValidator={selectedValidator}
          onValidatorChange={setSelectedValidator}
        />
        
        <StakingForm 
          selectedValidator={selectedValidator}
          availableBalance={balances?.balances?.coreum?.amount?.available || '0'}
          stakingAmount={stakingAmount}
          onAmountChange={setStakingAmount}
          walletAddress={walletAddress}
        />
      </div>

    </div>
  );
}
