import { prisma } from '../lib/db';
import { supabaseAdmin } from '../lib/supabase';
import { CryptoUtils } from '../utils/security';

// Test users data
const testUsers = [
  {
    name: 'Vicki Grunstad',
    email: 'vicnshane@sbcglobal.net',
    walletAddress: 'core1wpnv2ygglxsg6lp0n7uxka9g263pawtx7p8ql9'
  },
  {
    name: 'Ken Stanuch',
    email: 'staunchngdev@gmail.com',
    walletAddress: 'core1yqcecfndklx5wj6m7escy5hd6hra0s0tmqdhpa'
  },
  {
    name: 'Levi Decker',
    email: 'levifd@gmail.com',
    walletAddress: 'core14dqsuhj4sqz4r4mh5yc5rlp00jj8ype7tzanes'
  },
  {
    name: 'John Genelli',
    email: 'jgenelli85@yahoo.com',
    walletAddress: 'core1nl7q8add76lan03drd7l485knvgacw6shykk75'
  },
  {
    name: 'Stevie Alters',
    email: 'steviealters@yahoo.com',
    walletAddress: 'core19lps98np0ntal2fvhm86hrhh3kkxytl3u590sz'
  },
  {
    name: 'Kaio Cardoza',
    email: 'kaio.cardoza@gmail.com',
    walletAddress: 'core1zeraw0kcqutnvzre6x88lx8ptf885x3p9khkza'
  },
  {
    name: 'Issanah Seraphim',
    email: 'a.sawiniuk@gmail.com',
    walletAddress: 'core1a2j0skj4y22seqxsu8f2ldz8u7zpszsrsh8l4e'
  },
  {
    name: 'Scott Rodgers',
    email: 'mackenzie23@ymail.com',
    walletAddress: 'core1a652ykypdwxz7kw4gfkudegcgculrdpxps4vq7'
  },
  {
    name: 'Marco',
    email: 'marco5500sw@gmail.com',
    walletAddress: 'core1zfdh9jslt8ldzwnvw8pkldyx6l9vxkhv9m4meu'
  },
  {
    name: 'Cassie Slee',
    email: 'cassy.slee@gmail.com',
    walletAddress: 'core1zcrd42ggyk2jq7m2qlp7dvl35qjumy4vh4ns94'
  },
  {
    name: 'House-of Cohereence',
    email: 'visionary@protonmail.com',
    walletAddress: 'core1dgkf286wm4a6kcxa4jl57l2mdvmgepwam9urww'
  },
  {
    name: 'Willy b-b-Baby',
    email: 'williamkbrown1234@gmail.com',
    walletAddress: 'core19lps98np0ntal2fvhm86hrhh3kkxytl3u590sz'
  },
  {
    name: 'Kaycee Flinn',
    email: 'kayceeflinn@gmail.com',
    walletAddress: 'core1wez9xwgstvveelskv2khj4ja9ml2cs5y995cuk'
  },
  {
    name: 'Joshua Sojot',
    email: 'info@alohaislove.org',
    walletAddress: 'core1h0wnttdkhsancdxz83nyta88llvkkydcjl49f4'
  },
  {
    name: 'Beep Boop',
    email: 'mike_da_haole@yahoo.com',
    walletAddress: 'core12kgnwf5jjylrz3j522fhrt08xe47gsez7le56j'
  }
];

const TEMP_PASSWORD = 'CoherenceDaddy!';

async function setupTestUsers() {
  console.log('🚀 Setting up test users...');

  for (const userData of testUsers) {
    try {
      console.log(`\n⚙️ Processing user: ${userData.name} (${userData.email})`);

      // First, create user in Supabase with temporary password
      const { data: supabaseUser, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: TEMP_PASSWORD,
        email_confirm: true, // Skip email confirmation for test users
        user_metadata: {
          first_name: userData.name.split(' ')[0],
          last_name: userData.name.split(' ').slice(1).join(' '),
          is_test_user: true,
          needs_password_change: true
        }
      });

      if (supabaseError) {
        console.error(`❌ Supabase error for ${userData.email}:`, supabaseError);
        continue;
      }

      console.log(`✅ Created Supabase user for ${userData.email}`);

      // Check if user already exists in our database
      let existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { wallets: true, userWallets: true }
      });

      if (existingUser) {
        console.log(`📝 Updating existing user in database...`);
        
        // Update existing user with Supabase ID if not already linked
        if (!existingUser.supabaseId) {
          existingUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              supabaseId: supabaseUser.user.id,
              firstName: userData.name.split(' ')[0],
              lastName: userData.name.split(' ').slice(1).join(' '),
              name: userData.name,
              emailVerified: true
            },
            include: { wallets: true, userWallets: true }
          });
        }
      } else {
        console.log(`📝 Creating new user in database...`);
        
        // Create new user in our database
        existingUser = await prisma.user.create({
          data: {
            email: userData.email,
            supabaseId: supabaseUser.user.id,
            firstName: userData.name.split(' ')[0],
            lastName: userData.name.split(' ').slice(1).join(' '),
            name: userData.name,
            emailVerified: true
          },
          include: { wallets: true, userWallets: true }
        });
      }

      // Check if wallet is already associated
      const existingWallet = existingUser.wallets.find(w => w.address === userData.walletAddress);
      const existingUserWallet = existingUser.userWallets.find(uw => uw.address === userData.walletAddress);

      if (!existingWallet && !existingUserWallet) {
        console.log(`🔗 Adding wallet address to user...`);
        
        // Add wallet as UserWallet (read-only association)
        await prisma.userWallet.create({
          data: {
            userId: existingUser.id,
            address: userData.walletAddress,
            chain: 'coreum',
            label: 'Test Wallet',
            isDefault: true
          }
        });
      } else {
        console.log(`✅ Wallet already associated with user`);
      }

      console.log(`✅ Successfully set up user: ${userData.name}`);

    } catch (error) {
      console.error(`❌ Error setting up user ${userData.name}:`, error);
    }
  }

  console.log('\n🎉 Test user setup complete!');
  console.log(`\n📋 All users have been set up with:`);
  console.log(`   - Email: [user email]`);
  console.log(`   - Temporary Password: ${TEMP_PASSWORD}`);
  console.log(`   - Associated Wallet: [user wallet address]`);
  console.log(`   - Special flag: needs_password_change = true`);
}

// Run the setup if called directly
if (require.main === module) {
  setupTestUsers()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { setupTestUsers };
