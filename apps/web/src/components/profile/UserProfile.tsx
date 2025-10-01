import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WalletProfileCreator from './WalletProfileCreator';
import MultiWalletPortfolio from './MultiWalletPortfolio';
import ProfileCompletionModal from './ProfileCompletionModal';
import { truncateAddress } from '@/utils/wallet-helpers';
import { 
  UserIcon,
  EnvelopeIcon,
  CameraIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  WalletIcon,
  CheckCircleIcon,
  KeyIcon,
  ChartBarIcon,
  SparklesIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface UserWallet {
  id: string;
  address: string;
  chain: string;
  label?: string;
  isDefault: boolean;
  addedAt: string;
}

interface ProfileData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  userWallets: UserWallet[];
}

export default function UserProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState({
    address: '',
    label: '',
    isDefault: false
  });
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Removed password management - using Supabase auth
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);

  // Determine user type and profile state
  const isWalletOnlyUser = user?.email?.includes('@wallet.local'); // True wallet-only users
  const isEmailUser = user?.email && !user.email.includes('@wallet.local'); // Email-authenticated users
  const hasIncompleteProfile = user && (!user.firstName || !user.lastName); // Missing profile data
  
  // Only wallet-only users should be forced into profile creation
  // Email users with incomplete profiles get a modal suggestion instead
  const shouldShowProfileCreator = isWalletOnlyUser;
  const shouldOfferProfileCompletion = isEmailUser && hasIncompleteProfile;

  useEffect(() => {
    if (user && !shouldShowProfileCreator) {
      fetchProfile();
    } else if (shouldShowProfileCreator) {
      setIsLoading(false);
    }
  }, [user, shouldShowProfileCreator]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setEditForm({
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          avatarUrl: result.data.avatarUrl || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be smaller than 5MB' });
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    // For now, we'll convert to base64 and store as data URL
    // In production, you'd upload to a service like AWS S3, Cloudinary, etc.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Upload avatar if provided
      let avatarUrl = editForm.avatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          avatarUrl: avatarUrl
        })
      });

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        await refreshUser();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWallet)
      });

      const result = await response.json();
      if (result.success) {
        await fetchProfile();
        setNewWallet({ address: '', label: '', isDefault: false });
        setShowAddWallet(false);
        setMessage({ type: 'success', text: 'Wallet address added successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add wallet address' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add wallet address' });
    }
  };

  const handleSetDefaultWallet = async (walletId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile/wallets/${walletId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isDefault: true })
      });

      const result = await response.json();
      if (result.success) {
        await fetchProfile();
        setMessage({ type: 'success', text: 'Default wallet updated' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update wallet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update wallet' });
    }
  };

  const handleRemoveWallet = async (walletId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile/wallets/${walletId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        await fetchProfile();
        setMessage({ type: 'success', text: 'Wallet address removed' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove wallet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove wallet' });
    }
  };

  // Removed password management functions - using Supabase auth

  // Show profile creation form for wallet-only users
  if (shouldShowProfileCreator) {
    return <WalletProfileCreator onProfileCreated={() => {
      // Don't reload the page, just refresh the component state
      fetchProfile();
      refreshUser();
    }} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Completion Suggestion Banner */}
      {shouldOfferProfileCompletion && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Add your name to unlock personalized features and member benefits
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfileCompletionModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Complete Profile
              </button>
              <button
                onClick={() => setShowProfileCompletionModal(false)}
                className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-glass"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-start">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Profile Information</h2>
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Avatar Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition-colors"
                >
                  <CameraIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Click the camera icon to upload a new profile picture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Avatar URL (Alternative to upload)
              </label>
              <input
                type="url"
                value={editForm.avatarUrl}
                onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="btn-primary"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {profile.name || 'No name set'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {profile.email}
                  {profile.emailVerified && (
                    <CheckCircleIcon className="h-4 w-4 ml-2 text-green-500" />
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Management - Supabase Integration */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Password Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your account password through secure email verification
            </p>
          </div>
          <button
            onClick={() => {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              if (supabaseUrl) {
                window.open(`${supabaseUrl}/auth/v1/authorize?provider=email&redirect_to=${encodeURIComponent(window.location.origin)}/auth/callback&type=recovery`, '_blank');
              } else {
                setMessage({ type: 'error', text: 'Password reset not available' });
              }
            }}
            className="btn-glass inline-flex items-center"
          >
            <KeyIcon className="h-4 w-4 mr-2" />
            Reset Password
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Secure Password Management
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Your account password is securely managed through our authentication provider. 
                    To change your password:
                  </p>
                  <ol className="mt-2 ml-4 list-decimal list-inside space-y-1">
                    <li>Click "Reset Password" above</li>
                    <li>Check your email for a secure reset link</li>
                    <li>Follow the instructions to set your new password</li>
                  </ol>
                  <p className="mt-2 text-xs">
                    This ensures your password is never stored on our servers and remains secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Wallet Addresses</h2>
          <button
            onClick={() => setShowAddWallet(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Wallet
          </button>
        </div>

        {/* Add Wallet Form */}
        {showAddWallet && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Add Wallet Address</h3>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Read-Only Access:</strong> Adding wallet addresses manually provides portfolio viewing only. 
                To perform transactions (minting, trading, etc.), you'll need to connect your wallet.
              </p>
            </div>
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={newWallet.address}
                  onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                  placeholder="core1..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={newWallet.label}
                  onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                  placeholder="My main wallet"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newWallet.isDefault}
                  onChange={(e) => setNewWallet({ ...newWallet, isDefault: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Set as default wallet for portfolio display
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddWallet(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Wallet List */}
        {profile.userWallets.length > 0 ? (
          <div className="space-y-3">
            {profile.userWallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <WalletIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {wallet.label || 'Unlabeled Wallet'}
                      </p>
                      {wallet.isDefault && (
                        <StarIconSolid className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-yellow-100/80 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">
                        Read-Only
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {truncateAddress(wallet.address)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(wallet.addedAt).toLocaleDateString()} • Portfolio viewing only
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!wallet.isDefault && (
                    <button
                      onClick={() => handleSetDefaultWallet(wallet.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                      title="Set as default"
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveWallet(wallet.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove wallet"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <WalletIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Wallet Addresses
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add wallet addresses to view their portfolios. For full functionality (minting, trading), connect your wallet instead.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Access Types:</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>• Manual Address Entry</span>
                  <span className="text-yellow-600 dark:text-yellow-400">Read-Only</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Wallet Connection</span>
                  <span className="text-green-600 dark:text-green-400">Full Access</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Wallet Portfolio Section */}
      {profile && profile.userWallets.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Portfolio Overview
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aggregated view of all your wallet addresses
                </p>
              </div>
            </div>
          </div>
          
          <MultiWalletPortfolio />
        </div>
      )}

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileCompletionModal}
        onClose={() => setShowProfileCompletionModal(false)}
        onProfileCompleted={() => {
          setShowProfileCompletionModal(false);
          fetchProfile();
          refreshUser();
        }}
        showSkipOption={true}
      />
    </div>
  );
}
