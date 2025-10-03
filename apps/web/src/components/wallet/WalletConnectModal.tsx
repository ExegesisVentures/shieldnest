// apps/web/src/components/wallet/WalletConnectModal.tsx
'use client';

import React, { useState } from 'react';
import { useWallet, WalletType } from '@/contexts/WalletContext';
import { isValidCoreumAddress } from '@/lib/coreum/chain';
import { X, Download, Wallet, Plus } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (address: string, walletType: WalletType) => void;
}

/**
 * Modal for connecting wallets or adding manual addresses
 */
export function WalletConnectModal({ isOpen, onClose, onSuccess }: WalletConnectModalProps) {
  const { state, connect, connectManual, getSupportedWallets, clearError } = useWallet();
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualError, setManualError] = useState('');

  const supportedWallets = getSupportedWallets();

  const handleWalletConnect = async (walletType: WalletType) => {
    clearError();
    try {
      await connect(walletType);
      if (state.address) {
        onSuccess?.(state.address, walletType);
        onClose();
      }
    } catch (error) {
      // Error is handled by wallet context
    }
  };

  const handleManualConnect = async () => {
    setManualError('');
    
    if (!manualAddress.trim()) {
      setManualError('Please enter an address');
      return;
    }

    if (!isValidCoreumAddress(manualAddress.trim())) {
      setManualError('Invalid Coreum address format');
      return;
    }

    try {
      await connectManual(manualAddress.trim());
      onSuccess?.(manualAddress.trim(), 'manual');
      onClose();
      setManualAddress('');
      setShowManualInput(false);
    } catch (error) {
      setManualError('Failed to add address');
    }
  };

  const handleClose = () => {
    clearError();
    setManualError('');
    setManualAddress('');
    setShowManualInput(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {showManualInput ? 'Add Address' : 'Connect Wallet'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showManualInput ? (
            <>
              {/* Wallet Options */}
              <div className="space-y-3 mb-6">
                {supportedWallets.map((wallet) => (
                  <button
                    key={wallet.type}
                    onClick={() => handleWalletConnect(wallet.type)}
                    disabled={state.isConnecting || !wallet.isInstalled}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">{wallet.name}</span>
                    </div>
                    
                    {!wallet.isInstalled ? (
                      <a
                        href={wallet.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-sm">Install</span>
                      </a>
                    ) : state.isConnecting && state.walletType === wallet.type ? (
                      <div className="text-sm text-gray-500">Connecting...</div>
                    ) : (
                      <div className="text-sm text-gray-500">Connect</div>
                    )}
                  </button>
                ))}
              </div>

              {/* Manual Address Option */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Add address manually</span>
                </button>
              </div>

              {/* Error Display */}
              {state.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{state.error.message}</p>
                  {state.error.hint && (
                    <p className="text-xs text-red-600 mt-1">{state.error.hint}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Manual Address Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coreum Address
                  </label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="core1..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid Coreum address to track its portfolio
                  </p>
                </div>

                {manualError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{manualError}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleManualConnect}
                    disabled={!manualAddress.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Address
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
