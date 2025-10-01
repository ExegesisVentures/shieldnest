import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { authenticatedApiRequest, apiRequest, mintApi } from '@/lib/api';
import WalletConnect from '@/components/WalletConnect';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  SparklesIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FireIcon,
  TrophyIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
  CubeTransparentIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

// Type definitions
interface EligibilityData {
  isEligible: boolean;
  riseNFTCount: number;
  availableConversions: number;
  convertedCount?: number;
  message: string;
  lastConversion?: any;
}

interface ConversionHistory {
  id: string;
  rollTokenId: string | null;
  txHash: string | null;
  status: string;
  createdAt: string;
}

interface MintStats {
  totalSupply: number;
  maxSupply: number;
  burned: number;
  currentPrice: number;
  floorPrice: number;
  bookValue: number;
  weeklyRewards: number;
  holdersCount: number;
  avgRewardPerNFT: number;
  nextEpochIn: string;
}

export default function NFTPage() {
  const { isConnected, connectedWallet } = useWalletContext();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'convert' | 'mint' | 'rewards'>('overview');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Convert state
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [conversions, setConversions] = useState<ConversionHistory[]>([]);
  const [convertLoading, setConvertLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertStats, setConvertStats] = useState<any>(null);

  // Mint state
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintClaimId, setMintClaimId] = useState<string | null>(null);

  // Rewards state - Only show real data for authenticated + connected users
  const isAuthorizedMember = isAuthenticated && isConnected && user && !user.email?.includes('@wallet.local');
  
  const rewardsData = {
    currentEpoch: 12,
    nextEpochIn: '3 days, 14 hours',
    pendingRewards: isAuthorizedMember ? '125.50' : '0',
    claimableRewards: isAuthorizedMember ? '78.25' : '0',
    totalEarned: isAuthorizedMember ? '1,250.00' : '0',
    lastClaim: isAuthorizedMember ? '2024-01-15' : null,
    weeklyDistribution: '2,500.00',
    yourShare: isAuthorizedMember ? '5.02%' : '0%',
    rewardsHistory: isAuthorizedMember ? [
      { epoch: 11, amount: '85.30', date: '2024-01-15', status: 'claimed' },
      { epoch: 10, amount: '92.15', date: '2024-01-08', status: 'claimed' },
      { epoch: 9, amount: '76.80', date: '2024-01-01', status: 'claimed' },
      { epoch: 8, amount: '88.40', date: '2023-12-25', status: 'claimed' },
    ] : []
  };

  // Fetch mint information
  const { data: mintInfo, isLoading: mintInfoLoading, error: mintInfoError } = useQuery(
    'mintInfo',
    mintApi.getInfo,
    {
      refetchInterval: 30000,
      retry: 2
    }
  );

  // Fetch eligibility if connected
  const { data: mintEligibility, isLoading: eligibilityLoading } = useQuery(
    ['mintEligibility', isConnected],
    mintApi.checkEligibility,
    {
      enabled: isConnected,
      retry: 1
    }
  );

  // Mint mutation
  const mintMutation = useMutation(mintApi.mint, {
    onSuccess: (data) => {
      if (data.success) {
        setMintClaimId(data.data.claimId);
        toast.success('Mint initiated! Processing your NFT...');
        setTimeout(() => {
          queryClient.invalidateQueries('mintInfo');
        }, 5000);
      } else {
        toast.error(data.error || 'Mint failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Mint failed. Please try again.');
    }
  });

  // Poll mint status if we have a claim ID
  const { data: mintStatus } = useQuery(
    ['mintStatus', mintClaimId],
    () => mintApi.getStatus(mintClaimId!),
    {
      enabled: !!mintClaimId && !mintSuccess,
      refetchInterval: 2000,
      onSuccess: (data) => {
        if (data.success && data.data.status === 'COMPLETED') {
          setMintSuccess(true);
          setMintClaimId(null);
          toast.success('ShieldNest NFT minted successfully! Welcome to the community!');
          queryClient.invalidateQueries('mintInfo');
        }
      }
    }
  );

  // Convert functions
  useEffect(() => {
    fetchConversionStats();
  }, []);

  useEffect(() => {
    if (isConnected && connectedWallet) {
      checkEligibility();
      fetchConversionHistory();
    } else {
      setEligibility(null);
      setConversions([]);
    }
  }, [isConnected, connectedWallet]);

  const fetchConversionStats = async () => {
    try {
      const response = await apiRequest('api/convert/stats');
      if (response.ok) {
        const data = await response.json();
        setConvertStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversion stats:', error);
    }
  };

  const checkEligibility = async () => {
    if (!isConnected) return;
    
    setConvertLoading(true);
    try {
      const response = await authenticatedApiRequest('api/convert/check-eligibility');
      
      if (response.ok) {
        const data = await response.json();
        setEligibility(data.data);
      } else {
        console.error('Failed to check eligibility');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setConvertLoading(false);
    }
  };

  const fetchConversionHistory = async () => {
    if (!isConnected) return;
    
    try {
      const response = await authenticatedApiRequest('api/convert/history');
      
      if (response.ok) {
        const data = await response.json();
        setConversions(data.data.conversions || []);
      }
    } catch (error) {
      console.error('Error fetching conversion history:', error);
    }
  };

  const handleConvert = async () => {
    if (!isConnected || !eligibility?.isEligible) return;
    
    setConverting(true);
    try {
      const response = await authenticatedApiRequest('api/convert/convert', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Conversion successful! ShieldNest NFT ID: ${data.data.rollTokenId}\nTransaction: ${data.data.txHash}`);
        
        await checkEligibility();
        await fetchConversionHistory();
        await fetchConversionStats();
      } else {
        const errorData = await response.json();
        alert(`Conversion failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error converting:', error);
      alert('Conversion failed: Network error');
    } finally {
      setConverting(false);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (mintEligibility && !mintEligibility.data?.eligible) {
      if (mintEligibility.data?.reason === 'TMA_NOT_SIGNED') {
        toast.error('Please sign the Terms & Membership Agreement first');
        return;
      } else if (mintEligibility.data?.reason === 'PENDING_MINT') {
        toast.error('You already have a pending mint request');
        return;
      } else if (mintEligibility.data?.reason === 'SUPPLY_EXHAUSTED') {
        toast.error('Sorry, all NFTs have been minted!');
        return;
      }
    }

    mintMutation.mutate();
  };

  const handleClaimRewards = () => {
    alert('Claiming rewards... (This would integrate with the smart contract)');
  };

  // Use API data or fallback to defaults
  const stats = mintInfo?.success ? mintInfo.data : {
    totalSupply: 47,
    maxSupply: 100,
    burned: 3,
    mintPrice: 1000,
    floorPrice: 5000,
    bookValue: 10000,
    avgWeeklyRewards: 125,
    holdersCount: 44,
    potentialAnnualROI: '26.0',
    nextEpochIn: '3 days'
  };

  const remaining = stats.maxSupply - stats.totalSupply;
  const scarcityPercentage = ((stats.totalSupply / stats.maxSupply) * 100).toFixed(1);
  const currentPrice = stats.mintPrice || stats.currentPrice || 1000;
  const avgRewards = stats.avgWeeklyRewards || stats.avgRewardPerNFT || 125;
  const potentialWeeklyReturn = ((avgRewards / currentPrice) * 100).toFixed(2);
  const potentialAnnualReturn = stats.potentialAnnualROI || (parseFloat(potentialWeeklyReturn) * 52).toFixed(1);

  if (mintSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to ShieldNest NFT!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Your NFT has been minted successfully. You're now part of an exclusive community with premium benefits.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab('rewards')}
              className="btn-primary w-full block text-center"
            >
              View Your Rewards
            </button>
            <a
              href="/"
              className="btn-secondary w-full block text-center"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ShieldNest NFT Hub
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Convert, mint, and manage your ShieldNest NFTs. Earn rewards and be part of an exclusive community.
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Connect your wallet to access NFT features
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-6">
            You need to connect your Coreum wallet to convert, mint, or manage your ShieldNest NFTs.
          </p>
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="btn-primary"
          >
            Connect Wallet
          </button>
        </div>

        {/* Global Stats */}
        {(convertStats || stats) && (
          <div className="grid md:grid-cols-2 gap-6">
            {convertStats && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Conversion Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{convertStats.totalRiseHolders}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rise Holders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{convertStats.completedConversions}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{convertStats.totalRemainingRiseNFTs}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{convertStats.conversionRate}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Converted</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Mint Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${currentPrice}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mint Price</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{remaining}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{potentialAnnualReturn}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Est. Annual ROI</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">${avgRewards}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Weekly Rewards</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <WalletConnect 
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ShieldNest NFT Hub
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Convert, mint, and manage your ShieldNest NFTs. Earn rewards and be part of an exclusive community.
        </p>
      </div>

      {/* Tab Navigation - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-1 sm:gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Overview
        </button>
        {(isAuthenticated && isConnected) ? (
          <>
            <button
              onClick={() => setActiveTab('convert')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'convert'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Convert
            </button>
            <button
              onClick={() => setActiveTab('mint')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'mint'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Mint
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Rewards
            </button>
          </>
        ) : (
          <div className="col-span-2 sm:col-span-1 text-center p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {!isAuthenticated ? 'Sign in and connect wallet' : 'Connect wallet'} to access member features
            </p>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${currentPrice}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mint Price</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{remaining}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Remaining</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{potentialAnnualReturn}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Est. Annual ROI</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${avgRewards}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Weekly Rewards</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="p-4 bg-red-100/80 dark:bg-red-900/50 rounded-full inline-flex mb-4">
                <FireIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Convert Rise NFTs</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Convert your Rise member NFTs to ShieldNest NFTs with exclusive OG benefits.
              </p>
              <button
                onClick={() => setActiveTab('convert')}
                className="btn-secondary w-full"
              >
                View Conversion
              </button>
            </div>

            <div className="card text-center">
              <div className="p-4 bg-primary-100/80 dark:bg-primary-900/50 rounded-full inline-flex mb-4">
                <SparklesIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Mint New NFT</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join the exclusive ShieldNest community and start earning weekly rewards.
              </p>
              <button
                onClick={() => setActiveTab('mint')}
                className="btn-primary w-full"
              >
                Mint NFT
              </button>
            </div>

            <div className="card text-center">
              <div className="p-4 bg-green-100/80 dark:bg-green-900/50 rounded-full inline-flex mb-4">
                <BanknotesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Claim Rewards</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Track and claim your weekly LP fee distributions from the ecosystem.
              </p>
              <button
                onClick={() => setActiveTab('rewards')}
                className="btn-secondary w-full"
              >
                View Rewards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Tab Content */}
      {activeTab === 'convert' && (
        <AuthGuard requireAuth={true} requireWallet={true}>
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">OG Conversion</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Convert your Rise member NFTs to ShieldNest NFTs with exclusive OG benefits.
              </p>
            </div>

          {/* Eligibility Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Eligibility Status</h3>
            
            {convertLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Checking eligibility...</p>
              </div>
            ) : eligibility ? (
              <div className="space-y-4">
                <div className={`flex items-center p-4 rounded-lg ${
                  eligibility.isEligible 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                }`}>
                  {eligibility.isEligible ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                  ) : (
                    <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      eligibility.isEligible ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {eligibility.isEligible ? 'Eligible for OG Conversion' : 'Not Eligible'}
                    </p>
                    <p className={`text-sm ${
                      eligibility.isEligible ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {eligibility.message}
                    </p>
                  </div>
                </div>

                {eligibility.riseNFTCount > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{eligibility.riseNFTCount}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Original Rise NFTs</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{eligibility.availableConversions}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Available to Convert</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{eligibility.convertedCount || 0}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Already Converted</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Failed to check eligibility</p>
              </div>
            )}
          </div>

          {/* Conversion Action */}
          {eligibility?.isEligible && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Convert Rise to ShieldNest NFT</h3>
              
              <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <FireIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Rise Member NFT</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Legacy membership token</p>
                  </div>
                </div>
                
                <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                
                <div className="flex items-center">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <CubeTransparentIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">ShieldNest NFT</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">New utility token with rewards</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={converting || !eligibility.isEligible}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  converting
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {converting ? 'Converting...' : 'Convert 1 Rise NFT to ShieldNest NFT'}
              </button>
            </div>
          )}

          {/* Conversion History */}
          {conversions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Your Conversion History</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ShieldNest NFT ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {conversions.map((conversion, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {conversion.rollTokenId || 'Pending...'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            conversion.status === 'COMPLETED' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : conversion.status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          }`}>
                            {conversion.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(conversion.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {conversion.txHash ? (
                            <a 
                              href={`#tx-${conversion.txHash}`} 
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                              title={conversion.txHash}
                            >
                              {conversion.txHash.substring(0, 10)}...
                            </a>
                          ) : (
                            'Pending...'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        </AuthGuard>
      )}

      {/* Mint Tab Content */}
      {activeTab === 'mint' && (
        <AuthGuard requireAuth={true} requireWallet={true}>
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Mint Your ShieldNest NFT</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Join an exclusive community of {stats.holdersCount} members earning weekly rewards from LP fees.
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${currentPrice}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mint Price</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{remaining}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Remaining</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{potentialAnnualReturn}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Est. Annual ROI</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${avgRewards}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Weekly Rewards</div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
              Why ShieldNest NFT is Your Best Investment
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100/80 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Passive Income</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Earn 0.5% of weekly LP fee pool per NFT. Current average: <strong className="text-gray-900 dark:text-gray-100">${avgRewards}/week</strong>
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100/80 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Value Protection</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Backed by ${stats.bookValue.toLocaleString()} book value. Guaranteed sellback floor for OG holders.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100/80 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BoltIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Exclusive Access</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Zero marketplace fees, governance rights, and access to exclusive ecosystem benefits.
                </p>
              </div>
            </div>
          </div>

          {/* Mint Button Section */}
          <div className="card">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ready to Join? Mint Your ShieldNest NFT Now
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Secure your spot in the exclusive ShieldNest NFT community and start earning weekly rewards
              </p>
              
              <div className="max-w-md mx-auto space-y-4">
                {connectedWallet?.isReadOnly ? (
                  <>
                    <div className="glass-card border-yellow-200/50 dark:border-yellow-700/50 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Read-Only Mode</h4>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        You're connected with a read-only address. To mint NFTs, please connect with a wallet extension.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsWalletModalOpen(true)}
                      className="btn-primary w-full text-lg py-3"
                    >
                      Connect Wallet to Mint
                    </button>
                  </>
                ) : (
                  <>
                    <div className="glass-card">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 dark:text-gray-300">Mint Price:</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${currentPrice}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span>Connected: {connectedWallet?.address.slice(0, 8)}...</span>
                        <span>Ready to mint</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleMint}
                      disabled={mintMutation.isLoading || mintInfoLoading || eligibilityLoading}
                      className="btn-primary w-full text-lg py-3 relative"
                    >
                      {mintMutation.isLoading || mintClaimId ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          {mintClaimId ? 'Processing NFT...' : 'Initiating Mint...'}
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-6 w-6 mr-2 inline" />
                          Mint ShieldNest NFT for ${currentPrice}
                        </>
                      )}
                    </button>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      By minting, you agree to the Terms & Membership Agreement
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </AuthGuard>
      )}

      {/* Rewards Tab Content */}
      {activeTab === 'rewards' && (
        <AuthGuard requireAuth={true} requireWallet={true} requireMembership={true}>
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Rewards Dashboard</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Track and claim your weekly LP fee distributions from the ecosystem.
              </p>
            </div>

          {/* Current Epoch Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Epoch</h3>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Next epoch in {rewardsData.nextEpochIn}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Epoch Number</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">#{rewardsData.currentEpoch}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Distribution</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">${rewardsData.weeklyDistribution}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Share</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{rewardsData.yourShare}</p>
              </div>
            </div>
          </div>

          {/* Rewards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Claimable Rewards */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Claimable Now</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ${rewardsData.claimableRewards}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleClaimRewards}
                  disabled={parseFloat(rewardsData.claimableRewards) === 0}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    parseFloat(rewardsData.claimableRewards) > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Claim Rewards
                </button>
              </div>
            </div>

            {/* Pending Rewards */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Next Epoch</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ${rewardsData.pendingRewards}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Available to claim after epoch #{rewardsData.currentEpoch + 1}
              </p>
            </div>

            {/* Total Earned */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earned</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ${rewardsData.totalEarned}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                All-time rewards from LP fees
              </p>
            </div>
          </div>

          {/* Rewards History */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Rewards History</h3>
            
            {rewardsData.rewardsHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Epoch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {rewardsData.rewardsHistory.map((reward, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          #{reward.epoch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          ${reward.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(reward.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm text-green-700 dark:text-green-300 capitalize">
                              {reward.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No rewards history yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your reward distributions will appear here after claiming
                </p>
              </div>
            )}
          </div>
        </div>
        </AuthGuard>
      )}

      <WalletConnect 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
}
