import React from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useBalance } from '@/hooks/useBalance';
import TokenBalanceCard from '@/components/TokenBalanceCard';
import StakingDetailsCard from '@/components/StakingDetailsCard';
import OtherTokensCard from '@/components/OtherTokensCard';
import { 
  WalletIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface WalletOnlyPortfolioProps {
  onUpgradeProfile?: () => void;
}

export default function WalletOnlyPortfolio({ onUpgradeProfile }: WalletOnlyPortfolioProps) {
  const { isConnected, connectedWallet } = useWalletContext();
  const { balances, isLoading: balancesLoading, error: balancesError, refetch } = useBalance();

  if (!isConnected || !connectedWallet) {
    return (
      <div className="card text-center py-8">
        <WalletIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Wallet Connected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Connect your wallet to view your portfolio
        </p>
      </div>
    );
  }

  if (balancesError) {
    return (
      <div className="card text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Portfolio
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{balancesError}</p>
        <button
          onClick={refetch}
          className="btn-primary inline-flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upgrade Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Unlock More Features
              </h3>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Create a profile to track multiple wallets, access member features, and more
              </p>
            </div>
          </div>
          {onUpgradeProfile && (
            <button
              onClick={onUpgradeProfile}
              className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Create Profile
            </button>
          )}
        </div>
      </div>

      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Wallet Portfolio
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {connectedWallet.address.substring(0, 10)}...{connectedWallet.address.slice(-6)}
          </p>
        </div>
        <button
          onClick={refetch}
          className="btn-glass inline-flex items-center"
          disabled={balancesLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${balancesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Portfolio Content */}
      {balancesLoading ? (
        <div className="grid gap-6">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ) : balances ? (
        <div className="grid gap-6">
          {/* Token Balance Card */}
          <TokenBalanceCard tokenData={balances?.balances?.coreum} />
          
          {/* Staking Details Card */}
          <StakingDetailsCard stakingInfo={balances?.stakingInfo} />
          
          {/* Other Tokens Card */}
          <OtherTokensCard tokens={balances?.balances?.tokens || []} />
        </div>
      ) : (
        <div className="card text-center py-8">
          <WalletIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Balance Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load balance information for this wallet
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Read-only wallet view • Connect with {connectedWallet.source}
      </div>
    </div>
  );
}
