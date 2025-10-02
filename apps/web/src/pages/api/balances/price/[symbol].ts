/**
 * Token Price Endpoint (Serverless)
 * File: apps/web/src/pages/api/balances/price/[symbol].ts
 * 
 * Get current price for a token (CORE/COREUM)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '@/lib/api-shared/middleware';

async function getCoreumPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=coreum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.coreum?.usd || 0;
  } catch (error) {
    console.warn('Failed to fetch CORE price:', error);
    return 0;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required'
      });
    }

    // Currently only support CORE/COREUM
    const normalizedSymbol = symbol.toUpperCase();
    if (normalizedSymbol !== 'CORE' && normalizedSymbol !== 'COREUM') {
      return res.status(404).json({
        success: false,
        error: `Price data not available for ${symbol}`
      });
    }

    const price = await getCoreumPrice();

    res.json({
      success: true,
      data: {
        price,
        currency: 'USD',
        symbol: 'CORE',
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching token price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token price'
    });
  }
}

export default withMiddleware(handler);

