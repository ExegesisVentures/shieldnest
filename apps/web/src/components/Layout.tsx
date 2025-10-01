import React, { useState } from 'react';
import Link from 'next/link';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletModal } from '@/contexts/WalletModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import WalletConnect from './WalletConnect';
import UnifiedAuthModal from './auth/UnifiedAuthModal';
import ThemeToggle from './ThemeToggle';
import ShieldNestLogo from './ShieldNestLogo';
import MobileNavigation from './layout/MobileNavigation';
import PullToRefresh from './PullToRefresh';
import { truncateAddress } from '@/utils/wallet-helpers';
import { debugLog } from '@/utils/debug';
import { 
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isConnected, connectedWallet, disconnect } = useWalletContext();
  const { isAuthenticated, user, signOut } = useAuth();
  const { isWalletModalOpen, openWalletModal, closeWalletModal } = useWalletModal();
  const { isDark } = useTheme();
  const [isUnifiedAuthModalOpen, setIsUnifiedAuthModalOpen] = useState(false);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    // Simple page refresh for now - can be enhanced with specific data refresh logic
    window.location.reload();
  };

  // Helper function to check if user needs to create/complete profile
  // Only wallet-only users should see "Create Profile", email users see "Profile"
  const needsProfileCreation = (user: any) => {
    return user && user.email?.includes('@wallet.local');
  };

  // Production-safe debug logging
  React.useEffect(() => {
    debugLog.state('Layout', {
      isConnected,
      connectedWallet: connectedWallet?.address,
      isModalOpen: isWalletModalOpen
    });
  }, [isConnected, connectedWallet?.address, isWalletModalOpen]);

  // Debug user profile state
  React.useEffect(() => {
    if (user) {
      console.log('🔍 User Profile Debug:', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isWalletLocal: user.email?.includes('@wallet.local'),
        hasFirstName: !!user.firstName,
        hasLastName: !!user.lastName,
        needsProfileCreation: needsProfileCreation(user),
        menuText: needsProfileCreation(user) ? 'Create Profile' : 'Profile'
      });
    }
  }, [user]);


  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen">
        {/* Header */}
        <header className="header-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity">
                  <ShieldNestLogo size="sm" className="text-primary-600 dark:text-primary-400" />
                  <h1 
                    className="text-xl font-bold text-gray-900 dark:text-gray-100" 
                    style={{ 
                      textShadow: isDark ? '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' : 'none' 
                    }}
                  >
                    ShieldNest
                  </h1>
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-2">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link href="/portfolio" className="nav-link relative">
                Portfolio
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  FREE
                </span>
              </Link>
              <Link href="/nft" className="nav-link">
                NFT Hub
              </Link>
              <Link href="/staking" className="nav-link relative">
                Staking
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  PUBLIC
                </span>
              </Link>
              <Link href="/rewards-history" className="nav-link">
                History
              </Link>
              {isAuthenticated && (
                <Link href="/profile" className="nav-link">
                  Profile
                </Link>
              )}
              {/* Admin link - show for admin users */}
              {(isAuthenticated && user && (
                user.email === 'admin@roll-nft.com' || 
                user.email === 'mj@roll-nft.com' ||
                connectedWallet?.address === 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj'
              )) && (
                <Link href="/admin" className="nav-link text-primary-600 dark:text-primary-400 font-semibold">
                  Admin
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Desktop Theme Toggle - Hidden on Mobile */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {/* Mobile Navigation - Hidden on Desktop */}
              <MobileNavigation
                isAuthenticated={isAuthenticated}
                user={user}
                onSignOut={() => {
                  disconnect();
                  if (isAuthenticated) {
                    signOut();
                  }
                }}
                onOpenAuth={() => setIsUnifiedAuthModalOpen(true)}
                connectedWallet={connectedWallet}
                onDisconnectWallet={disconnect}
              />
              
              {/* Desktop User Menu - Hidden on Mobile */}
              <div className="hidden md:block">
                {/* Unified User Menu - Show wallet if connected, otherwise email if authenticated */}
                {isConnected && connectedWallet ? (
                  <Menu as="div" className="relative">
                    <Menu.Button className="wallet-connected flex items-center space-x-2">
                      <UserCircleIcon className="w-4 h-4" />
                      <span>{truncateAddress(connectedWallet.address)}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </Menu.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right glass-card-opaque divide-y divide-gray-200/20 dark:divide-gray-700/30 focus:outline-none">
                        <div className="px-1 py-1">
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            Connected with {connectedWallet.source}
                            {connectedWallet.isReadOnly && (
                              <span className="ml-2 badge badge-warning">
                                Read-Only
                              </span>
                            )}
                          </div>
                          <div className="px-3 py-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                            {connectedWallet.address}
                          </div>
                        </div>
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={`${
                                  active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                                } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                              >
                                <UserCircleIcon className="w-4 h-4 mr-2" />
                                {isAuthenticated && needsProfileCreation(user) ? 'Create Profile' : 'Profile'}
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                                } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                              >
                                <Cog6ToothIcon className="w-4 h-4 mr-2" />
                                Settings
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  disconnect();
                                  if (isAuthenticated) {
                                    signOut();
                                  }
                                }}
                                className={`${
                                  active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                                } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                              >
                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                                Sign Out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : isAuthenticated && user && !user.email?.includes('@wallet.local') ? (
                  /* Email-only user menu (when no wallet connected) */
                  <Menu as="div" className="relative">
                    <Menu.Button className="btn-glass flex items-center space-x-2">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{user.firstName || user.email}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </Menu.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right glass-card-opaque divide-y divide-gray-200/20 dark:divide-gray-700/30 focus:outline-none">
                        <div className="px-1 py-1">
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            Email Account
                          </div>
                          <div className="px-3 py-1 text-sm text-gray-900 dark:text-gray-100">
                            {user.email}
                          </div>
                        </div>
                        <div className="px-1 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={`${
                                  active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                                } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                              >
                                <UserCircleIcon className="w-4 h-4 mr-2" />
                                Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={signOut}
                                className={`${
                                  active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                                } group flex w-full items-center rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                              >
                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                                Sign Out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  /* Show unified sign in button */
                  <button
                    onClick={() => setIsUnifiedAuthModalOpen(true)}
                    className="btn-primary"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Wallet Connect Modal */}
      <WalletConnect 
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
      />

      {/* Unified Authentication Modal */}
      <UnifiedAuthModal
        isOpen={isUnifiedAuthModalOpen}
        onClose={() => setIsUnifiedAuthModalOpen(false)}
      />
      </div>
    </PullToRefresh>
  );
}
