import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  wallets: Array<{
    id: string;
    address: string;
    chain: string;
    verifiedAt: string | null;
    createdAt: string;
  }>;
}

interface UserProfileCardProps {
  manualAddress?: string;
  onProfileCreated?: (profile: UserProfile) => void;
}

export default function UserProfileCard({ manualAddress, onProfileCreated }: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    walletAddress: manualAddress || ''
  });

  // Fetch existing profile by wallet address
  useEffect(() => {
    if (manualAddress) {
      fetchProfileByWallet(manualAddress);
      setFormData(prev => ({ ...prev, walletAddress: manualAddress }));
    }
  }, [manualAddress]);

  const fetchProfileByWallet = async (address: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get<any>(`api/users/by-wallet/${address}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Transform the response to match UserProfile interface
          const userData = result.data;
        const transformedProfile: UserProfile = {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.name,
          createdAt: userData.user.createdAt,
          updatedAt: userData.user.createdAt, // Use createdAt as fallback
          wallets: [userData.wallet]
        };
          setProfile(transformedProfile);
          setShowCreateForm(false);
        }
      } else {
        // No profile found, show create form
        setProfile(null);
        setShowCreateForm(true);
      }
    } catch (err: any) {
      if (err.message.includes('404')) {
        // No profile found, show create form
        setProfile(null);
        setShowCreateForm(true);
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async () => {
    if (!formData.email || !formData.walletAddress) {
      setError('Email and wallet address are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<any>('api/users/create-profile', {
        email: formData.email,
        name: formData.name || undefined,
        walletAddress: formData.walletAddress,
        chain: 'coreum'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const userData = result.data;
        const newProfile: UserProfile = {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.name,
          createdAt: userData.user.createdAt,
          updatedAt: userData.user.createdAt,
          wallets: [userData.wallet]
        };
        
          setProfile(newProfile);
          setShowCreateForm(false);
          setIsEditing(false);
          
          if (onProfileCreated) {
            onProfileCreated(newProfile);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile || !formData.email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<any>('api/users/profile', {
        email: formData.email,
        name: formData.name || undefined
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProfile(result.data);
          setIsEditing(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      updateProfile();
    } else {
      createProfile();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  if (isLoading && !profile) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100/80 dark:bg-indigo-900/50 rounded-lg mr-3">
            <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile ? 'Manage account details' : 'Create profile'}
            </p>
          </div>
        </div>
        {profile && !isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setFormData({
                email: profile.email,
                name: profile.name || '',
                walletAddress: formData.walletAddress
              });
            }}
            className="btn-glass"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 glass-card border-red-200/50 dark:border-red-700/50">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Display Profile */}
      {profile && !isEditing && (
        <div className="space-y-4">
          <div className="flex items-center p-3 glass-card border-green-200/50 dark:border-green-700/50">
            <div className="flex items-center flex-1">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Active</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Created {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 glass-card">
              <div className="flex items-center mb-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100">{profile.email}</p>
            </div>

            {profile.name && (
              <div className="p-3 glass-card">
                <div className="flex items-center mb-2">
                  <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</p>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100">{profile.name}</p>
              </div>
            )}
          </div>

          {/* Linked Wallets */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Wallets</h4>
            <div className="space-y-2">
              {profile.wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-3 glass-card border-blue-200/50 dark:border-blue-700/50">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {shortenAddress(wallet.address)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {wallet.chain.toUpperCase()} • Verified {formatDate(wallet.verifiedAt || wallet.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input-field"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder="John Doe"
            />
          </div>

          {!profile && (
            <div>
              <label htmlFor="walletAddress" className="label">
                Wallet Address *
              </label>
              <input
                type="text"
                id="walletAddress"
                value={formData.walletAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                className="input-field"
                placeholder="core1..."
                required
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <div className="loading-spinner mr-2"></div>
              ) : (
                <PlusIcon className="h-4 w-4 mr-2" />
              )}
              {profile ? 'Update' : 'Create'}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
