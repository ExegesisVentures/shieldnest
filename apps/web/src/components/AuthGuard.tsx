import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletProvider';
import { ShieldExclamationIcon, LockClosedIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireWallet?: boolean;
  requireMembership?: boolean;
  fallback?: React.ReactNode;
}

interface AuthRequirement {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function AuthGuard({ 
  children, 
  requireAuth = false, 
  requireWallet = false, 
  requireMembership = false,
  fallback 
}: AuthGuardProps) {
  const { isAuthenticated, user } = useAuth();
  const { isConnected, connectedWallet } = useWalletContext();

  // Check membership status (you can customize this logic)
  const isMember = isAuthenticated && user && !user.email?.includes('@wallet.local');
  const hasCompleteProfile = user && user.firstName && user.lastName;

  // Determine what's missing
  const requirements: AuthRequirement[] = [];

  if (requireAuth && !isAuthenticated) {
    requirements.push({
      title: 'Authentication Required',
      description: 'You need to sign in to access this content.',
      icon: LockClosedIcon,
      action: {
        text: 'Sign In',
        href: '/?signup=true'
      }
    });
  }

  if (requireWallet && !isConnected) {
    requirements.push({
      title: 'Wallet Connection Required',
      description: 'Connect your wallet to access NFT features and member content.',
      icon: ShieldExclamationIcon,
      action: {
        text: 'Connect Wallet',
        onClick: () => {
          // This would trigger wallet modal
          console.log('Open wallet modal');
        }
      }
    });
  }

  if (requireMembership && (!isMember || !hasCompleteProfile)) {
    requirements.push({
      title: 'Membership Required',
      description: 'Access to member information requires a verified membership with complete profile.',
      icon: UserPlusIcon,
      action: {
        text: 'Become a Member',
        href: '/?signup=true'
      }
    });
  }

  // If all requirements are met, show the protected content
  if (requirements.length === 0) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30">
            <LockClosedIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Access Restricted
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This content is protected and requires additional verification.
          </p>
        </div>

        <div className="space-y-4">
          {requirements.map((req, index) => (
            <div key={index} className="glass-card p-4 border-red-200 dark:border-red-700">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <req.icon className="h-5 w-5 text-red-600 dark:text-red-400 mt-1" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {req.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {req.description}
                  </p>
                  <div className="mt-3">
                    {req.action.href ? (
                      <a
                        href={req.action.href}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      >
                        {req.action.text}
                      </a>
                    ) : (
                      <button
                        onClick={req.action.onClick}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      >
                        {req.action.text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
          >
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
