import React, { useState } from 'react';
import { useBalance } from '@/hooks/useBalance';
import TokenBalanceCard from '@/components/TokenBalanceCard';
import StakingDetailsCard from '@/components/StakingDetailsCard';
import OtherTokensCard from '@/components/OtherTokensCard';
import UserProfileCard from '@/components/UserProfileCard';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function TestBalancePage() {
  const [testAddress, setTestAddress] = useState('core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj');
  const [inputAddress, setInputAddress] = useState(testAddress);
  
  const { balances, isLoading, error, refetch } = useBalance({ 
    manualAddress: testAddress 
  });

  const handleAddressUpdate = () => {
    setTestAddress(inputAddress.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressUpdate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Balance Test Page
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the balance fetching system with any Coreum wallet address.
            This demonstrates the manual address connection feature.
          </p>
        </div>

        {/* Address Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Coreum Wallet Address
              </label>
              <input
                type="text"
                id="address"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="core1..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={handleAddressUpdate}
              disabled={isLoading || !inputAddress.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Fetch Balances
            </button>
          </div>
          
          {testAddress && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Currently viewing:</span> {testAddress}
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin mr-3" />
              <p className="text-blue-800 font-medium">Fetching balance data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load balance data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={refetch}
                    className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Section */}
        {testAddress && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Profile Management</h2>
            <UserProfileCard 
              manualAddress={testAddress}
              onProfileCreated={(profile) => {
                console.log('Profile created:', profile);
              }}
            />
          </div>
        )}

        {/* Balance Display */}
        {balances && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Available</p>
                  <p className="text-xl font-bold text-green-800">
                    {parseFloat(balances.balances.coreum.amount.available).toLocaleString()} CORE
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Staked</p>
                  <p className="text-xl font-bold text-blue-800">
                    {parseFloat(balances.balances.coreum.amount.staked).toLocaleString()} CORE
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Rewards</p>
                  <p className="text-xl font-bold text-purple-800">
                    {parseFloat(balances.balances.coreum.amount.rewards).toLocaleString()} CORE
                  </p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-600 font-medium">Other Tokens</p>
                  <p className="text-xl font-bold text-indigo-800">
                    {balances.balances.tokens.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Balance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* COREUM Balance Card */}
              <TokenBalanceCard 
                tokenData={balances.balances.coreum} 
                isLoading={false} 
              />

              {/* Staking Details Card */}
              <StakingDetailsCard 
                stakingInfo={balances.stakingInfo} 
                isLoading={false} 
              />
            </div>

            {/* Other Tokens Card */}
            {balances.balances.tokens && balances.balances.tokens.length > 0 && (
              <OtherTokensCard 
                tokens={balances.balances.tokens} 
                isLoading={false} 
              />
            )}

            {/* Raw Data (for debugging) */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Raw Data (Debug)</h3>
              <pre className="text-xs text-green-400 overflow-auto max-h-64">
                {JSON.stringify(balances, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Test Instructions</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>1. The pre-filled address belongs to the user and contains real Coreum tokens</p>
            <p>2. You can try other Coreum addresses (must start with "core1")</p>
            <p>3. This demonstrates the manual address connection feature</p>
            <p>4. Data is fetched directly from Coreum mainnet REST APIs</p>
            <p>5. User profiles can be created to link email addresses with wallet addresses</p>
            <p>6. Check the browser console for any errors during development</p>
          </div>
        </div>
      </div>
    </div>
  );
}
