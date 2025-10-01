import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon,
  ChartBarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CubeTransparentIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Test page specifically for wallet core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj
const TEST_WALLET_ADDRESS = 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj';

export default function TestPortfolio() {
  const [balanceData, setBalanceData] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [nftData, setNftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Testing with wallet address: ${TEST_WALLET_ADDRESS}`);
      
      // Fetch balance data
      const balanceResponse = await fetch(`/api/balances/wallet?address=${encodeURIComponent(TEST_WALLET_ADDRESS)}`);
      
      // Fetch earnings history
      const earningsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/balances/wallet/earnings-history?address=${encodeURIComponent(TEST_WALLET_ADDRESS)}`);
      
      // Fetch NFT holdings
      const nftResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/balances/wallet/nfts?address=${encodeURIComponent(TEST_WALLET_ADDRESS)}`);
      
      const [balanceResult, earningsResult, nftResult] = await Promise.all([
        balanceResponse.json(),
        earningsResponse.json(),
        nftResponse.json()
      ]);
      
      console.log('Balance API Result:', balanceResult);
      console.log('Earnings API Result:', earningsResult);
      console.log('NFT API Result:', nftResult);
      
      if (balanceResult.success) {
        setBalanceData(balanceResult.data);
      } else {
        console.error('Balance API failed:', balanceResult.error);
      }
      
      if (earningsResult.success) {
        setEarningsData(earningsResult.data);
      } else {
        console.error('Earnings API failed:', earningsResult.error);
      }
      
      if (nftResult.success) {
        setNftData(nftResult.data);
      } else {
        console.error('NFT API failed:', nftResult.error);
      }
      
    } catch (err: any) {
      console.error('API call failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatUSD = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCoreAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Portfolio Test</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Testing with wallet: {TEST_WALLET_ADDRESS}
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={isLoading}
          className="btn-glass inline-flex items-center"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card border-red-200/50 dark:border-red-700/50">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                API Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Summary Cards */}
      {balanceData && earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Portfolio Value */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio Value</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatUSD(balanceData.balances.coreum.usdValues.total)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total value of all tokens
            </p>
          </div>

          {/* Coreum Earned */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100/80 dark:bg-primary-900/50 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CORE Earned</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCoreAmount(earningsData.totalEarned)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total CORE rewards earned
            </p>
          </div>

          {/* Current Rewards */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Rewards</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCoreAmount(earningsData.currentRewards)} CORE
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Available to claim
            </p>
          </div>
        </div>
      )}

      {/* Token Balance Details */}
      {balanceData && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Token Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Available</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {formatCoreAmount(balanceData.balances.coreum.amount.available)} CORE
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {formatUSD(balanceData.balances.coreum.usdValues.available)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Staked</p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {formatCoreAmount(balanceData.balances.coreum.amount.staked)} CORE
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {formatUSD(balanceData.balances.coreum.usdValues.staked)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Unbonding</p>
              <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                {formatCoreAmount(balanceData.balances.coreum.amount.unbonding)} CORE
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                {formatUSD(balanceData.balances.coreum.usdValues.unbonding)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Rewards</p>
              <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                {formatCoreAmount(balanceData.balances.coreum.amount.rewards)} CORE
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {formatUSD(balanceData.balances.coreum.usdValues.rewards)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NFT Holdings */}
      {nftData && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">NFT Holdings</h2>
          
          {nftData.totalNFTs > 0 ? (
            <div className="space-y-6">
              {/* NFT Collection Summary */}
              <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Collection Value</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {formatUSD(nftData.collections.rollNft.totalValue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending NFT Rewards</p>
                    <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                      {formatCoreAmount(nftData.collections.rollNft.pendingRewards)} CORE
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total NFT Earned</p>
                    <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                      {formatCoreAmount(nftData.collections.rollNft.totalEarned)} CORE
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual NFTs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {nftData.nfts.map((nft: any) => (
                  <div key={nft.id} className="card">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <CubeTransparentIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {nft.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Value: {formatUSD(nft.currentValue)}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <p>Pending: {nft.rewards.pending} CORE</p>
                          <p>Total Earned: {nft.rewards.totalEarned} CORE</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <CubeTransparentIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No NFTs Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This wallet doesn't own any ShieldNest NFTs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Earnings History Details */}
      {earningsData && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Earnings Analysis</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Calculation Method</p>
                <p className="text-gray-600 dark:text-gray-400">{earningsData.calculationMethod}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(earningsData.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
            
            {earningsData.stakingHistory && earningsData.stakingHistory.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Staking History</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-600 dark:text-gray-400">
                    {JSON.stringify(earningsData.stakingHistory, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">{earningsData.note}</p>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Debug */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {balanceData && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Balance Data</h3>
            <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-green-400">
                {JSON.stringify(balanceData, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {earningsData && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Earnings Data</h3>
            <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-green-400">
                {JSON.stringify(earningsData, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {nftData && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">NFT Data</h3>
            <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-green-400">
                {JSON.stringify(nftData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
