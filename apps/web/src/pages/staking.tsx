import React from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useBalance } from '@/hooks/useBalance';
import StakingInterface from '@/components/staking/StakingInterface';
import LiquidityPools from '@/components/staking/LiquidityPools';
import WalletConnectionPrompt from '@/components/staking/WalletConnectionPrompt';

/**
 * Coreum Staking Page
 * 
 * Following Senior Developer Guidelines:
 * - Public access (no authentication required)
 * - Modular components for maintainability
 * - Graceful degradation for non-connected users
 * - Clean separation of concerns
 */
export default function StakingPage() {
  const { isConnected, connectedWallet } = useWalletContext();
  const { balances, isLoading, isRefreshing, error, refetch } = useBalance();

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:depth-bg-dark-subtle relative overflow-hidden">
      {/* Background depth effects */}
      <div className="absolute top-20 left-10 w-80 h-80 light-accent-blue rounded-full floating-light opacity-60"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 light-accent-green rounded-full floating-light opacity-40" style={{ animationDelay: '4s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-96 h-96 dark-accent-area rounded-full opacity-20"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Coreum Staking
            </h1>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="loading-spinner"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Stake your COREUM tokens to earn rewards and help secure the network. 
            Anyone can participate - no membership required.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!isConnected ? (
            <>
              <WalletConnectionPrompt />
              
              {/* Public Validator Preview - Show even without connection */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                  Available Validators
                </h3>
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Preview of active Coreum validators. Connect your wallet to stake with any validator.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Roll Validation ⭐</h4>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Recommended</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Commission:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">20.0%</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Est. APR:</span>
                          <span className="font-medium text-green-600 dark:text-green-400 ml-1">34.4%</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">50+ More Validators</h4>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Commission rates from 0% to 20%</p>
                        <p>APR rates up to 43%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Staking Interface */}
              <StakingInterface 
                walletAddress={connectedWallet?.address}
                balances={balances || undefined}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                error={error}
                onRefresh={refetch}
              />
              
              {/* Liquidity Pools */}
              <LiquidityPools 
                walletAddress={connectedWallet?.address}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
