import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface RewardsHistoryData {
  walletAddress: string;
  totalEarnedAllTime: string;
  currentClaimableRewards: string;
  totalDelegated: string;
  estimatedApr: number;
  summary: {
    totalValidators: number;
    estimatedMonthsStaking: number;
    isEstimated: boolean;
  };
  validatorBreakdown: Array<{
    validatorAddress: string;
    validatorMoniker: string;
    delegatedAmount: string;
    currentRewards: string;
    estimatedTotalEarned: string;
  }>;
  generatedAt: string;
  note: string;
}

interface RewardsSnapshot {
  totalRewards: string;
  totalDelegated: string;
  validatorCount: number;
  lastUpdated: string;
}

export default function RewardsHistory() {
  const [address, setAddress] = useState('core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj');
  const [isLoading, setIsLoading] = useState(false);
  const [rewardsData, setRewardsData] = useState<RewardsHistoryData | null>(null);
  const [snapshot, setSnapshot] = useState<RewardsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRewardsHistory = async (walletAddress: string) => {
    if (!walletAddress.trim()) {
      setError('Please enter a valid Coreum wallet address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching rewards history for:', walletAddress);
      
      // Fetch both complete history and snapshot
      const [historyResponse, snapshotResponse] = await Promise.all([
        fetch(`/api/balances/wallet/complete-rewards-history?address=${walletAddress}`),
        fetch(`/api/balances/wallet/rewards-snapshot?address=${walletAddress}`)
      ]);

      if (!historyResponse.ok) {
        throw new Error(`Failed to fetch rewards history: ${historyResponse.statusText}`);
      }

      if (!snapshotResponse.ok) {
        throw new Error(`Failed to fetch rewards snapshot: ${snapshotResponse.statusText}`);
      }

      const historyData = await historyResponse.json();
      const snapshotData = await snapshotResponse.json();

      if (!historyData.success) {
        throw new Error(historyData.error || 'Failed to fetch rewards history');
      }

      if (!snapshotData.success) {
        throw new Error(snapshotData.error || 'Failed to fetch rewards snapshot');
      }

      setRewardsData(historyData.data);
      setSnapshot(snapshotData.data);

    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load for the example address
    if (address) {
      fetchRewardsHistory(address);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRewardsHistory(address);
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Complete Rewards History
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Get comprehensive staking rewards analysis for any Coreum wallet address
          </p>
        </div>

        {/* Search Form */}
        <div className="card max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Coreum Wallet Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="core1..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Rewards History'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Fetching rewards data from Coreum blockchain...</p>
          </div>
        )}

        {/* Results */}
        {rewardsData && snapshot && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg w-fit mx-auto mb-3">
                  <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned (Est.)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(rewardsData.totalEarnedAllTime)} CORE
                </p>
              </div>

              <div className="card text-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg w-fit mx-auto mb-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Currently Delegated</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(rewardsData.totalDelegated)} CORE
                </p>
              </div>

              <div className="card text-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg w-fit mx-auto mb-3">
                  <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Claimable Now</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(rewardsData.currentClaimableRewards)} CORE
                </p>
              </div>

              <div className="card text-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg w-fit mx-auto mb-3">
                  <ChartBarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. APR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {rewardsData.estimatedApr}%
                </p>
              </div>
            </div>

            {/* Wallet Analysis */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Wallet Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Address</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                    {rewardsData.walletAddress}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Staking Summary</h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Active Validators: {rewardsData.summary.totalValidators}</p>
                    <p>Estimated Staking Period: {rewardsData.summary.estimatedMonthsStaking} months</p>
                    <p>Analysis Type: {rewardsData.summary.isEstimated ? 'Estimated' : 'Historical'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Validator Breakdown */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Validator Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Validator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Delegated Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current Rewards
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Est. Total Earned
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {rewardsData.validatorBreakdown.map((validator, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {validator.validatorMoniker}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {formatAddress(validator.validatorAddress)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatNumber(validator.delegatedAmount)} CORE
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          {formatNumber(validator.currentRewards)} CORE
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatNumber(validator.estimatedTotalEarned)} CORE
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex">
                <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    About This Analysis
                  </h3>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• Current data is fetched live from the Coreum blockchain</p>
                    <p>• Historical earnings are estimated based on current staking position and 8% APR</p>
                    <p>• Real historical data requires blockchain transaction indexing</p>
                    <p>• Actual rewards depend on validator performance and network conditions</p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Generated at: {new Date(rewardsData.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <details className="card">
              <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100 mb-4">
                Technical Implementation Details
              </summary>
              <div className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Current Data Sources:</h4>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Live Coreum REST API for current rewards and delegations</li>
                    <li>Real-time calculation of claimable rewards</li>
                    <li>Current validator information and delegation amounts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">For Complete Historical Data:</h4>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Blockchain transaction indexer (recommended: BigQuery, The Graph)</li>
                    <li>Event log parsing for reward distribution transactions</li>
                    <li>Historical validator performance tracking</li>
                    <li>Custom database to store processed transaction history</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </Layout>
  );
}
