#!/usr/bin/env node

/**
 * Real Coreum Rewards History Fetcher
 * This script demonstrates how to get actual transaction history for rewards
 * 
 * Usage: node get-real-rewards-history.js core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj
 */

const address = process.argv[2] || 'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj';

console.log('🔍 Fetching REAL rewards history for:', address);
console.log('');

// Current rewards and delegation data
async function getCurrentData() {
  try {
    console.log('📊 Current Staking Position:');
    console.log('================================');
    
    // Get current rewards
    const rewardsResponse = await fetch(
      `https://full-node.mainnet-1.coreum.dev:1317/cosmos/distribution/v1beta1/delegators/${address}/rewards`
    );
    const rewardsData = await rewardsResponse.json();
    
    // Get current delegations  
    const delegationResponse = await fetch(
      `https://full-node.mainnet-1.coreum.dev:1317/cosmos/staking/v1beta1/delegations/${address}`
    );
    const delegationData = await delegationResponse.json();
    
    // Calculate totals
    const totalRewards = parseFloat(rewardsData.total?.[0]?.amount || '0') / 1_000_000;
    const totalDelegated = delegationData.delegation_responses?.reduce((sum, del) => {
      return sum + (parseFloat(del.balance?.amount || '0') / 1_000_000);
    }, 0) || 0;
    
    console.log(`Total Delegated: ${totalDelegated.toFixed(6)} CORE`);
    console.log(`Current Claimable: ${totalRewards.toFixed(6)} CORE`);
    console.log(`Validators: ${delegationData.delegation_responses?.length || 0}`);
    
    if (delegationData.delegation_responses) {
      console.log('');
      console.log('Validator Breakdown:');
      for (const delegation of delegationData.delegation_responses) {
        const validatorAddr = delegation.delegation.validator_address;
        const delegatedAmount = parseFloat(delegation.balance.amount) / 1_000_000;
        
        // Find rewards for this validator
        const validatorReward = rewardsData.rewards?.find(r => r.validator_address === validatorAddr);
        const validatorRewards = parseFloat(validatorReward?.reward?.[0]?.amount || '0') / 1_000_000;
        
        console.log(`  • ${validatorAddr.slice(-12)}: ${delegatedAmount.toFixed(2)} CORE delegated, ${validatorRewards.toFixed(6)} CORE rewards`);
      }
    }
    
    return { totalRewards, totalDelegated, rewardsData, delegationData };
    
  } catch (error) {
    console.error('Error fetching current data:', error.message);
    return null;
  }
}

// Attempt to get transaction history
async function getTransactionHistory() {
  console.log('');
  console.log('🔍 Searching for Transaction History:');
  console.log('=====================================');
  
  // Method 1: Try to get recent transactions
  try {
    console.log('Attempting to fetch recent transactions...');
    
    // This approach may not work due to indexing limitations
    const txResponse = await fetch(
      `https://full-node.mainnet-1.coreum.dev:1317/cosmos/tx/v1beta1/txs?events=message.sender%3D%27${address}%27&pagination.limit=50`
    );
    
    if (txResponse.ok) {
      const txData = await txResponse.json();
      console.log(`Found ${txData.txs?.length || 0} transactions`);
      
      if (txData.txs && txData.txs.length > 0) {
        console.log('Recent transactions found - would need parsing for reward claims');
        return txData.txs;
      }
    } else {
      console.log('Direct transaction query not available through REST API');
    }
  } catch (error) {
    console.log('Transaction history query failed:', error.message);
  }
  
  return null;
}

// Calculate estimated historical earnings
function calculateEstimatedHistory(currentData) {
  if (!currentData) return;
  
  console.log('');
  console.log('📈 Estimated Historical Earnings:');
  console.log('==================================');
  
  const { totalRewards, totalDelegated } = currentData;
  
  // Estimate based on current staking position
  // Assuming average 8% APR over various time periods
  const annualRate = 0.08;
  
  const estimates = [
    { period: '1 month', multiplier: 1/12 },
    { period: '3 months', multiplier: 3/12 },
    { period: '6 months', multiplier: 6/12 },
    { period: '1 year', multiplier: 1 },
    { period: '2 years', multiplier: 2 }
  ];
  
  console.log('If current delegation was staked for:');
  estimates.forEach(({ period, multiplier }) => {
    const estimatedEarned = totalDelegated * annualRate * multiplier + totalRewards;
    console.log(`  ${period}: ~${estimatedEarned.toFixed(2)} CORE total earned`);
  });
  
  console.log('');
  console.log('⚠️  Note: These are estimates based on current delegation amount.');
  console.log('   Real earnings depend on:');
  console.log('   • Actual staking duration');
  console.log('   • Validator performance');
  console.log('   • Network reward rates over time');
  console.log('   • Compound reward frequency');
}

// Main execution
async function main() {
  const currentData = await getCurrentData();
  await getTransactionHistory();
  calculateEstimatedHistory(currentData);
  
  console.log('');
  console.log('💡 To get COMPLETE historical data, you would need:');
  console.log('   1. Blockchain indexer (like BigQuery Public Dataset)');
  console.log('   2. Custom transaction parsing service');
  console.log('   3. Event log analysis for reward distribution events');
  console.log('   4. Historical validator performance data');
  
  console.log('');
  console.log('🔗 Alternative approaches:');
  console.log('   • Use Coreum explorer API if available');
  console.log('   • Parse transaction logs from full node');
  console.log('   • Use third-party indexing services');
  console.log('   • Implement your own indexer');
}

main().catch(console.error);
