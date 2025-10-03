// apps/web/src/app/api/portfolio/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createError, ErrorCodes, mapSupabaseError } from '@/lib/errors';
import { isValidCoreumAddress, COREUM_CHAIN_CONFIG } from '@/lib/coreum/chain';
import { z } from 'zod';

const addAddressSchema = z.object({
  address: z.string().min(1),
  label: z.string().optional(),
  chainId: z.string().default(COREUM_CHAIN_CONFIG.chainId),
});

/**
 * Get user's portfolio addresses
 * GET /api/portfolio/addresses
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

    const { data: addresses, error } = await supabase
      .from('portfolio_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ addresses: addresses || [] });

  } catch (error) {
    console.error('Get addresses failed:', error);
    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch addresses'
    );
    return NextResponse.json(shieldError, { status: 500 });
  }
}

/**
 * Add new portfolio address
 * POST /api/portfolio/addresses
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createError(ErrorCodes.AUTH_UNAUTHORIZED, 'Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address, label, chainId } = addAddressSchema.parse(body);

    // Validate address format
    if (!isValidCoreumAddress(address)) {
      return NextResponse.json(
        createError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid Coreum address format',
          'Please provide a valid core1... address'
        ),
        { status: 400 }
      );
    }

    // Check if address already exists for this user
    const { data: existing } = await supabase
      .from('portfolio_addresses')
      .select('id')
      .eq('user_id', user.id)
      .eq('address', address)
      .eq('chain_id', chainId)
      .single();

    if (existing) {
      return NextResponse.json(
        createError(
          ErrorCodes.DB_CONSTRAINT_VIOLATION,
          'Address already exists in your portfolio',
          'This address is already being tracked'
        ),
        { status: 400 }
      );
    }

    // Add the address
    const { data: newAddress, error } = await supabase
      .from('portfolio_addresses')
      .insert({
        user_id: user.id,
        chain_id: chainId,
        address,
        label: label || `Address ${Date.now()}`,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ address: newAddress }, { status: 201 });

  } catch (error) {
    console.error('Add address failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createError(ErrorCodes.VALIDATION_ERROR, 'Invalid request data'),
        { status: 400 }
      );
    }

    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to add address'
    );
    return NextResponse.json(shieldError, { status: 500 });
  }
}

/**
 * Delete portfolio address
 * DELETE /api/portfolio/addresses
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createError(ErrorCodes.AUTH_UNAUTHORIZED, 'Authentication required'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json(
        createError(ErrorCodes.VALIDATION_ERROR, 'Address ID required'),
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('portfolio_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete address failed:', error);
    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete address'
    );
    return NextResponse.json(shieldError, { status: 500 });
  }
}
