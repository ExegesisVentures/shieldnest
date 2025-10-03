// apps/web/src/components/misc/ExitIntentPrompt.tsx
'use client';

import React, { useState } from 'react';
import { X, Shield, Mail, Wallet } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useVisitorState } from '@/hooks/useVisitorState';

interface ExitIntentPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: (email: string) => void;
}

/**
 * Exit intent modal to encourage visitor upgrades
 */
export function ExitIntentPrompt({ isOpen, onClose, onSignUp }: ExitIntentPromptProps) {
  const { session } = useSession();
  const { portfolio, markAsNudged } = useVisitorState();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't show if user is already registered
  if (session.type !== 'visitor' || !isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSignUp(email.trim());
      markAsNudged();
      onClose();
    } catch (error) {
      console.error('Sign up failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    markAsNudged();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-up">
        {/* Header */}
        <div className="relative p-6 text-center border-b">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wait! Don't lose your progress
          </h2>
          <p className="text-gray-600">
            You've added {portfolio.addresses.length} address{portfolio.addresses.length !== 1 ? 'es' : ''} to track. 
            Sign up to save your portfolio and unlock exclusive features.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-gray-700">Save multiple wallet addresses</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-gray-700">Access to Shield NFT membership</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-gray-700">Portfolio alerts & updates</span>
            </div>
          </div>

          {/* Sign up form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating Account...' : 'Save My Portfolio'}
            </button>
          </form>

          {/* Skip option */}
          <div className="mt-4 text-center">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              I'll continue as visitor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
