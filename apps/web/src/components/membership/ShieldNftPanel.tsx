// apps/web/src/components/membership/ShieldNftPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, Clock, DollarSign } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface ShieldNftData {
  imageUrl: string;
  estimatedValueUsd: number;
  isOwned: boolean;
  settings: {
    min_usd: number;
    max_usd: number;
  };
}

/**
 * Shield NFT panel showing ownership status and value
 */
export function ShieldNftPanel() {
  const { session } = useSession();
  const [nftData, setNftData] = useState<ShieldNftData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.type === 'private' && session.privateUser) {
      fetchNftData();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const fetchNftData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/nft/shield');
      if (!response.ok) {
        throw new Error('Failed to fetch Shield NFT data');
      }

      const data = await response.json();
      setNftData(data.nft);
    } catch (err) {
      console.error('Failed to fetch NFT data:', err);
      setError('Failed to load Shield NFT information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyClick = () => {
    // TODO(v2): Integrate with actual marketplace
    window.open('https://shieldnest.io/buy-shield-nft', '_blank');
  };

  // Don't show panel for non-private users
  if (session.type !== 'private') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-red-600 mb-2">Failed to load Shield NFT</p>
          <button
            onClick={fetchNftData}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!nftData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Shield NFT</h3>
              <p className="text-sm text-gray-500">
                {nftData.isOwned ? 'Owned' : 'Not Owned'}
              </p>
            </div>
          </div>
          
          {nftData.isOwned && (
            <div className="flex items-center space-x-1 text-green-600">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Active</span>
            </div>
          )}
        </div>
      </div>

      {/* NFT Image */}
      <div className="p-6">
        <div className="relative">
          <img
            src={nftData.imageUrl}
            alt="Shield NFT"
            className="w-full h-48 object-cover rounded-lg bg-gray-100"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = '/tokens/shld_light.svg';
            }}
          />
          
          {!nftData.isOwned && (
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Not Owned</p>
              </div>
            </div>
          )}
        </div>

        {/* Value Information */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated Value</span>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                ${nftData.estimatedValueUsd.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Value Range</span>
            <span className="text-sm text-gray-500">
              ${nftData.settings.min_usd.toLocaleString()} - ${nftData.settings.max_usd.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {!nftData.isOwned && (
            <button
              onClick={handleBuyClick}
              className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Buy Shield NFT</span>
            </button>
          )}

          {nftData.isOwned && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-600 py-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Shield Active</span>
              </div>
              
              {/* Sell-back placeholder (coming soon) */}
              <button
                disabled
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-400 py-2 px-4 rounded-lg cursor-not-allowed"
              >
                <Clock className="h-4 w-4" />
                <span>Sell-back Coming Soon</span>
              </button>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>v1 Placeholder:</strong> Shield NFT values are estimated placeholders. 
            Actual NFT marketplace integration coming in v2.
          </p>
        </div>
      </div>
    </div>
  );
}
