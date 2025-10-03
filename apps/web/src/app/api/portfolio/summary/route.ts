// apps/web/src/app/api/portfolio/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createError, ErrorCodes, mapSupabaseError } from '@/lib/errors';
import { fetchAddressBalances, calculatePortfolioValue } from '@/lib/coreum/metadata';

/**
 * Get portfolio summary with balances and totals
 * GET /api/portfolio/summary
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

    // Get user's addresses
    const { data: addresses, error: addressError } = await supabase
      .from('portfolio_addresses')
      .select('*')
      .eq('user_id', user.id);

    if (addressError) {
      throw addressError;
    }

    if (!addresses || addresses.length === 0) {
      return NextResponse.json({
        addresses: [],
        totalValueUsd: 0,
        balancesByAddress: {},
        summary: {
          totalAddresses: 0,
          totalTokens: 0,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // Fetch balances for each address
    const balancesByAddress: Record<string, any[]> = {};
    let allBalances: any[] = [];

    for (const addr of addresses) {
      try {
        const balances = await fetchAddressBalances(addr.address);
        balancesByAddress[addr.address] = balances;
        allBalances = allBalances.concat(balances);
      } catch (error) {
        console.error(`Failed to fetch balances for ${addr.address}:`, error);
        balancesByAddress[addr.address] = [];
      }
    }

    // Calculate total portfolio value
    const totalValueUsd = await calculatePortfolioValue(allBalances);

    // Aggregate token balances across all addresses
    const tokenSummary: Record<string, {
      symbol: string;
      denom: string;
      totalAmount: number;
      decimals: number;
      logoUrl?: string;
      addresses: Array<{ address: string; amount: number }>;
    }> = {};

    allBalances.forEach((balance) => {
      const key = balance.denom;
      
      if (!tokenSummary[key]) {
        tokenSummary[key] = {
          symbol: balance.symbol,
          denom: balance.denom,
          totalAmount: 0,
          decimals: balance.decimals,
          logoUrl: balance.logoUrl,
          addresses: [],
        };
      }

      const amount = parseFloat(balance.amount);
      tokenSummary[key].totalAmount += amount;
      
      // Find which address this balance belongs to
      const ownerAddress = Object.keys(balancesByAddress).find(addr => 
        balancesByAddress[addr].some(b => b.denom === balance.denom)
      );
      
      if (ownerAddress) {
        tokenSummary[key].addresses.push({
          address: ownerAddress,
          amount,
        });
      }
    });

    // Create portfolio snapshot (for caching/history)
    try {
      await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: user.id,
          total_value_usd: totalValueUsd,
          breakdown: {
            addressCount: addresses.length,
            tokenSummary: Object.values(tokenSummary),
            balancesByAddress,
          },
        });
    } catch (error) {
      // Snapshot creation is not critical
      console.warn('Failed to create portfolio snapshot:', error);
    }

    return NextResponse.json({
      addresses,
      totalValueUsd,
      balancesByAddress,
      tokenSummary: Object.values(tokenSummary),
      summary: {
        totalAddresses: addresses.length,
        totalTokens: Object.keys(tokenSummary).length,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Portfolio summary failed:', error);
    
    const shieldError = error.code ? mapSupabaseError(error) : createError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch portfolio summary',
      'Please try again in a moment'
    );
    
    return NextResponse.json(shieldError, { status: 500 });
  }
}
