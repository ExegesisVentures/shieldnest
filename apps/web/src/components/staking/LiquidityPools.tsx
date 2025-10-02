import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ThemeAwareTokenImage from '@/components/ui/ThemeAwareTokenImage';
import SwapModal from './SwapModal';
import LiquidityModal from './LiquidityModal';

interface LiquidityPoolsProps {
  walletAddress?: string;
  isLoading?: boolean;
}

interface PoolData {
  id: string;
  name: string;
  token0: { symbol: string; denom: string };
  token1: { symbol: string; denom: string };
  tvl?: number;
  apr?: number;
  volume24h?: number;
  fee: number;
  userLiquidity?: number;
  isActive: boolean;
  isNew: boolean;
}

// ShieldNest liquidity pool pairs - production ready structure
// Pool data will be fetched from Coreum DEX API when pools are created on-chain
const POOL_PAIRS_CONFIG = [
  {
    id: 'shld-core',
    name: 'SHLD/CORE',
    token0: { symbol: 'SHLD', denom: 'shield-ft' },
    token1: { symbol: 'CORE', denom: 'ucore' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  },
  {
    id: 'shld-roll',
    name: 'SHLD/ROLL',
    token0: { symbol: 'SHLD', denom: 'shield-ft' },
    token1: { symbol: 'ROLL', denom: 'roll-ft' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  },
  {
    id: 'core-roll',
    name: 'CORE/ROLL',
    token0: { symbol: 'CORE', denom: 'ucore' },
    token1: { symbol: 'ROLL', denom: 'roll-ft' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  },
  {
    id: 'solo-roll',
    name: 'SOLO/ROLL',
    token0: { symbol: 'SOLO', denom: 'solo-ft' },
    token1: { symbol: 'ROLL', denom: 'roll-ft' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  },
  {
    id: 'shld-solo',
    name: 'SHLD/SOLO',
    token0: { symbol: 'SHLD', denom: 'shield-ft' },
    token1: { symbol: 'SOLO', denom: 'solo-ft' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  },
  {
    id: 'shld-cat',
    name: 'SHLD/CAT',
    token0: { symbol: 'SHLD', denom: 'shield-ft' },
    token1: { symbol: 'CAT', denom: 'ucat' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  },
  {
    id: 'shld-cozy',
    name: 'SHLD/COZY',
    token0: { symbol: 'SHLD', denom: 'shield-ft' },
    token1: { symbol: 'COZY', denom: 'cozy-ft' },
    fee: 0.3,
    isActive: false, // Will be activated when pool is created on-chain
    isNew: true
  }
];

/**
 * Liquidity Pools Component
 * 
 * Modular component following Senior Developer Guidelines:
 * - Single responsibility: Display and manage liquidity pools
 * - User-friendly interface for adding liquidity
 * - Future-ready for farming and rewards features
 * - Responsive design with clear visual hierarchy
 */
export default function LiquidityPools({ walletAddress, isLoading }: LiquidityPoolsProps) {
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [swapPoolId, setSwapPoolId] = useState<string>('');
  const [showLiquidityModal, setShowLiquidityModal] = useState<boolean>(false);
  const [selectedPoolForLiquidity, setSelectedPoolForLiquidity] = useState<PoolData | null>(null);
  const [poolsData, setPoolsData] = useState<PoolData[]>([]);
  const [loadingPools, setLoadingPools] = useState<boolean>(false);
  const [poolsError, setPoolsError] = useState<string>('');

  // Fetch pool data from Coreum DEX API
  const fetchPoolData = async () => {
    setLoadingPools(true);
    setPoolsError('');
    
    try {
      // Fetch pool data from the API endpoint (same domain for serverless)
      const response = await fetch(`/api/pools/coreum-dex-data`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pool data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setPoolsData(result.data);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
      
    } catch (error) {
      console.error('Failed to fetch pool data:', error);
      setPoolsError('Failed to load pool data');
      
      // Fallback to config-only data
      const fallbackPools: PoolData[] = POOL_PAIRS_CONFIG.map(config => ({
        ...config,
        tvl: 0,
        apr: 0,
        volume24h: 0,
        userLiquidity: 0
      }));
      setPoolsData(fallbackPools);
    } finally {
      setLoadingPools(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const PoolCard = ({ pool }: { pool: PoolData }) => (
    <div 
      className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
    >
      {/* Status Badges */}
      <div className="flex justify-end mb-3">
        <div className="flex flex-col gap-1">
          <div className={`inline-flex items-center px-2 py-1 rounded-full ${
            pool.isActive 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-orange-100 dark:bg-orange-900/30'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${
              pool.isActive ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
            <span className={`text-xs font-medium ${
              pool.isActive 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {pool.isActive ? 'Active' : 'Pending'}
            </span>
          </div>
          {pool.isNew && (
            <div className="inline-flex items-center justify-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">NEW</span>
            </div>
          )}
        </div>
      </div>

      {/* Token Images - Centered at Top */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2">
          <ThemeAwareTokenImage
            symbol={pool.token0.symbol}
            alt={pool.token0.symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
          <ThemeAwareTokenImage
            symbol={pool.token1.symbol}
            alt={pool.token1.symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Pool Name & Fee - Centered */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          {pool.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatPercentage(pool.fee)} fee
        </p>
      </div>

      {/* Pool Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">TVL</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {pool.isActive && pool.tvl ? formatCurrency(pool.tvl) : 'Not Active'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">APR</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {pool.isActive && pool.apr ? formatPercentage(pool.apr) : 'TBD'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">24h Volume</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {pool.isActive && pool.volume24h ? formatCurrency(pool.volume24h) : 'Not Active'}
          </p>
        </div>
      </div>

      {/* User Position (if any) */}
      {(pool.userLiquidity ?? 0) > 0 && (
        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 dark:text-blue-200">Your Liquidity</span>
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {formatCurrency(pool.userLiquidity ?? 0)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedPoolForLiquidity(pool);
            setShowLiquidityModal(true);
          }}
          className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
          title="Add Liquidity"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="text-sm">Add</span>
        </button>
        <button
          onClick={() => {
            setSwapPoolId(pool.id);
            setShowSwapModal(true);
          }}
          className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
          title="Swap Tokens"
        >
          <ArrowsRightLeftIcon className="h-4 w-4" />
          <span className="text-sm">Swap</span>
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mr-4">
              <BeakerIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ShieldNest Staking Pairs
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Stake in premium pairs with enhanced rewards
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium mb-1">Liquidity Pools Coming Soon</p>
              <p className="text-orange-700 dark:text-orange-300">
                ShieldNest liquidity pools are being prepared for launch on Coreum DEX. Pool balances will be added once the pools are created on-chain and ready for production.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingPools && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pools...</p>
        </div>
      )}

      {/* Error State */}
      {poolsError && (
        <div className="card">
          <div className="flex items-center justify-center p-8">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Unable to load pools</p>
              <p className="text-gray-600 dark:text-gray-400">{poolsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pools Grid */}
      {!loadingPools && !poolsError && (
        <>
          {poolsData.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poolsData.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-8">
                <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No pools available</p>
                <p className="text-gray-600 dark:text-gray-400">Pools will appear here when they are created on-chain</p>
              </div>
            </div>
          )}
        </>
      )}


      {/* Future Features Preview */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Coming Soon
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 glass-card opacity-60">
            <div className="flex items-center mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Yield Farming</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stake LP tokens to earn additional rewards
            </p>
          </div>
          
          <div className="p-4 glass-card opacity-60">
            <div className="flex items-center mb-2">
              <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Advanced Analytics</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed pool performance and impermanent loss tracking
            </p>
          </div>
        </div>
      </div>

      {/* Swap Modal */}
      <SwapModal 
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        poolId={swapPoolId}
      />

      {/* Liquidity Modal */}
      <LiquidityModal 
        isOpen={showLiquidityModal}
        onClose={() => {
          setShowLiquidityModal(false);
          setSelectedPoolForLiquidity(null);
        }}
        poolData={selectedPoolForLiquidity || undefined}
      />
    </div>
  );
}
