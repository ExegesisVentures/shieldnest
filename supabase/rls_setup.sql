-- rls_setup.sql
-- Run on the dev branch first. Review before running in production.
-- This file implements Row Level Security (RLS) policies for the Roll NFT Dashboard

-- === Enable RLS where necessary ===
ALTER TABLE IF EXISTS public.epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.airdrop_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.airdrop_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blockchain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.price_oracles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.snapshot_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staking_tracked_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staking_wallet_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staking_claims ENABLE ROW LEVEL SECURITY;

-- Ensure core tables have RLS enabled (re-run safe)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tma_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tma_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rise_nft_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rise_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sellbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.airdrop_claims ENABLE ROW LEVEL SECURITY;

-- === Policies ===
-- Note: wrap auth.uid() for planner stability: (SELECT auth.uid())

-- Users
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = users."supabaseId");

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = users."supabaseId")
  WITH CHECK ((SELECT auth.uid())::text = users."supabaseId");

-- Service role full access to users (note: service_role key bypasses RLS, but keep policy explicit for admin JWTs)
DROP POLICY IF EXISTS "Service role full access to users" ON public.users;
CREATE POLICY "Service role full access to users" ON public.users
  FOR ALL USING ((auth.role() = 'service_role') OR ( (auth.jwt() ->> 'user_role') = 'admin' ));

-- User wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
CREATE POLICY "Users can view own wallets" ON public.user_wallets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_wallets."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Users can manage own wallets" ON public.user_wallets;
CREATE POLICY "Users can manage own wallets" ON public.user_wallets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_wallets."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_wallets."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to user_wallets" ON public.user_wallets;
CREATE POLICY "Service role full access to user_wallets" ON public.user_wallets
  FOR ALL USING (auth.role() = 'service_role');

-- Wallets
DROP POLICY IF EXISTS "Users can view own connected wallets" ON public.wallets;
CREATE POLICY "Users can view own connected wallets" ON public.wallets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = wallets."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Users can manage own connected wallets" ON public.wallets;
CREATE POLICY "Users can manage own connected wallets" ON public.wallets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = wallets."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = wallets."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to wallets" ON public.wallets;
CREATE POLICY "Service role full access to wallets" ON public.wallets
  FOR ALL USING (auth.role() = 'service_role');

-- TMA documents (public read, service role manage)
DROP POLICY IF EXISTS "TMA documents public read" ON public.tma_documents;
CREATE POLICY "TMA documents public read" ON public.tma_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage TMA documents" ON public.tma_documents;
CREATE POLICY "Service role can manage TMA documents" ON public.tma_documents
  FOR ALL USING (auth.role() = 'service_role');

-- TMA consents
DROP POLICY IF EXISTS "Users can view own TMA consents" ON public.tma_consents;
CREATE POLICY "Users can view own TMA consents" ON public.tma_consents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = tma_consents."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Users can create own TMA consents" ON public.tma_consents;
CREATE POLICY "Users can create own TMA consents" ON public.tma_consents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = tma_consents."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to TMA consents" ON public.tma_consents;
CREATE POLICY "Service role full access to TMA consents" ON public.tma_consents
  FOR ALL USING (auth.role() = 'service_role');

-- Claims
DROP POLICY IF EXISTS "Users can view own claims" ON public.claims;
CREATE POLICY "Users can view own claims" ON public.claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = claims."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Users can create own claims" ON public.claims;
CREATE POLICY "Users can create own claims" ON public.claims
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = claims."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to claims" ON public.claims;
CREATE POLICY "Service role full access to claims" ON public.claims
  FOR ALL USING (auth.role() = 'service_role');

-- Sellbacks
DROP POLICY IF EXISTS "Users can view own sellbacks" ON public.sellbacks;
CREATE POLICY "Users can view own sellbacks" ON public.sellbacks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = sellbacks."sellerId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Users can create own sellbacks" ON public.sellbacks;
CREATE POLICY "Users can create own sellbacks" ON public.sellbacks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = sellbacks."sellerId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to sellbacks" ON public.sellbacks;
CREATE POLICY "Service role full access to sellbacks" ON public.sellbacks
  FOR ALL USING (auth.role() = 'service_role');

-- Reward claims
DROP POLICY IF EXISTS "Users can view own reward claims" ON public.reward_claims;
CREATE POLICY "Users can view own reward claims" ON public.reward_claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = reward_claims."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to reward claims" ON public.reward_claims;
CREATE POLICY "Service role full access to reward claims" ON public.reward_claims
  FOR ALL USING (auth.role() = 'service_role');

