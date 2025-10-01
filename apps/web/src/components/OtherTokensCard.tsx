import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { OtherToken } from '@/types/balance';
import { getTokenMetadata, formatTokenAmount, getTokenImageUrl } from '@/lib/token-registry';
import ThemeAwareTokenImage from '@/components/ui/ThemeAwareTokenImage';
// import { getCachedTokenMetadata } from '@/lib/token-cache';

interface OtherTokensCardProps {
  tokens: OtherToken[];
  isLoading?: boolean;
}

export default function OtherTokensCard({ tokens, isLoading }: OtherTokensCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter out zero balances and invalid tokens
  const validTokens = tokens.filter(token => {
    const amount = parseFloat(token.amount);
    return amount > 0 && token.denom && token.symbol;
  });

  if (validTokens.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <PresentationChartLineIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Other Tokens</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have any other Coreum-based tokens in your wallet.
          </p>
        </div>
      </div>
    );
  }

  // Simple token processing with metadata - revert to sync approach for now
  const processedTokens = validTokens.map(token => {
    const metadata = getTokenMetadata(token.denom);
    console.log(`🔍 Processing token: ${token.denom} → symbol: ${token.symbol} → metadata: ${metadata.symbol}`);
    return {
      ...token,
      metadata,
      formattedAmount: formatTokenAmount(token.amount, metadata)
    };
  });

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

  const totalUSDValue = processedTokens.reduce((sum, token) => {
    return sum + (token.usdValue || 0);
  }, 0);

  return (
    <div className="card">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100/80 dark:bg-indigo-900/50 rounded-lg mr-3">
            <PresentationChartLineIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tokens</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {processedTokens.length} token{processedTokens.length !== 1 ? 's' : ''} • {formatUSD(totalUSDValue)}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* Token List */}
      <div className="mt-4">
        {processedTokens.slice(0, isExpanded ? undefined : 3).map((token, index) => (
          <div key={token.denom} className={`flex items-center justify-between p-3 glass-card ${
            index === 0 ? 'border-indigo-200/50 dark:border-indigo-700/50' : 'border-gray-200/50 dark:border-gray-700/50'
          } ${index > 0 ? 'mt-2' : ''}`}>
            <div className="flex items-center">
              {/* Token Image */}
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
                <p className={`text-sm font-medium ${
                  index === 0 ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {token.metadata.symbol}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${
                index === 0 ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {token.formattedAmount}
              </p>
              <p className={`text-xs ${
                index === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatUSD(token.usdValue)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {processedTokens.length > 3 && (
        <div className="mt-3 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            {isExpanded ? `Show Less` : `Show ${processedTokens.length - 3} More`}
          </button>
        </div>
      )}

      {totalUSDValue > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatUSD(totalUSDValue)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
