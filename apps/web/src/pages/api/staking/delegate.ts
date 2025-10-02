/**
 * Submit Staking Transaction (Serverless)
 * File: apps/web/pages/api/staking/delegate.ts
 */

import { NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { validatorAddress, amount, txHash, delegatorAddress } = req.body;
    
    if (!validatorAddress || !amount || !txHash || !delegatorAddress) {
      return res.status(400).json({
        success: false,
        error: 'validatorAddress, amount, txHash, and delegatorAddress are required'
      });
    }

    // Validate Coreum address format
    if (!delegatorAddress.startsWith('core1') || delegatorAddress.length < 39) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum delegator address format'
      });
    }

    if (!validatorAddress.startsWith('corevaloper1') || validatorAddress.length < 45) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum validator address format'
      });
    }

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Log the staking transaction for tracking
    console.log(`📊 Staking transaction recorded:`, {
      delegator: delegatorAddress,
      validator: validatorAddress,
      amount: amountNum,
      txHash
    });

    // In a production system, you might want to:
    // 1. Verify the transaction on-chain
    // 2. Store it in database for tracking
    // 3. Update user's staking history
    
    return res.json({
      success: true,
      data: {
        delegatorAddress,
        validatorAddress,
        amount: amountNum,
        txHash,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing staking transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process staking transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

