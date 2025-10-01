import express from 'express';
import { prisma } from '../lib/db';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

/**
 * Get the current active PMA document
 */
router.get('/current', async (req, res) => {
  try {
    const pma = await prisma.pMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!pma) {
      return res.status(404).json({
        success: false,
        error: 'No active PMA document found'
      });
    }

    res.json({
      success: true,
      data: pma
    });
  } catch (error) {
    console.error('Error fetching PMA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PMA document'
    });
  }
});

/**
 * Check if user has signed the current PMA
 */
router.get('/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const currentPMA = await prisma.pMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentPMA) {
      return res.json({
        success: true,
        data: {
          hasSigned: false,
          requiresSignature: false,
          message: 'No PMA document available'
        }
      });
    }

    const consent = await prisma.pMAConsent.findUnique({
      where: {
        userId_version: {
          userId,
          version: currentPMA.version
        }
      }
    });

    res.json({
      success: true,
      data: {
        hasSigned: !!consent,
        requiresSignature: !consent,
        pmaVersion: currentPMA.version,
        signedAt: consent?.timestamp
      }
    });
  } catch (error) {
    console.error('Error checking PMA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check PMA status'
    });
  }
});

/**
 * Sign the PMA agreement
 */
router.post('/sign', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
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

    // Create the consent record
    const consent = await prisma.pMAConsent.create({
      data: {
        userId,
        pmaId: pma.id,
        version: pma.version,
        signature: signature || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.get('User-Agent') || null
      }
    });

    res.json({
      success: true,
      data: {
        consentId: consent.id,
        version: consent.version,
        signedAt: consent.timestamp
      }
    });
  } catch (error) {
    console.error('Error signing PMA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign PMA'
    });
  }
});

/**
 * Get user's PMA consent history
 */
router.get('/history', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const consents = await prisma.pMAConsent.findMany({
      where: { userId },
      include: {
        pma: {
          select: {
            id: true,
            version: true,
            title: true,
            createdAt: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    console.error('Error fetching PMA history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PMA history'
    });
  }
});

/**
 * Generate PMA document for download/email
 */
router.post('/generate-document', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to generate PMA document'
    });
  }
});

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

export default router;
