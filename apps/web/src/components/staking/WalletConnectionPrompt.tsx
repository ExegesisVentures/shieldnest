import React from 'react';
import { WalletIcon, ShieldCheckIcon, GiftIcon } from '@heroicons/react/24/outline';
import { useWalletModal } from '@/contexts/WalletModalContext';

/**
 * Wallet Connection Prompt for Staking Page
 * 
 * Modular component following Senior Developer Guidelines:
 * - Single responsibility: Only handles wallet connection prompting
 * - User-friendly messaging about staking benefits
 * - Clear call-to-action
 * - Graceful handling of modal state
 */
export default function WalletConnectionPrompt() {
  const { openWalletModal } = useWalletModal();

  const benefits = [
    {
      icon: ShieldCheckIcon,
      title: "Help Secure the Network",
      description: "Your staked tokens help validate transactions and secure the Coreum blockchain"
    },
    {
      icon: GiftIcon,
      title: "Earn Rewards",
      description: "Receive regular staking rewards for participating in network consensus"
    },
    {
      icon: WalletIcon,
      title: "Maintain Control",
      description: "Your tokens remain in your wallet - we never hold custody of your funds"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Main Connection Card */}
      <div className="card text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <WalletIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Coreum wallet to start staking and earning rewards
            </p>
          </div>
          
          <button
            onClick={openWalletModal}
            className="btn-primary text-lg px-8 py-4 mb-4"
          >
            Connect Wallet
          </button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports Keplr, Leap, Cosmostation, and manual address input
          </p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="glass-card text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <benefit.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {benefit.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Staking is completely decentralized and non-custodial. Your tokens remain in your wallet, 
          and you can unstake at any time (subject to the standard 21-day unbonding period).
        </p>
      </div>
    </div>
  );
}
