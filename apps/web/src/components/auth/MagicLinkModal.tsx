import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MagicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResend?: () => Promise<void>;
}

export default function MagicLinkModal({ isOpen, onClose, email, onResend }: MagicLinkModalProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(300);
      setResendMessage(null);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (!onResend) return;
    
    setIsResending(true);
    setResendMessage(null);
    
    try {
      await onResend();
      setTimeLeft(300); // Reset timer
      setResendMessage({ type: 'success', text: 'Magic link sent again!' });
    } catch (error) {
      setResendMessage({ type: 'error', text: 'Failed to resend magic link' });
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <EnvelopeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Magic Link Sent!
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We've sent a secure magic link to:
            </p>
            
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-6">
              {email}
            </p>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                    Next Steps:
                  </p>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>1. Check your email inbox</li>
                    <li>2. Click the magic link in the email</li>
                    <li>3. You'll be automatically signed in</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center mb-6">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Link expires in: <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                  {formatTime(timeLeft)}
                </span>
              </span>
            </div>

            {/* Resend Message */}
            {resendMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                resendMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <p className="text-sm">{resendMessage.text}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {onResend && timeLeft > 0 && (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Magic Link'
                  )}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors"
              >
                Got it, I'll check my email
              </button>
            </div>

            {/* Help text */}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
