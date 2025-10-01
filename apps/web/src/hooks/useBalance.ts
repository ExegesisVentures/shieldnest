import { useState, useEffect, useCallback } from 'react';
import { WalletBalances, BalanceApiResponse, PriceApiResponse } from '@/types/balance';
import { useWalletContext } from '@/contexts/WalletProvider';
import { api } from '@/lib/api';

interface UseBalanceReturn {
  balances: WalletBalances | null;
  corePrice: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseBalanceOptions {
  manualAddress?: string;
}

export function useBalance(options?: UseBalanceOptions): UseBalanceReturn {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [corePrice, setCorePrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { isConnected, connectedWallet } = useWalletContext();

  const fetchBalances = useCallback(async (isRefresh = false) => {
    // Check if we have an address to fetch (either connected wallet or manual address)
    const targetAddress = options?.manualAddress || (isConnected ? connectedWallet?.address : null);
    
    if (!targetAddress) {
      setBalances(null);
      setError(null);
      return;
    }

    // Use different loading states for initial load vs refresh
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Construct API URLs
      const balanceUrl = options?.manualAddress 
        ? `api/balances/wallet?address=${encodeURIComponent(options.manualAddress)}`
        : 'api/balances/wallet';
      
      // Fetch both wallet balances and current price
      const [balanceResponse, priceResponse] = await Promise.all([
        api.get<BalanceApiResponse>(balanceUrl),
        api.get<PriceApiResponse>('api/balances/price/coreum')
      ]);

      if (balanceResponse.ok) {
        const balanceResult = await balanceResponse.json();
        if (balanceResult.success && balanceResult.data) {
          // Validate the data structure before setting it
          const balanceData = balanceResult.data;
        console.log('💰 Raw balance data received:', balanceData);
        console.log('💰 Balance structure check:', {
          hasBalances: !!balanceData.balances,
          hasCoreum: !!balanceData.balances?.coreum,
          hasStakingInfo: !!balanceData.stakingInfo,
          coreumData: balanceData.balances?.coreum,
          tokensCount: balanceData.balances?.tokens?.length || 0,
          tokens: balanceData.balances?.tokens
        });
        
        if (balanceData.balances && balanceData.balances.coreum && balanceData.stakingInfo) {
          console.log('✅ Balance data validated, setting state');
          setBalances(balanceData);
          setLastUpdated(new Date());
          } else {
            console.error('❌ Invalid balance data structure:', balanceData);
            throw new Error('Invalid balance data structure received');
          }
        } else {
          console.error('❌ Balance API response failed:', balanceResult);
          throw new Error('Failed to fetch balances');
        }
      } else {
        console.error('❌ Balance API request failed:', balanceResponse.status, balanceResponse.statusText);
        throw new Error('Failed to fetch balances');
      }

      if (priceResponse.ok) {
        const priceResult = await priceResponse.json();
        if (priceResult.success) {
          setCorePrice(priceResult.data.price);
        } else {
          console.warn('Failed to fetch CORE price, using fallback');
          setCorePrice(0);
        }
      } else {
        console.warn('Failed to fetch CORE price, using fallback');
        setCorePrice(0);
      }

    } catch (err: any) {
      console.error('Error fetching balance data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch balance data');
      setBalances(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isConnected, connectedWallet, options?.manualAddress]);

  // Auto-fetch on wallet connection
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Auto-refresh every 5 minutes when we have an address to track (reduced from 30 seconds)
  useEffect(() => {
    const targetAddress = options?.manualAddress || (isConnected ? connectedWallet?.address : null);
    if (!targetAddress) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing balance data...');
      fetchBalances(true); // Mark as refresh
    }, 300000); // 5 minutes (300 seconds)

    return () => clearInterval(interval);
  }, [isConnected, fetchBalances, options?.manualAddress]);

  return {
    balances,
    corePrice,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchBalances(true),
    lastUpdated
  };
}
