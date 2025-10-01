import { prisma } from '@/lib/db';

// CSV data parsed from the image provided
const csvUsers = [
  { name: 'adiush', nfts: 1, address: 'core145cvkhvqhp2ewczqejgst5gd9j36bft2glr8' },
  { name: 'bill', nfts: 1, address: 'core13v9fuj7nfkjrprjdwfwtx6kkqktmfxqhzrany' },
  { name: 'brenda', nfts: 1, address: null, custody: 'an*a' }, // incomplete address
  { name: 'brian b', nfts: 2, address: 'core1c2nqprk10z228du2vhgp6tqxz56n9p7hpxrmw' },
  { name: 'brian m', nfts: 3, address: 'core1sehqtg50gzqzrjdphruk29r72pryykkmnh5azl' },
  { name: 'CASSIE', nfts: 2, address: 'core1zcd422gyk2q7m2xgp7dx45eqsmy3kf5rcb4' },
  { name: 'John MAYBERG', nfts: 1, address: 'core1ltb22c7txej8btvhk4k03qjfwevbv8pz0c0bpu' },
  { name: 'House of evergeisis', nfts: 2, address: 'core1s8ens8efemjneuveqxd7ar8f8w4t7n3j2c4awrohr4', custody: '8f4e' },
  { name: 'susan/eh', nfts: 2, address: 'core1a2p94vfp224avceuil8f2f4t2b7zp6xzsh8l4ee' },
  { name: 'Jim H', nfts: 1, address: 'core1cjgkr268swmf4s4cexjd4p5f7z5nxjvmm8unw', custody: '1 OWES for nft mpe/mvmm8unw' },
  { name: 'kato', nfts: 1, address: 'core1zraw0kczrunixcbn8rq8bk8p8i3818x3jp3k2a' },
  { name: 'kaycea', nfts: 1, address: 'core1wxz3kxwgzbvew8k2kv2kfq4q8rn3cz55dy9bcan', custody: 'PAID 1400' },
  { name: 'kristen', nfts: 1, address: 'core1zqp268q36cnnwfrbmf6jjgdsu4svl68qvx9pr0' },
  { name: 'levi', nfts: 1, address: '33', custody: 'an*s' }, // incomplete address
  { name: 'mackensie', nfts: 5, address: 'core1s5x3yybvexz5x4vqfjguhqbqgcnl6lyxprk4v9t' },
  { name: 'Marco', nfts: 1, address: 'core1zd6m3rldf4swxn3xlgslyy6z8v4kvhm4nna8uzj' },
  { name: 'me', nfts: 5, address: 'core1hce6qd96c5aphv5gxwatuqgzx2nmwnrsw6c5phyr' },
  { name: 'melony', nfts: 1, address: 'core1u5hnkmysmyimygusulaujyx4qw3z9pfwzrxmitc' },
  { name: 'michelle', nfts: 2, address: 'core13lllt275ennlsesexaaheb4d7i5h00p9ye0fybcv3' },
  { name: 'MIKE MOM', nfts: 1, address: 'core12qmhwt5iy4fz3q322hrr9b8ex47q36qz7tu65jj' },
  { name: 'phil quakem', nfts: 1, address: 'core1pc7q4q87fb3a8k0u4q1sj3yxd8yllxys0p0e' },
  { name: 'randy', nfts: 3, address: 'core1qp2kxrw4vnqamrcst8cp0x8v7vt5q9z5hufd6fq4' },
  { name: 'staunch', nfts: 2, address: 'core1yjzacsthqks8wjh6w7zeczj5rhdxkrszf20mgrpa' },
  { name: 'tom', nfts: 2, address: 'core1s5sedvk9639f4avq0puvn4ef034lfgf5h0mkk6k' },
  { name: 'vicki', nfts: 2, address: 'core1wywrrzv2qbxegq6p0n7xx4q8qg2636pgwq7gchg' },
  { name: 'willie', nfts: 1, address: 'core1f9rp6bhqdxtq42vtm86hrrh33kx5xu3uf26rbz', custody: 'Owes 1500 nft' },
  { name: 'stevie silers', nfts: 0, address: 'core1l9rp6bhqdxtq42vtm86hrrh33kx5xu3uf26rbz' },
  { name: 'john G', nfts: 0, address: 'core1khf7qbar47qlshcs8lnn3crvr4rrd4f8swgcvabm76' },
  { name: 'Josh Aleha iz Love', nfts: 0, address: 'core1hkwmtdkn6hswicczr8k3htgy8el8tvkbyxjc4944' }
];

async function createUserProfiles() {
  console.log('🚀 Starting CSV user profile creation...');
  
  try {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const userData of csvUsers) {
      try {
        const { name, nfts, address, custody } = userData;
        
        // Skip users without valid addresses
        if (!address || address.length < 20 || address === '33') {
          results.errors.push(`Invalid address for ${name}: ${address}`);
          continue;
        }

        // Create email based on name (wallet-local format for wallet-only users)
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${cleanName}@wallet.local`;
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          console.log(`⏭️  User ${name} already exists, skipping...`);
          results.skipped++;
          continue;
        }

        // Create user profile
        const user = await prisma.user.create({
          data: {
            email,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' ') || null,
            name,
            emailVerified: false, // Wallet-only users don't have verified emails
            profileSettings: {
              nftCount: nfts,
              custodyNotes: custody || null,
              importedFromCSV: true,
              importedAt: new Date().toISOString()
            }
          }
        });

        // Create wallet entry
        const wallet = await prisma.wallet.create({
          data: {
            userId: user.id,
            address,
            chain: 'coreum',
            verifiedAt: new Date() // Mark as verified since this is manual import
          }
        });

        // Also create UserWallet entry for read-only access
        await prisma.userWallet.create({
          data: {
            userId: user.id,
            address,
            chain: 'coreum',
            label: `${name}'s Primary Wallet`,
            isDefault: true
          }
        });

        console.log(`✅ Created profile for ${name} (${email}) with wallet ${address}`);
        results.created++;

      } catch (error) {
        const errorMsg = `Error creating profile for ${userData.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log('\n📊 CSV Import Results:');
    console.log(`✅ Created: ${results.created} profiles`);
    console.log(`⏭️  Skipped: ${results.skipped} profiles`);
    console.log(`❌ Errors: ${results.errors.length} errors`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 Error Details:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;

  } catch (error) {
    console.error('❌ Script execution failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  createUserProfiles()
    .then(() => {
      console.log('\n🎉 CSV profile creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { createUserProfiles };
