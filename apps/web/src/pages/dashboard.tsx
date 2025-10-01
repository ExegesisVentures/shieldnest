import React, { useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { debugLog } from '@/utils/debug';
import { 
  CubeTransparentIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  FireIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import ShieldNestLogo from '@/components/ShieldNestLogo';

export default function Dashboard() {
  const { isConnected, connectedWallet } = useWalletContext();

  // Production-safe wallet state monitoring
  useEffect(() => {
    debugLog.wallet('Dashboard wallet state changed', {
      isConnected,
      address: connectedWallet?.address
    });
  }, [isConnected, connectedWallet]);

  // Mock data - in real app this would come from API
  const stats = {
    totalSupply: 47,
    maxSupply: 100,
    burned: 3,
    frontendSalePrice: 5000,
    backendBookValue: 10000,
    currentEpoch: 12,
    nextEpochIn: '3 days',
    yourNFTs: isConnected ? 2 : 0,
    pendingRewards: isConnected ? '125.50' : '0',
    totalRewardsEarned: isConnected ? '1,250.00' : '0'
  };

  const supplyProgress = (stats.totalSupply / stats.maxSupply) * 100;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
          ShieldNest NFT
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
          Exclusive membership NFTs with OG conversion, weekly distributions, and governance rights.
        </p>
        
        {/* ShieldNest CTA */}
        <div className="glass-card max-w-md mx-auto p-6 border-primary-200/50 dark:border-primary-700/50">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary-100/80 dark:bg-primary-900/50 rounded-full">
              <ShieldNestLogo size="lg" className="text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
            Introducing ShieldNest
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Our new private custody organization for ultimate crypto security and education.
          </p>
          <a
            href="/"
            className="btn-primary inline-flex items-center w-full justify-center"
          >
            Learn More
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </a>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="glass-card border-yellow-200/50 dark:border-yellow-700/50">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg mr-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Connect your wallet to get started
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Connect your Coreum wallet to view NFTs, balances, and participate in the ecosystem.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Supply */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100/80 dark:bg-primary-900/50 rounded-lg">
              <CubeTransparentIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Supply</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.totalSupply}/{stats.maxSupply}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${supplyProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {supplyProgress.toFixed(1)}% minted
            </p>
          </div>
        </div>

        {/* Floor Price */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Floor Price</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ${stats.frontendSalePrice.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Book: ${stats.backendBookValue.toLocaleString()}
          </p>
        </div>

        {/* Burned NFTs */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100/80 dark:bg-red-900/50 rounded-lg">
              <FireIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Burned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.burned}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Removed from supply
          </p>
        </div>

        {/* Current Epoch */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100/80 dark:bg-blue-900/50 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Epoch</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                #{stats.currentEpoch}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Next in {stats.nextEpochIn}
          </p>
        </div>
      </div>

      {/* User Stats (if connected) */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100/80 dark:bg-purple-900/50 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Your NFTs</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats.yourNFTs}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  ${stats.pendingRewards}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  ${stats.totalRewardsEarned}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/portfolio"
            className="p-4 glass-card hover:shadow-glass dark:hover:shadow-glass-dark transition-all duration-600 text-center group"
          >
            <div className="w-12 h-12 bg-primary-100/80 dark:bg-primary-900/50 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Portfolio</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tokens & NFTs
            </p>
          </a>

          <a
            href="/nft"
            className="p-4 glass-card hover:shadow-glass dark:hover:shadow-glass-dark transition-all duration-600 text-center group"
          >
            <div className="w-12 h-12 bg-green-100/80 dark:bg-green-900/50 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CubeTransparentIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">NFT Hub</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Convert, Mint & Rewards
            </p>
          </a>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pricing</h2>
        <div className="glass-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${stats.frontendSalePrice.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current market price for OG holders
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Book Value</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${stats.backendBookValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for floor price calculations
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Note:</strong> Floor price increases by $50 per net burned NFT. When selling back, 
              your COREUM amount is locked at current oracle price - if COREUM price changes during 
              the 14-day staking period, your token amount stays the same but USD value may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
