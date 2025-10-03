// apps/web/src/components/misc/UpgradePrompt.tsx
'use client';

import React from 'react';
import { ArrowUp, X } from 'lucide-react';

interface UpgradePromptProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message?: string;
}

/**
 * Inline upgrade prompt shown after user actions
 */
export function UpgradePrompt({ 
  isVisible, 
  onClose, 
  onUpgrade, 
  message = "Sign up to save your portfolio and track multiple addresses!" 
}: UpgradePromptProps) {
  
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-lg p-4 animate-slide-up z-40">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start space-x-3 pr-6">
        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <ArrowUp className="h-4 w-4" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium mb-2">
            {message}
          </p>
          
          <button
            onClick={onUpgrade}
            className="text-sm bg-white text-primary-600 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors font-medium"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </div>
  );
}
