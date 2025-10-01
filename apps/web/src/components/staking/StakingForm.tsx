import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useWalletContext } from '@/contexts/WalletProvider';
import { coin } from '@cosmjs/amino';
import { MsgDelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';

interface StakingFormProps {
  selectedValidator: string;
  availableBalance: string;
  stakingAmount: string;
  onAmountChange: (amount: string) => void;
  walletAddress?: string;
}

interface TransactionStatus {
  status: 'idle' | 'signing' | 'broadcasting' | 'success' | 'error';
  txHash?: string;
  error?: string;
}

interface CountdownState {
  isVisible: boolean;
  secondsLeft: number;
}

/**
 * Staking Form Component
 * 
 * Modular component following Senior Developer Guidelines:
 * - Single responsibility: Handle staking amount input and validation
 * - Real-time validation with user-friendly feedback
 * - Responsive design with clear visual hierarchy
 * - Graceful error handling and edge cases
 */
export default function StakingForm({ 
  selectedValidator, 
  availableBalance, 
  stakingAmount, 
  onAmountChange,
  walletAddress 
}: StakingFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ status: 'idle' });
  const [showInfo, setShowInfo] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>({ isVisible: false, secondsLeft: 0 });
  const { isConnected, connectedWallet, getSigningClient } = useWalletContext();

  const availableNum = parseFloat(availableBalance) || 0;
  const stakingNum = parseFloat(stakingAmount) || 0;

  // Validation
  useEffect(() => {
    setError('');
    if (stakingAmount && stakingNum > 0) {
      if (stakingNum > availableNum) {
        setError('Amount exceeds available balance');
      } else if (stakingNum < 1) {
        setError('Minimum staking amount is 1 CORE');
      }
    }
  }, [stakingAmount, stakingNum, availableNum]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown.isVisible && countdown.secondsLeft > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => ({ 
          ...prev, 
          secondsLeft: prev.secondsLeft - 1 
        }));
      }, 1000);
    } else if (countdown.isVisible && countdown.secondsLeft === 0) {
      // Hide the success box and reset transaction status
      setCountdown({ isVisible: false, secondsLeft: 0 });
      setTxStatus({ status: 'idle' });
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    onAmountChange(cleanValue);
  };

  const handleMaxClick = () => {
    if (availableNum > 1) {
      // Reserve a small amount for transaction fees
      const maxStakeable = Math.max(0, availableNum - 0.1);
      onAmountChange(maxStakeable.toString());
    }
  };

  const handlePercentageClick = (percentage: number) => {
    const amount = (availableNum * percentage / 100);
    if (amount >= 1) {
      onAmountChange(amount.toFixed(3));
    }
  };

  const handleStake = async () => {
    // Validation checks
    if (!isConnected || !connectedWallet) {
      setError('Please connect your wallet first');
      return;
    }

    if (connectedWallet.isReadOnly) {
      setError('Cannot stake with read-only wallet. Please connect with a wallet extension.');
      return;
    }

    if (!selectedValidator) {
      setError('Please select a validator first');
      return;
    }

    if (!stakingAmount || stakingNum <= 0) {
      setError('Please enter a valid staking amount');
      return;
    }

    if (stakingNum < 1) {
      setError('Minimum staking amount is 1 CORE');
      return;
    }

    if (stakingNum > availableNum) {
      setError('Amount exceeds available balance');
      return;
    }

    setIsProcessing(true);
    setError('');
    setTxStatus({ status: 'idle' });

    try {
      // Step 1: Get signing client
      setTxStatus({ status: 'signing' });
      const signingClient = await getSigningClient();
      
      // Step 2: Prepare transaction
      const delegatorAddress = connectedWallet.address;
      const validatorAddress = selectedValidator;
      const amount = coin(Math.floor(stakingNum * 1_000_000), 'ucore'); // Convert to microcore
      
      const msg = {
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: MsgDelegate.fromPartial({
          delegatorAddress,
          validatorAddress,
          amount,
        }),
      };

      // Step 3: Calculate fee
      const fee = {
        amount: [coin(5000, 'ucore')], // 0.005 CORE fee
        gas: '200000',
      };

      // Step 4: Broadcast transaction
      setTxStatus({ status: 'broadcasting' });
      const result = await signingClient.signAndBroadcast(
        delegatorAddress,
        [msg],
        fee,
        `Stake ${stakingAmount} CORE to validator`
      );

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      // Step 5: Success
      setTxStatus({ 
        status: 'success', 
        txHash: result.transactionHash 
      });
      
      // Start countdown timer
      setCountdown({ isVisible: true, secondsLeft: 8 });
      onAmountChange(''); // Clear the form
      
    } catch (err: any) {
      console.error('Staking transaction failed:', err);
      const errorMessage = err.message || 'Failed to stake tokens. Please try again.';
      setError(errorMessage);
      setTxStatus({ 
        status: 'error', 
        error: errorMessage 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = isConnected && !connectedWallet?.isReadOnly && selectedValidator && stakingAmount && stakingNum > 0 && !error && !isProcessing;

  return (
    <div className="depth-card flex flex-col justify-center min-h-full shadow-depth dark:shadow-depth-dark">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
          Stake
        </h3>

        {/* Available Balance Display */}
        <div className="p-4 glass-card-opaque shadow-depth dark:shadow-depth-dark">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Available to Stake</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {parseFloat(availableBalance).toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 3 
              })} CORE
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="label">
            Staking Amount
          </label>
          <div className="relative">
            <input
              type="text"
              value={stakingAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.000"
              className={`input-field pr-16 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
              disabled={isProcessing}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">CORE</span>
            </div>
          </div>
          {error && (
            <p className="error-text flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handlePercentageClick(25)}
              className="btn-glass text-sm py-2"
              disabled={isProcessing || availableNum < 1}
            >
              25%
            </button>
            <button
              onClick={() => handlePercentageClick(50)}
              className="btn-glass text-sm py-2"
              disabled={isProcessing || availableNum < 1}
            >
              50%
            </button>
            <button
              onClick={() => handlePercentageClick(75)}
              className="btn-glass text-sm py-2"
              disabled={isProcessing || availableNum < 1}
            >
              75%
            </button>
            <button
              onClick={handleMaxClick}
              className="btn-glass text-sm py-2"
              disabled={isProcessing || availableNum < 1}
            >
              Max
            </button>
          </div>
        </div>

        {/* Stake Button */}
        <button
          onClick={handleStake}
          disabled={!isFormValid}
          className={`w-full btn-primary text-lg py-4 ${
            !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {txStatus.status === 'signing' && (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Please sign in your wallet...
            </div>
          )}
          {txStatus.status === 'broadcasting' && (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Broadcasting transaction...
            </div>
          )}
          {(txStatus.status === 'idle' || txStatus.status === 'error') && (
            !isConnected ? 'Connect Wallet First' : 
            connectedWallet?.isReadOnly ? 'Read-Only Wallet' :
            'Click to Stake'
          )}
          {txStatus.status === 'success' && (
            <div className="flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Staked Successfully!
            </div>
          )}
        </button>

        {/* Info Button */}
        <div className="mt-3">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            Staking Information
            <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${
              showInfo ? 'rotate-180' : ''
            }`} />
          </button>
          
          {/* Info Dropdown */}
          {showInfo && (
            <div className="mt-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <li>• Staked tokens are locked for 7 days when unstaking</li>
                <li>• Rewards are earned continuously and compound automatically</li>
                <li>• Staking helps secure the network and earn you passive income</li>
                <li>• You maintain full custody of your tokens at all times</li>
              </ul>
            </div>
          )}
        </div>

        {/* Transaction Status Messages */}
        {txStatus.status === 'success' && txStatus.txHash && countdown.isVisible && (
          <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50 transition-all duration-300 animate-in slide-in-from-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-800 dark:text-green-200">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Transaction Successful!</span>
              </div>
              
              {/* Countdown Circle */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    className="stroke-green-200 dark:stroke-green-700"
                    strokeWidth="2"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    className="stroke-green-600 dark:stroke-green-400"
                    strokeWidth="2"
                    strokeDasharray="87.96"
                    strokeDashoffset={87.96 * (1 - countdown.secondsLeft / 8)}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s linear'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {countdown.secondsLeft}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">
              TX Hash: {txStatus.txHash.slice(0, 8)}...{txStatus.txHash.slice(-8)}
            </p>
            <a 
              href={`https://www.mintscan.io/coreum/tx/${txStatus.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block font-medium"
            >
              View on Mintscan →
            </a>
            
            <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-2">
              This message will disappear in {countdown.secondsLeft} seconds
            </p>
          </div>
        )}

        {/* Wallet Connection Reminder */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <InformationCircleIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Connect your wallet to start staking</span>
            </div>
          </div>
        )}
      
        {/* Read-Only Wallet Warning */}
        {isConnected && connectedWallet?.isReadOnly && (
          <div className="mt-4 p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
            <div className="flex items-center text-orange-800 dark:text-orange-200">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Read-only wallet cannot sign transactions. Connect with a wallet extension.</span>
            </div>
          </div>
        )}

        {/* Validator Selection Reminder */}
        {isConnected && !connectedWallet?.isReadOnly && !selectedValidator && (
          <div className="mt-4 p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
            <div className="flex items-center text-yellow-800 dark:text-yellow-200">
              <InformationCircleIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Please select a validator before staking</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}