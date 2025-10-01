import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, WalletIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { useWalletContext } from '@/contexts/WalletProvider';
import { getAvailableWallets, getInstallableWallets } from '@/lib/wallet-registry';
import { WalletInfo } from '@/types/wallet';
import WalletButton from './wallet/WalletButton';
import ManualAddressInput from './wallet/ManualAddressInput';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'wallet' | 'manual';

export default function WalletConnect({ isOpen, onClose }: WalletConnectProps) {
  const { connectExtension, connectManual, isConnecting, error } = useWalletContext();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('wallet');
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualConnecting, setIsManualConnecting] = useState(false);

  const availableWallets = getAvailableWallets();
  const installableWallets = getInstallableWallets();

  const handleConnect = async (walletName: string) => {
    setSelectedWallet(walletName);
    try {
      await connectExtension(walletName);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Connection successful, closing modal');
      }
      
      // Close modal immediately after successful connection
      onClose();
      setSelectedWallet(null);
      
    } catch (err) {
      console.error('Connection failed:', err);
      setSelectedWallet(null);
    }
  };

  const handleManualConnect = async (address: string) => {
    setManualError(null);
    setIsManualConnecting(true);
    try {
      await connectManual(address);
      // Close modal after successful connection
      onClose();
      setActiveTab('wallet'); // Reset to wallet tab for next time
    } catch (err: any) {
      setManualError(err.message || 'Failed to connect with manual address');
    } finally {
      setIsManualConnecting(false);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-600"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-400"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-600"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-400"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Connect Wallet
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'wallet'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <WalletIcon className="w-4 h-4" />
                    <span>Wallet</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'manual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <CpuChipIcon className="w-4 h-4" />
                    <span>Manual</span>
                  </button>
                </div>

                {/* Error Display */}
                {(error || manualError) && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error || manualError}</p>
                  </div>
                )}

                {/* Tab Content */}
                {activeTab === 'wallet' ? (
                  <div className="space-y-3">
                    {/* Available Wallets */}
                    {availableWallets.length > 0 && (
                      <>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Available Wallets
                        </h3>
                        {availableWallets.map((wallet) => (
                          <WalletButton
                            key={wallet.name}
                            wallet={wallet}
                            isConnecting={isConnecting}
                            isSelected={selectedWallet === wallet.name}
                            onConnect={handleConnect}
                            variant="connect"
                          />
                        ))}
                      </>
                    )}

                    {/* Installable Wallets */}
                    {installableWallets.length > 0 && (
                      <>
                        <h3 className="text-sm font-medium text-gray-700 mb-2 mt-6">
                          Install Wallet
                        </h3>
                        {installableWallets.map((wallet) => (
                          <WalletButton
                            key={wallet.name}
                            wallet={wallet}
                            isConnecting={false}
                            isSelected={false}
                            onConnect={() => {}}
                            variant="install"
                          />
                        ))}
                      </>
                    )}

                    {availableWallets.length === 0 && installableWallets.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <WalletIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No wallet extensions detected</p>
                        <p className="text-xs mt-1">Please install a supported wallet extension</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ManualAddressInput
                    onAddressSubmit={handleManualConnect}
                    isValidating={isManualConnecting}
                    error={manualError}
                  />
                )}

                <div className="mt-6 text-xs text-gray-500">
                  <p>
                    By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
                    Make sure you&apos;re on the official ShieldNest Dashboard.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
