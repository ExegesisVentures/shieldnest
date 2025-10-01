import { prisma } from '@/lib/db';
import crypto from 'crypto';

const RISE_NFT_HOLDERS = [
  'core1vjqlhj9ec4yuf93xmggfc4n9nl522y7mteh483',
  'core1zfdh9jslt8ldzwnvw8pkldyx6l9vxkhv9m4meu',
  'core1nfl2rqgdgnnvsve750hg0jumkhy5aeskjlgu7a',
  'core1a652ykypdwxz7kw4gfkudegcgculrdpxps4vq7',
  'core19e7p4qh7fts5x5hfy44j3xj8fygf8sxy0pd862',
  'core17u9vavfjj4du0288w0ksl377nyskjr02hwsjsv',
  'core14dqsuhj4sqz4r4mh5yc5rlp00jj8ype7tzanes'
];

const TMA_CONTENT = `
# TERMS & MEMBERSHIP AGREEMENT (TMA)
## Roll NFT Dashboard - Version 1.0

### 1. MEMBERSHIP TERMS
By signing this agreement, you acknowledge and agree to the following terms for participation in the Roll NFT ecosystem:

### 2. NFT OWNERSHIP & RIGHTS
- Roll NFTs represent membership in an exclusive community
- Members receive access to special features, rewards, and governance rights
- NFT ownership grants fee-free marketplace access and LP fee distributions

### 3. ECONOMIC TERMS
- New member mint price: $1,000 USD
- OG conversion available for Rise NFT holders
- Minimum sellback price for OG members: $5,000 USD
- Backend book value used for floor calculations: $10,000 USD

### 4. STAKING & REWARDS
- Sellback proceeds are staked for 14 days before claim
- Weekly epoch rewards distributed based on NFT holdings
- Each NFT receives 0.5% of weekly LP fee pool

### 5. RISKS & DISCLAIMERS
- Cryptocurrency investments carry significant risk
- NFT values may fluctuate
- Smart contract risks apply
- No guarantee of returns

### 6. GOVERNANCE
- Roll NFT holders may participate in community governance
- Voting power proportional to NFT holdings
- Major decisions require community consensus

### 7. COMPLIANCE
- All activities must comply with applicable laws
- Anti-money laundering and KYC policies apply
- Users responsible for tax obligations

### 8. AMENDMENTS
- This agreement may be updated with new versions
- Users must re-sign updated versions to maintain access
- Notice provided for material changes

By signing this message with your wallet, you indicate your understanding and acceptance of these terms.

Last Updated: ${new Date().toISOString()}
`;

async function createTMA() {
  console.log('Creating TMA document...');
  
  const version = '1.0';
  const body = TMA_CONTENT.trim();
  const hash = crypto.createHash('sha256').update(body).digest('hex');

  // Deactivate any existing TMAs
  await prisma.tMA.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  const tma = await prisma.tMA.create({
    data: {
      version,
      hash,
      body,
      isActive: true
    }
  });

  console.log(`✅ Created TMA v${version} with hash: ${hash.substring(0, 16)}...`);
  return tma;
}

async function createRiseSnapshot() {
  console.log('Creating Rise NFT holder snapshot...');
  
  const snapshotHeight = BigInt(12345678); // Placeholder block height
  
  for (const address of RISE_NFT_HOLDERS) {
    // Create mock token IDs for each holder (1-3 NFTs each)
    const tokenCount = Math.floor(Math.random() * 3) + 1;
    const tokenIds = Array.from({ length: tokenCount }, (_, i) => `${address.slice(-4)}_${i + 1}`);
    
    // Create simple merkle proof (placeholder)
    const merkleProof = [
      crypto.createHash('sha256').update(address).digest('hex'),
      crypto.createHash('sha256').update(`proof_${address}`).digest('hex')
    ];

    await prisma.snapshotEntry.create({
      data: {
        address,
        tokenIds,
        merkleProof,
        snapshotHeight
      }
    });
  }

  console.log(`✅ Created snapshot entries for ${RISE_NFT_HOLDERS.length} Rise NFT holders`);
}

async function createInitialConfig() {
  console.log('Creating initial configuration...');
  
  const configs = [
    { key: 'current_supply', value: '0', type: 'NUMBER' as const },
    { key: 'total_burned', value: '0', type: 'NUMBER' as const },
    { key: 'current_floor_price', value: '5000', type: 'NUMBER' as const },
    { key: 'last_epoch_number', value: '0', type: 'NUMBER' as const },
    { key: 'oracle_last_update', value: new Date().toISOString(), type: 'STRING' as const },
    { key: 'coreum_usd_price', value: '0.15', type: 'NUMBER' as const },
    { key: 'maintenance_mode', value: 'false', type: 'BOOLEAN' as const }
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value, type: config.type },
      create: config
    });
  }

  console.log(`✅ Created ${configs.length} configuration entries`);
}

async function createTestUsers() {
  console.log('Creating test users...');
  
  // Create a test user for each Rise holder
  for (let i = 0; i < 3; i++) {
    const address = RISE_NFT_HOLDERS[i];
    const email = `test${i + 1}@rollnft.com`;
    
    const user = await prisma.user.create({
      data: {
        email,
        name: `Test User ${i + 1}`
      }
    });

    // Create wallet for the user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        address,
        chain: 'coreum',
        verifiedAt: new Date()
      }
    });

    console.log(`✅ Created test user: ${email} with wallet: ${address}`);
  }
}

async function createInitialEpoch() {
  console.log('Creating initial epoch...');
  
  const now = new Date();
  const epochStart = new Date(now);
  epochStart.setDate(epochStart.getDate() - 7); // Start a week ago
  
  const epochEnd = new Date(now);
  epochEnd.setDate(epochEnd.getDate() - 1); // End yesterday

  await prisma.epoch.create({
    data: {
      number: 0,
      startTs: epochStart,
      endTs: epochEnd,
      poolAmount: '1000.0', // $1000 in fees for initial epoch
      totalNFTs: 0,
      finalized: true
    }
  });

  console.log('✅ Created initial epoch');
}

async function createRiseNFTHolders() {
  console.log('Creating Rise NFT holder records...');
  
  for (const address of RISE_NFT_HOLDERS) {
    // Random number of original NFTs (1-5)
    const originalCount = Math.floor(Math.random() * 5) + 1;
    
    await prisma.riseNFTHolder.create({
      data: {
        walletAddress: address,
        originalCount,
        remainingCount: originalCount, // All available for conversion initially
        addedBy: 'seed-script',
        notes: `Seeded holder with ${originalCount} original Rise NFTs`
      }
    });
  }

  console.log(`✅ Created ${RISE_NFT_HOLDERS.length} Rise NFT holder records`);
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  try {
    await createTMA();
    await createRiseSnapshot();
    await createRiseNFTHolders();
    await createInitialConfig();
    await createTestUsers();
    await createInitialEpoch();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- TMA document created and activated`);
    console.log(`- ${RISE_NFT_HOLDERS.length} Rise NFT holders added to snapshot`);
    console.log(`- ${RISE_NFT_HOLDERS.length} Rise NFT holder records created`);
    console.log(`- Initial configuration values set`);
    console.log(`- 3 test users created with verified wallets`);
    console.log(`- Initial epoch created`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error during seeding:', error);
      process.exit(1);
    });
}

export default main;
