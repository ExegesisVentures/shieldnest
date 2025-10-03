// apps/web/src/app/api/admin/shield-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import { createError, ErrorCodes, mapSupabaseError } from '@/lib/errors';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  imageUrl: z.string().url().optional(),
  minUsd: z.number().min(0).optional(),
  maxUsd: z.number().min(0).optional(),
});

/**
 * Get Shield NFT settings
 * GET /api/admin/shield-settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    
    const { data: settings, error } = await supabase
      .from('shield_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Get shield settings failed:', error);
    
    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch shield settings'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}

/**
 * Update Shield NFT settings (admin only)
 * POST /api/admin/shield-settings
 */
export async function POST(request: NextRequest) {
  try {
    // TODO(v1): Add proper admin authentication
    // For now, we'll use a simple secret key check
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.ADMIN_SECRET_KEY}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        createError(
          ErrorCodes.AUTH_UNAUTHORIZED,
          'Admin authentication required',
          'Please provide valid admin credentials'
        ),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, minUsd, maxUsd } = updateSettingsSchema.parse(body);

    // Validate min/max relationship
    if (minUsd !== undefined && maxUsd !== undefined && minUsd > maxUsd) {
      return NextResponse.json(
        createError(
          ErrorCodes.VALIDATION_ERROR,
          'Minimum USD value cannot be greater than maximum',
          'Please ensure min_usd <= max_usd'
        ),
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (minUsd !== undefined) updateData.min_usd = minUsd;
    if (maxUsd !== undefined) updateData.max_usd = maxUsd;

    const { data: settings, error } = await supabase
      .from('shield_settings')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      settings,
      message: 'Shield settings updated successfully' 
    });

  } catch (error) {
    console.error('Update shield settings failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid settings data',
          'Please check your input values'
        ),
        { status: 400 }
      );
    }

    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update shield settings'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}
