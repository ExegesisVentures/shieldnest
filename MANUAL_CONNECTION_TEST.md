# Manual Wallet Connection Test Guide

## ✅ Testing the Manual Read-Only Connection Feature

### Test Environment
- **Test Address**: `core1h0wnttdkhsancdxz83nyta88llvkkydcjl49f4`
- **Feature**: Manual address input for read-only wallet connections
- **Status**: ✅ PRODUCTION READY

### What Was Fixed
1. **Removed Placeholder Code**: Eliminated the "coming soon" alert message
2. **Implemented Real Functionality**: Added actual read-only wallet connection
3. **Complete Integration**: Full state management and UI updates
4. **Error Handling**: Proper validation and error messages
5. **Persistence**: Connection survives page refreshes

---

## 🧪 Test Scenarios

### Scenario 1: Basic Manual Connection
**Steps:**
1. Go to any page (mint, convert, etc.)
2. Click "Connect Wallet" button
3. Switch to "Manual" tab
4. Enter address: `core1h0wnttdkhsancdxz83nyta88llvkkydcjl49f4`
5. Click "Connect Read-Only"

**Expected Results:**
- ✅ Address validates successfully (green checkmark)
- ✅ Connection succeeds without errors
- ✅ Modal closes automatically
- ✅ Header shows connected state with "Read-Only" badge
- ✅ User dropdown shows "Connected with Manual Input" + Read-Only badge

### Scenario 2: Read-Only Limitations
**Steps:**
1. Connect with manual address (as above)
2. Go to mint page

**Expected Results:**
- ✅ Shows yellow warning box: "Read-Only Mode"
- ✅ Explains limitations clearly
- ✅ Provides option to "Connect Wallet to Mint"
- ✅ Cannot perform signing operations

### Scenario 3: Address Validation
**Steps:**
1. Try invalid addresses:
   - `invalid-address`
   - `core1abc` (too short)
   - `cosmos1...` (wrong prefix)

**Expected Results:**
- ✅ Shows yellow warning icon for invalid format
- ✅ Button stays disabled for invalid addresses
- ✅ Clear validation message displayed

### Scenario 4: Persistence
**Steps:**
1. Connect with manual address
2. Refresh the page
3. Navigate to different pages

**Expected Results:**
- ✅ Connection persists across page refreshes
- ✅ Read-only status maintained
- ✅ All UI elements show correct state

### Scenario 5: Disconnection
**Steps:**
1. Connect with manual address
2. Click user dropdown
3. Click "Disconnect"

**Expected Results:**
- ✅ Disconnects successfully
- ✅ Returns to "Connect Wallet" button
- ✅ localStorage cleared

---

## 🔧 Technical Implementation

### New Features Added:
1. **`connectManual(address: string)`** method in useWallet hook
2. **Read-only connection type** with proper state management
3. **Address validation** with real-time feedback
4. **Persistence** across sessions
5. **UI indicators** for read-only mode
6. **Graceful degradation** for operations requiring signing

### Key Components:
- `useWallet.ts`: Added `connectManual` function
- `WalletConnect.tsx`: Updated to use real connection
- `ManualAddressInput.tsx`: Validates and connects
- `Layout.tsx`: Shows read-only badge
- `mint.tsx`: Handles read-only limitations

### Connection Flow:
```
User Input → Validation → connectManual() → State Update → UI Refresh → Persistence
```

---

## 🎯 Production Verification

### ✅ What Works Now:
1. **Real Connection**: No more placeholder messages
2. **Full State Management**: Properly integrated with existing wallet system
3. **Address Validation**: Real-time Coreum address format checking
4. **Read-Only Safety**: Clear limitations and helpful messaging
5. **Persistence**: Survives page refreshes and navigation
6. **Error Handling**: Meaningful error messages for all scenarios
7. **UI Integration**: Seamless integration with existing design

### ✅ User Experience:
- Clear tabbed interface (Wallet vs Manual)
- Real-time validation feedback
- Loading states during connection
- Success confirmation
- Helpful error messages
- Visual read-only indicators
- Appropriate limitations messaging

### ✅ Developer Experience:
- Modular, reusable components
- Proper TypeScript typing
- Comprehensive error handling
- Clean separation of concerns
- Follows existing patterns

---

## 🚀 How to Use in Production

1. **Basic Connection**:
   ```typescript
   const { connectManual } = useWallet();
   await connectManual('core1h0wnttdkhsancdxz83nyta88llvkkydcjl49f4');
   ```

2. **Check if Read-Only**:
   ```typescript
   const { connectedWallet } = useWallet();
   if (connectedWallet?.isReadOnly) {
     // Show read-only limitations
   }
   ```

3. **Handle Signing Operations**:
   ```typescript
   try {
     await signMessage('test');
   } catch (error) {
     // Will throw: "Cannot sign messages with read-only connection"
   }
   ```

**The manual wallet connection feature is now fully functional and production-ready!** 🎉
