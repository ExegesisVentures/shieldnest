import React, { useState } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CogIcon,
  InformationCircleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import ThemeAwareTokenImage from '@/components/ui/ThemeAwareTokenImage';

interface LiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolData?: {
    id: string;
    name: string;
    token0: { symbol: string; denom: string };
    token1: { symbol: string; denom: string };
    fee: number;
    isActive: boolean;
  };
}

interface Token {
  symbol: string;
  denom: string;
  balance: string;
}

const AVAILABLE_TOKENS: Token[] = [
  { symbol: 'SHLD', denom: 'shield-ft', balance: '1,234.56' },
  { symbol: 'CORE', denom: 'ucore', balance: '5,678.90' },
  { symbol: 'ROLL', denom: 'roll-ft', balance: '987.65' },
  { symbol: 'SOLO', denom: 'solo-ft', balance: '432.10' },
  { symbol: 'CAT', denom: 'ucat', balance: '123.45' },
  { symbol: 'COZY', denom: 'cozy-ft', balance: '678.90' }
];

/**
 * Liquidity Modal Component
 * 
 * A popup modal for adding/removing liquidity that dims the background
 * similar to the swap modal interface
 */
export default function LiquidityModal({ isOpen, onClose, poolData }: LiquidityModalProps) {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [token0Amount, setToken0Amount] = useState<string>('');
  const [token1Amount, setToken1Amount] = useState<string>('');
  const [lpTokenAmount, setLpTokenAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');

  if (!isOpen || !poolData) return null;

  const token0 = AVAILABLE_TOKENS.find(t => t.symbol === poolData.token0.symbol) || 
    { symbol: poolData.token0.symbol, denom: poolData.token0.denom, balance: '0.00' };
  const token1 = AVAILABLE_TOKENS.find(t => t.symbol === poolData.token1.symbol) || 
    { symbol: poolData.token1.symbol, denom: poolData.token1.denom, balance: '0.00' };

  const handleToken0AmountChange = (value: string) => {
    setToken0Amount(value);
    // Simulate pool ratio calculation (1:1 for demo)
    if (mode === 'add') {
      const calculated = (parseFloat(value) || 0).toFixed(6);
      setToken1Amount(calculated);
    }
  };

  const handleToken1AmountChange = (value: string) => {
    setToken1Amount(value);
    // Simulate pool ratio calculation (1:1 for demo)
    if (mode === 'add') {
      const calculated = (parseFloat(value) || 0).toFixed(6);
      setToken0Amount(calculated);
    }
  };

  const handleMaxToken0 = () => {
    const maxAmount = parseFloat(token0.balance.replace(/,/g, ''));
    handleToken0AmountChange(maxAmount.toString());
  };

  const handleMaxToken1 = () => {
    const maxAmount = parseFloat(token1.balance.replace(/,/g, ''));
    handleToken1AmountChange(maxAmount.toString());
  };

  const isValidAmounts = () => {
    if (mode === 'add') {
      return token0Amount && token1Amount && 
             parseFloat(token0Amount) > 0 && parseFloat(token1Amount) > 0;
    } else {
      return lpTokenAmount && parseFloat(lpTokenAmount) > 0;
    }
  };

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
            {mode === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
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

        {/* Pool Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center gap-2">
              <ThemeAwareTokenImage
                symbol={poolData.token0.symbol}
                alt={poolData.token0.symbol}
                width={32}
                height={32}
                className="rounded-full"
              />
              <ThemeAwareTokenImage
                symbol={poolData.token1.symbol}
                alt={poolData.token1.symbol}
                width={32}
                height={32}
                className="rounded-full -ml-2"
              />
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {poolData.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {poolData.fee}% fee • {poolData.isActive ? 'Active' : 'Pending'}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode('add')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'add'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <PlusIcon className="h-4 w-4 inline mr-2" />
            Add
          </button>
          <button
            onClick={() => setMode('remove')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'remove'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <MinusIcon className="h-4 w-4 inline mr-2" />
            Remove
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'add' ? (
            <>
              {/* Token 0 Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {token0.symbol}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {token0.balance}
                    </span>
                    <button
                      onClick={handleMaxToken0}
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={token0Amount}
                      onChange={(e) => handleToken0AmountChange(e.target.value)}
                      placeholder="0.0"
                      className="bg-transparent text-xl font-semibold text-gray-900 dark:text-gray-100 outline-none flex-1"
                    />
                    <div className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <ThemeAwareTokenImage
                        symbol={token0.symbol}
                        alt={token0.symbol}
                        width={20}
                        height={20}
                        className="rounded-full mr-2"
                      />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {token0.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <PlusIcon className="h-4 w-4 text-gray-500" />
                </div>
              </div>

              {/* Token 1 Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {token1.symbol}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {token1.balance}
                    </span>
                    <button
                      onClick={handleMaxToken1}
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={token1Amount}
                      onChange={(e) => handleToken1AmountChange(e.target.value)}
                      placeholder="0.0"
                      className="bg-transparent text-xl font-semibold text-gray-900 dark:text-gray-100 outline-none flex-1"
                    />
                    <div className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <ThemeAwareTokenImage
                        symbol={token1.symbol}
                        alt={token1.symbol}
                        width={20}
                        height={20}
                        className="rounded-full mr-2"
                      />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {token1.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Remove Liquidity Mode */
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  LP Tokens
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Balance: 0.00
                </span>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={lpTokenAmount}
                    onChange={(e) => setLpTokenAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-xl font-semibold text-gray-900 dark:text-gray-100 outline-none flex-1"
                  />
                  <div className="flex items-center bg-white dark:bg-gray-700 px-3 py-2 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {poolData.name} LP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {isValidAmounts() && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
              <div className="space-y-2 text-sm">
                {mode === 'add' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pool Share</span>
                      <span className="text-gray-900 dark:text-gray-100">~0.01%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">LP Tokens</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {Math.sqrt(parseFloat(token0Amount || '0') * parseFloat(token1Amount || '0')).toFixed(6)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">You'll receive</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {(parseFloat(lpTokenAmount || '0') * 0.5).toFixed(6)} {token0.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400"></span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {(parseFloat(lpTokenAmount || '0') * 0.5).toFixed(6)} {token1.symbol}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Slippage</span>
                  <span className="text-gray-900 dark:text-gray-100">{slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fee</span>
                  <span className="text-gray-900 dark:text-gray-100">{poolData.fee}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            disabled={!isValidAmounts() || !poolData.isActive}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
              isValidAmounts() && poolData.isActive
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!poolData.isActive 
              ? 'Pool Not Active Yet'
              : !isValidAmounts() 
                ? 'Enter Amount' 
                : mode === 'add' 
                  ? 'Add Liquidity' 
                  : 'Remove Liquidity'
            }
          </button>

          {/* Info */}
          <div className="p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
            <div className="flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-orange-800 dark:text-orange-200">
                {!poolData.isActive 
                  ? 'This pool is pending creation on Coreum DEX. Liquidity will be available once the pool is live.'
                  : 'This is a demo liquidity interface. Actual liquidity functionality will be implemented with real DEX integration.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
