import React, { useState } from 'react';
import { 
  WalletIcon, 
  PlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface WalletAddress {
  id: string;
  address: string;
  label?: string;
}

interface EmailCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error?: string;
}

function EmailCollectionModal({ isOpen, onClose, onSubmit, isLoading, error }: EmailCollectionModalProps) {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setIsValid(validateEmail(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && email) {
      onSubmit(email);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="text-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-4">
            <UserIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Create Profile to Add More Wallets
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            To add more than 2 wallet addresses, please provide your email to create a profile. 
            This helps us organize your portfolio data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                isValid 
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                  : email.length > 0 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            {email.length > 0 && !isValid && (
              <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AnonymousWalletManagerProps {
  onWalletsChange: (wallets: WalletAddress[]) => void;
  onProfileCreated?: () => void;
}

export default function AnonymousWalletManager({ 
  onWalletsChange, 
  onProfileCreated 
}: AnonymousWalletManagerProps) {
  const [wallets, setWallets] = useState<WalletAddress[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string>('');

  const MAX_ANONYMOUS_WALLETS = 2;

  const validateCoreumAddress = (addr: string): boolean => {
    return /^core1[a-z0-9]{38}$/.test(addr);
  };

  const handleAddressChange = (value: string) => {
    setNewAddress(value);
    if (value.length > 0) {
      setIsValid(validateCoreumAddress(value));
    } else {
      setIsValid(null);
    }
  };

  const addWallet = () => {
    if (!isValid || !newAddress) return;

    // Check if address already exists
    if (wallets.some(w => w.address === newAddress)) {
      alert('This wallet address is already added');
      return;
    }

    const newWallet: WalletAddress = {
      id: Date.now().toString(),
      address: newAddress,
      label: newLabel.trim() || `Wallet ${wallets.length + 1}`
    };

    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    onWalletsChange(updatedWallets);
    
    // Clear form
    setNewAddress('');
    setNewLabel('');
    setIsValid(null);
  };

  const removeWallet = (id: string) => {
    const updatedWallets = wallets.filter(w => w.id !== id);
    setWallets(updatedWallets);
    onWalletsChange(updatedWallets);
  };

  const handleTryAddMore = () => {
    setShowEmailModal(true);
    setProfileError('');
  };

  const createProfileWithEmail = async (email: string) => {
    setIsCreatingProfile(true);
    setProfileError('');

    try {
      // API call to create profile with first wallet
      const response = await fetch(`/api/users/create-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          walletAddress: wallets[0]?.address,
          chain: 'coreum'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store auth token
        localStorage.setItem('auth_token', result.data.token);
        
        // Call parent callback to refresh and redirect
        if (onProfileCreated) {
          onProfileCreated();
        }
        
        setShowEmailModal(false);
      } else {
        setProfileError(result.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      setProfileError('Failed to create profile. Please try again.');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  };

  const canAddMore = wallets.length < MAX_ANONYMOUS_WALLETS;
  const showUpgradePrompt = wallets.length >= MAX_ANONYMOUS_WALLETS;

  return (
    <div className="space-y-6">
      {/* Current Wallets */}
      {wallets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Your Wallet Addresses ({wallets.length})
          </h3>
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <div 
                key={wallet.id} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{wallet.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {truncateAddress(wallet.address)}
                  </p>
                </div>
                <button
                  onClick={() => removeWallet(wallet.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Wallet */}
      {canAddMore && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {wallets.length === 0 ? 'Add Wallet Address' : 'Add Another Wallet'}
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wallet Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="core1..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    isValid === true 
                      ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                      : isValid === false
                        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {isValid === true && (
                  <CheckCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
                {isValid === false && (
                  <ExclamationTriangleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-500" />
                )}
              </div>
              {isValid === false && (
                <p className="text-xs text-yellow-600 mt-1">
                  Please enter a valid Coreum address (starts with 'core1')
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Label (Optional)
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., My Main Wallet"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={addWallet}
              disabled={!isValid}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Wallet
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Want to add more wallets?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                You've reached the limit of 2 wallet addresses. Create a profile with your email 
                to add unlimited wallet addresses and access additional features.
              </p>
              <button
                onClick={handleTryAddMore}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Notice */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Read-Only Access</span>
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• View wallet balances and portfolio data</li>
          <li>• Cannot perform transactions or mint NFTs</li>
          <li>• Connect a wallet for full functionality</li>
        </ul>
      </div>

      {/* Email Collection Modal */}
      <EmailCollectionModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={createProfileWithEmail}
        isLoading={isCreatingProfile}
        error={profileError}
      />
    </div>
  );
}
