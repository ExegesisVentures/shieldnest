import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/profile/UserProfile';
import EmailAuth from '@/components/auth/EmailAuth';

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <UserProfile />
      ) : (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-md">
            <EmailAuth />
          </div>
        </div>
      )}
    </div>
  );
}