-- Epochs
DROP POLICY IF EXISTS "Epochs public read" ON public.epochs;
CREATE POLICY "Epochs public read" ON public.epochs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage epochs" ON public.epochs;
CREATE POLICY "Service role can manage epochs" ON public.epochs
  FOR ALL USING (auth.role() = 'service_role');

-- Rise NFT Holders - service only
DROP POLICY IF EXISTS "Service role only for rise_nft_holders" ON public.rise_nft_holders;
CREATE POLICY "Service role only for rise_nft_holders" ON public.rise_nft_holders
  FOR ALL USING (auth.role() = 'service_role');

-- Rise conversions
DROP POLICY IF EXISTS "Users can view own rise conversions" ON public.rise_conversions;
CREATE POLICY "Users can view own rise conversions" ON public.rise_conversions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = rise_conversions."userId"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to rise conversions" ON public.rise_conversions;
CREATE POLICY "Service role full access to rise conversions" ON public.rise_conversions
  FOR ALL USING (auth.role() = 'service_role');

-- Airdrop schedules
DROP POLICY IF EXISTS "Airdrop schedules public read" ON public.airdrop_schedules;
CREATE POLICY "Airdrop schedules public read" ON public.airdrop_schedules
  FOR SELECT USING (COALESCE("isActive", false) = true);

DROP POLICY IF EXISTS "Service role can manage airdrop schedules" ON public.airdrop_schedules;
CREATE POLICY "Service role can manage airdrop schedules" ON public.airdrop_schedules
  FOR ALL USING (auth.role() = 'service_role');

-- Airdrop claims
DROP POLICY IF EXISTS "Users can view relevant airdrop claims" ON public.airdrop_claims;
CREATE POLICY "Users can view relevant airdrop claims" ON public.airdrop_claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      JOIN public.users u ON u.id = w."userId"
      WHERE w.address = airdrop_claims."walletAddress"
        AND (SELECT auth.uid())::text = u."supabaseId"
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_wallets uw
      JOIN public.users u2 ON u2.id = uw."userId"
      WHERE uw.address = airdrop_claims."walletAddress"
        AND (SELECT auth.uid())::text = u2."supabaseId"
    )
  );

DROP POLICY IF EXISTS "Service role full access to airdrop claims" ON public.airdrop_claims;
CREATE POLICY "Service role full access to airdrop claims" ON public.airdrop_claims
  FOR ALL USING (auth.role() = 'service_role');

-- Config / Blockchain Events / Price Oracles / Snapshots - service only except public reads noted
DROP POLICY IF EXISTS "Service role only for config" ON public.config;
CREATE POLICY "Service role only for config" ON public.config
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role only for blockchain events" ON public.blockchain_events;
CREATE POLICY "Service role only for blockchain events" ON public.blockchain_events
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Price oracles public read" ON public.price_oracles;
CREATE POLICY "Price oracles public read" ON public.price_oracles
  FOR SELECT USING (COALESCE("isActive", false) = true);

DROP POLICY IF EXISTS "Service role can manage price oracles" ON public.price_oracles;
CREATE POLICY "Service role can manage price oracles" ON public.price_oracles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Snapshot entries public read" ON public.snapshot_entries;
CREATE POLICY "Snapshot entries public read" ON public.snapshot_entries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage snapshots" ON public.snapshot_entries;
CREATE POLICY "Service role can manage snapshots" ON public.snapshot_entries
  FOR ALL USING (auth.role() = 'service_role');

-- === Helper function ===
CREATE OR REPLACE FUNCTION auth.user_owns_wallet(wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.wallets w
    JOIN public.users u ON u.id = w."userId"
    WHERE w.address = wallet_address
      AND u."supabaseId" = (SELECT auth.uid())::text
  )
  OR EXISTS (
    SELECT 1 FROM public.user_wallets uw
    JOIN public.users u2 ON u2.id = uw."userId"
    WHERE uw.address = wallet_address
      AND u2."supabaseId" = (SELECT auth.uid())::text
  );
END;
$$;

-- Immediately restrict execution to authenticated role only (or adjust as desired)
REVOKE ALL ON FUNCTION auth.user_owns_wallet(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth.user_owns_wallet(text) TO authenticated;

-- Schema usage grants (minimal)
GRANT USAGE ON SCHEMA public TO authenticated;
-- Do NOT broadly grant access to auth schema unless required.
-- If needed, you can grant EXECUTE on specific auth functions only.

-- === Verification queries (run after migration) ===
-- 1) Check RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2) Check policies for a table (example):
-- SELECT polname, polcmd, polpermissive FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';
