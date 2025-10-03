// apps/web/src/app/api/tokens/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createError, ErrorCodes, mapSupabaseError } from '@/lib/errors';
import { getTokenMetadata } from '@/lib/coreum/metadata';
import { CORE_DENOM, CORE_SYMBOL } from '@/lib/coreum/chain';

/**
 * Get token metadata
 * GET /api/tokens?denom=ucore or GET /api/tokens (all tokens)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const denom = searchParams.get('denom');

    const supabase = createServerSupabaseClient();

    if (denom) {
      // Get specific token
      let tokenData;
      
      // Check cache first
      const { data: cachedToken } = await supabase
        .from('tokens')
        .select('*')
        .eq('denom', denom)
        .single();

      if (cachedToken) {
        tokenData = cachedToken;
      } else {
        // Fetch fresh metadata
        const metadata = await getTokenMetadata(denom);
        
        // Cache the result
        const { data: insertedToken, error: insertError } = await supabase
          .from('tokens')
          .upsert({
            symbol: metadata.symbol,
            denom: metadata.denom,
            decimals: metadata.decimals,
            logo_url: metadata.logoUrl,
            source: metadata.source,
            last_updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.warn('Failed to cache token metadata:', insertError);
        }

        tokenData = insertedToken || metadata;
      }

      return NextResponse.json({ token: tokenData });
    } else {
      // Get all cached tokens
      const { data: tokens, error } = await supabase
        .from('tokens')
        .select('*')
        .order('symbol', { ascending: true });

      if (error) {
        throw error;
      }

      // Ensure CORE token is included
      const hasCore = tokens?.some(t => t.denom === CORE_DENOM);
      
      if (!hasCore) {
        const coreMetadata = await getTokenMetadata(CORE_DENOM);
        
        // Add CORE to database
        const { error: coreError } = await supabase
          .from('tokens')
          .upsert({
            symbol: CORE_SYMBOL,
            denom: CORE_DENOM,
            decimals: 6,
            logo_url: '/tokens/core.svg',
            source: 'native',
          });

        if (!coreError) {
          tokens?.unshift({
            symbol: CORE_SYMBOL,
            denom: CORE_DENOM,
            decimals: 6,
            logo_url: '/tokens/core.svg',
            source: 'native',
            last_updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      }

      return NextResponse.json({ tokens: tokens || [] });
    }

  } catch (error) {
    console.error('Token metadata fetch failed:', error);
    
    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch token metadata',
      'Please try again in a moment'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}

/**
 * Update token metadata (admin only)
 * POST /api/tokens
 */
export async function POST(request: NextRequest) {
  try {
    // TODO(v1): Add admin authentication
    // For now, this endpoint is open but should be restricted in production
    
    const body = await request.json();
    const { symbol, denom, decimals, logoUrl, source } = body;

    if (!symbol || !denom) {
      return NextResponse.json(
        createError(ErrorCodes.VALIDATION_ERROR, 'Symbol and denom are required'),
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: token, error } = await supabase
      .from('tokens')
      .upsert({
        symbol,
        denom,
        decimals: decimals || 6,
        logo_url: logoUrl,
        source: source || 'manual',
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ token }, { status: 201 });

  } catch (error) {
    console.error('Token update failed:', error);
    
    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update token metadata'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}
