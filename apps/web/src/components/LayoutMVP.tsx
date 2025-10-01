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
import PullToRefresh from './PullToRefresh';
import { truncateAddress } from '@/utils/wallet-helpers';
import { 
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  WalletIcon,
  HomeIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function LayoutMVP({ children }: LayoutProps) {
  const { isConnected, connectedWallet, disconnect } = useWalletContext();
  const { isAuthenticated, user, signOut } = useAuth();
  const { isWalletModalOpen, openWalletModal, closeWalletModal } = useWalletModal();
  const { isDark } = useTheme();
  const [isUnifiedAuthModalOpen, setIsUnifiedAuthModalOpen] = useState(false);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    window.location.reload();
  };

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
                    Roll Dashboard
                  </h1>
                </Link>
              </div>
            </div>

            {/* Simplified Navigation - MVP Only */}
            <nav className="hidden md:flex space-x-2">
              <Link href="/" className="nav-link flex items-center space-x-1">
                <HomeIcon className="w-4 h-4" />
                <span>Home</span>
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link href="/portfolio" className="nav-link flex items-center space-x-1">
                    <WalletIcon className="w-4 h-4" />
                    <span>Portfolio</span>
                  </Link>
                  
                  <Link href="/nft" className="nav-link flex items-center space-x-1">
                    <CubeTransparentIcon className="w-4 h-4" />
                    <span>NFTs</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              {/* Authentication/Wallet Section */}
              {!isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsUnifiedAuthModalOpen(true)}
                    className="btn-secondary text-sm px-3 py-1.5"
                  >
                    Sign In
                  </button>
                  
                  {!isConnected && (
                    <button
                      onClick={openWalletModal}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* User Menu */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center space-x-2 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <UserCircleIcon className="w-5 h-5" />
                      <span className="hidden sm:block">
                        {user?.firstName || 'Account'}
                      </span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </Menu.Button>
                    
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={`${
                                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                              >
                                <UserCircleIcon className="w-4 h-4 mr-3" />
                                Profile
                              </Link>
                            )}
                          </Menu.Item>
                          
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={signOut}
                                className={`${
                                  active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                              >
                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                                Sign Out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>

                  {/* Wallet Connection Status */}
                  {isConnected && connectedWallet && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="hidden sm:block text-gray-600 dark:text-gray-400">
                        {truncateAddress(connectedWallet.address)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Modals */}
        <WalletConnect 
          isOpen={isWalletModalOpen} 
          onClose={closeWalletModal} 
        />
        
        <UnifiedAuthModal
          isOpen={isUnifiedAuthModalOpen}
          onClose={() => setIsUnifiedAuthModalOpen(false)}
        />
      </div>
    </PullToRefresh>
  );
}
