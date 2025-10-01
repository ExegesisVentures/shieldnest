import React, { useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ManualAddressInputProps {
  onAddressSubmit: (address: string) => void;
  isValidating?: boolean;
  error?: string | null;
}

export default function ManualAddressInput({ 
  onAddressSubmit, 
  isValidating = false, 
  error 
}: ManualAddressInputProps) {
  const [address, setAddress] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateCoreumAddress = (addr: string): boolean => {
    // Basic Coreum address validation
    return /^core1[a-z0-9]{38}$/.test(addr);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (value.length > 0) {
      setIsValid(validateCoreumAddress(value));
    } else {
      setIsValid(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && address) {
      onAddressSubmit(address);
    }
  };

  const getInputStyles = () => {
    let styles = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors";
    
    if (error) {
      styles += " border-red-300 bg-red-50";
    } else if (isValid === true) {
      styles += " border-green-300 bg-green-50";
    } else if (isValid === false) {
      styles += " border-yellow-300 bg-yellow-50";
    } else {
      styles += " border-gray-300";
    }
    
    return styles;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Manual Address Input
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Enter a Coreum address to view read-only information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="core1..."
            className={getInputStyles()}
            aria-describedby="address-help"
          />
          
          {/* Validation Icon */}
          {isValid === true && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
          )}
          
          {isValid === false && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Validation Message */}
        {isValid === false && (
          <p className="text-xs text-yellow-600">
            Please enter a valid Coreum address (starts with 'core1')
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!isValid || isValidating}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isValidating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            'Connect Read-Only'
          )}
        </button>
      </form>

      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
        <p className="font-medium mb-1">Read-Only Mode:</p>
        <ul className="space-y-1 text-xs">
          <li>• View balances and transaction history</li>
          <li>• Cannot sign transactions</li>
          <li>• Cannot mint or trade NFTs</li>
        </ul>
      </div>
    </div>
  );
}
