/**
 * Create New TMA Version (Serverless)
 * File: apps/web/pages/api/tma/create.ts
 * Note: Should be protected by admin middleware in production
 */

import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '@/lib/api-shared/db';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    return res.json({
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
    return res.status(500).json({
      success: false,
      error: 'Failed to create TMA'
    });
  }
}

export default withMiddleware(handler);

