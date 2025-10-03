// apps/web/src/app/api/nft/shield/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getShieldNftData } from '@/lib/nft/shield';
import { createError, ErrorCodes } from '@/lib/errors';

/**
 * Get Shield NFT data for current user
 * GET /api/nft/shield
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createError(ErrorCodes.AUTH_UNAUTHORIZED, 'Authentication required'),
        { status: 401 }
      );
    }

    const nftData = await getShieldNftData(user.id);
    
    if (!nftData) {
      return NextResponse.json(
        createError(
          ErrorCodes.NFT_CONTRACT_NOT_FOUND,
          'Shield NFT data not available',
          'Please try again later'
        ),
        { status: 404 }
      );
    }

    return NextResponse.json({ nft: nftData });

  } catch (error) {
    console.error('Shield NFT fetch failed:', error);
    
    const shieldError = createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch Shield NFT data',
      'Please try again in a moment'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}
