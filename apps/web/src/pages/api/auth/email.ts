/**
 * Supabase Email Authentication - Signup/Signin (Serverless)
 * File: apps/web/pages/api/auth/email.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { config } from '@/lib/api-shared/config';
import { supabase } from '@/lib/api-shared/supabase';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName, isSignUp = false } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    let authResult;
    
    if (isSignUp) {
      // Sign up new user
      authResult = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36), // We'll use email-only auth, password not used
        options: {
          emailRedirectTo: `${config.server.frontendUrl}/auth/callback`,
          data: {
            first_name: firstName || '',
            last_name: lastName || ''
          }
        }
      });
    } else {
      // Sign in existing user with magic link
      authResult = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${config.server.frontendUrl}/auth/callback`
        }
      });
    }

    if (authResult.error) {
      console.error('Supabase auth error:', authResult.error);
      return res.status(400).json({
        success: false,
        error: authResult.error.message
      });
    }

    // Create or update user in our database
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          name: firstName && lastName ? `${firstName} ${lastName}` : firstName || null,
          supabaseId: authResult.data.user?.id || null,
          emailVerified: authResult.data.user?.email_confirmed_at !== null
        }
      });
    } else if (authResult.data.user?.id && !user.supabaseId) {
      // Link existing user to Supabase
      await prisma.user.update({
        where: { id: user.id },
        data: {
          supabaseId: authResult.data.user.id,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          name: (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || user.name),
          emailVerified: authResult.data.user?.email_confirmed_at !== null
        }
      });
    }

    return res.json({
      success: true,
      message: isSignUp ? 
        'Sign up successful! Please check your email to verify your account.' : 
        'Magic link sent! Please check your email to sign in.',
      data: {
        needsVerification: isSignUp,
        email
      }
    });

  } catch (error) {
    console.error('Email auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process email authentication'
    });
  }
}

export default withMiddleware(handler);

