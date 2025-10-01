/**
 * Force browser cache refresh for all token images
 */

const http = require('http');

const tokens = [
  { denom: 'ucore', symbol: 'CORE', imageName: 'coreum.png' },
  { denom: 'uxrp', symbol: 'XRP', imageName: 'uxrp.png' },
  { denom: 'uatom', symbol: 'ATOM', imageName: 'uatom.png' },
  { denom: 'uosmo', symbol: 'OSMO', imageName: 'uosmo.png' },
];

function updateTokenImage(token) {
  return new Promise((resolve, reject) => {
    const payload = {
      denom: token.denom,
      symbol: token.symbol,
      imageUrl: `/tokens/${token.imageName}?v=${Date.now()}`, // Use timestamp for cache-busting
    };

    const postData = JSON.stringify(payload);
    
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
          resolve({ token: token.symbol, success: result.success, url: payload.imageUrl });
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
  console.log('🔄 Forcing browser cache refresh for all token images...\n');
  
  for (const token of tokens) {
    try {
      const result = await updateTokenImage(token);
      if (result.success) {
        console.log(`✅ ${result.token}: Updated to ${result.url}`);
      } else {
        console.log(`❌ ${result.token}: Update failed`);
      }
    } catch (error) {
      console.log(`❌ ${token.symbol}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🎉 Cache refresh completed!');
  console.log('💡 All token images should now display correctly in your browser.');
  console.log('   If you still see old images, try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
}

main().catch(console.error);
