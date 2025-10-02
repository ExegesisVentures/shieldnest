import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { truncateAddress } from '@/utils/wallet-helpers';
import { 
  WalletIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface WalletBalance {
  address: string;
  chain: string;
  type: 'connected' | 'manual';
  label?: string;
  isDefault: boolean;
  balances: {
    available: number;
    staked: number;
    total: number;
  };
  success: boolean;
  error?: string;
}

interface PortfolioSummary {
  totalCore: number;
  totalAvailable: number;
  totalStaked: number;
  totalValueUSD: number;
  corePrice: number;
}

interface PortfolioData {
  wallets: WalletBalance[];
  summary: PortfolioSummary;
  aggregatedData: {
    successfulWallets: number;
    failedWallets: number;
    totalWallets: number;
  };
  lastUpdated: string;
  message: string;
}

export default function MultiWalletPortfolio() {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user]);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/profile/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setPortfolioData(result.data);
      } else {
        setError(result.error || 'Failed to fetch portfolio data');
      }
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCoreAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatUSD = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Portfolio
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchPortfolioData}
          className="btn-primary inline-flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!portfolioData || portfolioData.wallets.length === 0) {
    return (
      <div className="card text-center py-8">
        <WalletIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Wallet Addresses Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add wallet addresses to your profile to view aggregated portfolio data.
        </p>
        <a href="/profile" className="btn-primary">
          Manage Wallet Addresses
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Multi-Wallet Portfolio
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {portfolioData.message}
          </p>
        </div>
        <button
          onClick={fetchPortfolioData}
          className="btn-glass inline-flex items-center"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Portfolio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatUSD(portfolioData.summary.totalValueUSD)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatCoreAmount(portfolioData.summary.totalCore)} CORE
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <WalletIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCoreAmount(portfolioData.summary.totalAvailable)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">CORE</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Staked</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCoreAmount(portfolioData.summary.totalStaked)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">CORE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Details */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Wallet Breakdown
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {portfolioData.aggregatedData.successfulWallets} of {portfolioData.aggregatedData.totalWallets} wallets loaded successfully
          </div>
        </div>

        <div className="space-y-4">
          {portfolioData.wallets.map((wallet, index) => (
            <div 
              key={`${wallet.address}-${index}`}
              className={`p-4 rounded-lg border-2 ${
                wallet.success 
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' 
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    wallet.type === 'connected' 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {wallet.type === 'connected' ? (
                      <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <WalletIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {wallet.label || truncateAddress(wallet.address)}
                      </p>
                      {wallet.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                          Default
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        wallet.type === 'connected'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {wallet.type === 'connected' ? 'Connected' : 'Manual'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {truncateAddress(wallet.address)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {wallet.success ? (
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCoreAmount(wallet.balances.total)} CORE
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCoreAmount(wallet.balances.available)} available • {formatCoreAmount(wallet.balances.staked)} staked
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">Failed to load</span>
                    </div>
                  )}
                </div>
              </div>
              
              {!wallet.success && wallet.error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Error: {wallet.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Last updated: {new Date(portfolioData.lastUpdated).toLocaleString()} • 
        CORE Price: {formatUSD(portfolioData.summary.corePrice)}
      </div>
    </div>
  );
}
