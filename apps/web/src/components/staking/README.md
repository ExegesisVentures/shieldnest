# Staking Components

This directory contains modular staking-related components following the Senior Developer Guidelines.

## Component Structure

### Core Components

1. **StakingInterface.tsx** - Main orchestrator component
   - Manages high-level state and error handling
   - Coordinates other staking components
   - Provides loading states and error boundaries

2. **StakingBalanceDisplay.tsx** - Balance overview
   - Shows available, staked, unbonding, and reward balances
   - Reuses existing styling patterns from TokenBalanceCard
   - Responsive grid layout

3. **ValidatorSelector.tsx** - Validator selection UI
   - Promotes Roll Validator while providing alternatives
   - Collapsible other validators section
   - Clear visual hierarchy with recommendations

4. **StakingForm.tsx** - Amount input and staking controls
   - Real-time validation with user feedback
   - Quick percentage selection buttons
   - Preview of staking rewards

5. **WalletConnectionPrompt.tsx** - Non-connected user experience
   - Benefits explanation
   - Clear call-to-action for wallet connection
   - Educational content about staking

6. **LiquidityPools.tsx** - Basic liquidity provision UI
   - Pool overview with APR and TVL
   - Placeholder for future farming features
   - User-friendly design for adding liquidity

## Design Principles

### Modularity
- Each component has a single responsibility
- Components can be used independently
- Clean separation of concerns

### User Experience
- Graceful degradation for non-connected users
- Clear error messages with actionable next steps
- Loading states and smooth transitions
- Mobile-responsive design

### Security & Safety
- Input validation and sanitization
- Error boundaries and fallback UIs
- Clear warnings about staking periods
- Non-custodial messaging

### Accessibility
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Color not the only information conveyor
- Screen reader friendly

## Future Enhancements

1. **Real Blockchain Integration**
   - Connect to actual Coreum staking transactions
   - Real validator data from chain
   - Transaction status tracking

2. **Advanced Features**
   - Multi-validator staking
   - Automatic reward compounding
   - Staking analytics and history

3. **Liquidity Pools**
   - Full AMM integration
   - Yield farming capabilities
   - Impermanent loss tracking

## Usage

```tsx
import StakingInterface from '@/components/staking/StakingInterface';

// Use in any page with wallet context
<StakingInterface 
  walletAddress={address}
  balances={balances}
  isLoading={loading}
  error={error}
  onRefresh={refetch}
/>
```

## Dependencies

- `@/contexts/WalletProvider` - Wallet connection state
- `@/contexts/WalletModalContext` - Modal management
- `@/hooks/useBalance` - Balance data fetching
- `@/types/balance` - TypeScript interfaces
- `@heroicons/react` - Icon components
- Tailwind CSS classes from global styles
