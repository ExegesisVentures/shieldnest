import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticate } from '@/middleware/auth';
import { config } from '@/lib/config';

const router = Router();

// Utils
function convertMicroToCore(microAmount: string): number {
  const amount = parseFloat(microAmount || '0') / 1_000_000;
  return Number.isFinite(amount) ? amount : 0;
}

async function fetchCurrentClaimableCore(address: string): Promise<number> {
  const response = await fetch(
    `${config.restEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch rewards: ${response.statusText}`);
  }
  const data = await response.json();
  const total = data?.total?.find((t: any) => t.denom === 'ucore');
  return convertMicroToCore(total?.amount || '0');
}

/**
 * Get validators from Coreum blockchain (public endpoint)
 */
router.get('/validators', async (req, res) => {
  try {
    console.log('🔗 Fetching validators from Coreum blockchain via backend...');
    
    // Fetch validators from Coreum REST API
    const validatorsResponse = await fetch(
      `${config.restEndpoint}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=100`
    );
    
    if (!validatorsResponse.ok) {
      throw new Error(`Failed to fetch validators: ${validatorsResponse.status} ${validatorsResponse.statusText}`);
    }
    
    const validatorsData = await validatorsResponse.json();
    console.log(`📊 Found ${validatorsData.validators?.length || 0} active validators`);
    
    if (!validatorsData.validators || validatorsData.validators.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No validators found',
        data: []
      });
    }
    
    // Process validators
    const processedValidators = validatorsData.validators.slice(0, 50).map((validator: any) => {
      const commission = parseFloat(validator.commission?.commission_rates?.rate || '0.05') * 100;
      // Use the correct maximum APR of 43% for Coreum network
      // This reflects the actual network conditions as of current date
      const baseAPR = 43.0; // Current maximum APR for Coreum network
      const commissionFactor = (100 - commission) / 100;
      const estimatedAPR = baseAPR * commissionFactor;
      
      const isRollValidator = validator.description?.moniker?.toLowerCase().includes('roll') || 
                             validator.operator_address === 'corevaloper1rollvalidatoraddress';
      
      return {
        address: validator.operator_address,
        moniker: validator.description?.moniker || 'Unknown Validator',
        commission: `${commission.toFixed(1)}%`,
        apr: `${estimatedAPR.toFixed(1)}%`,
        aprValue: estimatedAPR,
        status: validator.jailed ? 'Jailed' : 'Active',
        description: isRollValidator ? 'Roll Validation - Professional validator supporting high-quality security standards' : validator.description?.details,
        website: validator.description?.website || undefined,
        isRecommended: isRollValidator
      };
    });
    
    // Sort by APR descending, but keep Roll validator first
    const rollValidator = processedValidators.find((v: any) => v.isRecommended);
    const otherValidators = processedValidators
      .filter((v: any) => !v.isRecommended)
      .sort((a: any, b: any) => b.aprValue - a.aprValue);
    
    const sortedValidators = rollValidator ? [rollValidator, ...otherValidators] : otherValidators;
    
    console.log(`✅ Successfully processed ${sortedValidators.length} validators`);
    
    return res.json({ 
      success: true, 
      data: sortedValidators,
      count: sortedValidators.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching validators:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch validators from blockchain',
      message: error.message
    });
  }
});

/**
 * Track a wallet for staking rewards (members only)
 */
router.post('/track-wallet', authenticate, async (req, res) => {
  try {
    const { userId, address, chain = 'coreum', startDate, investedUsd } = req.body;

    if (!userId || !address || !startDate) {
      return res.status(400).json({ success: false, error: 'userId, address, startDate are required' });
    }

    // Upsert tracked wallet
    const tracked = await prisma.stakingTrackedWallet.upsert({
      where: { address_chain: { address, chain } },
      update: {
        userId,
        startDate: new Date(startDate),
        investedUsd: investedUsd !== undefined ? investedUsd : undefined,
      },
      create: {
        userId,
        address,
        chain,
        startDate: new Date(startDate),
        investedUsd,
      }
    });

    // Ensure totals row exists
    await prisma.stakingWalletTotal.upsert({
      where: { trackedWalletId: tracked.id },
      update: {},
      create: { trackedWalletId: tracked.id }
    });

    return res.json({ success: true, data: tracked });
  } catch (error) {
    console.error('Track wallet error:', error);
    return res.status(500).json({ success: false, error: 'Failed to track wallet' });
  }
});

