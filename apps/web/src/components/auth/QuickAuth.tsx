import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface QuickAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function QuickAuth({ onSuccess, onError }: QuickAuthProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStoredCredential, setHasStoredCredential] = useState(false);
  const { enableRememberMe } = useAuth();

  useEffect(() => {
    checkBiometricSupport();
    checkStoredCredentials();
  }, []);

  const checkBiometricSupport = () => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      // Check for platform authenticator (Face ID, Touch ID, Windows Hello)
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          setIsSupported(available);
        })
        .catch(() => {
          setIsSupported(false);
        });
    }
  };

  const checkStoredCredentials = () => {
    // Check if user has saved credentials or is remembered
    const rememberMe = localStorage.getItem('remember_me');
    const hasToken = localStorage.getItem('auth_token');
    setHasStoredCredential(!!(rememberMe && hasToken));
  };

  const handleQuickAuth = async () => {
    setIsLoading(true);

    try {
      // Enable remember me for quick auth
      enableRememberMe(true);

      // Try WebAuthn first if supported
      if (isSupported) {
        const result = await attemptWebAuthnSignIn();
        if (result.success) {
          onSuccess?.();
          return;
        }
      }

      // Fall back to stored credentials
      if (hasStoredCredential) {
        // User has remember me enabled, try to refresh session
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Test if token is still valid
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            onSuccess?.();
            return;
          }
        }
      }

      throw new Error('Quick authentication not available');

    } catch (error: any) {
      onError?.(error.message || 'Quick authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const attemptWebAuthnSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported');
      }

      // This is a simplified WebAuthn implementation
      // In production, you'd need to implement the full WebAuthn flow
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required'
        }
      });

      if (credential) {
        // In a real implementation, you'd verify this credential with your server
        return { success: true };
      }

      throw new Error('No credential returned');
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  if (!isSupported && !hasStoredCredential) {
    return null; // Don't show if no quick auth options available
  }

  return (
    <button
      onClick={handleQuickAuth}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 mb-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Authenticating...
        </div>
      ) : (
        <div className="flex items-center">
          {isSupported ? (
            <FingerPrintIcon className="h-4 w-4 mr-2" />
          ) : (
            <KeyIcon className="h-4 w-4 mr-2" />
          )}
          Quick Sign In
        </div>
      )}
    </button>
  );
}
