import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminGuard from '@/components/AdminGuard';
import Layout from '@/components/Layout';
import { 
  UserGroupIcon,
  WalletIcon,
  CubeTransparentIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface AdminStats {
  users: {
    total: number;
    withWallets: number;
  };
  wallets: {
    total: number;
    verified: number;
  };
  nfts: {
    totalClaims: number;
    completedClaims: number;
    totalConversions: number;
    completedConversions: number;
    totalSupply: number;
  };
  legal: {
    activeTMAs: number;
    activePMAs: number;
    tmaConsents: number;
    pmaConsents: number;
  };
}

interface RiseHolder {
  id: string;
  walletAddress: string;
  originalCount: number;
  remainingCount: number;
  createdAt: string;
  conversions: Array<{
    id: string;
    status: string;
    createdAt: string;
    user: {
      email: string;
      name: string;
    };
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [riseHolders, setRiseHolders] = useState<RiseHolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rise-holders' | 'users' | 'legal'>('overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch Rise holders
      const holdersResponse = await fetch('/api/admin/rise-holders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (holdersResponse.ok) {
        const holdersData = await holdersResponse.json();
        if (holdersData.success) {
          setRiseHolders(holdersData.data.holders);
        }
      }

    } catch (err) {
      console.error('Admin data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <ArrowPathIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
            </div>
          </div>
        </Layout>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchAdminData}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </Layout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back, {user?.email}
              </p>
            </div>
            <button
              onClick={fetchAdminData}
              className="btn-secondary flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'rise-holders', name: 'Rise Holders', icon: CubeTransparentIcon },
                { id: 'users', name: 'Users', icon: UserGroupIcon },
                { id: 'legal', name: 'Legal', icon: ShieldCheckIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users */}
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100/80 dark:bg-blue-900/50 rounded-lg">
                      <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.users.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stats.users.withWallets} with wallets
                  </p>
                </div>

                {/* Wallets */}
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
                      <WalletIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Wallets</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.wallets.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stats.wallets.verified} verified
                  </p>
                </div>

                {/* NFTs */}
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100/80 dark:bg-purple-900/50 rounded-lg">
                      <CubeTransparentIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Supply</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.nfts.totalSupply.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stats.nfts.completedClaims} claims + {stats.nfts.completedConversions} conversions
                  </p>
                </div>

                {/* Legal */}
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100/80 dark:bg-orange-900/50 rounded-lg">
                      <ShieldCheckIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Legal Documents</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {stats.legal.activeTMAs + stats.legal.activePMAs}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stats.legal.activeTMAs} TMAs + {stats.legal.activePMAs} PMAs
                  </p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NFT Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    NFT Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Claims:</span>
                      <span className="font-medium">{stats.nfts.totalClaims}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed Claims:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {stats.nfts.completedClaims}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Conversions:</span>
                      <span className="font-medium">{stats.nfts.totalConversions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed Conversions:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {stats.nfts.completedConversions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Legal Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active TMAs:</span>
                      <span className="font-medium">{stats.legal.activeTMAs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active PMAs:</span>
                      <span className="font-medium">{stats.legal.activePMAs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">TMA Consents:</span>
                      <span className="font-medium">{stats.legal.tmaConsents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">PMA Consents:</span>
                      <span className="font-medium">{stats.legal.pmaConsents}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rise Holders Tab */}
          {activeTab === 'rise-holders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Rise NFT Holders ({riseHolders.length})
                </h2>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Holder
                </button>
              </div>

              <div className="card">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Wallet Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Original Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Converted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {riseHolders.map((holder) => (
                        <tr key={holder.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                            {formatAddress(holder.walletAddress)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {holder.originalCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {holder.remainingCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {holder.originalCount - holder.remainingCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(holder.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  User Management
                </h2>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>

              <div className="card">
                <p className="text-gray-600 dark:text-gray-400">
                  User management functionality will be implemented here.
                </p>
              </div>
            </div>
          )}

          {/* Legal Tab */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Legal Document Management
                </h2>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Document
                </button>
              </div>

              <div className="card">
                <p className="text-gray-600 dark:text-gray-400">
                  Legal document management functionality will be implemented here.
                </p>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AdminGuard>
  );
}