/**
 * Log a reward claim (admin performs claims on behalf of member)
 */
router.post('/claims', authenticate, async (req, res) => {
  try {
    const { address, chain = 'coreum', amountCore, txHash, autoCompounded = false } = req.body;
    if (!address || amountCore === undefined) {
      return res.status(400).json({ success: false, error: 'address and amountCore are required' });
    }

    const tracked = await prisma.stakingTrackedWallet.findUnique({
      where: { address_chain: { address, chain } },
      include: { totals: true }
    });

    if (!tracked) {
      return res.status(404).json({ success: false, error: 'Tracked wallet not found' });
    }

    const amount = Number(amountCore);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'amountCore must be a positive number' });
    }

    // Create claim and update totals in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.stakingClaim.create({
        data: {
          trackedWalletId: tracked.id,
          userId: tracked.userId,
          amount,
          txHash,
          autoCompounded,
        }
      });

      const updatedTotals = await tx.stakingWalletTotal.update({
        where: { trackedWalletId: tracked.id },
        data: {
          totalClaimed: {
            increment: amount
          },
          lastClaimAt: new Date(),
        }
      });

      return { claim, totals: updatedTotals };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Create claim error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create claim' });
  }
});

/**
 * Refresh current claimable amounts (single wallet or all)
 */
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const { address, chain = 'coreum' } = req.body || {};

    const targets = address
      ? await prisma.stakingTrackedWallet.findMany({ where: { address, chain }, include: { totals: true } })
      : await prisma.stakingTrackedWallet.findMany({ include: { totals: true } });

    const results: any[] = [];
    for (const t of targets) {
      try {
        const currentClaimable = await fetchCurrentClaimableCore(t.address);
        const updated = await prisma.stakingWalletTotal.update({
          where: { trackedWalletId: t.id },
          data: {
            currentClaimable,
            lastClaimableUpdate: new Date()
          }
        });
        results.push({ address: t.address, currentClaimable: updated.currentClaimable });
      } catch (inner) {
        console.warn('Refresh claimable failed for', t.address, inner);
        results.push({ address: t.address, error: true });
      }
    }

    return res.json({ success: true, data: { count: results.length, results } });
  } catch (error) {
    console.error('Refresh totals error:', error);
    return res.status(500).json({ success: false, error: 'Failed to refresh totals' });
  }
});

/**
 * Admin list of tracked members with totals and admin take (20%)
 */
router.get('/members', authenticate, async (req, res) => {
  try {
    const tracked = await prisma.stakingTrackedWallet.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, firstName: true, lastName: true } },
        totals: true,
      }
    });

    const rows = tracked.map((t) => {
      const totalClaimed = Number(t.totals?.totalClaimed || 0);
      const currentClaimable = Number(t.totals?.currentClaimable || 0);
      const adminTake = totalClaimed * 0.2; // fixed 20%
      return {
        trackedWalletId: t.id,
        user: t.user,
        address: t.address,
        chain: t.chain,
        startDate: t.startDate,
        investedUsd: t.investedUsd,
        totals: {
          totalClaimed,
          currentClaimable,
          lastClaimAt: t.totals?.lastClaimAt || null,
          lastClaimableUpdate: t.totals?.lastClaimableUpdate || null,
        },
        adminTake,
      };
    });

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('List members error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list members' });
  }
});

/**
 * Submit staking transaction (authenticated endpoint)
 */
router.post('/delegate', authenticate, async (req, res) => {
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
      message: error.message
    });
  }
});

export default router;


