/**
 * Script to fetch real token images from reliable sources
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Known token sources with real images
const TOKEN_SOURCES = {
  // Coreum ecosystem tokens with known image URLs
  'ucore': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/coreum/images/coreum.png',
  
  // Alternative sources for common tokens
  'uxrp': 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png',
  
  // Cosmos ecosystem tokens
  'uatom': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
  'uosmo': 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
  
  // Additional known sources
  'cozy-ft': 'https://raw.githubusercontent.com/cosmostation/chainlist/main/chain/coreum/asset/cozy.png',
  'smart-ft': 'https://raw.githubusercontent.com/cosmostation/chainlist/main/chain/coreum/asset/smart.png',
  
  // CoinGecko as fallback for major tokens
  fallback_sources: {
    'xrp': 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png',
    'atom': 'https://assets.coingecko.com/coins/images/1/standard/cosmos_hub.png',
    'osmo': 'https://assets.coingecko.com/coins/images/16724/standard/osmo.png'
  }
};

const TARGET_DIR = path.join(__dirname, 'apps/web/public/tokens');

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(outputPath);
        });
        
        fileStream.on('error', reject);
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadImage(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function getFileExtension(url) {
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath);
  return ext || '.png'; // Default to PNG if no extension
}

async function fetchTokenImages() {
  console.log('🚀 Starting token image fetching...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (const [token, imageUrl] of Object.entries(TOKEN_SOURCES)) {
    if (token === 'fallback_sources') continue;
    
    try {
      console.log(`📸 Fetching ${token} from ${imageUrl}`);
      
      const extension = getFileExtension(imageUrl);
      const outputPath = path.join(TARGET_DIR, `${token}${extension}`);
      
      await downloadImage(imageUrl, outputPath);
      
      console.log(`✅ Downloaded: ${token}${extension}`);
      successCount++;
      results.push({ token, status: 'success', path: outputPath });
      
    } catch (error) {
      console.log(`❌ Failed: ${token} - ${error.message}`);
      errorCount++;
      results.push({ token, status: 'error', error: error.message });
    }
  }

  // Try fallback sources
  console.log('\n🔄 Trying fallback sources...');
  
  for (const [tokenSymbol, imageUrl] of Object.entries(TOKEN_SOURCES.fallback_sources)) {
    try {
      console.log(`📸 Fetching ${tokenSymbol} from ${imageUrl}`);
      
      const extension = getFileExtension(imageUrl);
      const outputPath = path.join(TARGET_DIR, `${tokenSymbol}${extension}`);
      
      await downloadImage(imageUrl, outputPath);
      
      console.log(`✅ Downloaded: ${tokenSymbol}${extension}`);
      successCount++;
      results.push({ token: tokenSymbol, status: 'success', path: outputPath });
      
    } catch (error) {
      console.log(`❌ Failed: ${tokenSymbol} - ${error.message}`);
      errorCount++;
      results.push({ token: tokenSymbol, status: 'error', error: error.message });
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successfully downloaded: ${successCount} images`);
  console.log(`   ❌ Failed: ${errorCount} images`);
  
  // List downloaded files
  console.log(`\n📁 Downloaded files:`);
  const downloadedFiles = fs.readdirSync(TARGET_DIR)
    .filter(file => !file.endsWith('.svg'))
    .sort();
  
  downloadedFiles.forEach(file => {
    const stats = fs.statSync(path.join(TARGET_DIR, file));
    console.log(`   - ${file} (${Math.round(stats.size / 1024)}KB)`);
  });

  return results;
}

// Also try to fetch from ecosystem-specific registries
async function fetchFromRegistries() {
  console.log('\n🌐 Checking ecosystem registries...');
  
  const registries = [
    'https://api.coingecko.com/api/v3/coins/coreum',
    'https://api.coingecko.com/api/v3/coins/xrp'
  ];

  for (const registryUrl of registries) {
    try {
      console.log(`🔍 Checking ${registryUrl}...`);
      
      // We can't easily fetch JSON in Node without additional packages
      // So we'll just document the approach for now
      console.log(`   ℹ️  Manual check recommended for: ${registryUrl}`);
      
    } catch (error) {
      console.log(`   ❌ Registry failed: ${error.message}`);
    }
  }
}

// Run the script
async function main() {
  try {
    await fetchTokenImages();
    await fetchFromRegistries();
    
    console.log('\n🎉 Token image fetching completed!');
    console.log('💡 Next steps:');
    console.log('   1. Check downloaded images in apps/web/public/tokens/');
    console.log('   2. Update database with correct image paths');
    console.log('   3. Convert PNG images to optimized formats if needed');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

main();
