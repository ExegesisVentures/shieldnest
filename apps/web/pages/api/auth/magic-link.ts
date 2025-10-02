/**
 * Send Magic Link for Email Authentication (Serverless)
 * File: apps/web/pages/api/auth/magic-link.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/api-shared/db';
import { config } from '../../../src/lib/api-shared/config';
import { withMiddleware } from '../../../src/lib/api-shared/middleware';
import { SecureTokenManager, SecureLogger } from '../../../src/lib/api-shared/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    return res.json({
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
    return res.status(500).json({
      success: false,
      error: 'Failed to send magic link'
    });
  }
}

export default withMiddleware(handler);

