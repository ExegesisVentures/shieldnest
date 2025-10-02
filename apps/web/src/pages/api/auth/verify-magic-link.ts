/**
 * Verify Magic Link Token (Serverless)
 * File: apps/web/pages/api/auth/verify-magic-link.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/api-shared/db';
import { withMiddleware } from '@/lib/api-shared/middleware';
import { SecureTokenManager, SecureLogger } from '@/lib/api-shared/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    return res.json({
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
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

export default withMiddleware(handler);

