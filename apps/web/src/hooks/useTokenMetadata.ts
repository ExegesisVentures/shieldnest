/**
 * Universal Token Metadata Hook
 * Provides consistent token metadata fetching across all components
 */

import { useState, useEffect, useCallback } from 'react';
import { getCachedTokenMetadata, getCachedTokenMetadataBatch } from '@/lib/token-cache';
import { TokenMetadata } from '@/lib/token-registry';

interface UseTokenMetadataReturn {
  metadata: TokenMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseTokenMetadataBatchReturn {
  metadataMap: Record<string, TokenMetadata>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching single token metadata with caching
 */
export function useTokenMetadata(denom: string | null): UseTokenMetadataReturn {
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!denom) {
      setMetadata(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getCachedTokenMetadata(denom);
      setMetadata(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token metadata';
      setError(errorMessage);
      console.error('Error fetching token metadata:', err);
    } finally {
      setLoading(false);
    }
  }, [denom]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata
  };
}

/**
 * Hook for fetching multiple token metadata with batch optimization
 */
export function useTokenMetadataBatch(denoms: string[]): UseTokenMetadataBatchReturn {
  const [metadataMap, setMetadataMap] = useState<Record<string, TokenMetadata>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadataBatch = useCallback(async () => {
    if (denoms.length === 0) {
      setMetadataMap({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await getCachedTokenMetadataBatch(denoms);
      const map: Record<string, TokenMetadata> = {};
      
      results.forEach((metadata, index) => {
        if (denoms[index]) {
          map[denoms[index]] = metadata;
        }
      });

      setMetadataMap(map);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token metadata batch';
      setError(errorMessage);
      console.error('Error fetching token metadata batch:', err);
    } finally {
      setLoading(false);
    }
  }, [denoms]);

  useEffect(() => {
    fetchMetadataBatch();
  }, [fetchMetadataBatch]);

  return {
    metadataMap,
    loading,
    error,
    refetch: fetchMetadataBatch
  };
}

/**
 * Hook for getting token image URL with fallback handling
 */
export function useTokenImage(denom: string | null): {
  imageUrl: string;
  loading: boolean;
} {
  const { metadata, loading } = useTokenMetadata(denom);

  return {
    imageUrl: metadata?.imageUrl || '/tokens/default.svg',
    loading
  };
}

/**
 * Hook for token discovery and management (admin only)
 */
export function useTokenDiscovery() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [lastDiscovery, setLastDiscovery] = useState<Date | null>(null);

  const discoverTokens = useCallback(async (options: {
    force?: boolean;
    includeImages?: boolean;
    denoms?: string[];
  } = {}) => {
    setIsDiscovering(true);
    
    try {
      const response = await fetch('/api/tokens/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token here if needed
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLastDiscovery(new Date());
      return result;
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  return {
    discoverTokens,
    isDiscovering,
    lastDiscovery
  };
}
