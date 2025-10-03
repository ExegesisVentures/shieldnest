// apps/web/src/contexts/SessionContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PublicUser, PrivateUser } from '@/lib/supabase/types';

/**
 * User session types
 */
export type UserType = 'visitor' | 'public' | 'private';

export interface UserSession {
  type: UserType;
  publicUser?: PublicUser;
  privateUser?: PrivateUser;
  isLoading: boolean;
}

/**
 * Session context value
 */
interface SessionContextValue {
  session: UserSession;
  refreshSession: () => Promise<void>;
  upgradeToPublic: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultSession: UserSession = {
  type: 'visitor',
  isLoading: true,
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Session provider component
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(defaultSession);

  const refreshSession = async () => {
    try {
      setSession(prev => ({ ...prev, isLoading: true }));
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.user) {
        setSession({ type: 'visitor', isLoading: false });
        return;
      }

      // Fetch public user data
      const { data: publicUser, error: publicError } = await supabase
        .from('public_users')
        .select('*')
        .eq('id', authSession.user.id)
        .single();

      if (publicError || !publicUser) {
        setSession({ type: 'visitor', isLoading: false });
        return;
      }

      // Check if user is private (has PMA signed)
      const { data: privateUser, error: privateError } = await supabase
        .from('private_users')
        .select('*')
        .eq('public_user_id', publicUser.id)
        .single();

      if (!privateError && privateUser && privateUser.pma_status === 'signed') {
        setSession({
          type: 'private',
          publicUser,
          privateUser,
          isLoading: false,
        });
      } else {
        setSession({
          type: 'public',
          publicUser,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setSession({ type: 'visitor', isLoading: false });
    }
  };

  const upgradeToPublic = async (email: string) => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.user) {
        throw new Error('No active session');
      }

      // Update or create public user record
      const { data: publicUser, error } = await supabase
        .from('public_users')
        .upsert({
          id: authSession.user.id,
          email,
          notify_opt_in: false,
        })
        .select()
        .single();

      if (error) throw error;

      setSession({
        type: 'public',
        publicUser,
        isLoading: false,
      });
    } catch (error) {
      console.error('Upgrade to public failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession({ type: 'visitor', isLoading: false });
  };

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshSession();
        } else if (event === 'SIGNED_OUT') {
          setSession({ type: 'visitor', isLoading: false });
        }
      }
    );

    // Initial session check
    refreshSession();

    return () => subscription.unsubscribe();
  }, []);

  const value: SessionContextValue = {
    session,
    refreshSession,
    upgradeToPublic,
    signOut,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to use session context
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
