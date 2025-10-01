import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { updateUserSession, isLikelyReturningUser } from '@/utils/user-recognition';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  hasWallets: boolean;
  hasUserWallets: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordChange?: boolean; isTestUser?: boolean; user?: any; token?: string }>;
  signInWithOAuth: (provider: 'google' | 'microsoft' | 'github') => Promise<{ success: boolean; error?: string }>;
  enableRememberMe: (enabled: boolean) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(true); // Default to remember user

  // Check for existing session on mount - only on client
  useEffect(() => {
    // Ensure this only runs on client-side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    checkSession();

    // Only set up auth state listener if Supabase is available
    if (!supabase) {
      console.warn('Supabase not configured - email auth disabled');
      setIsLoading(false);
      return;
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
      }
      
      // Ignore initial session to prevent double loading
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      if (event === 'SIGNED_IN' && session) {
        await handleAuthCallback(session.access_token, session.refresh_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('auth_token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      // MVP Mode: Skip API calls for UI development
      if (process.env.NEXT_PUBLIC_APP_ENV === 'mvp') {
        setIsLoading(false);
        return;
      }

      // Check if we have a valid JWT token
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify token with our API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setUser(result.data);
            } else {
              localStorage.removeItem('auth_token');
            }
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (apiError) {
          console.warn('🔄 API server not reachable during session check, keeping existing token');
          // Don't remove token if API server is temporarily unavailable
        }
      }
      
      // Also check Supabase session if available
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !token) {
          await handleAuthCallback(session.access_token, session.refresh_token);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Only remove token if it's not a network error
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
        localStorage.removeItem('auth_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthCallback = async (accessToken: string, refreshToken?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        setUser(result.data.user);
        return { success: true };
      } else {
        console.error('Auth callback failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      
      // If it's a network error, provide a more helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('🚨 API server may not be running. Please ensure the backend is started.');
        return { success: false, error: 'Unable to connect to authentication server. Please try again later.' };
      }
      
      return { success: false, error: 'Authentication failed' };
    }
  };

  const signUp = async (email: string, firstName?: string, lastName?: string) => {
    if (!supabase) {
      return { success: false, error: 'Email authentication not available' };
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          isSignUp: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Sign up failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string) => {
    if (!supabase) {
      return { success: false, error: 'Email authentication not available' };
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          isSignUp: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Sign in failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithPassword = async (email: string, password: string, firstName?: string, lastName?: string) => {
    if (!supabase) {
      return { success: false, error: 'Email authentication not available' };
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || '',
            last_name: lastName || ''
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create user in our database
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            isSignUp: true,
            supabaseUserId: data.user.id
          })
        });

        const result = await response.json();
        
        if (result.success) {
          return { success: true };
        } else {
          return { success: false, error: result.error };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up with password error:', error);
      return { success: false, error: 'Sign up failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Use our custom password endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        setUser(result.data.user);
        
        // Update user session tracking
        updateUserSession({
          lastEmail: result.data.user.email
        });
        
        return { 
          success: true, 
          needsPasswordChange: result.data.needsPasswordChange,
          isTestUser: result.data.isTestUser,
          user: result.data.user,
          token: result.data.token
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Sign in with password error:', error);
      return { success: false, error: 'Sign in failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'microsoft' | 'github') => {
    if (!supabase) {
      return { success: false, error: 'OAuth authentication not available' };
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth will redirect, so we don't handle the response here
      return { success: true };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return { success: false, error: 'OAuth sign in failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const enableRememberMe = (enabled: boolean) => {
    setRememberMe(enabled);
    if (enabled) {
      // Set longer session duration
      localStorage.setItem('remember_me', 'true');
    } else {
      localStorage.removeItem('remember_me');
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      // Clear tokens based on remember me setting
      localStorage.removeItem('auth_token');
      if (!rememberMe) {
        localStorage.removeItem('remember_me');
        // Clear any session storage
        sessionStorage.clear();
      }
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      // MVP Mode: Skip API calls for UI development
      if (process.env.NEXT_PUBLIC_APP_ENV === 'mvp') {
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('📱 User refreshed:', {
            email: result.data.email,
            isWalletUser: result.data.email?.includes('@wallet.local'),
            hasProfile: !!(result.data.firstName && result.data.lastName)
          });
          
          // Update user session tracking
          updateUserSession({
            lastEmail: result.data.email
          });
          
          setUser(result.data);
        }
      } else {
        console.error('Failed to refresh user, removing token');
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signUpWithPassword,
    signInWithPassword,
    signInWithOAuth,
    enableRememberMe,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
