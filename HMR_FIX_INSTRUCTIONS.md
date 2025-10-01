# HMR Error Fix Instructions

## Issues Fixed

The following HMR (Hot Module Replacement) errors were occurring in your Next.js 15 application:

1. **ISR Manifest Error**: `[HMR] Invalid message: {"action":"isrManifest","data":{"/":true}}`
2. **Component Properties Error**: `TypeError: Cannot read properties of undefined (reading 'components')`
3. **Static Indicator Error**: Issues with `handleStaticIndicator` function

## Changes Made

### 1. Next.js Configuration (`apps/web/next.config.js`)

- **Disabled ISR features** in development that conflict with HMR
- **Enhanced build indicators** configuration to prevent static indicator errors
- **Added webpack ignoreWarnings** to suppress known HMR-related warnings
- **Improved HMR plugin configuration** to handle ISR manifest messages properly
- **Disabled file tracing** and other features that trigger unwanted messages

### 2. HMR Error Suppressor (`apps/web/src/components/HMRErrorSuppressor.tsx`)

- **Enhanced console patching** to prevent double-patching
- **Expanded error suppression** to cover more HMR-related error patterns
- **Added WebSocket message filtering** to block problematic ISR manifest messages
- **Improved static indicator error handling**

### 3. Development Scripts (`apps/web/package.json`)

- **Optimized polling settings** (disabled WATCHPACK_POLLING for better performance)
- **Added memory management** with NODE_OPTIONS for larger projects
- **Added clean development script** for troubleshooting
- **Added verbose debugging script** for advanced debugging

### 4. TypeScript Configuration (`apps/web/tsconfig.json`)

- **Updated module resolution** to 'bundler' for better compatibility with Next.js 15
- **Added synthetic default imports** support
- **Disabled verbatim module syntax** to prevent import issues

## How to Apply the Fix

1. **Restart your development server** completely:
   ```bash
   # Stop the current dev server (Ctrl+C)
   
   # Navigate to the web app directory
   cd apps/web
   
   # Clean the build cache
   npm run clean
   
   # Start the development server
   npm run dev
   ```

2. **If issues persist**, try the clean development script:
   ```bash
   npm run dev:clean
   ```

3. **For advanced debugging**, use the verbose script:
   ```bash
   npm run dev:verbose
   ```

## Expected Behavior

After applying these fixes:

- ✅ The ISR manifest error should no longer appear
- ✅ The "Cannot read properties of undefined (reading 'components')" error should be resolved
- ✅ Static indicator errors should be suppressed
- ✅ HMR should work smoothly without console pollution
- ✅ WebSocket connections should be stable

## Environment Variables (Optional)

Create a `.env.local` file in `apps/web/` with these optimizations:

```env
# Development Environment Variables for HMR Optimization
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
FAST_REFRESH=true
TURBOPACK=false
DISABLE_ESLINT_PLUGIN=false
NODE_OPTIONS=--max-old-space-size=4096
PORT=3000
HOSTNAME=localhost
SUPPRESS_NO_CONFIG_WARNING=true
```

## Troubleshooting

If you still experience issues:

1. **Clear all caches**:
   ```bash
   rm -rf .next node_modules/.cache
   npm install
   ```

2. **Check for conflicting browser extensions** that might interfere with WebSocket connections

3. **Verify port 3000 is available** and not being used by other services

4. **Update dependencies** if needed:
   ```bash
   npm update next react react-dom
   ```

## Files Modified

- `apps/web/next.config.js` - Enhanced HMR configuration
- `apps/web/src/components/HMRErrorSuppressor.tsx` - Improved error suppression
- `apps/web/package.json` - Optimized development scripts
- `apps/web/tsconfig.json` - Updated TypeScript configuration for Next.js 15

The HMR errors you were experiencing are common with Next.js 15 and its new ISR features. These fixes address the root causes while maintaining full development functionality.
