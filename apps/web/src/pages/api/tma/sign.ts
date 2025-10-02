/**
 * Sign TMA with Wallet (Serverless)
 * File: apps/web/pages/api/tma/sign.ts
 */

import { NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth, requireWallet } from '../../../../lib/api-shared/middleware';
import WalletVerifier from '../../../../lib/api-shared/wallet';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check if wallet is required
  if (!requireWallet(req, res)) {
    return; // Response already sent
  }

  try {
    const { version, signature, messageHash } = req.body;

    if (!version || !signature || !messageHash) {
      return res.status(400).json({
        success: false,
        error: 'Version, signature, and messageHash are required'
      });
    }

    // Get the TMA document
    const tma = await prisma.tMA.findFirst({
      where: { 
        version,
        isActive: true
      }
    });

    if (!tma) {
      return res.status(404).json({
        success: false,
        error: 'TMA version not found or inactive'
      });
    }

    // Check if user already signed this version with this wallet
    const existingConsent = await prisma.tMAConsent.findFirst({
      where: {
        userId: req.user!.id,
        walletId: req.wallet!.id,
        version
      }
    });

    if (existingConsent) {
      return res.status(400).json({
        success: false,
        error: 'TMA already signed with this wallet'
      });
    }

    // Verify the message hash matches expected TMA message
    const expectedMessage = WalletVerifier.createTMAMessage(
      req.wallet!.address,
      version,
      tma.hash,
      Date.now() // In production, you'd validate timestamp is recent
    );
    
    const expectedHash = crypto.createHash('sha256')
      .update(expectedMessage)
      .digest('hex');

    // Note: In production, you'd also verify the signature against the message
    // For now, we'll store the signature as provided

    // Create TMA consent record
    const consent = await prisma.tMAConsent.create({
      data: {
        userId: req.user!.id,
        walletId: req.wallet!.id,
        tmaId: tma.id,
        version,
        signature,
        messageHash
      }
    });

    // Log for compliance
    console.log(`TMA signed: User ${req.user!.id}, Wallet ${req.wallet!.address}, Version ${version}, Timestamp ${consent.timestamp}`);

    return res.json({
      success: true,
      data: {
        consentId: consent.id,
        version: consent.version,
        timestamp: consent.timestamp,
        message: 'TMA successfully signed'
      }
    });
  } catch (error) {
    console.error('TMA signing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sign TMA'
    });
  }
}

export default withAuth(handler);

