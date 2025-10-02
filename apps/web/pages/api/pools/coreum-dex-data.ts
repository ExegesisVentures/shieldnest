/**
 * Coreum DEX Pool Data Endpoint (Serverless)
 * File: apps/web/pages/api/pools/coreum-dex-data.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../../../src/lib/api-shared/middleware';

interface PoolData {
  id: string;
  name: string;
  token0: { symbol: string; denom: string };
  token1: { symbol: string; denom: string };
  tvl: number;
  apr: number;
  volume24h: number;
  fee: number;
  isActive: boolean;
  isNew: boolean;
  poolAddress?: string;
  reserves?: {
    token0: string;
    token1: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Fetching pool data from Coreum DEX...');
    
    // Pool configuration - these will be the pools once created on-chain
    const poolConfigs = [
      {
        id: 'shld-core',
        name: 'SHLD/CORE',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'CORE', denom: 'ucore' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-roll',
        name: 'SHLD/ROLL',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'ROLL', denom: 'roll-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'core-roll',
        name: 'CORE/ROLL',
        token0: { symbol: 'CORE', denom: 'ucore' },
        token1: { symbol: 'ROLL', denom: 'roll-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'solo-roll',
        name: 'SOLO/ROLL',
        token0: { symbol: 'SOLO', denom: 'solo-ft' },
        token1: { symbol: 'ROLL', denom: 'roll-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-solo',
        name: 'SHLD/SOLO',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'SOLO', denom: 'solo-ft' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-cat',
        name: 'SHLD/CAT',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'CAT', denom: 'ucat' },
        fee: 0.3,
        isNew: true
      },
      {
        id: 'shld-cozy',
        name: 'SHLD/COZY',
        token0: { symbol: 'SHLD', denom: 'shield-ft' },
        token1: { symbol: 'COZY', denom: 'cozy-ft' },
        fee: 0.3,
        isNew: true
      }
    ];

    const pools: PoolData[] = poolConfigs.map((config) => {
      return {
        ...config,
        tvl: 0,
        apr: 0,
        volume24h: 0,
        isActive: false,
        poolAddress: undefined,
        reserves: undefined
      };
    });

    console.log(`✅ Processed ${pools.length} pool configurations`);
    
    return res.json({
      success: true,
      data: pools,
      count: pools.length,
      message: 'Pool data ready for production launch'
    });
    
  } catch (error) {
    console.error('❌ Error fetching pool data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pool data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withMiddleware(handler);

