import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  WalletIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CubeTransparentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AnonymousWalletManager from './AnonymousWalletManager';

interface WalletAddress {
  id: string;
  address: string;
  label?: string;
}

interface WalletBalance {
  address: string;
  balances: {
    coreum: {
      amount: string;
      usdValue: number;
      usdValues: {
        total: number;
        available: number;
        staked: number;
        rewards: number;
      };
    };
    tokens: Array<{
      denom: string;
      amount: string;
      symbol: string;
      decimals: number;
      usdValue: number;
    }>;
  };
  stakingInfo?: {
    totalStaked: string;
    totalRewards: string;
    validators: Array<{
      validatorAddress: string;
      stakedAmount: string;
      rewards: string;
    }>;
  };
  error?: string;
}

interface AnonymousPortfolioViewProps {
  onProfileCreated?: () => void;
}

export default function AnonymousPortfolioView({ onProfileCreated }: AnonymousPortfolioViewProps) {
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showManager, setShowManager] = useState(true);

  useEffect(() => {
    if (wallets.length > 0) {
      fetchBalances();
    } else {
      setBalances([]);
    }
  }, [wallets]);

  const fetchBalances = async () => {
    setIsLoading(true);
    
    try {
      const promises = wallets.map(async (wallet) => {
        try {
          const response = await fetch(
            `/api/balances/wallet?address=${encodeURIComponent(wallet.address)}`
          );
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              return {
                address: wallet.address,
                balances: result.data.balances,
                stakingInfo: result.data.stakingInfo
              };
            }
          }
          
          return {
            address: wallet.address,
            error: 'Failed to fetch balance data'
          };
        } catch (error) {
          return {
            address: wallet.address,
            error: 'Network error'
          };
        }
      });

      const results = await Promise.all(promises);
      setBalances(results as WalletBalance[]);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletsChange = (newWallets: WalletAddress[]) => {
    setWallets(newWallets);
    if (newWallets.length > 0) {
      setShowManager(false);
    } else {
      setShowManager(true);
    }
  };

  const calculateTotalPortfolioValue = () => {
    return balances.reduce((total, wallet) => {
      if (wallet.balances) {
        return total + wallet.balances.coreum.usdValues.total;
      }
      return total;
    }, 0);
  };

  const formatUSD = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCoreAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  };

  const totalPortfolioValue = calculateTotalPortfolioValue();

  if (showManager || wallets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <EyeIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Portfolio Viewer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Enter wallet addresses to view portfolio data in read-only mode. 
              No registration required for up to 2 wallets.
            </p>
          </div>
          
          <div className="card">
            <AnonymousWalletManager 
              onWalletsChange={handleWalletsChange}
              onProfileCreated={onProfileCreated}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Anonymous Portfolio</h1>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-gray-600 dark:text-gray-400">
              Read-only view of your wallet addresses
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50">
              Anonymous Mode
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBalances}
            disabled={isLoading}
            className="btn-glass inline-flex items-center"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowManager(true)}
            className="btn-primary inline-flex items-center text-sm"
          >
            <WalletIcon className="h-4 w-4 mr-2" />
            Manage Wallets
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {totalPortfolioValue > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Portfolio Value</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatUSD(totalPortfolioValue)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Combined value across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100/80 dark:bg-primary-900/50 rounded-lg">
                <WalletIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wallets Tracked</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {wallets.length}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {wallets.length < 2 ? 'Can add 1 more without registration' : 'Maximum for anonymous users'}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg">
                <EyeIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Access Level</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Read-Only
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Connect wallet for transactions
            </p>
          </div>
        </div>
      )}

      {/* Wallet Details */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Wallet Details</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {wallets.map((wallet) => {
            const walletBalance = balances.find(b => b.address === wallet.address);
            const isWalletLoading = !walletBalance && isLoading;
            
            return (
              <div key={wallet.id} className="card">
                <div className="space-y-4">
                  {/* Wallet Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {wallet.label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {truncateAddress(wallet.address)}
                      </p>
                    </div>
                    {isWalletLoading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    )}
                  </div>

                  {/* Balance Data */}
                  {walletBalance && !walletBalance.error ? (
                    <div className="space-y-3">
                      {/* CORE Balance */}
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CORE Balance</span>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCoreAmount(walletBalance.balances.coreum.amount)} CORE
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatUSD(walletBalance.balances.coreum.usdValue)}
                          </p>
                        </div>
                      </div>

                      {/* Staking Info */}
                      {walletBalance.stakingInfo && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Staked</span>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatCoreAmount(walletBalance.stakingInfo.totalStaked)} CORE
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Rewards: {formatCoreAmount(walletBalance.stakingInfo.totalRewards)} CORE
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Other Tokens */}
                      {walletBalance.balances.tokens && walletBalance.balances.tokens.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Tokens</p>
                          {walletBalance.balances.tokens.slice(0, 3).map((token, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{token.symbol}</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {parseFloat(token.amount).toLocaleString()} {token.symbol}
                              </span>
                            </div>
                          ))}
                          {walletBalance.balances.tokens.length > 3 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              +{walletBalance.balances.tokens.length - 3} more tokens
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : walletBalance?.error ? (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">{walletBalance.error}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Notice */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CubeTransparentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Want Full Access?
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Connect your wallet to mint NFTs, trade tokens, and access all features
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
