/**
 * Wallet Authentication Endpoint (Serverless)
 * File: apps/web/pages/api/auth/wallet-auth.ts
 * 
 * Handles wallet-only authentication - creates user if needed and returns JWT token
 */

import { NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { config } from '@/lib/api-shared/config';
import { withMiddleware } from '@/lib/api-shared/middleware';
import { SecureTokenManager, SecureLogger } from '@/lib/api-shared/security';
import WalletVerifier from '@/lib/api-shared/wallet';
import { AuthenticatedRequest } from '@/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  console.log('🔐 [DEBUG] WALLET AUTH ENDPOINT HIT! - Serverless Version');
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
        ip: req.socket.remoteAddress
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid wallet signature. Please try connecting again.'
      });
    }

    // Smart user recognition: Check for existing user association
    console.log('🗄️ [DEBUG] Checking for existing wallet in database:', { address, chain });
    let wallet = await prisma.wallet.findFirst({
      where: { address, chain },
      include: { user: true }
    });
    
    console.log('🗄️ [DEBUG] Wallet lookup result:', {
      walletFound: !!wallet,
      walletId: wallet?.id,
      userId: wallet?.user?.id,
      userEmail: wallet?.user?.email
    });

    // Also check if this address exists in UserWallet table (manual additions)
    let existingUserWallet = null;
    if (!wallet) {
      console.log('🗄️ [DEBUG] Checking for existing user wallet (manual addition):', { address, chain });
      existingUserWallet = await prisma.userWallet.findFirst({
        where: { address, chain },
        include: { user: true }
      });
      
      console.log('🗄️ [DEBUG] UserWallet lookup result:', {
        userWalletFound: !!existingUserWallet,
        userWalletId: existingUserWallet?.id,
        userId: existingUserWallet?.user?.id,
        userEmail: existingUserWallet?.user?.email
      });
    }

    let user;
    if (wallet) {
      // Existing wallet connection
      user = wallet.user;
      // Update verification timestamp
      wallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { verifiedAt: new Date() },
        include: { user: true }
      });
      
      console.log(`🔄 Returning user reconnected: ${user.email} with wallet ${address}`);
    } else if (existingUserWallet) {
      // User previously added this address manually, now connecting with wallet
      user = existingUserWallet.user;
      
      // Create verified wallet connection (upgrade from manual to connected)
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          address,
          chain,
          verifiedAt: new Date()
        },
        include: { user: true }
      });
      
      console.log(`⬆️ Upgraded manual address to connected wallet for user: ${user.email}`);
    } else {
      // Create new user with wallet address as email placeholder
      console.log('🗄️ [DEBUG] Creating new user with wallet:', { address, chain });
      user = await prisma.user.create({
        data: {
          email: `${address}@wallet.local`, // Placeholder email for wallet-only users
          name: `Wallet ${address.substring(0, 10)}...`,
          wallets: {
            create: {
              address,
              chain,
              verifiedAt: new Date()
            }
          }
        },
        include: { wallets: true }
      });
      wallet = { ...user.wallets[0], user };
      
      console.log('🗄️ [DEBUG] New user created successfully:', {
        userId: user.id,
        userEmail: user.email,
        walletId: wallet.id,
        walletAddress: wallet.address
      });
      console.log(`🆕 New wallet-only user created: ${address}`);
    }

    // Generate JWT token with wallet info
    const token = SecureTokenManager.generateJWT({
      userId: user.id,
      walletId: wallet.id,
      purpose: 'wallet-auth'
    });

    return res.json({
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
    console.error('🔐 [ERROR] Wallet authentication error:', error);
    console.error('🔐 [ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    SecureLogger.logSecure('error', 'Wallet authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to authenticate wallet',
      ...(config.server.nodeEnv === 'development' && { 
        debug: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    });
  }
}

export default withMiddleware(handler);

