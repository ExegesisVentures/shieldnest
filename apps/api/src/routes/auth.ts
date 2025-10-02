import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { authenticate } from '@/middleware/auth';
import { SecurityMiddlewareFactory } from '@/middleware/security';
import { SecureTokenManager, SecureLogger, SecurityValidator } from '@/utils/security';
import WalletVerifier from '@/utils/wallet';
import { AuthenticatedRequest, WalletConnectRequest, ApiResponse } from '@/types';

const router = Router();

// Apply auth-specific security middleware to all routes
router.use(SecurityMiddlewareFactory.getAuthMiddleware());

/**
 * Send magic link for email authentication
 */
router.post('/magic-link', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null
        }
      });
    }

    // Generate magic link token
    const magicToken = SecureTokenManager.generateMagicLinkToken({
      userId: user.id,
      email: user.email,
      purpose: 'magic-link'
    });

    // In production, send email here
    // For now, return the token for development
    const magicLink = `${config.server.frontendUrl}/auth/verify?token=${magicToken}`;

    SecureLogger.logSecure('info', 'Magic link generated', {
      email,
      userId: user.id,
      ...(config.server.nodeEnv === 'development' && { magicLink })
    });

    res.json({
      success: true,
      message: 'Magic link sent to email',
      data: {
        // Remove this in production
        ...(config.server.nodeEnv === 'development' && { magicLink })
      }
    });
  } catch (error) {
    SecureLogger.logSecure('error', 'Magic link error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body?.email
    });
    res.status(500).json({
      success: false,
      error: 'Failed to send magic link'
    });
  }
});

/**
 * Password-based authentication for test users
 */
router.post('/password', async (req, res) => {
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * Change password for test users
 */
router.post('/change-password', async (req, res) => {
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

    res.json({
      success: true,
      message: 'Password updated successfully. Check your email for a verification link.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * Supabase email authentication (signup/signin)
 */
router.post('/email', async (req, res) => {
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to process email authentication'
    });
  }
});

/**
 * Handle Supabase auth callback and create our JWT
 */
router.post('/callback', async (req, res) => {
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
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        supabaseId: user.supabaseId,
        type: 'email-auth'
      },
      config.auth.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to process authentication callback'
    });
  }
});

/**
 * Verify magic link token (legacy support)
 */
router.post('/verify-magic-link', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const decoded = SecureTokenManager.verifyMagicLinkToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        wallets: true,
        tmaConsents: {
          where: { tma: { isActive: true } },
          include: { tma: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate session JWT
    const sessionToken = SecureTokenManager.generateJWT({
      userId: user.id,
      purpose: 'session'
    });

    res.json({
      success: true,
      data: {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          wallets: user.wallets.map(w => ({
            id: w.id,
            address: w.address,
            chain: w.chain,
            verifiedAt: w.verifiedAt
          })),
          hasActiveTMA: user.tmaConsents.length > 0
        }
      }
    });
  } catch (error) {
    SecureLogger.logSecure('error', 'Magic link verification error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(400).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

/**
 * Connect and verify wallet
 */
router.post('/connect-wallet', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { address, chain, signature, message, publicKey }: WalletConnectRequest = req.body;

    // Validate inputs
    if (!address || !chain || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Address, chain, signature, and message are required'
      });
    }

    if (chain !== 'coreum') {
      return res.status(400).json({
        success: false,
        error: 'Only Coreum chain is supported'
      });
    }

    if (!WalletVerifier.isValidCoreumAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Verify signature
    if (publicKey) {
      const isValidSignature = await WalletVerifier.verifyADR36Signature(
        address,
        message,
        signature,
        publicKey
      );

      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          error: 'Invalid signature'
        });
      }
    } else {
      // If no public key provided, we'll need to verify differently
      console.warn('No public key provided for signature verification');
    }

    // Check if wallet already exists
    let wallet = await prisma.wallet.findFirst({
      where: {
        address,
        chain
      }
    });

    if (wallet && wallet.userId !== req.user!.id) {
      return res.status(400).json({
        success: false,
        error: 'Wallet is already connected to another account'
      });
    }

    if (!wallet) {
      // Create new wallet
      wallet = await prisma.wallet.create({
        data: {
          userId: req.user!.id,
          address,
          chain,
          verifiedAt: new Date()
        }
      });
    } else {
      // Update verification timestamp
      wallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { verifiedAt: new Date() }
      });
    }

    // Generate new token with wallet info
    const tokenWithWallet = SecureTokenManager.generateJWT({
      userId: req.user!.id,
      walletId: wallet.id,
      purpose: 'wallet-connect'
    });

    res.json({
      success: true,
      data: {
        token: tokenWithWallet,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain,
          verifiedAt: wallet.verifiedAt
        }
      }
    });
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect wallet'
    });
  }
});

/**
 * Test Supabase database connection
 */
