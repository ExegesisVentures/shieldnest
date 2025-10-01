import React, { useState } from 'react';
import { 
  ChevronDownIcon,
  LinkIcon, 
  EyeIcon,
  StarIcon as StarIconSolid,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { truncateAddressMobile } from '@/utils/wallet-helpers';

interface MobileOptimizedWalletProps {
  wallet: any;
  index: number;
  onRefresh: () => void;
}

const MobileOptimizedWallet: React.FC<MobileOptimizedWalletProps> = ({ wallet, index, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCoreAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatUSD = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    if (amount === 0) return '$0.00';
    if (amount < 0.01) return '<$0.01';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  return (
    <div 
      className={`rounded-xl border-2 transition-all duration-200 ${
        wallet.success 
          ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10' 
          : 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10'
      } ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}
    >
      {/* Mobile-First Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Top Row - Icon, Name, Amount */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              wallet.type === 'connected' 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {wallet.type === 'connected' ? (
                <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {wallet.label || `Wallet ${index + 1}`}
                </p>
                {wallet.isDefault && (
                  <StarIconSolid className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          
          {/* Amount - Right Aligned */}
          <div className="text-right flex-shrink-0 ml-2">
            {wallet.success ? (
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatCoreAmount(wallet.balances?.total || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">CORE</p>
              </div>
            ) : (
              <p className="text-xs text-red-600 dark:text-red-400">Error</p>
            )}
          </div>
        </div>

        {/* Bottom Row - Address, Status, Chevron */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              wallet.type === 'connected'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {wallet.type === 'connected' ? 'Connected' : 'Read-Only'}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
              {truncateAddressMobile(wallet.address)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {wallet.success && wallet.balances?.staked && wallet.balances.staked > 0 && (
              <div className="text-right">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  {formatCoreAmount(wallet.balances.staked)} staked
                </p>
              </div>
            )}
            <ChevronDownIcon 
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && wallet.success && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Detailed Balance Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Available</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {wallet.balances?.available?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} CORE
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatUSD((wallet.balances as any)?.availableUSD || (wallet.balances?.available || 0) * 0.15)}
              </p>
            </div>
            
            {wallet.balances?.staked && wallet.balances.staked > 0 && (
              <div className="bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Staked</p>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {wallet.balances.staked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} CORE
                </p>
                <p className="text-xs text-purple-500 dark:text-purple-400">
                  {formatUSD((wallet.balances as any)?.stakedUSD || (wallet.balances?.staked || 0) * 0.15)}
                </p>
              </div>
            )}
          </div>

          {/* Token List - Mobile Optimized */}
          {wallet.tokens && wallet.tokens.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Other Tokens ({wallet.tokens.length})
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {wallet.tokens.slice(0, 3).map((token: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {token.symbol || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {parseFloat(token.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                {wallet.tokens.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{wallet.tokens.length - 3} more tokens
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedWallet;
