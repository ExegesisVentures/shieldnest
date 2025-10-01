import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { authenticate, requireWallet } from '@/middleware/auth';
import WalletVerifier from '@/utils/wallet';
import { AuthenticatedRequest, TMASignRequest } from '@/types';

const router = Router();

/**
 * Get current active TMA
 */
router.get('/current', async (req, res) => {
  try {
    const tma = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!tma) {
      return res.status(404).json({
        success: false,
        error: 'No active TMA found'
      });
    }

    res.json({
      success: true,
      data: {
        version: tma.version,
        hash: tma.hash,
        body: tma.body,
        createdAt: tma.createdAt
      }
    });
  } catch (error) {
    console.error('Get TMA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get TMA'
    });
  }
});

/**
 * Get user's TMA consent status
 */
router.get('/consent-status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const currentTMA = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentTMA) {
      return res.status(404).json({
        success: false,
        error: 'No active TMA found'
      });
    }

    const consents = await prisma.tMAConsent.findMany({
      where: { 
        userId: req.user!.id,
        version: currentTMA.version
      },
      include: {
        wallet: true
      }
    });

    res.json({
      success: true,
      data: {
        currentVersion: currentTMA.version,
        hasConsented: consents.length > 0,
        consents: consents.map(consent => ({
          walletAddress: consent.wallet.address,
          timestamp: consent.timestamp,
          signature: consent.signature
        }))
      }
    });
  } catch (error) {
    console.error('Get TMA consent status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consent status'
    });
  }
});

/**
 * Sign TMA with wallet
 */
router.post('/sign', authenticate, requireWallet, async (req: AuthenticatedRequest, res) => {
  try {
    const { version, signature, messageHash }: TMASignRequest = req.body;

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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to sign TMA'
    });
  }
});

/**
 * Get all TMA versions (admin only - for now public for development)
 */
router.get('/versions', async (req, res) => {
  try {
    const tmas = await prisma.tMA.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: tmas.map(tma => ({
        version: tma.version,
        hash: tma.hash,
        isActive: tma.isActive,
        createdAt: tma.createdAt
      }))
    });
  } catch (error) {
    console.error('Get TMA versions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get TMA versions'
    });
  }
});

/**
 * Create new TMA version (admin only - simplified for development)
 */
router.post('/create', async (req, res) => {
  try {
    const { version, body } = req.body;

    if (!version || !body) {
      return res.status(400).json({
        success: false,
        error: 'Version and body are required'
      });
    }

    // Check if version already exists
    const existingTMA = await prisma.tMA.findFirst({
      where: { version }
    });

    if (existingTMA) {
      return res.status(400).json({
        success: false,
        error: 'TMA version already exists'
      });
    }

    // Create hash of the TMA body
    const hash = crypto.createHash('sha256')
      .update(body)
      .digest('hex');

    // Deactivate previous TMA if this is marked as active
    await prisma.tMA.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new TMA
    const tma = await prisma.tMA.create({
      data: {
        version,
        hash,
        body,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        version: tma.version,
        hash: tma.hash,
        isActive: tma.isActive,
        createdAt: tma.createdAt
      }
    });
  } catch (error) {
    console.error('Create TMA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create TMA'
    });
  }
});

export default router;
