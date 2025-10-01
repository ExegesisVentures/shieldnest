import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletProvider';
import { ShieldExclamationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, user } = useAuth();
  const { connectedWallet } = useWalletContext();

  // Admin check logic - same as in Layout.tsx
  const isAdmin = isAuthenticated && user && (
    user.email === 'admin@roll-nft.com' || 
    user.email === 'mj@roll-nft.com' ||
    connectedWallet?.address === 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30">
              <ShieldExclamationIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You must be signed in to access this area.
            </p>
            <div className="mt-6">
              <a
                href="/?signup=true"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Admin Access Required
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You do not have permission to access this administrative area.
            </p>
            <div className="mt-6 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contact an administrator if you believe this is an error.
              </p>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
