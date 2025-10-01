import React, { useState, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useWalletModal } from '@/contexts/WalletModalContext';
import { supabase } from '@/lib/supabase';
import MagicLinkModal from './MagicLinkModal';
import QuickAuth from './QuickAuth';
import { Dialog, Transition } from '@headlessui/react';
import { 
  EnvelopeIcon,
  UserIcon,
  KeyIcon,
  WalletIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'wallet' | 'email-magic' | 'email-password' | 'oauth';

export default function UnifiedAuthModal({ isOpen, onClose }: UnifiedAuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  
  // Email/Password form state
  const [emailPasswordForm, setEmailPasswordForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isSignUp: false
  });

  // Remember me state
  const [rememberMe, setRememberMe] = useState(true);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const { signIn, signUp, signUpWithPassword, signInWithPassword, signInWithOAuth, enableRememberMe } = useAuth();
  const { connectExtension } = useWalletContext();
  const { closeWalletModal } = useWalletModal();

  const handleWalletConnect = async (walletName: string) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      await connectExtension(walletName);
      
      // Connection successful - close modal with small delay for state propagation
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Wallet connected successfully, closing modal in 200ms');
      }
      setTimeout(() => {
        setIsLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔗 Closing modal now');
        }
        onClose();
      }, 200);
      
    } catch (error: any) {
      setIsLoading(false);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to connect wallet'
      });
    }
  };

  const handleEmailMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Apply remember me setting
      enableRememberMe(rememberMe);
      
      const result = await signIn(emailPasswordForm.email);
      
      if (result.success) {
        setSubmittedEmail(emailPasswordForm.email);
        setShowMagicLinkModal(true);
        setEmailPasswordForm({ ...emailPasswordForm, email: '' });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to send magic link'
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

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Apply remember me setting
      enableRememberMe(rememberMe);
      
      let result;
      
      if (emailPasswordForm.isSignUp) {
        result = await signUpWithPassword(
          emailPasswordForm.email,
          emailPasswordForm.password,
          emailPasswordForm.firstName,
          emailPasswordForm.lastName
        );
      } else {
        result = await signInWithPassword(
          emailPasswordForm.email,
          emailPasswordForm.password
        );
      }

      if (result.success) {
        onClose();
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

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft' | 'github') => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Apply remember me setting
      enableRememberMe(rememberMe);
      
      const result = await signInWithOAuth(provider);
      
      if (result.success) {
        // OAuth will redirect, so we don't close the modal here
        setMessage({
          type: 'success',
          text: `Redirecting to ${provider} login...`
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || `Failed to sign in with ${provider}`
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
      const result = await signIn(submittedEmail);
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend magic link');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCloseMagicLinkModal = () => {
    setShowMagicLinkModal(false);
    setSubmittedEmail('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (!supabase) {
        setMessage({
          type: 'error',
          text: 'Password reset not available'
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/callback`
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Password reset link sent! Check your email.'
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
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

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-left transform transition-all">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Choose your preferred sign-in method
              </p>
            </div>

            {/* Quick Auth Component */}
            <QuickAuth 
              onSuccess={onClose}
              onError={(error) => setMessage({ type: 'error', text: error })}
            />

            {/* Auth Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('wallet')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'wallet'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <WalletIcon className="h-4 w-4 mx-auto mb-1" />
                Wallet
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('email-magic')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'email-magic'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <EnvelopeIcon className="h-4 w-4 mx-auto mb-1" />
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('email-password')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'email-password'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <KeyIcon className="h-4 w-4 mx-auto mb-1" />
                Password
              </button>
            </div>

            {/* Quick Sign In Options */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
                <span className="px-3 text-sm text-gray-500 dark:text-gray-400">Or continue with</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Sign in with Google (may use your system PIN/password)"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => handleOAuthSignIn('microsoft')}
                  disabled={isLoading}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Sign in with Microsoft (may use your system PIN/password)"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M0 0h11.5v11.5H0z"/>
                    <path fill="#00A4EF" d="M12.5 0H24v11.5H12.5z"/>
                    <path fill="#7FBA00" d="M0 12.5h11.5V24H0z"/>
                    <path fill="#FFB900" d="M12.5 12.5H24V24H12.5z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Sign in with GitHub"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                These providers may use your computer's PIN, fingerprint, or face recognition
              </p>
            </div>

            {/* Wallet Connection */}
            {authMode === 'wallet' && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Connect Your Wallet
                </h3>
                
                <button
                  onClick={() => handleWalletConnect('keplr-extension')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <WalletIcon className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  Connect with Keplr
                </button>
                
                <button
                  onClick={() => handleWalletConnect('leap-extension')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-purple-300 dark:border-purple-600 rounded-lg text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <WalletIcon className="h-5 w-5 mr-3 text-purple-600 dark:text-purple-400" />
                  Connect with Leap
                </button>
              </div>
            )}

            {/* Email Magic Link */}
            {authMode === 'email-magic' && (
              <form onSubmit={handleEmailMagicLink} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Sign in with Magic Link
                </h3>
                
                <div>
                  <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="magic-email"
                      value={emailPasswordForm.email}
                      onChange={(e) => setEmailPasswordForm({ ...emailPasswordForm, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="you@example.com"
                      required
                    />
                    <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMeMagic"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMeMagic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Remember me for faster sign-in
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>
            )}

            {/* Email/Password */}
            {authMode === 'email-password' && (
              <form onSubmit={handleEmailPassword} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {emailPasswordForm.isSignUp ? 'Create Account' : 'Sign In'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEmailPasswordForm({ ...emailPasswordForm, isSignUp: !emailPasswordForm.isSignUp })}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {emailPasswordForm.isSignUp ? 'Already have an account?' : 'Need an account?'}
                  </button>
                </div>

                {/* Name fields for signup */}
                {emailPasswordForm.isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="firstName"
                          value={emailPasswordForm.firstName}
                          onChange={(e) => setEmailPasswordForm({ ...emailPasswordForm, firstName: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="First name"
                          required={emailPasswordForm.isSignUp}
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
                        value={emailPasswordForm.lastName}
                        onChange={(e) => setEmailPasswordForm({ ...emailPasswordForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="password-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="password-email"
                      value={emailPasswordForm.email}
                      onChange={(e) => setEmailPasswordForm({ ...emailPasswordForm, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="you@example.com"
                      required
                    />
                    <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      value={emailPasswordForm.password}
                      onChange={(e) => setEmailPasswordForm({ ...emailPasswordForm, password: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter your password"
                      required
                    />
                    <KeyIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                {!emailPasswordForm.isSignUp ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Remember me for faster sign-in
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      {emailPasswordForm.isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </div>
                  ) : (
                    emailPasswordForm.isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>
            )}

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

            {/* Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose the sign-in method that works best for you
              </p>
            </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowForgotPassword(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Close button */}
              <button
                onClick={() => setShowForgotPassword(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Reset Password
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Enter your email to receive a password reset link
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="you@example.com"
                      required
                    />
                    <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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

