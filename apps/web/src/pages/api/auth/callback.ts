/**
 * Handle Supabase Auth Callback and Create JWT (Serverless)
 * File: apps/web/pages/api/auth/callback.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { config } from '@/lib/api-shared/config';
import { supabaseAdmin } from '@/lib/api-shared/supabase';
import { withMiddleware } from '@/lib/api-shared/middleware';
import { SecureTokenManager } from '@/lib/api-shared/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Get user from Supabase
    const { data: supabaseUser, error: userError } = await supabaseAdmin.auth.getUser(access_token);

    if (userError || !supabaseUser.user) {
      console.error('Supabase user fetch error:', userError);
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.user.id },
      include: {
        wallets: true,
        userWallets: true
      }
    });

    if (!user) {
      // Try to find by email and link
      user = await prisma.user.findUnique({
        where: { email: supabaseUser.user.email! },
        include: {
          wallets: true,
          userWallets: true
        }
      });

      if (user) {
        // Link existing user to Supabase
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            supabaseId: supabaseUser.user.id,
            emailVerified: supabaseUser.user.email_confirmed_at !== null,
            lastLoginAt: new Date()
          },
          include: {
            wallets: true,
            userWallets: true
          }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: supabaseUser.user.email!,
            supabaseId: supabaseUser.user.id,
            firstName: supabaseUser.user.user_metadata?.first_name || null,
            lastName: supabaseUser.user.user_metadata?.last_name || null,
            name: supabaseUser.user.user_metadata?.first_name && supabaseUser.user.user_metadata?.last_name ? 
              `${supabaseUser.user.user_metadata.first_name} ${supabaseUser.user.user_metadata.last_name}` : 
              supabaseUser.user.user_metadata?.first_name || null,
            emailVerified: supabaseUser.user.email_confirmed_at !== null,
            lastLoginAt: new Date()
          },
          include: {
            wallets: true,
            userWallets: true
          }
        });
      }
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          emailVerified: supabaseUser.user.email_confirmed_at !== null
        },
        include: {
          wallets: true,
          userWallets: true
        }
      });
    }

    // Create our JWT
    const token = SecureTokenManager.generateJWT({
      userId: user.id,
      email: user.email,
      supabaseId: user.supabaseId,
      purpose: 'email-auth'
    } as any);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          hasWallets: user.wallets.length > 0,
          hasUserWallets: user.userWallets.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process authentication callback'
    });
  }
}

export default withMiddleware(handler);

