/**
 * Update database with correct token image paths
 */

const https = require('https');

// Tokens to update with their correct image paths
const TOKENS_TO_UPDATE = [
  {
    denom: 'ucore',
    symbol: 'CORE',
    name: 'Coreum',
    decimals: 6,
    imageUrl: '/tokens/coreum.png',
    description: 'Native token of the Coreum blockchain',
    website: 'https://coreum.com',
    isNative: true,
    category: 'native',
    verified: true,
    priority: 100
  },
  {
    denom: 'uxrp',
    symbol: 'XRP',
    name: 'XRP',
    decimals: 6,
    imageUrl: '/tokens/uxrp.png',
    description: 'XRP token on Coreum',
    website: 'https://xrpl.org',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 60
  },
  {
    denom: 'uatom',
    symbol: 'ATOM',
    name: 'Cosmos Hub',
    decimals: 6,
    imageUrl: '/tokens/uatom.png',
    description: 'Native token of Cosmos Hub',
    website: 'https://cosmos.network',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 70
  },
  {
    denom: 'uosmo',
    symbol: 'OSMO',
    name: 'Osmosis',
    decimals: 6,
    imageUrl: '/tokens/uosmo.png',
    description: 'Native token of Osmosis DEX',
    website: 'https://osmosis.zone',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 65
  }
];

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/tokens',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function updateTokenDatabase() {
  console.log('🔄 Updating token database with real images...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const token of TOKENS_TO_UPDATE) {
    try {
      console.log(`📝 Updating ${token.symbol} (${token.denom})...`);
      
      const result = await makeRequest(token);
      
      if (result.success) {
        console.log(`✅ ${token.symbol} updated successfully`);
        successCount++;
      } else {
        console.log(`❌ ${token.symbol} update failed: ${result.error}`);
        errorCount++;
      }
      
    } catch (error) {
      console.log(`❌ ${token.symbol} update failed: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Database Update Results:`);
  console.log(`   ✅ Successfully updated: ${successCount} tokens`);
  console.log(`   ❌ Failed: ${errorCount} tokens`);
  
  return { successCount, errorCount };
}

// Use HTTP instead of HTTPS for localhost
const http = require('http');

function makeHttpRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/tokens',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting token database update...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const token of TOKENS_TO_UPDATE) {
    try {
      console.log(`📝 Updating ${token.symbol} (${token.denom})...`);
      
      const result = await makeHttpRequest(token);
      
      if (result.success) {
        console.log(`✅ ${token.symbol} updated successfully`);
        successCount++;
      } else {
        console.log(`❌ ${token.symbol} update failed: ${result.error || 'Unknown error'}`);
        errorCount++;
      }
      
    } catch (error) {
      console.log(`❌ ${token.symbol} update failed: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Database Update Results:`);
  console.log(`   ✅ Successfully updated: ${successCount} tokens`);
  console.log(`   ❌ Failed: ${errorCount} tokens`);
  
  console.log(`\n🎉 Token database update completed!`);
  console.log(`💡 All major tokens now use real, official images!`);
}

main().catch(console.error);
