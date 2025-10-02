import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AuthCallback() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      if (!supabase) {
        setStatus('error');
        setMessage('Email authentication not configured');
        return;
      }

      // Get current session from Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed: ' + error.message);
        return;
      }

      const session = data.session;

      if (!session) {
        setStatus('error');
        setMessage('No authentication session found');
        return;
      }

      // Exchange Supabase session for our JWT
      const response = await fetch(`/api/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Store our JWT
        localStorage.setItem('auth_token', result.data.token);
        
        // Refresh user context
        await refreshUser();
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        // Redirect to profile or dashboard
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Authentication failed: ' + result.error);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred during authentication');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please wait while we process your authentication
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <ArrowPathIcon className="h-12 w-12 text-primary-600 mx-auto animate-spin" />
                <p className="text-gray-700 dark:text-gray-300">{message}</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-green-700 dark:text-green-300">{message}</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
                <p className="text-red-700 dark:text-red-300">{message}</p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
