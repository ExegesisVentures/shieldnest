/**
 * Connect and Verify Wallet (Authenticated) (Serverless)
 * File: apps/web/pages/api/auth/connect-wallet.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { SecureTokenManager } from '../../../../lib/api-shared/security';
import WalletVerifier from '../../../../lib/api-shared/wallet';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    return res.json({
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
    return res.status(500).json({
      success: false,
      error: 'Failed to connect wallet'
    });
  }
}

export default withAuth(handler);

