import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ success: false, error: 'Access token is required' });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Authentication not configured' });
    }

    // Set the session using the tokens
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || ''
    });

    if (error) {
      console.error('Session error:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ success: false, error: 'No user found' });
    }

    // Create a simple JWT-like token for our API
    const userToken = Buffer.from(JSON.stringify({
      userId: data.user.id,
      email: data.user.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    return res.status(200).json({
      success: true,
      data: {
        token: userToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name,
          lastName: data.user.user_metadata?.last_name,
          emailVerified: data.user.email_confirmed_at ? true : false,
          hasWallets: false,
          hasUserWallets: false
        }
      }
    });
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
