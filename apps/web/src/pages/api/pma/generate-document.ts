/**
 * Generate PMA Document for Download/Email (Serverless)
 * File: apps/web/pages/api/pma/generate-document.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

// Helper function to generate PMA document content
function generatePMADocument(pma: any, user: any, consent: any): string {
  return `
PRIVATE MEMBERSHIP AGREEMENT
${pma.title}
Version: ${pma.version}

Member Information:
Name: ${user.name || user.email}
Email: ${user.email}
Date Signed: ${consent.timestamp.toLocaleDateString()}
IP Address: ${consent.ipAddress || 'N/A'}

Agreement Content:
${pma.content}

Digital Signature: ${consent.signature || 'Electronic Consent'}
Timestamp: ${consent.timestamp.toISOString()}

This document serves as proof of your agreement to the Private Membership Agreement.
  `.trim();
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.user!.id;
    const { pmaId, format = 'pdf' } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get PMA document
    const pma = await prisma.pMA.findUnique({
      where: { id: pmaId }
    });

    if (!pma) {
      return res.status(404).json({
        success: false,
        error: 'PMA document not found'
      });
    }

    // Get consent record
    const consent = await prisma.pMAConsent.findUnique({
      where: {
        userId_version: {
          userId,
          version: pma.version
        }
      }
    });

    if (!consent) {
      return res.status(400).json({
        success: false,
        error: 'You must sign the PMA before generating a document'
      });
    }

    // Generate document content
    const documentContent = generatePMADocument(pma, user, consent);

    return res.json({
      success: true,
      data: {
        content: documentContent,
        format,
        filename: `PMA_${pma.version}_${user.email}_${consent.timestamp.toISOString().split('T')[0]}.${format}`,
        signedAt: consent.timestamp
      }
    });
  } catch (error) {
    console.error('Error generating PMA document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate PMA document'
    });
  }
}

export default withAuth(handler);

