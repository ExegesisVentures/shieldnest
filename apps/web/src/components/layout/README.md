# Layout Components

This directory contains layout-related components following the modular architecture principles outlined in the developer notes.

## MobileNavigation Component

A fully modular mobile navigation dropdown component that provides:

### Features
- **Responsive Design**: Only visible on mobile devices (hidden on md+ screens)
- **Complete Navigation**: All main navigation items with active state highlighting
- **User Context Aware**: Different UI based on authentication and wallet connection states
- **Theme Integration**: Built-in theme toggle functionality
- **Modular Architecture**: Self-contained with clear prop interface

### Usage
```tsx
<MobileNavigation
  isAuthenticated={isAuthenticated}
  user={user}
  onSignOut={() => { /* handle sign out */ }}
  onOpenAuth={() => { /* open auth modal */ }}
  connectedWallet={connectedWallet}
  onDisconnectWallet={() => { /* disconnect wallet */ }}
/>
```

### Props Interface
```typescript
interface MobileNavigationProps {
  isAuthenticated: boolean;
  user?: any;
  onSignOut?: () => void;
  onOpenAuth?: () => void;
  connectedWallet?: any;
  onDisconnectWallet?: () => void;
}
```

### Architecture Notes
- **Modularity**: Component is completely self-contained with no external dependencies beyond required contexts
- **Responsive**: Uses Tailwind's responsive utilities to hide/show appropriately
- **State Management**: Integrates with existing ThemeContext without modifications
- **Graceful Degradation**: Handles missing props gracefully
- **User Experience**: Provides clear visual feedback for active pages and user states

### Integration
This component integrates seamlessly with the existing Layout.tsx component by:
1. Replacing overlapping mobile navigation issues
2. Moving theme toggle into the dropdown (solving overlap problems)
3. Maintaining all existing functionality while improving mobile UX
4. Following the senior developer guidelines for modular, maintainable code

## Development Notes Compliance
✅ **Modular Design**: Single responsibility component with clear interface  
✅ **Fail-Safe Architecture**: Graceful handling of missing props and contexts  
✅ **User Experience Priority**: Solves mobile navigation overlap issues  
✅ **Code Maintainability**: Well-documented with clear prop types  
✅ **No Breaking Changes**: Maintains all existing functionality
