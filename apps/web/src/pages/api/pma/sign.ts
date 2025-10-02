/**
 * Sign PMA Agreement (Serverless)
 * File: apps/web/pages/api/pma/sign.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { withAuth } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.user!.id;
    const { pmaId, signature } = req.body;

    if (!pmaId) {
      return res.status(400).json({
        success: false,
        error: 'PMA ID is required'
      });
    }

    // Get the PMA document
    const pma = await prisma.pMA.findUnique({
      where: { id: pmaId }
    });

    if (!pma) {
      return res.status(404).json({
        success: false,
        error: 'PMA document not found'
      });
    }

    // Check if user already signed this version
    const existingConsent = await prisma.pMAConsent.findUnique({
      where: {
        userId_version: {
          userId,
          version: pma.version
        }
      }
    });

    if (existingConsent) {
      return res.status(400).json({
        success: false,
        error: 'You have already signed this PMA version'
      });
    }

    // Get IP address and user agent
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.socket.remoteAddress || 
                     null;
    const userAgent = req.headers['user-agent'] || null;

    // Create the consent record
    const consent = await prisma.pMAConsent.create({
      data: {
        userId,
        pmaId: pma.id,
        version: pma.version,
        signature: signature || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
        userAgent: typeof userAgent === 'string' ? userAgent : null
      }
    });

    return res.json({
      success: true,
      data: {
        consentId: consent.id,
        version: consent.version,
        signedAt: consent.timestamp
      }
    });
  } catch (error) {
    console.error('Error signing PMA:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sign PMA'
    });
  }
}

export default withAuth(handler);

