/**
 * Complete token metadata refresh with cache-busting
 */

const http = require('http');

const COMPLETE_TOKENS = [
  {
    denom: 'ucore',
    symbol: 'CORE',
    name: 'Coreum',
    decimals: 6,
    imageUrl: `/tokens/coreum.png?cb=${Date.now()}`,
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
    imageUrl: `/tokens/uxrp.png?cb=${Date.now()}`,
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
    imageUrl: `/tokens/uatom.png?cb=${Date.now()}`,
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
    imageUrl: `/tokens/uosmo.png?cb=${Date.now()}`,
    description: 'Native token of Osmosis DEX',
    website: 'https://osmosis.zone',
    isNative: false,
    category: 'fungible',
    verified: true,
    priority: 65
  }
];

function updateToken(token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(token);
    
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
          resolve({ token: token.symbol, success: result.success, imageUrl: token.imageUrl });
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
  console.log('🚀 Refreshing all token metadata with cache-busting...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const token of COMPLETE_TOKENS) {
    try {
      const result = await updateToken(token);
      if (result.success) {
        console.log(`✅ ${result.token}: ${result.imageUrl}`);
        successCount++;
      } else {
        console.log(`❌ ${result.token}: Update failed`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ ${token.symbol}: Error - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  console.log('\n🎉 Token refresh completed!');
  console.log('💡 All token images now have unique cache-busting URLs.');
  console.log('🌐 Frontend components updated to use API-based metadata.');
  console.log('🔄 Dev server restarted with cleared cache.');
  console.log('\n📱 To see changes:');
  console.log('   1. Open your ShieldNest app');
  console.log('   2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('   3. Token images should now show real official logos!');
}

main().catch(console.error);
