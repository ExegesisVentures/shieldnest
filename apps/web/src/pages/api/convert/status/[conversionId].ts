/**
 * Get Conversion Status (Serverless)
 * File: apps/web/pages/api/convert/status/[conversionId].ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../lib/api-shared/db';
import { withAuth } from '../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { conversionId } = req.query;

    if (typeof conversionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversion ID'
      });
    }

    const conversion = await prisma.riseConversion.findUnique({
      where: { id: conversionId },
      include: {
        riseHolder: true
      }
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: 'Conversion not found'
      });
    }

    // Verify conversion belongs to user
    if (conversion.userId && conversion.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    return res.json({
      success: true,
      data: {
        id: conversion.id,
        walletAddress: conversion.walletAddress,
        status: conversion.status,
        rollTokenId: conversion.rollTokenId,
        txHash: conversion.txHash,
        createdAt: conversion.createdAt,
        updatedAt: conversion.updatedAt
      }
    });
  } catch (error) {
    console.error('Get conversion status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get conversion status'
    });
  }
}

export default withAuth(handler);

