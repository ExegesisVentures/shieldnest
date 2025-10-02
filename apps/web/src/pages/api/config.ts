/**
 * Config Endpoint (Serverless)
 * File: apps/web/pages/api/config.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { config } from '../../lib/api-shared/config';
import { withMiddleware } from '../../lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return res.json({
    success: true,
    data: {
      chainId: config.chainId,
      contracts: config.contracts,
      pricing: config.pricing,
      supply: config.supply,
      rewards: config.rewards,
      accessGating: config.accessGating,
      marketplaceFees: config.marketplaceFees
    }
  });
}

export default withMiddleware(handler);

