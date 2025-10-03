// apps/web/src/components/wallet/WalletButton.tsx
'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnectModal } from './WalletConnectModal';
import { Wallet, ChevronDown } from 'lucide-react';

interface WalletButtonProps {
  onConnected?: (address: string) => void;
  className?: string;
}

/**
 * Wallet connection button with dropdown for connected state
 */
export function WalletButton({ onConnected, className = '' }: WalletButtonProps) {
  const { state, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = () => {
    setShowModal(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (state.isConnected && state.address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-lg hover:bg-green-100 transition-colors ${className}`}
        >
          <Wallet className="h-4 w-4" />
          <span className="font-mono text-sm">{formatAddress(state.address)}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-4 border-b">
                <div className="text-sm text-gray-500">Connected with</div>
                <div className="font-medium text-gray-900 capitalize">{state.walletType}</div>
                <div className="font-mono text-sm text-gray-600 mt-1">{state.address}</div>
              </div>
              
              <div className="p-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={state.isConnecting}
        className={`flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        <Wallet className="h-4 w-4" />
        <span>{state.isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(address) => {
          onConnected?.(address);
          setShowModal(false);
        }}
      />
    </>
  );
}
