import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BeakerIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CogIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AdminGuard from '@/components/AdminGuard';
import { useWalletContext } from '@/contexts/WalletProvider';
import { authenticatedApiRequest } from '@/lib/api';
import ThemeAwareTokenImage from '@/components/ui/ThemeAwareTokenImage';

interface PoolConfig {
  id: string;
  name: string;
  token0: { symbol: string; denom: string };
  token1: { symbol: string; denom: string };
  fee: number;
  exists: boolean;
  status: 'active' | 'not_created' | 'unknown';
  error?: string;
}

interface PoolCreationData {
  poolCreationData: any;
  transactionData: any;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
    note: string;
  };
}

export default function AdminPools() {
  const { connectedWallet } = useWalletContext();
  const [pools, setPools] = useState<PoolConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationData, setCreationData] = useState<PoolCreationData | null>(null);
  const [formData, setFormData] = useState({
    token0Amount: '',
    token1Amount: '',
    slippage: '0.5'
  });

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const response = await authenticatedApiRequest('api/admin/pools/configs');
      if (response.ok) {
        const data = await response.json();
        setPools(data.data.pools || []);
      } else {
        console.error('Failed to fetch pools');
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPool || !connectedWallet) {
      alert('Please select a pool and connect your wallet');
      return;
    }

    try {
      const response = await authenticatedApiRequest('api/admin/pools/create', {
        method: 'POST',
        body: JSON.stringify({
          poolId: selectedPool.id,
          token0Amount: formData.token0Amount,
          token1Amount: formData.token1Amount,
          walletAddress: connectedWallet.address,
          slippage: parseFloat(formData.slippage)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCreationData(data.data);
        setShowCreateModal(false);
        alert('Pool creation transaction prepared! Check the transaction data below.');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating pool:', error);
      alert('Error creating pool');
    }
  };

  const openCreateModal = (pool: PoolConfig) => {
    setSelectedPool(pool);
    setFormData({
      token0Amount: '',
      token1Amount: '',
      slippage: '0.5'
    });
    setShowCreateModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'not_created':
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active on DEX';
      case 'not_created':
        return 'Not Created';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'not_created':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      default:
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/admin"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Admin
              </Link>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-4">
                  <BeakerIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Pool Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create and manage liquidity pools on Coreum DEX
                  </p>
                </div>
              </div>
              
              <button
                onClick={fetchPools}
                className="btn-secondary flex items-center"
                disabled={loading}
              >
                <CogIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            </div>
          </div>

          {/* Pool Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {pools.filter(p => p.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Pools</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {pools.filter(p => p.status === 'not_created').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Creation</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <BeakerIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {pools.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Pools</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pools Grid */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              ShieldNest Liquidity Pools
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading pools...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    {/* Pool Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ThemeAwareTokenImage
                          symbol={pool.token0.symbol}
                          alt={pool.token0.symbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <ThemeAwareTokenImage
                          symbol={pool.token1.symbol}
                          alt={pool.token1.symbol}
                          width={32}
                          height={32}
                          className="rounded-full -ml-2"
                        />
                      </div>
                      
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pool.status)}`}>
                        {getStatusIcon(pool.status)}
                        <span className="ml-1">{getStatusText(pool.status)}</span>
                      </div>
                    </div>

                    {/* Pool Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {pool.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pool.fee}% trading fee
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2">
                      {pool.status === 'not_created' ? (
                        <button
                          onClick={() => openCreateModal(pool)}
                          className="flex-1 btn-primary text-sm py-2"
                          disabled={!connectedWallet}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Pool
                        </button>
                      ) : (
                        <div className="flex-1 text-center py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
                          {pool.status === 'active' ? 'Pool Active' : 'Status Unknown'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Data Display */}
          {creationData && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Pool Creation Transaction
              </h2>
              
              <div className="space-y-6">
                {/* Instructions */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Instructions:</h3>
                  <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>1. {creationData.instructions.step1}</li>
                    <li>2. {creationData.instructions.step2}</li>
                    <li>3. {creationData.instructions.step3}</li>
                  </ol>
                  <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-800/30 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> {creationData.instructions.note}
                    </p>
                  </div>
                </div>

                {/* Transaction Data */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Transaction Data (Copy for wallet):
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(creationData.transactionData, null, 2)}
                  </pre>
                </div>

                {/* Pool Creation Data */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Pool Details:
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pool Name:</span>
                      <span className="ml-2 font-medium">{creationData.poolCreationData.poolName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                      <span className="ml-2 font-medium">{creationData.poolCreationData.fee}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Token 0:</span>
                      <span className="ml-2 font-medium">
                        {(parseInt(creationData.poolCreationData.token0.amount) / 1_000_000).toLocaleString()} {creationData.poolCreationData.token0.denom}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Token 1:</span>
                      <span className="ml-2 font-medium">
                        {(parseInt(creationData.poolCreationData.token1.amount) / 1_000_000).toLocaleString()} {creationData.poolCreationData.token1.denom}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCreationData(null)}
                  className="btn-secondary"
                >
                  Clear Transaction Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Pool Modal */}
        {showCreateModal && selectedPool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Create {selectedPool.name} Pool
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreatePool} className="space-y-6">
                {/* Token 0 Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {selectedPool.token0.symbol} Amount
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.token0Amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, token0Amount: e.target.value }))}
                    className="input-field"
                    placeholder="0.0"
                    required
                  />
                </div>

                {/* Token 1 Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {selectedPool.token1.symbol} Amount
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.token1Amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, token1Amount: e.target.value }))}
                    className="input-field"
                    placeholder="0.0"
                    required
                  />
                </div>

                {/* Slippage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slippage Tolerance (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.slippage}
                    onChange={(e) => setFormData(prev => ({ ...prev, slippage: e.target.value }))}
                    className="input-field"
                    placeholder="0.5"
                  />
                </div>

                {/* Wallet Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Creator Wallet:</strong> {connectedWallet?.address}
                  </p>
                </div>

                {/* Warning */}
                <div className="p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-orange-800 dark:text-orange-200">
                      This will prepare a transaction for pool creation. You'll need to sign it with your wallet and broadcast it to Coreum network.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={!connectedWallet}
                >
                  Prepare Pool Creation Transaction
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
