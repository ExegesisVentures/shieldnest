import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletProvider';
import { authenticatedApiRequest } from '@/lib/api';
import AdminGuard from '@/components/AdminGuard';
import { 
  UserGroupIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  WalletIcon,
  CubeIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  profileSettings?: any;
  wallets: {
    address: string;
    chain: string;
    verifiedAt?: string;
    createdAt: string;
  }[];
  userWallets: {
    address: string;
    chain: string;
    label?: string;
    isDefault: boolean;
    addedAt: string;
  }[];
  claims: {
    type: string;
    status: string;
    tokenId?: string;
    createdAt: string;
  }[];
  rewardClaims: {
    amount: string;
    claimed: boolean;
    claimedAt?: string;
  }[];
}

interface UserSummary {
  totalUsers: number;
  emailUsers: number;
  walletOnlyUsers: number;
  verifiedUsers: number;
  usersWithNFTs: number;
}

export default function AdminUsers() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const { isConnected, connectedWallet } = useWalletContext();
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    notes: ''
  });
  const [supportFormData, setSupportFormData] = useState({
    issue: '',
    priority: 'medium',
    notes: ''
  });

  // Check if current user is admin
  const isAdmin = currentUser && (
    currentUser.email === 'admin@roll-nft.com' || 
    currentUser.email === 'mj@roll-nft.com' ||
    connectedWallet?.address === 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
  );

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authenticatedApiRequest('api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
        setSummary(data.data.summary);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || '',
      notes: user.profileSettings?.adminNotes || ''
    });
    setShowUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await authenticatedApiRequest(`api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(userFormData)
      });

      if (response.ok) {
        alert('User updated successfully!');
        setShowUserModal(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await authenticatedApiRequest(`api/admin/users/${selectedUser.id}/support`, {
        method: 'POST',
        body: JSON.stringify(supportFormData)
      });

      if (response.ok) {
        alert('Support ticket created successfully!');
        setShowSupportModal(false);
        setSupportFormData({ issue: '', priority: 'medium', notes: '' });
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
      alert('Error creating support ticket');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.wallets.some(w => w.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link
          href="/admin"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Admin
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
            User Management
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage user profiles, NFT holdings, and support tickets.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="stat-card text-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalUsers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          </div>
          <div className="stat-card text-center">
            <EnvelopeIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.emailUsers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email Users</p>
          </div>
          <div className="stat-card text-center">
            <WalletIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.walletOnlyUsers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Only</p>
          </div>
          <div className="stat-card text-center">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.verifiedUsers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
          </div>
          <div className="stat-card text-center">
            <CubeIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.usersWithNFTs}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">With NFTs</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or wallet address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Wallets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  NFTs
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {users.length === 0 ? 'No users found' : 'No users match your search'}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {users.length === 0 ? 'Users will appear here once they sign up' : 'Try adjusting your search terms'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const nftCount = user.claims?.filter(c => c.status === 'COMPLETED').length || 0;
                  const isWalletOnly = user.email?.includes('@wallet.local');
                  const totalRewards = user.rewardClaims?.reduce((sum, claim) => sum + parseFloat(claim.amount || '0'), 0) || 0;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {(user.firstName || user.name || user.email)[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.firstName || user.name || 'Unnamed User'}
                              {user.lastName && ` ${user.lastName}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isWalletOnly ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              <WalletIcon className="h-3 w-3 mr-1" />
                              Wallet
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              Email
                            </span>
                          )}
                          {user.emailVerified && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {user.wallets.length + user.userWallets.length} wallet(s)
                        </div>
                        {(user.wallets.length > 0 || user.userWallets.length > 0) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-xs">
                            {user.wallets[0]?.address || user.userWallets[0]?.address}
                            {(user.wallets.length + user.userWallets.length) > 1 && ' +more'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {nftCount} NFT{nftCount !== 1 ? 's' : ''}
                        </div>
                        {totalRewards > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {totalRewards.toFixed(2)} CORE rewards
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowSupportModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-200"
                        >
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Edit User: {selectedUser.firstName || selectedUser.name || selectedUser.email}
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={userFormData.notes}
                  onChange={(e) => setUserFormData({ ...userFormData, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {showSupportModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Create Support Ticket for {selectedUser.firstName || selectedUser.name || selectedUser.email}
            </h3>
            <form onSubmit={handleCreateSupportTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Type
                </label>
                <select
                  value={supportFormData.issue}
                  onChange={(e) => setSupportFormData({ ...supportFormData, issue: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select an issue type...</option>
                  <option value="password_reset">Password Reset</option>
                  <option value="wallet_access">Wallet Access</option>
                  <option value="nft_missing">Missing NFT</option>
                  <option value="rewards_issue">Rewards Issue</option>
                  <option value="technical_support">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={supportFormData.priority}
                  onChange={(e) => setSupportFormData({ ...supportFormData, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={supportFormData.notes}
                  onChange={(e) => setSupportFormData({ ...supportFormData, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional details about the issue..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminGuard>
  );
}
