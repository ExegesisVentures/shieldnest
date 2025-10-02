/**
 * Initiate Rise to Roll NFT Conversion (Serverless)
 * File: apps/web/pages/api/convert/convert.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/api-shared/db';
import { withAuth, requireWallet } from '../../../src/lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check wallet requirement
  if (!requireWallet(req, res)) {
    return; // Response already sent
  }

  try {
    const walletAddress = req.wallet!.address;
    const userId = req.user!.id;
    const walletId = req.wallet!.id;

    // Check if user has available Rise NFTs
    const riseHolder = await prisma.riseNFTHolder.findUnique({
      where: { walletAddress }
    });

    if (!riseHolder) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address not found in Rise NFT holders list'
      });
    }

    if (riseHolder.remainingCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No Rise NFTs available for conversion'
      });
    }

    // Check if there's already a pending conversion for this wallet
    const pendingConversion = await prisma.riseConversion.findFirst({
      where: {
        walletAddress,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingConversion) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending conversion. Please wait for it to complete.'
      });
    }

    // Create conversion record
    const conversion = await prisma.riseConversion.create({
      data: {
        riseHolderId: riseHolder.id,
        walletAddress,
        userId,
        walletId,
        status: 'PENDING'
      }
    });

    // Update remaining count
    await prisma.riseNFTHolder.update({
      where: { id: riseHolder.id },
      data: {
        remainingCount: riseHolder.remainingCount - 1
      }
    });

    console.log(`✅ Conversion initiated for wallet ${walletAddress}:`, {
      conversionId: conversion.id,
      riseHolder: riseHolder.walletAddress,
      remainingAfter: riseHolder.remainingCount - 1
    });

    return res.json({
      success: true,
      data: {
        conversionId: conversion.id,
        walletAddress: conversion.walletAddress,
        status: conversion.status,
        createdAt: conversion.createdAt,
        message: 'Conversion initiated successfully. You will receive your Roll NFT shortly.',
        remainingConversions: riseHolder.remainingCount - 1
      }
    });
  } catch (error) {
    console.error('Convert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate conversion'
    });
  }
}

export default withAuth(handler);

