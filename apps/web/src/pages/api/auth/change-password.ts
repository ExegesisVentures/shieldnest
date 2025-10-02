/**
 * Change Password for Test Users (Serverless)
 * File: apps/web/pages/api/auth/change-password.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/api-shared/supabase';
import { config } from '@/lib/api-shared/config';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, old password, and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // First verify the old password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      {
        password: newPassword,
        user_metadata: {
          ...authData.user.user_metadata,
          needs_password_change: false,
          password_changed_at: new Date().toISOString()
        }
      }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }

    // Send magic link for email verification after password change
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${config.server.frontendUrl}/auth/callback`
        }
      });

      if (otpError) {
        console.warn('Failed to send verification email:', otpError);
        // Don't fail the password change if email sending fails
      }
    } catch (emailError) {
      console.warn('Error sending verification email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Password updated successfully. Check your email for a verification link.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
}

export default withMiddleware(handler);

