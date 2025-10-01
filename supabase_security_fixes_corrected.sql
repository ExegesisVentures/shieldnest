-- =====================================================
-- SUPABASE SECURITY CONFIGURATION (CORRECTED)
-- Fix for RLS and security issues - Only existing tables
-- =====================================================

-- Enable Row Level Security (RLS) on existing public tables
-- This is CRITICAL for data security in Supabase

-- 1. User and Authentication Tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tma_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tma_consents ENABLE ROW LEVEL SECURITY;

-- 2. NFT and Trading Tables
ALTER TABLE public.rise_nft_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rise_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellbacks ENABLE ROW LEVEL SECURITY;

-- 3. Rewards Tables
ALTER TABLE public.epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

-- 4. Airdrop Tables
ALTER TABLE public.airdrop_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_claims ENABLE ROW LEVEL SECURITY;

-- 5. System Tables
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_oracles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshot_entries ENABLE ROW LEVEL SECURITY;

-- Note: _prisma_migrations should remain unrestricted for schema management

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Users Table Policies
-- Users can only see and modify their own records
CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (auth.uid()::text = "supabaseId");

CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE USING (auth.uid()::text = "supabaseId");

-- Service role can manage all users (for API operations)
CREATE POLICY "Service role full access to users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- User Wallets Policies
-- Users can only access their own wallet associations
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = user_wallets.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage own wallets" ON public.user_wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = user_wallets.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to user_wallets" ON public.user_wallets
    FOR ALL USING (auth.role() = 'service_role');

-- Wallets Policies
-- Users can only access wallets they own
CREATE POLICY "Users can view own connected wallets" ON public.wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = wallets.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage own connected wallets" ON public.wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = wallets.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to wallets" ON public.wallets
    FOR ALL USING (auth.role() = 'service_role');

-- TMA Documents Policies
-- TMA documents are publicly readable but only admin writable
CREATE POLICY "TMA documents public read" ON public.tma_documents
    FOR SELECT USING (true);

-- Only service role can modify TMA documents
CREATE POLICY "Service role can manage TMA documents" ON public.tma_documents
    FOR ALL USING (auth.role() = 'service_role');

-- TMA Consents Policies
-- Users can only see their own consents
CREATE POLICY "Users can view own TMA consents" ON public.tma_consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = tma_consents.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own TMA consents" ON public.tma_consents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = tma_consents.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to TMA consents" ON public.tma_consents
    FOR ALL USING (auth.role() = 'service_role');

-- Claims Policies
-- Users can only see their own claims
CREATE POLICY "Users can view own claims" ON public.claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = claims.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own claims" ON public.claims
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = claims.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to claims" ON public.claims
    FOR ALL USING (auth.role() = 'service_role');

-- Sellbacks Policies
-- Users can only see their own sellbacks
CREATE POLICY "Users can view own sellbacks" ON public.sellbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = sellbacks.seller_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own sellbacks" ON public.sellbacks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = sellbacks.seller_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to sellbacks" ON public.sellbacks
    FOR ALL USING (auth.role() = 'service_role');

-- Reward Claims Policies
-- Users can only see their own reward claims
CREATE POLICY "Users can view own reward claims" ON public.reward_claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = reward_claims.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

-- Service role full access
CREATE POLICY "Service role full access to reward claims" ON public.reward_claims
    FOR ALL USING (auth.role() = 'service_role');

-- Epochs are publicly readable (for transparency)
CREATE POLICY "Epochs public read" ON public.epochs
    FOR SELECT USING (true);

-- Only service role can manage epochs
CREATE POLICY "Service role can manage epochs" ON public.epochs
    FOR ALL USING (auth.role() = 'service_role');

-- Rise NFT Holders - Admin only
CREATE POLICY "Service role only for rise_nft_holders" ON public.rise_nft_holders
    FOR ALL USING (auth.role() = 'service_role');

-- Rise Conversions - Users can see their own
CREATE POLICY "Users can view own rise conversions" ON public.rise_conversions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = rise_conversions.user_id 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Service role full access to rise conversions" ON public.rise_conversions
    FOR ALL USING (auth.role() = 'service_role');

-- Airdrop Schedules - Publicly readable
CREATE POLICY "Airdrop schedules public read" ON public.airdrop_schedules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage airdrop schedules" ON public.airdrop_schedules
    FOR ALL USING (auth.role() = 'service_role');

-- Airdrop Claims - Users can see claims for their wallets
CREATE POLICY "Users can view relevant airdrop claims" ON public.airdrop_claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            JOIN public.users ON users.id = wallets.user_id
            WHERE wallets.address = airdrop_claims.wallet_address 
            AND users.supabase_id = auth.uid()::text
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.user_wallets 
            JOIN public.users ON users.id = user_wallets.user_id
            WHERE user_wallets.address = airdrop_claims.wallet_address 
            AND users.supabase_id = auth.uid()::text
        )
    );

CREATE POLICY "Service role full access to airdrop claims" ON public.airdrop_claims
    FOR ALL USING (auth.role() = 'service_role');

-- System Tables (Config, Blockchain Events, Price Oracles, Snapshots)
-- These are service-role only for security
CREATE POLICY "Service role only for config" ON public.config
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for blockchain events" ON public.blockchain_events
    FOR ALL USING (auth.role() = 'service_role');

-- Price oracles can be read publicly for transparency
CREATE POLICY "Price oracles public read" ON public.price_oracles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage price oracles" ON public.price_oracles
    FOR ALL USING (auth.role() = 'service_role');

-- Snapshot entries are publicly readable for verification
CREATE POLICY "Snapshot entries public read" ON public.snapshot_entries
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage snapshots" ON public.snapshot_entries
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- ADDITIONAL SECURITY SETTINGS
-- =====================================================

-- Create a function to check if a user owns a wallet address
CREATE OR REPLACE FUNCTION auth.user_owns_wallet(wallet_address text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.wallets 
        JOIN public.users ON users.id = wallets.user_id
        WHERE wallets.address = wallet_address 
        AND users.supabase_id = auth.uid()::text
    ) OR EXISTS (
        SELECT 1 FROM public.user_wallets 
        JOIN public.users ON users.id = user_wallets.user_id
        WHERE user_wallets.address = wallet_address 
        AND users.supabase_id = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_owns_wallet TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled:
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '%prisma%';
