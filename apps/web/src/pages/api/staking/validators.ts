/**
 * Get Validators from Coreum Blockchain (Serverless)
 * File: apps/web/pages/api/staking/validators.ts
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { config } from '../../lib/api-shared/config';
import { withMiddleware } from '../../lib/api-shared/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withMiddleware(handler);

