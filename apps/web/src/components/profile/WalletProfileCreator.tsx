import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletProvider';
import { 
  UserIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface WalletProfileCreatorProps {
  onProfileCreated?: () => void;
}

export default function WalletProfileCreator({ onProfileCreated }: WalletProfileCreatorProps) {
  const { user, refreshUser } = useAuth();
  const { connectedWallet } = useWalletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email?.includes('@wallet.local') ? '' : (user?.email || ''),
    avatarFile: null as File | null
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if this is a wallet-only user who needs to create a profile
  const isWalletUser = user?.email?.includes('@wallet.local') || 
    (user && (!user.firstName || !user.lastName));

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email?.includes('@wallet.local') ? '' : (user.email || ''),
        avatarFile: null
      });
    }
  }, [user]);

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

      setFormData({ ...formData, avatarFile: file });
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('No user found');
      }

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setMessage({ type: 'error', text: 'First name, last name, and email are required' });
        setIsLoading(false);
        return;
      }

      // Upload avatar if provided
      let avatarUrl = user.avatarUrl;
      if (formData.avatarFile) {
        avatarUrl = await uploadAvatar(formData.avatarFile);
      }

      // Update user profile with the real email
      const response = await fetch(`/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email, // Use the real email instead of wallet.local
          avatarUrl: avatarUrl
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile created successfully!' });
        // Refresh user data to get updated profile
        await refreshUser();
        
        // Small delay to ensure user state is updated
        setTimeout(() => {
          if (onProfileCreated) {
            onProfileCreated();
          }
        }, 500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create profile' });
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      setMessage({ type: 'error', text: 'Failed to create profile' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isWalletUser) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Your Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete your profile to personalize your experience
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
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

      {/* Profile Creation Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                ) : (
                  <UserIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition-colors"
              >
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Click the camera icon to upload a profile picture
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="your.email@example.com"
              required
            />
          </div>

          {/* Connected Wallet Info */}
          {connectedWallet && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Connected Wallet
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                {connectedWallet.address}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                Connected via {connectedWallet.source}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
