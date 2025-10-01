import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MagicLinkModal from './MagicLinkModal';
import { 
  EnvelopeIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface EmailAuthProps {
  onClose?: () => void;
  defaultMode?: 'signin' | 'signup';
}

export default function EmailAuth({ onClose, defaultMode = 'signin' }: EmailAuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  
  const { signIn, signUp } = useAuth();

  // Check if email auth is available
  const isEmailAuthAvailable = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isEmailAuthAvailable) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Email Authentication Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Email authentication is not configured. Please use wallet connection for access.
          </p>
          {onClose && (
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      let result;
      
      if (mode === 'signup') {
        result = await signUp(email, firstName, lastName);
      } else {
        result = await signIn(email);
      }

      if (result.success) {
        // Store the email and show magic link modal
        setSubmittedEmail(email);
        setShowMagicLinkModal(true);
        
        // Clear form
        setEmail('');
        setFirstName('');
        setLastName('');
        setMessage(null);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Authentication failed'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMagicLink = async () => {
    try {
      let result;
      
      if (mode === 'signup') {
        result = await signUp(submittedEmail, firstName, lastName);
      } else {
        result = await signIn(submittedEmail);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend magic link');
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleCloseMagicLinkModal = () => {
    setShowMagicLinkModal(false);
    setSubmittedEmail('');
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {mode === 'signup' 
              ? 'Create your profile to manage wallet addresses'
              : 'Sign in to access your portfolio'
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields for signup */}
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="First name"
                    required={mode === 'signup'}
                  />
                  <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Last name"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="you@example.com"
                required
              />
              <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Send Magic Link'
            )}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
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

        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm transition-colors"
          >
            Cancel
          </button>
        )}

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mode === 'signup' 
              ? 'By creating an account, you can add wallet addresses for read-only portfolio access'
              : 'We\'ll send you a secure magic link to sign in'
            }
          </p>
        </div>
        </div>
      </div>

      {/* Magic Link Modal */}
      <MagicLinkModal
        isOpen={showMagicLinkModal}
        onClose={handleCloseMagicLinkModal}
        email={submittedEmail}
        onResend={handleResendMagicLink}
      />
    </>
  );
}
