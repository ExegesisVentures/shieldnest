/**
 * Password Authentication Endpoint (Serverless)
 * File: apps/web/pages/api/auth/password.ts
 * 
 * Handles password-based authentication for test users
 */

import { NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../src/lib/api-shared/db';
import { config } from '../../../src/lib/api-shared/config';
import { supabase } from '../../../src/lib/api-shared/supabase';
import { withMiddleware } from '../../../src/lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Password auth error:', authError);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Find user in our database
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallets: true,
        userWallets: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update last login
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        emailVerified: authData.user?.email_confirmed_at !== null
      },
      include: {
        wallets: true,
        userWallets: true
      }
    });

    // Check if user needs password change (test users)
    const needsPasswordChange = authData.user?.user_metadata?.needs_password_change === true;
    const isTestUser = authData.user?.user_metadata?.is_test_user === true;

    // Create our JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        purpose: 'auth'
      },
      config.jwt.secret!,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          emailVerified: user.emailVerified,
          wallets: user.wallets,
          userWallets: user.userWallets
        },
        token,
        needsPasswordChange,
        isTestUser
      }
    });

  } catch (error) {
    console.error('Password auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

export default withMiddleware(handler);

