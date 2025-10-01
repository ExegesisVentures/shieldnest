import React, { Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, Transition } from '@headlessui/react';
import { 
  ChevronDownIcon,
  HomeIcon,
  ChartBarIcon,
  BriefcaseIcon,
  PhotoIcon,
  TrophyIcon,
  ClockIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  requiresAuth?: boolean;
  badge?: string;
}

interface MobileNavigationProps {
  isAuthenticated: boolean;
  user?: any;
  onSignOut?: () => void;
  onOpenAuth?: () => void;
  connectedWallet?: any;
  onDisconnectWallet?: () => void;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Portfolio', href: '/portfolio', icon: BriefcaseIcon, badge: 'FREE' },
  { name: 'NFT Hub', href: '/nft', icon: PhotoIcon },
  { name: 'Staking', href: '/staking', icon: TrophyIcon, badge: 'PUBLIC' },
  { name: 'History', href: '/rewards-history', icon: ClockIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon, requiresAuth: true },
];

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isAuthenticated,
  user,
  onSignOut,
  onOpenAuth,
  connectedWallet,
  onDisconnectWallet
}) => {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // Helper function to check if user needs to create/complete profile
  const needsProfileCreation = (user: any) => {
    return user && user.email?.includes('@wallet.local');
  };

  // Filter navigation items based on authentication
  const availableNavigationItems = navigationItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  // Get display text for the button
  const getButtonText = () => {
    if (connectedWallet) {
      return connectedWallet.address.slice(0, 8) + '...' + connectedWallet.address.slice(-6);
    }
    if (isAuthenticated && user) {
      return user.firstName || user.email?.split('@')[0] || 'Account';
    }
    return 'Menu';
  };

  const getButtonIcon = () => {
    if (connectedWallet || isAuthenticated) {
      return UserCircleIcon;
    }
    return Bars3Icon;
  };

  const ButtonIcon = getButtonIcon();

  return (
    <div className="md:hidden">
      <Menu as="div" className="relative">
        <Menu.Button className="btn-glass flex items-center space-x-2 text-sm">
          <ButtonIcon className="w-4 h-4" />
          <span className="max-w-[120px] truncate">{getButtonText()}</span>
          <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right glass-card-opaque divide-y divide-gray-200/20 dark:divide-gray-700/30 focus:outline-none z-50">
            
            {/* Connected Wallet/User Info Section */}
            {(connectedWallet || (isAuthenticated && user)) && (
              <div className="px-1 py-1">
                {connectedWallet && (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                      Connected with {connectedWallet.source}
                      {connectedWallet.isReadOnly && (
                        <span className="ml-2 badge badge-warning text-xs">
                          Read-Only
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-1 text-xs font-mono text-gray-900 dark:text-gray-100 break-all">
                      {connectedWallet.address}
                    </div>
                  </>
                )}
                
                {isAuthenticated && user && !connectedWallet && (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {user.email?.includes('@wallet.local') ? 'Wallet Account' : 'Email Account'}
                    </div>
                    <div className="px-3 py-1 text-sm text-gray-900 dark:text-gray-100">
                      {user.email?.includes('@wallet.local') ? 'Wallet-based login' : user.email}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Navigation Section */}
            <div className="px-1 py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Navigation
              </div>
              {availableNavigationItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <Link
                        href={item.href}
                        className={`${
                          active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                        } ${
                          isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                        } group flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors`}
                      >
                        <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                        {item.name}
                        {item.badge && (
                          <span className={`ml-auto text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm ${
                            item.badge === 'PUBLIC' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                              : 'bg-gradient-to-r from-green-500 to-green-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </Menu.Item>
                );
              })}
            </div>

            {/* Theme Toggle Section */}
            <div className="px-1 py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Appearance
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={toggleTheme}
                    className={`${
                      active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                    } group flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                  >
                    {isDark ? (
                      <SunIcon className="w-4 h-4 mr-3" />
                    ) : (
                      <MoonIcon className="w-4 h-4 mr-3" />
                    )}
                    {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </button>
                )}
              </Menu.Item>
            </div>

            {/* Account Actions Section */}
            {(connectedWallet || isAuthenticated) && (
              <div className="px-1 py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Account
                </div>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={`${
                        active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                      } group flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                    >
                      <UserCircleIcon className="w-4 h-4 mr-3" />
                      {isAuthenticated && needsProfileCreation(user) ? 'Create Profile' : 'Profile'}
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                      } group flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        if (connectedWallet && onDisconnectWallet) {
                          onDisconnectWallet();
                        }
                        if (isAuthenticated && onSignOut) {
                          onSignOut();
                        }
                      }}
                      className={`${
                        active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                      } group flex w-full items-center rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 transition-colors`}
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            )}

            {/* Sign In Section (for non-authenticated users) */}
            {!isAuthenticated && !connectedWallet && (
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onOpenAuth}
                      className={`${
                        active ? 'bg-white/50 dark:bg-gray-800/50' : ''
                      } group flex w-full items-center rounded-lg px-3 py-2 text-sm text-primary-600 dark:text-primary-400 font-medium transition-colors`}
                    >
                      <UserCircleIcon className="w-4 h-4 mr-3" />
                      Sign In / Connect Wallet
                    </button>
                  )}
                </Menu.Item>
              </div>
            )}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default MobileNavigation;
