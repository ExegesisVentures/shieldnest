import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useWalletModal } from '@/contexts/WalletModalContext';
import { truncateAddress } from '@/utils/wallet-helpers';
import MobileOptimizedWallet from './MobileOptimizedWallet';
import { 
  WalletIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LinkIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { getTokenMetadata, formatTokenAmount, getTokenImageUrl } from '@/lib/token-registry';
import ThemeAwareTokenImage from '@/components/ui/ThemeAwareTokenImage';
// import { getCachedTokenMetadata } from '@/lib/token-cache';

interface TokenBalance {
  denom: string;
  symbol: string;
  amount: string;
  decimals: number;
  usdValue?: number;
  usdPrice?: number;
}

interface WalletBalance {
  address: string;
  chain: string;
  type: 'connected' | 'manual';
  label?: string;
  isDefault: boolean;
  balances: {
    available: number;
    staked: number;
    total: number;
  };
  tokens: TokenBalance[];
  success: boolean;
  error?: string;
}

interface PortfolioSummary {
  totalCore: number;
  totalAvailable: number;
  totalStaked: number;
  totalValueUSD: number;
  corePrice: number;
}

interface PortfolioData {
  wallets: WalletBalance[];
  summary: PortfolioSummary;
  aggregatedData: {
    successfulWallets: number;
    failedWallets: number;
    totalWallets: number;
  };
  lastUpdated: string;
  message: string;
}

interface AddWalletFormData {
  address: string;
  label: string;
  isDefault: boolean;
}

interface CollapsibleWalletProps {
  wallet: WalletBalance;
  index: number;
  onRefresh: () => void;
}

const CollapsibleWallet: React.FC<CollapsibleWalletProps> = ({ wallet, index, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCoreAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatUSD = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    if (amount === 0) return '$0.00';
    if (amount < 0.01) return '<$0.01';
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Process tokens for this wallet
  const validTokens = wallet.tokens?.filter(token => {
    const amount = parseFloat(token.amount);
    return amount > 0 && token.denom && token.symbol;
  }) || [];

  const processedTokens = validTokens.map(token => {
    const metadata = getTokenMetadata(token.denom);
    return {
      ...token,
      metadata,
      formattedAmount: formatTokenAmount(token.amount, metadata)
    };
  });

  const totalTokenUSDValue = processedTokens.reduce((sum, token) => {
    return sum + (token.usdValue || 0);
  }, 0);

  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-200 ${
        wallet.success 
          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
          : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
      } ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}
    >
      {/* Main Wallet Header */}
      <div 
        className="p-4 cursor-pointer transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
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
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {wallet.label || truncateAddress(wallet.address)}
                </p>
                {wallet.isDefault && (
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                  wallet.type === 'connected'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {wallet.type === 'connected' ? 'Connected' : 'Read-Only'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {truncateAddress(wallet.address)}
              </p>
              {processedTokens.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {processedTokens.length} token{processedTokens.length !== 1 ? 's' : ''} • {formatUSD(totalTokenUSDValue)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
                <div className="text-right">
                  {wallet.success ? (
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCoreAmount(wallet.balances.total)} CORE
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCoreAmount(wallet.balances.available)} available • {formatCoreAmount(wallet.balances.staked)} staked
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatUSD((wallet.balances as any)?.totalUSD || wallet.balances.total * 0.15)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">Failed to load</span>
                    </div>
                  )}
                </div>
            <div className="transition-transform duration-200">
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {!wallet.success && wallet.error && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            Error: {wallet.error}
          </div>
        )}
      </div>

      {/* Expanded Content - Token Breakdown */}
      {isExpanded && wallet.success && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70">
          <div className="p-4">
            {/* CORE Token Details */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-3 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <BanknotesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">CORE Token</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Native Coreum Token</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {formatCoreAmount(wallet.balances.total)} CORE
                  </p>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                    <div>Available: {formatCoreAmount(wallet.balances.available)}</div>
                    <div>Staked: {formatCoreAmount(wallet.balances.staked)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Tokens */}
            {processedTokens.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <PresentationChartLineIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Other Tokens ({processedTokens.length})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total: {formatUSD(totalTokenUSDValue)}
                  </p>
                </div>
                <div className="space-y-2">
                  {processedTokens.map((token, tokenIndex) => (
                    <div 
                      key={token.denom} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-center">
                        <div className="relative w-8 h-8 mr-3">
                          <ThemeAwareTokenImage
                            metadata={token.metadata}
                            alt={token.metadata.symbol}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {token.metadata.symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {token.denom}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {token.formattedAmount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatUSD(token.usdValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <PresentationChartLineIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No other tokens found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function EnhancedPortfolioView() {
  const { user } = useAuth();
  const { isConnected, connectedWallet } = useWalletContext();
  const { openWalletModal } = useWalletModal();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [addWalletForm, setAddWalletForm] = useState<AddWalletFormData>({
    address: '',
    label: '',
    isDefault: false
  });
  const [addWalletLoading, setAddWalletLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user, isConnected, connectedWallet]);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/profile/portfolio-enhanced`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      console.log('🔍 Enhanced Portfolio API Response:', result);
      console.log('🔍 Portfolio data structure:', {
        hasData: !!result.data,
        walletCount: result.data?.wallets?.length || 0,
        firstWallet: result.data?.wallets?.[0],
        summary: result.data?.summary
      });
      console.log('🔍 USD Value Debug:', {
        totalValueUSD: result.data?.summary?.totalValueUSD,
        totalCore: result.data?.summary?.totalCore,
        corePrice: result.data?.summary?.corePrice,
        calculation: (result.data?.summary?.totalCore || 0) * (result.data?.summary?.corePrice || 0)
      });
      
      if (result.success) {
        setPortfolioData(result.data);
      } else {
        setError(result.error || 'Failed to fetch portfolio data');
      }
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setAddWalletLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/profile/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addWalletForm)
      });

      const result = await response.json();
      if (result.success) {
        await fetchPortfolioData();
        setAddWalletForm({ address: '', label: '', isDefault: false });
        setShowAddWallet(false);
        setMessage({ type: 'success', text: 'Wallet address added successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add wallet address' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add wallet address' });
    } finally {
      setAddWalletLoading(false);
    }
  };

  const formatCoreAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatUSD = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
    if (amount === 0) return '$0.00';
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Portfolio
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchPortfolioData}
          className="btn-primary inline-flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              Multi-Wallet Crypto Watcher
            </span>
            <span className="ml-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              FREE
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {portfolioData?.message || 'Track every wallet, monitor all tokens, never miss rewards - your complete crypto dashboard'}
          </p>
        </div>
        
        {/* Mobile: Stack buttons vertically on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-3">
          <button
            onClick={() => setShowAddWallet(true)}
            className="btn-secondary inline-flex items-center justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Wallet
          </button>
          <button
            onClick={openWalletModal}
            className="btn-primary inline-flex items-center justify-center"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Wallet
          </button>
          <button
            onClick={fetchPortfolioData}
            className="btn-glass inline-flex items-center justify-center"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md ${
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

      {/* Add Wallet Form */}
      {showAddWallet && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Add Wallet Address</h3>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Read-Only Access:</strong> Adding wallet addresses manually provides portfolio viewing only. 
              To perform transactions, connect your wallet above.
            </p>
          </div>
          <form onSubmit={handleAddWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={addWalletForm.address}
                onChange={(e) => setAddWalletForm({ ...addWalletForm, address: e.target.value })}
                placeholder="core1..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label (Optional)
              </label>
              <input
                type="text"
                value={addWalletForm.label}
                onChange={(e) => setAddWalletForm({ ...addWalletForm, label: e.target.value })}
                placeholder="My wallet"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={addWalletForm.isDefault}
                onChange={(e) => setAddWalletForm({ ...addWalletForm, isDefault: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Set as default wallet for portfolio display
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={addWalletLoading}
                className="btn-primary"
              >
                {addWalletLoading ? 'Adding...' : 'Add Wallet'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddWallet(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Summary - Mobile Optimized */}
      {portfolioData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BanknotesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Portfolio</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {formatUSD(portfolioData.summary.totalValueUSD)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {formatCoreAmount(portfolioData.summary.totalCore)} CORE
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <WalletIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {formatCoreAmount(portfolioData.summary.totalAvailable)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">CORE</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Staked</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {formatCoreAmount(portfolioData.summary.totalStaked)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">CORE</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Details */}
      {portfolioData && portfolioData.wallets.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Wallet Breakdown
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {portfolioData.aggregatedData.successfulWallets} of {portfolioData.aggregatedData.totalWallets} wallets loaded successfully
            </div>
          </div>

          {/* Mobile-first wallet list */}
          <div className="space-y-3">
            {portfolioData.wallets.map((wallet, index) => (
              <MobileOptimizedWallet
                key={`${wallet.address}-${index}`}
                wallet={wallet}
                index={index}
                onRefresh={fetchPortfolioData}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-8">
          <WalletIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Wallet Addresses Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add wallet addresses or connect your wallet to view portfolio data.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowAddWallet(true)}
              className="btn-primary w-full max-w-xs"
            >
              Add Wallet Address (Read-Only)
            </button>
            <button
              onClick={openWalletModal}
              className="btn-secondary w-full max-w-xs"
            >
              Connect Wallet (Full Access)
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      {portfolioData && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(portfolioData.lastUpdated).toLocaleString()} • 
          CORE Price: {formatUSD(portfolioData.summary.corePrice)}
        </div>
      )}
    </div>
  );
}
