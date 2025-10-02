import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCompleted?: () => void;
  showSkipOption?: boolean;
}

export default function ProfileCompletionModal({ 
  isOpen, 
  onClose, 
  onProfileCompleted,
  showSkipOption = true 
}: ProfileCompletionModalProps) {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatarFile: null as File | null
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
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
      if (!formData.firstName || !formData.lastName) {
        setMessage({ type: 'error', text: 'First name and last name are required' });
        setIsLoading(false);
        return;
      }

      // Upload avatar if provided
      let avatarUrl = user.avatarUrl;
      if (formData.avatarFile) {
        avatarUrl = await uploadAvatar(formData.avatarFile);
      }

      // Update user profile
      const response = await fetch(`/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          avatarUrl: avatarUrl
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile completed successfully!' });
        // Refresh user data to get updated profile
        await refreshUser();
        
        // Small delay to ensure user state is updated
        setTimeout(() => {
          if (onProfileCompleted) {
            onProfileCompleted();
          }
          onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to complete profile' });
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      setMessage({ type: 'error', text: 'Failed to complete profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // For now, just close the modal
    // In the future, you might want to mark the user as "skipped profile completion"
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
                  <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Help us personalize your experience
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-4 p-3 rounded-md ${
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Current avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-1.5 hover:bg-primary-700 transition-colors"
                  >
                    <CameraIcon className="h-3 w-3" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Optional profile picture
                </p>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* Benefits */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Profile Benefits
                </h4>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Personalized dashboard experience</li>
                  <li>• Access to member-only features</li>
                  <li>• Multi-wallet portfolio tracking</li>
                  <li>• Enhanced security features</li>
                </ul>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
            
            {showSkipOption && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Skip for Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
