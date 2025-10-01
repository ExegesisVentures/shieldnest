/**
 * Example component demonstrating the modular wallet connection system
 * This shows how to use the new wallet components and helpers
 * 
 * File: /apps/web/src/components/examples/WalletConnectionExample.tsx
 */

import React, { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import WalletConnect from '@/components/WalletConnect';
import WalletButton from '@/components/wallet/WalletButton';
import ManualAddressInput from '@/components/wallet/ManualAddressInput';
import { getAvailableWallets } from '@/lib/wallet-registry';
import { truncateAddress, formatWalletError, isValidCoreumAddress } from '@/utils/wallet-helpers';

export default function WalletConnectionExample() {
  const wallet = useWalletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const availableWallets = getAvailableWallets();

  const handleDirectConnect = async (walletName: string) => {
    try {
      setCustomError(null);
      await wallet.connectExtension(walletName);
    } catch (error) {
      setCustomError(formatWalletError(error));
    }
  };

  const handleManualAddress = async (address: string) => {
    try {
      setCustomError(null);
      if (!isValidCoreumAddress(address)) {
        throw new Error('Invalid Coreum address format');
      }
      // Handle manual address connection logic here
      console.log('Manual address submitted:', address);
    } catch (error) {
      setCustomError(formatWalletError(error));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Wallet Connection Examples
        </h1>
        <p className="text-gray-600">
          Demonstrating the modular wallet connection system
        </p>
      </div>

      {/* Current Wallet State */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Current Wallet State</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Connected:</strong> {wallet.isConnected ? 'Yes' : 'No'}</p>
          <p><strong>Connecting:</strong> {wallet.isConnecting ? 'Yes' : 'No'}</p>
          {wallet.connectedWallet && (
            <>
              <p><strong>Address:</strong> {truncateAddress(wallet.connectedWallet.address)}</p>
              <p><strong>Source:</strong> {wallet.connectedWallet.source}</p>
            </>
          )}
          {wallet.error && (
            <p className="text-red-600"><strong>Error:</strong> {wallet.error}</p>
          )}
        </div>
      </div>

      {/* Method 1: Using WalletConnect Modal */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Method 1: Full Modal Experience</h2>
        <p className="text-gray-600 text-sm mb-4">
          Complete wallet connection modal with tabs for extension wallets and manual address input
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Wallet Modal
        </button>
      </div>

      {/* Method 2: Direct Wallet Buttons */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Method 2: Direct Wallet Buttons</h2>
        <p className="text-gray-600 text-sm mb-4">
          Individual wallet buttons for direct connection
        </p>
        <div className="space-y-2">
          {availableWallets.map((walletInfo) => (
            <WalletButton
              key={walletInfo.name}
              wallet={walletInfo}
              isConnecting={wallet.isConnecting}
              isSelected={false}
              onConnect={handleDirectConnect}
              variant="connect"
            />
          ))}
          {availableWallets.length === 0 && (
            <p className="text-gray-500 text-sm italic">No wallet extensions detected</p>
          )}
        </div>
      </div>

      {/* Method 3: Manual Address Input */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Method 3: Manual Address Input</h2>
        <p className="text-gray-600 text-sm mb-4">
          Standalone manual address input component
        </p>
        <ManualAddressInput
          onAddressSubmit={handleManualAddress}
          error={customError}
        />
      </div>

      {/* Connection Controls */}
      {wallet.isConnected && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Connection Controls</h2>
          <div className="flex space-x-3">
            <button
              onClick={wallet.disconnect}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
            <button
              onClick={wallet.clearError}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Errors
            </button>
          </div>
        </div>
      )}

      {/* WalletConnect Modal */}
      <WalletConnect 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
