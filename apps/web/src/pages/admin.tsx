import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedApiRequest } from '@/lib/api';
import AdminGuard from '@/components/AdminGuard';
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  CubeTransparentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface RiseHolder {
  id: string;
  walletAddress: string;
  originalCount: number;
  remainingCount: number;
  addedBy: string;
  notes?: string;
  createdAt: string;
  conversions: any[];
}

interface AdminStats {
  totalUsers: number;
  totalWallets: number;
  totalRiseHolders: number;
  totalConversions: number;
  totalRemainingRiseNFTs: number;
}

export default function Admin() {
  const { isConnected, connectedWallet } = useWalletContext();
  const { user: currentUser } = useAuth();
  const [holders, setHolders] = useState<RiseHolder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    walletAddress: '',
    nftCount: '',
    notes: ''
  });

  // Check if current user is admin (same logic as users page)
  const isAdmin = currentUser && (
    currentUser.email === 'admin@roll-nft.com' || 
    currentUser.email === 'mj@roll-nft.com' ||
    connectedWallet?.address === 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
  );

  // Debug logging
  console.log('Admin Debug:', {
    isConnected,
    isAdmin,
    currentUserEmail: currentUser?.email,
    connectedWalletAddress: connectedWallet?.address,
    expectedWallet: 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
  });

  useEffect(() => {
    if (isConnected && isAdmin) {
      fetchData();
    }
  }, [isConnected, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [holdersRes, statsRes] = await Promise.all([
        authenticatedApiRequest('api/admin/rise-holders'),
        authenticatedApiRequest('api/admin/stats')
      ]);

      if (holdersRes.ok) {
        const holdersData = await holdersRes.json();
        setHolders(holdersData.data.holders || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authenticatedApiRequest('api/admin/rise-holders', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: formData.walletAddress,
          nftCount: parseInt(formData.nftCount),
          notes: formData.notes || undefined
        })
      });

      if (response.ok) {
        alert('Shield NFT holder added successfully!');
        setFormData({ walletAddress: '', nftCount: '', notes: '' });
        setShowAddForm(false);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding holder:', error);
      alert('Error adding holder');
    }
  };

  const handleUpdateHolder = async (id: string, remainingCount: number) => {
    try {
      const response = await authenticatedApiRequest(`api/admin/rise-holders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ remainingCount })
      });

      if (response.ok) {
        alert('Holder updated successfully!');
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating holder:', error);
      alert('Error updating holder');
    }
  };

  const handleDeleteHolder = async (id: string, walletAddress: string) => {
    if (!confirm(`Are you sure you want to delete holder ${walletAddress}?`)) {
      return;
    }

    try {
      const response = await authenticatedApiRequest(`api/admin/rise-holders/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Holder deleted successfully!');
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting holder:', error);
      alert('Error deleting holder');
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage Shield NFT holders and conversions.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Admin Access Required
          </h3>
          <p className="text-yellow-700">
            You need to connect your admin wallet to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage users, Shield NFT holders and conversions.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Shield Holder
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/users"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Management</h3>
              <p className="text-gray-600 dark:text-gray-400">View and manage all user profiles</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/shield-nfts"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
        >
          <div className="flex items-center">
            <CubeTransparentIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Shield NFT Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Manage Shield NFT holders and conversions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/pools"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500"
        >
          <div className="flex items-center">
            <BeakerIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pool Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Create and manage DEX liquidity pools</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/support"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Support Tickets</h3>
              <p className="text-gray-600 dark:text-gray-400">Create and manage user support</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card text-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
          <div className="card text-center">
            <CubeTransparentIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalWallets}</p>
            <p className="text-sm text-gray-500">Connected Wallets</p>
          </div>
          <div className="card text-center">
            <UserGroupIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalRiseHolders}</p>
            <p className="text-sm text-gray-500">Shield Holders</p>
          </div>
          <div className="card text-center">
            <ArrowPathIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalConversions}</p>
            <p className="text-sm text-gray-500">Conversions</p>
          </div>
          <div className="card text-center">
            <CubeTransparentIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalRemainingRiseNFTs}</p>
            <p className="text-sm text-gray-500">Remaining Shield NFTs</p>
          </div>
        </div>
      )}

      {/* Add Holder Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Shield NFT Holder</h2>
          <form onSubmit={handleAddHolder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="core1..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Shield NFTs
              </label>
              <input
                type="number"
                min="1"
                value={formData.nftCount}
                onChange={(e) => setFormData({...formData, nftCount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Additional notes about this holder..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Add Holder
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rise Holders Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Shield NFT Holders</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading holders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holders.map((holder) => (
                  <tr key={holder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {holder.walletAddress.substring(0, 12)}...{holder.walletAddress.substring(holder.walletAddress.length - 8)}
                      </div>
                      {holder.notes && (
                        <div className="text-sm text-gray-500 mt-1">{holder.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {holder.originalCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={holder.originalCount}
                        value={holder.remainingCount}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          if (newValue !== holder.remainingCount) {
                            handleUpdateHolder(holder.id, newValue);
                          }
                        }}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {holder.conversions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {holder.addedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleDeleteHolder(holder.id, holder.walletAddress)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete holder"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {holders.length === 0 && (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No Shield NFT holders found</p>
                <p className="text-sm text-gray-400 mt-1">Add holders using the form above</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </AdminGuard>
  );
}
