/**
 * Get Wallet Balances Endpoint (Serverless)
 * File: apps/web/pages/api/balances/[address].ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withMiddleware } from '../../../src/lib/api-shared/middleware';
import { config } from '../../../src/lib/api-shared/config';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid address is required'
      });
    }

    // Validate Coreum address format
    if (!address.startsWith('core1')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Fetch balances from Coreum REST API
    const response = await axios.get(
      `${config.restEndpoint}/cosmos/bank/v1beta1/balances/${address}`,
      { timeout: 10000 }
    );

    if (!response.data || !response.data.balances) {
      return res.status(404).json({
        success: false,
        error: 'Unable to fetch balances'
      });
    }

    return res.json({
      success: true,
      data: {
        address,
        balances: response.data.balances,
        pagination: response.data.pagination
      }
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Address not found or has no balances'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balances'
    });
  }
}

export default withMiddleware(handler);

