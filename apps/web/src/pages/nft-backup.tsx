import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletProvider';
import { useAuth } from '@/contexts/AuthContext';

export default function NFTPageBackup() {
  const { isConnected } = useWalletContext();
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ShieldNest NFT Hub - Simple Version
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          This is a simplified version to test compilation.
        </p>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
