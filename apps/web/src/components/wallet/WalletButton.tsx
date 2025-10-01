import React from 'react';
import { WalletInfo } from '@/types/wallet';

interface WalletButtonProps {
  wallet: WalletInfo;
  isConnecting: boolean;
  isSelected: boolean;
  onConnect: (walletName: string) => void;
  variant?: 'connect' | 'install';
}

export default function WalletButton({ 
  wallet, 
  isConnecting, 
  isSelected, 
  onConnect, 
  variant = 'connect' 
}: WalletButtonProps) {
  const handleClick = () => {
    if (variant === 'connect') {
      onConnect(wallet.name);
    } else {
      const desktopUrl = wallet.downloads?.desktop?.[0];
      if (desktopUrl) {
        window.open(desktopUrl, '_blank');
      }
    }
  };

  const getIcon = () => {
    if (wallet.logo) {
      return (
        <img 
          src={wallet.logo} 
          alt={wallet.prettyName}
          className="w-8 h-8 rounded-full"
        />
      );
    }
    
    // Fallback to letter icon
    return (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {wallet.prettyName[0]}
        </span>
      </div>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = "w-full flex items-center justify-between p-3 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    if (variant === 'install') {
      return `${baseStyles} border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
    }
    
    return `${baseStyles} border-gray-200 hover:border-primary-300 hover:bg-primary-50`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting && variant === 'connect'}
      className={getButtonStyles()}
      aria-label={variant === 'connect' ? `Connect ${wallet.prettyName}` : `Install ${wallet.prettyName}`}
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <span className={`font-medium ${variant === 'connect' ? 'text-gray-900' : 'text-gray-700'}`}>
          {wallet.prettyName}
        </span>
      </div>
      
      {variant === 'connect' && isConnecting && isSelected ? (
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      ) : variant === 'install' ? (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      ) : null}
    </button>
  );
}
