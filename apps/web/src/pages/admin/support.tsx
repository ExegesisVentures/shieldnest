import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ExclamationTriangleIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import AdminGuard from '@/components/AdminGuard';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedApiRequest } from '@/lib/api';

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  walletAddress?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'account' | 'wallet' | 'nft' | 'staking' | 'other';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: SupportResponse[];
}

interface SupportResponse {
  id: string;
  ticketId: string;
  message: string;
  isAdminResponse: boolean;
  createdBy: string;
  createdAt: string;
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
}

export default function AdminSupport() {
  const { isConnected, connectedWallet } = useWalletContext();
  const { user: currentUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Check if current user is admin
  const isAdmin = currentUser && (
    currentUser.email === 'admin@roll-nft.com' || 
    currentUser.email === 'mj@roll-nft.com' ||
    connectedWallet?.address === 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
  );

  useEffect(() => {
    if (isConnected && isAdmin) {
      fetchTickets();
      fetchStats();
    }
  }, [isConnected, isAdmin]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // For now, we'll create mock data since the API endpoint doesn't exist yet
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          userId: 'user1',
          userEmail: 'user@example.com',
          walletAddress: 'core1abc123...',
          subject: 'Unable to connect Keplr wallet',
          description: 'I am having trouble connecting my Keplr wallet to the platform. It shows an error message.',
          status: 'open',
          priority: 'high',
          category: 'wallet',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: []
        },
        {
          id: '2',
          userId: 'user2',
          userEmail: 'holder@example.com',
          subject: 'Shield NFT conversion not working',
          description: 'My Shield NFT conversion has been pending for 2 hours. Can you help?',
          status: 'in_progress',
          priority: 'medium',
          category: 'nft',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: 'admin@roll-nft.com',
          responses: [
            {
              id: 'r1',
              ticketId: '2',
              message: 'We are looking into this issue. Please wait while we investigate.',
              isAdminResponse: true,
              createdBy: 'admin@roll-nft.com',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now
      const mockStats: SupportStats = {
        totalTickets: 15,
        openTickets: 3,
        inProgressTickets: 2,
        resolvedTickets: 10,
        avgResponseTime: 2.5
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (!isConnected) {
    return (
      <AdminGuard>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Support Tickets
            </h1>
            <p className="text-xl text-gray-600">
              Manage user support tickets and requests.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Admin Access Required
            </h3>
            <p className="text-yellow-700">
              You need to connect your admin wallet to access support ticket management.
            </p>
          </div>
        </div>
      </AdminGuard>
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
              Support Tickets
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Manage user support tickets and requests.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Ticket
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="card text-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              <p className="text-sm text-gray-500">Total Tickets</p>
            </div>
            <div className="card text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
              <p className="text-sm text-gray-500">Open</p>
            </div>
            <div className="card text-center">
              <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTickets}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="card text-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
            <div className="card text-center">
              <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
              <p className="text-sm text-gray-500">Avg Response</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['all', 'open', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tickets Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading tickets...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{ticket.id}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {ticket.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.userEmail}
                            </div>
                            {ticket.walletAddress && (
                              <div className="text-sm text-gray-500">
                                {ticket.walletAddress.substring(0, 12)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {ticket.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View ticket"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="Edit ticket"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTickets.length === 0 && (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No support tickets found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {filter === 'all' ? 'No tickets have been created yet' : `No ${filter.replace('_', ' ')} tickets`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Ticket #{selectedTicket.id}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedTicket.subject}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Description</h4>
                    <p className="text-gray-700 mt-1">{selectedTicket.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Status</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Priority</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                  </div>
                  
                  {selectedTicket.responses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Responses</h4>
                      <div className="space-y-2">
                        {selectedTicket.responses.map((response) => (
                          <div key={response.id} className={`p-3 rounded-lg ${response.isAdminResponse ? 'bg-blue-50' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-start">
                              <p className="text-sm text-gray-700">{response.message}</p>
                              <span className="text-xs text-gray-500 ml-2">
                                {response.isAdminResponse ? 'Admin' : 'User'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(response.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
