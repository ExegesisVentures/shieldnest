import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletModal } from '@/contexts/WalletModalContext';
import { useBalance } from '@/hooks/useBalance';
import TokenBalanceCard from '@/components/TokenBalanceCard';
import StakingDetailsCard from '@/components/StakingDetailsCard';
import OtherTokensCard from '@/components/OtherTokensCard';
import WalletOnlyPortfolio from '@/components/WalletOnlyPortfolio';
import MultiWalletPortfolio from '@/components/profile/MultiWalletPortfolio';
import ProfileCompletionModal from '@/components/profile/ProfileCompletionModal';
import AnonymousPortfolioView from '@/components/portfolio/AnonymousPortfolioView';
import EnhancedPortfolioView from '@/components/portfolio/EnhancedPortfolioView';
import ExitIntentModal from '@/components/ExitIntentModal';
import { 
  BanknotesIcon,
  ChartBarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CubeTransparentIcon,
  PlusIcon,
  WalletIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface PortfolioSummary {
  totalPortfolioValue: number;
  totalCoreumEarned: number;
  totalRewardsEarned: number;
  hasNFT: boolean;
  nftCount: number;
}

interface EarningsHistory {
  walletAddress: string;
  totalEarned: string;
  currentRewards: string;
  stakingHistory: Array<{
    month: Date;
    cumulativeEarned: number;
    monthlyEarned: number;
    stakingBalance: number;
  }>;
  calculationMethod: string;
  lastUpdated: Date;
  note: string;
}

interface NFTData {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  collection: {
    name: string;
    floorPrice: number;
    currency: string;
  };
  currentValue: number;
  lastSale: number;
  isStaked: boolean;
  rewards: {
    pending: string;
    totalEarned: string;
  };
}

interface NFTHoldingsData {
  walletAddress: string;
  totalNFTs: number;
  collections: {
    rollNft: {
      count: number;
      totalValue: number;
      pendingRewards: string;
      totalEarned: string;
    };
  };
  nfts: NFTData[];
  lastUpdated: Date;
}

export default function Portfolio() {
  const { isConnected, connectedWallet } = useWalletContext();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const { openWalletModal } = useWalletModal();
  const { balances, isLoading: balancesLoading, error: balancesError, refetch } = useBalance();
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [nftHoldings, setNftHoldings] = useState<NFTHoldingsData | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showExitIntentModal, setShowExitIntentModal] = useState(false);
  const [hasPortfolioData, setHasPortfolioData] = useState(false);

  // Determine user type
  const isWalletOnlyUser = user?.email?.includes('@wallet.local');
  const isEmailUser = user?.email && !user.email.includes('@wallet.local');
  const hasCompleteProfile = user && user.firstName && user.lastName;

  // Calculate portfolio summary when balances change
  useEffect(() => {
    if (balances && isConnected) {
      fetchNFTData();
      fetchCoreumEarningsHistory();
    }
  }, [balances, isConnected, connectedWallet]);

  // Recalculate portfolio summary when earnings history or NFT data is loaded
  useEffect(() => {
    if (balances) {
      calculatePortfolioSummary();
    }
  }, [balances, earningsHistory, nftHoldings]);

  // Track when user has portfolio data
  useEffect(() => {
    const hasData = (balances && (balances.balances.tokens.length > 0 || parseFloat(balances.balances.coreum.amount.available) > 0)) || 
                   (portfolioSummary && portfolioSummary.totalPortfolioValue > 0) ||
                   (nftHoldings && nftHoldings.nfts.length > 0);
    setHasPortfolioData(!!hasData);
  }, [balances, portfolioSummary, nftHoldings]);

  // Exit intent detection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show if user has portfolio data and isn't authenticated with email
      if (hasPortfolioData && !isAuthenticated) {
        e.preventDefault();
        e.returnValue = '';
        setShowExitIntentModal(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from the top of the page
      if (e.clientY < 0 && hasPortfolioData && !isAuthenticated) {
        setShowExitIntentModal(true);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasPortfolioData, isAuthenticated]);

  const calculatePortfolioSummary = () => {
    if (!balances) return;

    const totalPortfolioValue = balances.balances.coreum.usdValues.total;
    
    // Use earnings history data if available, otherwise fallback to mock data
    const totalCoreumEarned = earningsHistory ? parseFloat(earningsHistory.totalEarned) : 325.50;
    
    // Use NFT data if available, otherwise fallback to mock data
    const totalRewardsEarned = nftHoldings ? parseFloat(nftHoldings.collections.rollNft.totalEarned) : 1250.00;
    const hasNFT = nftHoldings ? nftHoldings.totalNFTs > 0 : true;
    const nftCount = nftHoldings ? nftHoldings.totalNFTs : 2;

    setPortfolioSummary({
      totalPortfolioValue,
      totalCoreumEarned,
      totalRewardsEarned,
      hasNFT,
      nftCount
    });
  };

  const fetchNFTData = async () => {
    if (!connectedWallet?.address) return;
    
    try {
      console.log(`Fetching NFT holdings for: ${connectedWallet.address}`);
      
      // Make API call to get NFT holdings
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/balances/wallet/nfts?address=${encodeURIComponent(connectedWallet.address)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNftHoldings(result.data);
          console.log('✅ NFT holdings loaded:', result.data);
        } else {
          console.error('❌ Failed to fetch NFT holdings:', result.error);
        }
      } else {
        console.error('❌ NFT API request failed:', response.statusText);
      }
      
    } catch (error) {
      console.error('Error fetching NFT holdings:', error);
    }
  };

  const fetchCoreumEarningsHistory = async () => {
    if (!connectedWallet?.address) return;
    
    setIsLoadingPortfolio(true);
    
    try {
      console.log(`Fetching Coreum earnings history for: ${connectedWallet.address}`);
      
      // Make API call to get earnings history
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/balances/wallet/earnings-history?address=${encodeURIComponent(connectedWallet.address)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEarningsHistory(result.data);
          console.log('✅ Earnings history loaded:', result.data);
        } else {
          console.error('❌ Failed to fetch earnings history:', result.error);
        }
      } else {
        console.error('❌ API request failed:', response.statusText);
      }
      
    } catch (error) {
      console.error('Error fetching Coreum earnings:', error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const handleBuyNFT = () => {
    // Navigate to mint page
    window.location.href = '/mint';
  };

  const formatUSD = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCoreAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const handleSavePortfolio = async (email: string) => {
    try {
      // Prepare portfolio data to save
      const portfolioData = {
        email,
        walletAddresses: isConnected && connectedWallet ? [connectedWallet.address] : [],
        balances: balances,
        portfolioSummary: portfolioSummary,
        nftHoldings: nftHoldings,
        savedAt: new Date().toISOString()
      };

      // Save to API
      const response = await fetch('/api/save-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData)
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolio');
      }

      // Optionally trigger authentication flow for the user
      console.log('Portfolio saved successfully for', email);
      
    } catch (error) {
      console.error('Error saving portfolio:', error);
      throw error;
    }
  };

  if (!isConnected && !isAuthenticated) {
    return (
      <AnonymousPortfolioView 
        onProfileCreated={() => {
          // Refresh user context and redirect
          refreshUser().then(() => {
            window.location.href = '/profile';
          });
        }}
      />
    );
  }

  // If authenticated user without any wallets (connected or manual), show wallet management
  if (isAuthenticated && user && !isConnected && (!user.hasWallets && !user.hasUserWallets)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <WalletIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Add Wallet Addresses
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add Coreum wallet addresses to view their portfolios, or connect a wallet for full functionality.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/profile'}
              className="btn-primary w-full"
            >
              Add Wallet Addresses (Read-Only)
            </button>
            <button
              onClick={openWalletModal}
              className="btn-secondary w-full"
            >
              Connect Wallet (Full Access)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show different portfolio views based on user type
  if (isAuthenticated && isEmailUser && hasCompleteProfile) {
    // Full members with completed profiles get enhanced portfolio
    return <EnhancedPortfolioView />;
  }

  if (isAuthenticated && isWalletOnlyUser) {
    // Wallet-only users get enhanced portfolio view too
    return <EnhancedPortfolioView />;
  }

  // Show enhanced portfolio for any authenticated user with wallets (connected or manual)
  if (isAuthenticated && (isConnected || (user && (user.hasWallets || user.hasUserWallets)))) {
    return <EnhancedPortfolioView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:depth-bg-dark-subtle relative overflow-hidden">
      {/* Background depth effects */}
      <div className="absolute top-16 right-10 w-72 h-72 light-accent-purple rounded-full floating-light opacity-50"></div>
      <div className="absolute bottom-32 left-10 w-80 h-80 gradient-orb-1 rounded-full floating-orb opacity-40" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 dark-accent-area rounded-full opacity-15"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8">
        <div className="space-y-8">
      {/* Profile completion suggestion for incomplete email users */}
      {isAuthenticated && isEmailUser && !hasCompleteProfile && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Unlock Multi-Wallet Portfolio
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Complete your profile to track multiple wallets and access member features
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                Free Multi-Wallet Crypto Watcher
              </span>
            </h1>
            <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
              100% FREE
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-primary-600 dark:text-primary-400">Track Every Wallet. Monitor All Tokens. Never Miss Rewards.</span>
              <br />
              <span className="text-sm">Complete portfolio management across unlimited Coreum wallets - no signup required!</span>
            </p>
            {/* Access Mode Indicator */}
            {isConnected && connectedWallet?.isReadOnly && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-100/80 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border border-yellow-200/50 dark:border-yellow-700/50">
                Read-Only Mode
              </span>
            )}
            {isConnected && !connectedWallet?.isReadOnly && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100/80 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50">
                Full Access
              </span>
            )}
            {!isConnected && isAuthenticated && user?.hasUserWallets && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50">
                Email Account - Read-Only
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {balances && (
            <button
              onClick={refetch}
              disabled={balancesLoading || isLoadingPortfolio}
              className="btn-glass inline-flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${(balancesLoading || isLoadingPortfolio) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          {/* Upgrade Access Button for Read-Only Users */}
          {(isConnected && connectedWallet?.isReadOnly) || (isAuthenticated && !isConnected) && (
            <button
              onClick={openWalletModal}
              className="btn-primary inline-flex items-center text-sm"
            >
              <WalletIcon className="h-4 w-4 mr-2" />
              Connect Wallet for Full Access
            </button>
          )}
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      {portfolioSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Portfolio Value */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio Value</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatUSD(portfolioSummary.totalPortfolioValue)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total value of all tokens
            </p>
          </div>

          {/* Coreum Earned */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100/80 dark:bg-primary-900/50 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CORE Earned</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCoreAmount(portfolioSummary.totalCoreumEarned)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total CORE rewards earned
            </p>
          </div>

          {/* Total Rewards Earned */}
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rewards Earned</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatUSD(portfolioSummary.totalRewardsEarned)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total USD value of rewards
            </p>
          </div>
        </div>
      )}

      {/* NFT Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ShieldNest NFTs</h2>
          {portfolioSummary?.nftCount && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {portfolioSummary.nftCount} NFT{portfolioSummary.nftCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {portfolioSummary?.hasNFT && nftHoldings ? (
          <div className="space-y-6">
            {/* NFT Collection Summary */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Collection Value</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatUSD(nftHoldings.collections.rollNft.totalValue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Rewards</p>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {formatCoreAmount(parseFloat(nftHoldings.collections.rollNft.pendingRewards))} CORE
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned</p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {formatCoreAmount(parseFloat(nftHoldings.collections.rollNft.totalEarned))} CORE
                  </p>
                </div>
              </div>
            </div>

            {/* Individual NFTs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {nftHoldings.nfts.map((nft) => (
                <div key={nft.id} className="card">
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <CubeTransparentIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {nft.name}
                        </h3>
                        {nft.isStaked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100/80 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                            Staked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Value: {formatUSD(nft.currentValue)}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {nft.attributes.slice(0, 2).map((attr, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-100/80 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                          >
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p>Pending: {nft.rewards.pending} CORE</p>
                        <p>Total Earned: {nft.rewards.totalEarned} CORE</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={handleBuyNFT}
                      className="btn-primary w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Buy Another NFT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <CubeTransparentIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
              No ShieldNest NFTs Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              ShieldNest NFTs provide exclusive access to weekly rewards distributions and governance rights. 
              Start earning passive income by purchasing your first NFT.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">What you'll earn:</h4>
                <ul className="space-y-1">
                  <li>• Weekly CORE token distributions</li>
                  <li>• Governance voting rights</li>
                  <li>• Access to exclusive features</li>
                  <li>• Potential value appreciation</li>
                </ul>
              </div>
              <button 
                onClick={handleBuyNFT}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Buy Your First NFT - $1,000
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Balance Error State */}
      {balancesError && (
        <div className="glass-card border-red-200/50 dark:border-red-700/50">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to load balance data
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{balancesError}</p>
            </div>
            <button
              onClick={refetch}
              className="btn-glass text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Token Balances Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Token Balances</h2>
        </div>

        {/* Balance Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COREUM Balance Card */}
          <TokenBalanceCard 
            tokenData={balances?.balances?.coreum} 
            isLoading={balancesLoading} 
          />

          {/* Staking Details Card */}
          <StakingDetailsCard 
            stakingInfo={balances?.stakingInfo} 
            isLoading={balancesLoading} 
          />
        </div>

        {/* Other Tokens Card */}
        {balances?.balances?.tokens && balances.balances.tokens.length > 0 && (
          <OtherTokensCard 
            tokens={balances.balances.tokens} 
            isLoading={balancesLoading} 
          />
        )}
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileCompleted={() => {
          setShowProfileModal(false);
          refreshUser();
        }}
        showSkipOption={true}
      />

      {/* Exit Intent Modal */}
      <ExitIntentModal
        isOpen={showExitIntentModal}
        onClose={() => setShowExitIntentModal(false)}
        onSave={handleSavePortfolio}
      />
        </div>
      </div>
    </div>
  );
}
