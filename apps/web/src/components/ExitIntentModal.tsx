import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon, EnvelopeIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: string) => void;
}

export default function ExitIntentModal({ isOpen, onClose, onSave }: ExitIntentModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Pre-fill email if user is authenticated
  useEffect(() => {
    if (user && user.email && !user.email.includes('@wallet.local')) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(email);
      onClose();
    } catch (error) {
      setError('Failed to save portfolio data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleSkip}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl glass-card p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <BookmarkIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Save Your Portfolio?
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Don't lose your data!
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      You've been exploring your <span className="font-semibold text-primary-600 dark:text-primary-400">free multi-wallet crypto portfolio</span>. 
                      Save your progress and get notified about new features!
                    </p>
                    
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-primary-700 dark:text-primary-300">
                          <strong>What you'll keep:</strong>
                          <ul className="mt-1 list-disc list-inside space-y-0.5">
                            <li>Your wallet addresses and portfolio data</li>
                            <li>Portfolio performance tracking</li>
                            <li>Personalized dashboard preferences</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="you@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      className="flex-1 btn-primary inline-flex items-center justify-center"
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <BookmarkIcon className="w-4 h-4 mr-2" />
                          Save Portfolio
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex-1 btn-secondary"
                      onClick={handleSkip}
                      disabled={isLoading}
                    >
                      Skip for Now
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    We'll only use your email to save your portfolio data and send important updates. No spam, ever.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
