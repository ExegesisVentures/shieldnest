# Developer Notes - Roll NFT Dashboard

## 🧠 Senior Developer Guidelines & Best Practices

### Before Making Any Changes - READ THIS FIRST

#### Core Principles
1. **Think Like a Senior Developer**: Always consider the broader impact of changes
2. **Modularity First**: Every component, hook, and utility should be self-contained
3. **Fail-Safe Architecture**: Systems should degrade gracefully, not break entirely
4. **User Experience Priority**: Never sacrifice UX for developer convenience
5. **Code Maintainability**: Write code that the next developer will thank you for

#### Change Management Protocol
Before implementing ANY changes, ask yourself:

1. **Impact Analysis**
   - What other components depend on this code?
   - Will this change break existing functionality?
   - Are there any hidden dependencies?
   - How will this affect the user experience?

2. **Modular Design Check**
   - Can this be made more modular?
   - Should this be extracted to a separate component/hook/utility?
   - Are we creating tight coupling?
   - Is this component doing too many things?

3. **Error Handling**
   - What happens if this fails?
   - How do we gracefully handle errors?
   - Are we providing meaningful feedback to users?
   - Do we have fallback mechanisms?

4. **Testing Scenarios**
   - How do we test this in isolation?
   - What edge cases exist?
   - How does this behave with network failures?
   - What about different wallet states?

#### Architecture Patterns

##### Wallet Connection System
- **Modular Approach**: Each wallet type should be independently manageable
- **Graceful Degradation**: If one wallet fails, others should still work
- **State Management**: Clear separation between connection state and authentication state
- **Error Recovery**: Always provide retry mechanisms and clear error messages

##### Component Structure
```
components/
├── core/           # Base components (Button, Modal, etc.)
├── wallet/         # Wallet-specific components
├── features/       # Feature-specific components
└── layout/         # Layout components
```

##### Hook Organization
```
hooks/
├── core/           # Basic hooks (useLocalStorage, useDebounce)
├── wallet/         # Wallet-related hooks
├── api/            # API-related hooks
└── features/       # Feature-specific hooks
```

#### Common Pitfalls to Avoid

1. **Tight Coupling**
   - ❌ Components that directly import and use other feature components
   - ✅ Use props, context, or event systems for communication

2. **Monolithic Components**
   - ❌ Components that handle multiple responsibilities
   - ✅ Single responsibility principle - one component, one job

3. **Silent Failures**
   - ❌ Errors that fail silently or show generic messages
   - ✅ Meaningful error messages with actionable next steps

4. **State Pollution**
   - ❌ Mixing unrelated state in the same component
   - ✅ Separate concerns - each piece of state should have a clear purpose

#### Wallet System Specific Guidelines

##### Manual Connection Features
The wallet system should support:
- Extension-based connections (Keplr, Leap, Cosmostation)
- Manual address input (for read-only operations)
- QR code connections (future)
- WalletConnect protocol (future)

##### Error Handling Strategy
```typescript
// Good: Granular error handling
try {
  await connectWallet(walletName);
} catch (error) {
  if (error.code === 'WALLET_NOT_INSTALLED') {
    showInstallPrompt(walletName);
  } else if (error.code === 'USER_REJECTED') {
    showUserRejectedMessage();
  } else if (error.code === 'NETWORK_ERROR') {
    showRetryOption();
  } else {
    showGenericErrorWithSupport();
  }
}
```

##### State Management Best Practices
- Keep wallet connection state separate from authentication state
- Use optimistic updates where appropriate
- Always provide loading states
- Cache connection preferences locally

#### UI/UX Guidelines

##### Progressive Enhancement
- Basic functionality should work without JavaScript
- Enhanced features should layer on top
- Always provide fallbacks

##### Accessibility
- All interactive elements must be keyboard accessible
- Color should not be the only way to convey information
- Provide proper ARIA labels and descriptions

##### Performance
- Lazy load non-critical components
- Debounce expensive operations
- Use React.memo for expensive renders
- Minimize bundle size

#### Code Quality Standards

##### TypeScript Usage
- Use strict type checking
- Prefer interfaces over types for object shapes
- Use generics for reusable components
- Always type async functions properly

##### Error Boundaries
- Implement error boundaries for feature sections
- Provide meaningful fallback UIs
- Log errors for debugging but don't expose sensitive data

##### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for critical user flows
- E2E tests for complete features
- Test error conditions, not just happy paths

#### Security Considerations

##### Wallet Security
- Never store private keys or mnemonics
- Validate all wallet signatures on the backend
- Use secure random generation for nonces
- Implement proper CSRF protection

##### Data Handling
- Sanitize all user inputs
- Use HTTPS for all communications
- Implement proper rate limiting
- Validate data on both client and server

#### Deployment & Monitoring

##### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Accessibility audit completed
- [ ] Performance audit completed
- [ ] Security review completed

##### Monitoring
- Track wallet connection success rates
- Monitor error rates by wallet type
- Watch for failed transactions
- Monitor API response times

#### Common Issues & Solutions

##### Wallet Connection Problems
1. **Issue**: Wallet shows as connected but authentication fails
   **Solution**: Implement separate connection and authentication states

2. **Issue**: Page breaks when wallet extension is not installed
   **Solution**: Always check for wallet availability before attempting connection

3. **Issue**: User loses connection on page refresh
   **Solution**: Implement proper reconnection logic with localStorage

##### Performance Issues
1. **Issue**: Slow initial load times
   **Solution**: Implement code splitting and lazy loading

2. **Issue**: Excessive re-renders
   **Solution**: Use React.memo, useMemo, and useCallback appropriately

#### Future Considerations

##### Scalability
- Design for multiple blockchain support
- Consider mobile wallet integration
- Plan for high transaction volumes
- Design for international users

##### Maintainability
- Document all public APIs
- Use consistent naming conventions
- Implement comprehensive logging
- Regular dependency updates

---

## Remember: A senior developer thinks about edge cases, plans for failures, and designs for the future while keeping the present simple and maintainable.

**Last Updated**: September 26, 2025
**Next Review**: Every major release

---

## 🚨 CRITICAL CONFIGURATION WARNING

### ⚠️ DO NOT CHANGE THESE VALUES:
- **Database URL**: Must use Supabase, not localhost
- **Password**: `8JRE5bwZHqz@H@Z` (exact value)
- **Supabase URLs**: Must match between frontend and backend
- **Ports**: Frontend 3000, API 3001

### 📋 Before Making Changes:
1. **READ**: `CRITICAL_CONFIG_NOTES.md` first
2. **VERIFY**: All environment variables are correct
3. **TEST**: Health checks pass after changes
4. **NEVER**: Hardcode URLs in frontend code

### 🔧 Quick Recovery:
If you break the configuration, restore from `CRITICAL_CONFIG_NOTES.md`

---

## Recent Updates (September 26, 2025)

### ✅ Completed Improvements

1. **Restored Manual Wallet Connect Features**
   - Fixed broken `connect()` call in mint page that was missing wallet name parameter
   - Added tabbed interface to WalletConnect modal with "Wallet" and "Manual" tabs
   - Implemented manual address input component with validation
   - Enhanced wallet connection modal with better error handling

2. **Modularized Wallet System**
   - Created `WalletButton` component for reusable wallet connection buttons
   - Created `ManualAddressInput` component for address-based connections
   - Added `useWalletConnection` hook for connection UI state management
   - Created `WalletContext` for centralized wallet state management
   - Added comprehensive wallet helper utilities in `utils/wallet-helpers.ts`

3. **Enhanced Architecture**
   - Separated concerns between connection logic and UI components
   - Improved error handling with user-friendly error messages
   - Added proper TypeScript typing throughout wallet system
   - Created example component demonstrating all connection methods

4. **Developer Experience**
   - Created comprehensive developer notes with best practices
   - Added modular component structure for easier maintenance
   - Implemented proper error boundaries and fallback mechanisms
   - Added utility functions for common wallet operations

### 🏗️ New Architecture Structure

```
components/
├── wallet/
│   ├── WalletButton.tsx           # Reusable wallet connection button
│   ├── ManualAddressInput.tsx     # Manual address input component
│   └── WalletConnect.tsx          # Enhanced modal with tabs
├── examples/
│   └── WalletConnectionExample.tsx # Demo of all wallet features
└── Layout.tsx                     # Updated to use wallet helpers

hooks/
├── useWallet.ts                   # Core wallet functionality
└── useWalletConnection.ts         # Connection UI state management

contexts/
└── WalletContext.tsx              # Centralized wallet state

utils/
└── wallet-helpers.ts              # Wallet utility functions
```

### 🔧 Key Features Added

1. **Manual Address Connection**: Users can now input Coreum addresses manually for read-only access
2. **Improved Modularity**: Each component has a single responsibility and can be used independently  
3. **Better Error Handling**: User-friendly error messages with actionable next steps
4. **Graceful Degradation**: System works even when some wallet extensions aren't available
5. **Enhanced UX**: Tabbed interface, loading states, and clear visual feedback

### 🎯 Benefits Achieved

- **No Breaking Changes**: Existing functionality preserved while adding new features
- **Senior-Level Architecture**: Follows enterprise-grade patterns and best practices
- **Future-Proof Design**: Easy to add new wallet types and connection methods
- **Maintainable Code**: Clear separation of concerns and comprehensive documentation
- **User-Friendly**: Enhanced UX with multiple connection options and clear error handling
