# 🎯 Token Management System Setup Guide

This document outlines the new efficient token image and metadata management system that has been implemented for ShieldNest.

## 🏗️ System Architecture

### 1. **Database-First Approach**
- **Primary Storage**: PostgreSQL table `token_metadata` in Supabase
- **Fallback**: Hardcoded registry in `token-registry.ts`
- **Caching**: Browser localStorage for frequently used tokens

### 2. **Multi-Layer Caching Strategy**
```
User Request → Browser Cache → Database → Hardcoded Registry → Default
```

### 3. **Image Storage Options**
- **Local Files**: `/public/tokens/` directory (current approach)
- **Database Storage**: Optional binary data in `imageData` field
- **External URLs**: Support for external image caching

## 🚀 Implementation Features

### ✅ **Completed Features**

1. **Enhanced ROLL Token Support**
   - ✅ Saved your provided ROLL token image as SVG
   - ✅ Added proper denomination mapping for `xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz`
   - ✅ Updated liquidity pools to use correct ROLL image

2. **Database Schema**
   - ✅ Created `TokenMetadata` table with comprehensive fields
   - ✅ Added indexing for performance
   - ✅ Support for verification and priority ranking

3. **API Endpoints**
   - ✅ `GET /api/tokens/:denom` - Get token metadata
   - ✅ `GET /api/tokens` - Get all verified tokens
   - ✅ `POST /api/tokens` - Create/update token metadata (admin)
   - ✅ `POST /api/tokens/:denom/image` - Upload token image (admin)
   - ✅ `POST /api/tokens/cache-image` - Cache external image (admin)
   - ✅ `POST /api/tokens/bulk-import` - Bulk import tokens (admin)

4. **Frontend Caching**
   - ✅ Browser localStorage caching with LRU eviction
   - ✅ 24-hour cache expiry
   - ✅ Preloading of common tokens
   - ✅ Batch fetching support

5. **Service Layer**
   - ✅ Token metadata service with fallbacks
   - ✅ Image caching from external URLs
   - ✅ Automatic database population

## 📋 Setup Instructions

### 1. **Database Migration**

Run the Prisma migration to create the new table:

```bash
cd apps/api
npx prisma migrate dev --name add_token_metadata
```

### 2. **Populate Initial Data**

Run the migration script to populate the database with existing token data:

```bash
cd apps/api
npx ts-node src/scripts/migrate-token-data.ts
```

To force update existing data:
```bash
npx ts-node src/scripts/migrate-token-data.ts --force
```

### 3. **Install New Dependencies**

The system uses `multer` for file uploads:

```bash
cd apps/api
npm install multer @types/multer
```

### 4. **Frontend Integration**

Update components to use the new caching system:

```typescript
// Old approach
import { getTokenMetadata } from '@/lib/token-registry';
const metadata = getTokenMetadata(denom);

// New approach (async with caching)
import { getCachedTokenMetadata } from '@/lib/token-cache';
const metadata = await getCachedTokenMetadata(denom);
```

### 5. **Initialize Cache**

Add to your app initialization:

```typescript
import { initializeTokenCache } from '@/lib/token-cache';

// In your app startup
useEffect(() => {
  initializeTokenCache();
}, []);
```

## 🎛️ Admin Management

### **Adding New Tokens**

1. **Via API** (Recommended):
```bash
curl -X POST http://localhost:8000/api/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "denom": "new-token-denom",
    "symbol": "NEW",
    "name": "New Token",
    "decimals": 6,
    "imageUrl": "/tokens/new.svg",
    "description": "Description of new token",
    "category": "fungible",
    "verified": true,
    "priority": 50
  }'
```

2. **Upload Token Image**:
```bash
curl -X POST http://localhost:8000/api/tokens/new-token-denom/image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/token-image.svg"
```

3. **Cache External Image**:
```bash
curl -X POST http://localhost:8000/api/tokens/cache-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "imageUrl": "https://example.com/token-logo.png",
    "symbol": "NEW"
  }'
```

## 📊 Performance Benefits

### **Before**
- ❌ Hardcoded token list
- ❌ No caching mechanism
- ❌ Manual image management
- ❌ No dynamic updates

### **After**
- ✅ Database-driven with caching
- ✅ Automatic fallbacks
- ✅ Efficient browser caching
- ✅ Admin-friendly management
- ✅ External image support
- ✅ Bulk import capabilities

## 🔧 Cache Management

### **Browser Cache Stats**
```typescript
import { tokenCache } from '@/lib/token-cache';

// Get cache statistics
const stats = tokenCache.getStats();
console.log('Cache size:', stats.size);
console.log('Top tokens:', stats.topTokens);

// Clear cache if needed
tokenCache.clear();
```

### **Cache Behavior**
- **Expiry**: 24 hours
- **Max Size**: 100 tokens (LRU eviction)
- **Hit Tracking**: Usage-based prioritization
- **Preloading**: Common tokens loaded on app start

## 🚨 Important Notes

1. **ROLL Token Fixed**: The system now properly recognizes the Coreum ROLL token denomination and displays the correct image.

2. **Backwards Compatible**: Existing code will continue to work with automatic fallbacks.

3. **Admin Access Required**: Token management endpoints require admin authentication.

4. **Image Formats**: Supports SVG, PNG, JPEG, and WebP formats.

5. **File Size Limits**: 2MB maximum for uploaded images.

## 🔄 Future Enhancements

1. **Automatic Discovery**: Fetch token metadata from Coreum explorer API
2. **CDN Integration**: Serve images from CDN for better performance
3. **Image Optimization**: Automatic resizing and format conversion
4. **Community Submissions**: Allow users to suggest token metadata
5. **Analytics**: Track token usage and popularity

---

**Result**: Your ROLL token image is now properly stored and the system provides a robust, scalable solution for managing all token metadata and images efficiently! 🎉
