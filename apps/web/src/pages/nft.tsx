import React, { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';

export default function NFTPage() {
  const { isConnected } = useWalletContext();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'convert' | 'mint' | 'rewards'>('overview');

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ShieldNest NFT Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Connect your wallet to access NFT features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ShieldNest NFT Hub
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Convert, mint, and manage your ShieldNest NFTs.
        </p>
      </div>

      <div className="flex justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Overview
        </button>
        {isAuthenticated && (
          <>
            <button
              onClick={() => setActiveTab('convert')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'convert'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Convert
            </button>
            <button
              onClick={() => setActiveTab('mint')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'mint'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Mint
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Rewards
            </button>
          </>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">NFT Overview</h2>
          <p>Overview content here</p>
        </div>
      )}

      {activeTab === 'convert' && isAuthenticated && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Convert NFTs</h2>
          <p>Convert content here - requires authentication</p>
        </div>
      )}

      {activeTab === 'mint' && isAuthenticated && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Mint NFT</h2>
          <p>Mint content here - requires authentication</p>
        </div>
      )}

      {activeTab === 'rewards' && isAuthenticated && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Rewards</h2>
          <p>Rewards content here - requires authentication</p>
        </div>
      )}
    </div>
  );
}
