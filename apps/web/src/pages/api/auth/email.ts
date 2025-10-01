import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName, isSignUp } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Email authentication not configured' });
    }

    if (isSignUp) {
      // Sign up flow
      const { data, error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Sign up successful! Please check your email to verify your account.' 
      });
    } else {
      // Sign in flow
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (error) {
        console.error('Sign in error:', error);
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Magic link sent! Please check your email to sign in.' 
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
