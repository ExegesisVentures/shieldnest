# Portfolio Enhancements - Multi-Wallet & Token Breakdown

## Overview

The portfolio page has been enhanced with advanced functionality to support multiple wallets and collapsible token breakdowns for a cleaner, more organized user experience.

## Key Features Implemented

### 1. Multiple Manual Wallet Support

**File: `/apps/web/src/components/portfolio/EnhancedPortfolioView.tsx`**

- Users can now add multiple manual wallet addresses directly from the portfolio page
- Manual wallets work alongside connected wallets
- Each wallet shows read-only or connected status
- Support for wallet labels and default wallet selection

**API Enhancement: `/apps/api/src/routes/profile.ts`**
- New `/api/profile/portfolio-enhanced` endpoint with full token breakdown
- Combines connected and manual wallets in a single view
- Enhanced error handling and wallet status tracking

### 2. Collapsible Wallet Breakdown UI

**Component: `CollapsibleWallet` (within EnhancedPortfolioView)**

- Each wallet displays as a collapsible card
- Click to expand/collapse wallet details
- Smooth animations and visual feedback
- Color-coded status indicators (success/error states)

### 3. Token Breakdown Per Wallet

**Features:**
- **CORE Token Details**: Separate breakdown of available vs staked CORE
- **Other Tokens**: Comprehensive list of all tokens held in each wallet
- **Token Images**: Visual token representations with fallback support
- **USD Values**: Real-time USD conversion where available
- **Token Metadata**: Proper symbol display and formatting

### 4. Enhanced User Experience

**Visual Improvements:**
- Intuitive expand/collapse icons (chevron up/down)
- Hover effects and transitions
- Consistent card-based layout
- Dark mode support throughout
- Loading states and error handling

**Status Indicators:**
- Connected vs Manual wallet badges
- Read-only vs Full access labels
- Default wallet star indicators
- Success/error states for balance loading

## File Structure

```
apps/web/src/
├── components/portfolio/
│   └── EnhancedPortfolioView.tsx    # Main enhanced portfolio component
├── pages/
│   └── portfolio.tsx                # Updated to use enhanced view
└── types/
    └── balance.ts                   # Token type definitions

apps/api/src/
└── routes/
    └── profile.ts                   # Enhanced API with token data
```

## Usage

### Adding Manual Wallets

1. Navigate to Portfolio page
2. Click "Add Wallet" button
3. Enter wallet address and optional label
4. Choose whether to set as default
5. Wallet appears in portfolio with read-only status

### Token Breakdown

1. Each wallet shows summary with token count
2. Click wallet card to expand full token breakdown
3. CORE token details shown separately
4. Other tokens listed with images and values
5. Click again to collapse for cleaner view

### Multiple Wallet Management

- Connected wallets automatically appear with "Connected" badge
- Manual wallets show "Read-Only" badge
- Default wallet marked with star icon
- Failed wallet loads show error status

## API Changes

### New Endpoint: `GET /api/profile/portfolio-enhanced`

**Response Structure:**
```typescript
{
  success: boolean;
  data: {
    wallets: WalletBalance[];
    summary: PortfolioSummary;
    aggregatedData: {
      successfulWallets: number;
      failedWallets: number;
      totalWallets: number;
    };
    lastUpdated: string;
    message: string;
  };
}
```

**WalletBalance Interface:**
```typescript
interface WalletBalance {
  address: string;
  chain: string;
  type: 'connected' | 'manual';
  label?: string;
  isDefault: boolean;
  balances: {
    available: number;
    staked: number;
    total: number;
  };
  tokens: TokenBalance[];
  success: boolean;
  error?: string;
}
```

## Benefits

1. **Unified Portfolio View**: All wallets (connected + manual) in one place
2. **Detailed Token Insights**: Per-wallet token breakdown with full details
3. **Clean UI**: Collapsible design prevents information overload
4. **Enhanced UX**: Smooth animations and intuitive interactions
5. **Scalable**: Supports unlimited manual wallets
6. **Error Resilient**: Graceful handling of failed wallet loads

## Future Enhancements

- Token price fetching for accurate USD values
- Token filtering and search within expanded wallets
- Bulk wallet import functionality
- Portfolio analytics and charts
- Token swap integration within wallet breakdowns
