# Roll NFT Dashboard - Access Model

## 🔐 Authentication Types vs Access Methods

### Authentication Types (Identity)
1. **Email Users** - Users with email accounts and profiles
2. **Wallet Users** - Users authenticated via Web3 wallet connection
3. **Anonymous Users** - No authentication required for read-only access

### Access Methods (Functionality)
1. **Connected Wallet** - Full access to all features
2. **Manual Address Entry** - Read-only portfolio access only

## 📊 Access Matrix

| Authentication | Access Method | Capabilities | Use Case |
|---------------|---------------|--------------|----------|
| **Email User** | Manual Address | Read-only portfolio | View multiple wallets |
| **Email User** | Connected Wallet | Full access | All features |
| **Wallet User** | Connected Wallet | Full access | Traditional Web3 |
| **Wallet User** | Manual Address | Read-only portfolio | View other wallets |
| **Anonymous** | Manual Address | Read-only portfolio | Quick portfolio check |

## 🎯 Key Principles

### 1. Access Method Determines Functionality
- **Read-Only**: Manual address entry (any user type)
- **Full Access**: Connected wallet (any user type)

### 2. Authentication Type Determines Features
- **Email Users**: Profile management, multiple wallet tracking
- **Wallet Users**: Direct blockchain interaction
- **Anonymous**: Basic portfolio viewing

### 3. Progressive Enhancement
- Start with read-only access
- Upgrade to connected wallet for full functionality
- Add email profile for enhanced features

## 🔄 User Journeys

### Email User Journey
1. **Sign Up** → Create profile → Add wallet addresses (read-only)
2. **Upgrade** → Connect wallet for full access while keeping profile
3. **Manage** → Add/remove wallet addresses, update profile

### Wallet User Journey
1. **Connect** → Immediate full access
2. **Enhance** → Create email profile for multiple wallet tracking
3. **Expand** → Add other wallet addresses for read-only viewing

### Anonymous User Journey
1. **Manual Entry** → Read-only portfolio access
2. **Upgrade** → Sign up for profile or connect wallet

## 🛠️ Technical Implementation

### Read-Only Mode Indicators
- Manual address entry always shows "Read-Only" badges
- Clear messaging about limitations
- Upgrade prompts for full access

### Full Access Features
- Minting, trading, rewards claiming
- Transaction signing
- Wallet-based authentication

### Profile Features (Email Users)
- Multiple wallet address management
- Portfolio aggregation
- Preference settings
- Account history

## 🎨 UI/UX Guidelines

### Clear Access Communication
- Always indicate current access level
- Explain what each access type provides
- Show upgrade paths prominently

### Seamless Transitions
- Easy switching between access methods
- No data loss when upgrading
- Consistent experience across methods

### Progressive Disclosure
- Basic features first
- Advanced features with appropriate access
- Educational content about benefits
