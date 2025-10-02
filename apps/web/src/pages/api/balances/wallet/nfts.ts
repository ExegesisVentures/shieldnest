/**
 * NFT Holdings Endpoint (Serverless)
 * File: apps/web/src/pages/api/balances/wallet/nfts.ts
 * 
 * Get NFT holdings for a wallet address
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required'
      });
    }

    // Validate Coreum address format
    if (!address.startsWith('core1')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    console.log('🎨 Fetching NFT holdings for:', address);

    // For now, return empty NFT holdings since Coreum NFT infrastructure is still developing
    // This endpoint can be enhanced when Coreum NFT standards are more established
    const nftHoldings = {
      address,
      nfts: [],
      totalCount: 0,
      collections: [],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: nftHoldings,
      message: 'NFT holdings retrieved (Coreum NFT infrastructure still developing)'
    });

  } catch (error) {
    console.error('Error fetching NFT holdings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT holdings'
    });
  }
}

export default withMiddleware(handler);
