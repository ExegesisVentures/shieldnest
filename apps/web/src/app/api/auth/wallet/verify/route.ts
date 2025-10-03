// apps/web/src/app/api/auth/wallet/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifySignature, isNonceValid, createAuthSignDoc } from '@/utils/wallet/adr36';
import { COREUM_CHAIN_CONFIG } from '@/lib/coreum/chain';
import { createError, ErrorCodes, mapSupabaseError } from '@/lib/errors';
import { z } from 'zod';

const verifyRequestSchema = z.object({
  signature: z.string(),
  publicKey: z.string(),
  address: z.string(),
  nonce: z.string(),
  email: z.string().email().optional(),
});

/**
 * Verify wallet signature and create/login user
 * POST /api/auth/wallet/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signature, publicKey, address, nonce, email } = verifyRequestSchema.parse(body);

    // Validate nonce
    if (!isNonceValid(nonce)) {
      return NextResponse.json(
        createError(
          ErrorCodes.AUTH_NONCE_EXPIRED,
          'Authentication nonce has expired',
          'Please request a new signature'
        ),
        { status: 400 }
      );
    }

    // Verify signature
    const signDoc = createAuthSignDoc(COREUM_CHAIN_CONFIG.chainId, address, nonce);
    const isValid = await verifySignature(signature, publicKey, signDoc);

    if (!isValid) {
      return NextResponse.json(
        createError(
          ErrorCodes.AUTH_INVALID_SIGNATURE,
          'Invalid wallet signature',
          'Please try signing again'
        ),
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check if user exists by address in wallets table
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('user_id, public_users(*)')
      .eq('address', address)
      .eq('chain_id', COREUM_CHAIN_CONFIG.chainId)
      .single();

    let userId: string;

    if (existingWallet) {
      // Existing user - sign them in
      userId = existingWallet.user_id;
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${address}@shieldnest.temp`, // Temporary email format
        password: address, // Use address as password for wallet auth
      });

      if (signInError) {
        // If sign in fails, we'll create a new session manually
        const { error: adminSignInError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: `${address}@shieldnest.temp`,
        });
        
        if (adminSignInError) {
          throw adminSignInError;
        }
      }
    } else {
      // New user - create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email || `${address}@shieldnest.temp`,
        password: address, // Use address as password
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      userId = authData.user.id;

      // Create public user record
      const { error: publicUserError } = await supabase
        .from('public_users')
        .insert({
          id: userId,
          email: email || null,
          notify_opt_in: false,
        });

      if (publicUserError) {
        throw publicUserError;
      }

      // Add wallet to wallets table
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          chain_id: COREUM_CHAIN_CONFIG.chainId,
          address: address,
          label: 'Connected Wallet',
          read_only: false,
          is_primary: true,
        });

      if (walletError) {
        throw walletError;
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      address,
      needsEmail: !email && !existingWallet,
    });

  } catch (error) {
    console.error('Wallet verification failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          'Please check your signature parameters'
        ),
        { status: 400 }
      );
    }

    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Authentication failed',
      'Please try again in a moment'
    );

    return NextResponse.json(shieldError, { status: 500 });
  }
}
