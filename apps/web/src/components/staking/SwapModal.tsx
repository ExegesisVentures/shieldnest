import React, { useState } from 'react';
import { 
  XMarkIcon,
  ArrowsRightLeftIcon,
  CogIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import ThemeAwareTokenImage from '@/components/ui/ThemeAwareTokenImage';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId?: string;
}

interface Token {
  symbol: string;
  balance: string;
}

const AVAILABLE_TOKENS: Token[] = [
  { symbol: 'CORE', balance: '1,234.56' },
  { symbol: 'USDC', balance: '5,678.90' },
  { symbol: 'ATOM', balance: '987.65' },
  { symbol: 'OSMO', balance: '432.10' }
];

/**
 * Swap Modal Component
 * 
 * A popup modal for token swapping that dims the background
 * instead of navigating to a new page
 */
export default function SwapModal({ isOpen, onClose, poolId }: SwapModalProps) {
  const [fromToken, setFromToken] = useState<Token>(AVAILABLE_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(AVAILABLE_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);

  if (!isOpen) return null;

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Swap amounts too
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleTokenSelect = (token: Token) => {
    if (showTokenSelector === 'from') {
      setFromToken(token);
    } else if (showTokenSelector === 'to') {
      setToToken(token);
    }
    setShowTokenSelector(null);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    // Simulate exchange rate calculation
    const rate = 0.95; // Mock exchange rate
    const calculated = (parseFloat(value) * rate).toFixed(6);
    setToAmount(calculated);
  };

  const TokenSelector = () => (
    <div className="absolute top-0 left-0 right-0 bottom-0 bg-white dark:bg-gray-900 rounded-2xl p-6 z-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Select Token
        </h3>
        <button
          onClick={() => setShowTokenSelector(null)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <div className="space-y-2">
        {AVAILABLE_TOKENS.map((token) => (
          <button
            key={token.symbol}
            onClick={() => handleTokenSelect(token)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <ThemeAwareTokenImage
                symbol={token.symbol}
                alt={token.symbol}
                width={32}
                height={32}
                className="rounded-full mr-3"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {token.symbol}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {token.balance}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Swap Tokens
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <CogIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Token Selector Overlay */}
          {showTokenSelector && <TokenSelector />}

          {/* From Token */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Balance: {fromToken.balance}
              </span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-2xl font-semibold text-gray-900 dark:text-gray-100 outline-none flex-1"
                />
                <button
                  onClick={() => setShowTokenSelector('from')}
                  className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <ThemeAwareTokenImage
                    symbol={fromToken.symbol}
                    alt={fromToken.symbol}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {fromToken.symbol}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-4">
            <button
              onClick={handleSwapTokens}
              className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            >
              <ArrowsRightLeftIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* To Token */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">To</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Balance: {toToken.balance}
              </span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="bg-transparent text-2xl font-semibold text-gray-900 dark:text-gray-100 outline-none flex-1"
                />
                <button
                  onClick={() => setShowTokenSelector('to')}
                  className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <ThemeAwareTokenImage
                    symbol={toToken.symbol}
                    alt={toToken.symbol}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {toToken.symbol}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          {fromAmount && toAmount && (
            <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rate</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    1 {fromToken.symbol} = 0.95 {toToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Slippage</span>
                  <span className="text-gray-900 dark:text-gray-100">{slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fee</span>
                  <span className="text-gray-900 dark:text-gray-100">0.3%</span>
                </div>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            disabled={!fromAmount || !toAmount}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
              fromAmount && toAmount
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {fromAmount && toAmount ? 'Swap Tokens' : 'Enter Amount'}
          </button>

          {/* Info */}
          <div className="mt-4 p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
            <div className="flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                This is a demo swap interface. Actual swapping functionality will be implemented with real DEX integration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
