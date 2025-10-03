// apps/web/src/app/api/auth/wallet/nonce/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from '@/utils/wallet/adr36';
import { createError, ErrorCodes } from '@/lib/errors';

/**
 * Generate authentication nonce for wallet signing
 * GET /api/auth/wallet/nonce
 */
export async function GET(request: NextRequest) {
  try {
    const nonce = generateNonce();
    
    return NextResponse.json({
      nonce,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    });
  } catch (error) {
    console.error('Nonce generation failed:', error);
    
    const shieldError = createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to generate authentication nonce',
      'Please try again in a moment'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}