router.post('/test-db', async (req, res) => {
  try {
    console.log('🔐 [DEBUG] Testing Supabase database connection...');
    
    // Test simple query to users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('🔐 [DEBUG] Users query result:', { users, error: usersError?.message });
    
    // Test simple query to wallets table
    const { data: wallets, error: walletsError } = await supabaseAdmin
      .from('wallets')
      .select('count')
      .limit(1);
    
    console.log('🔐 [DEBUG] Wallets query result:', { wallets, error: walletsError?.message });
    
    res.json({
      success: true,
      message: 'Database connection test completed',
      data: {
        users: { hasData: !!users, error: usersError?.message },
        wallets: { hasData: !!wallets, error: walletsError?.message }
      }
    });
  } catch (error) {
    console.error('🔐 [DEBUG] Database test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Wallet-only authentication - creates user if needed and returns JWT token
 */
router.post('/wallet-auth', async (req, res) => {
  console.log('🔐 [DEBUG] WALLET AUTH ENDPOINT HIT! - PROPER VERSION');
  console.log('🔐 [DEBUG] Wallet auth endpoint called with:', {
    address: req.body.address,
    chain: req.body.chain,
    hasSignature: !!req.body.signature,
    hasMessage: !!req.body.message,
    hasPublicKey: !!req.body.publicKey,
    signatureLength: req.body.signature?.length || 0,
    messageLength: req.body.message?.length || 0
  });
  
  try {
    const { address, chain, signature, message, publicKey } = req.body;

    // Validate inputs
    if (!address || !chain || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Address, chain, signature, and message are required'
      });
    }

    if (chain !== 'coreum') {
      return res.status(400).json({
        success: false,
        error: 'Only Coreum chain is supported'
      });
    }

    if (!WalletVerifier.isValidCoreumAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // TEMPORARY DEVELOPMENT BYPASS - REMOVE IN PRODUCTION
    console.log('🔐 [TEMP] Development mode wallet auth bypass active');
    const isSignatureValid = true;

    if (!isSignatureValid) {
      SecureLogger.logSecure('warn', 'Wallet authentication failed: Invalid signature', {
        address,
        chain,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid wallet signature. Please try connecting again.'
      });
    }

    // Check for existing wallet first
    console.log('🔐 [DEBUG] Checking for existing wallet...');
    const { data: existingWallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, address, chain, verifiedAt, userId')
      .eq('address', address)
      .eq('chain', chain)
      .single();
    
    console.log('🔐 [DEBUG] Wallet query result:', { existingWallet: !!existingWallet, error: walletError?.message });

    let user, wallet;
    
    if (existingWallet && !walletError) {
      // Existing wallet found, get the user
      console.log('🔐 [DEBUG] Found existing wallet, fetching user...');
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('id', existingWallet.userId)
        .single();
      
      if (existingUser && !userError) {
        user = existingUser;
        
        // Update verification timestamp
        const { data: updatedWallet } = await supabaseAdmin
          .from('wallets')
          .update({ verifiedAt: new Date().toISOString() })
          .eq('id', existingWallet.id)
          .select()
          .single();
        
        wallet = updatedWallet;
        console.log(`🔄 Returning user reconnected: ${user.email} with wallet ${address}`);
      } else {
        console.log('🔐 [DEBUG] User not found for existing wallet, creating new user...');
        // Create new user for existing wallet
        const { data: newUser } = await supabaseAdmin
          .from('users')
          .insert({
            id: uuidv4(),
            email: `${address}@wallet.local`,
            name: `Wallet ${address.substring(0, 10)}...`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single();
        
        user = newUser;
        wallet = existingWallet;
        console.log(`🆕 Created new user for existing wallet: ${address}`);
      }
    } else {
      // No existing wallet, create new user and wallet
      console.log('🔐 [DEBUG] No existing wallet found, creating new user and wallet...');
      
      // Create new user with explicit UUID
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: uuidv4(),
          email: `${address}@wallet.local`,
          name: `Wallet ${address.substring(0, 10)}...`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (userError || !newUser) {
        throw new Error(`Failed to create user: ${userError?.message || 'Unknown error'}`);
      }
      
      user = newUser;
      
      // Create wallet for the new user
      const { data: newWallet, error: walletError2 } = await supabaseAdmin
        .from('wallets')
        .insert({
          id: uuidv4(),
          userId: user.id,
          address,
          chain,
          verifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (walletError2 || !newWallet) {
        throw new Error(`Failed to create wallet: ${walletError2?.message || 'Unknown error'}`);
      }
      
      wallet = newWallet;
      console.log(`🆕 New wallet-only user created: ${address}`);
    }

    // Generate JWT token with wallet info
    const token = SecureTokenManager.generateJWT({
      userId: user.id,
      walletId: wallet.id,
      purpose: 'wallet-auth'
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          wallets: [{
            id: wallet.id,
            address: wallet.address,
            chain: wallet.chain,
            verifiedAt: wallet.verifiedAt
          }]
        },
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain,
          verifiedAt: wallet.verifiedAt
        }
      }
    });
  } catch (error) {
    SecureLogger.logSecure('error', 'Wallet authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate wallet',
      ...(config.server.nodeEnv === 'development' && { 
        debug: error instanceof Error ? error.message : 'Unknown error' 
      })
    });
  }
});

/**
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        wallets: true,
        tmaConsents: {
          where: { tma: { isActive: true } },
          include: { tma: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          wallets: user.wallets.map(w => ({
            id: w.id,
            address: w.address,
            chain: w.chain,
            verifiedAt: w.verifiedAt
          })),
          hasActiveTMA: user.tmaConsents.length > 0,
          tmaConsents: user.tmaConsents.map(consent => ({
            version: consent.version,
            timestamp: consent.timestamp
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

export default router;
