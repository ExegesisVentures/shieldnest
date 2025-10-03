-- ShieldNest Supabase Schema
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE pma_status_enum AS ENUM ('none', 'pending', 'signed');

-- 1. Public Users table
CREATE TABLE public_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    notify_opt_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Private Users table
CREATE TABLE private_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_user_id UUID REFERENCES public_users(id) ON DELETE CASCADE,
    pma_status pma_status_enum DEFAULT 'none',
    pma_pdf_url TEXT,
    pma_hash_onchain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public_users(id) ON DELETE CASCADE,
    chain_id TEXT NOT NULL,
    address TEXT NOT NULL,
    label TEXT,
    read_only BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chain_id, address)
);

-- 4. Portfolio Addresses table (for tracking multiple addresses)
CREATE TABLE portfolio_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public_users(id) ON DELETE CASCADE,
    chain_id TEXT NOT NULL,
    address TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chain_id, address)
);

-- 5. NFT Holdings Cache
CREATE TABLE nft_holdings_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public_users(id) ON DELETE CASCADE,
    contract TEXT NOT NULL,
    token_class TEXT,
    balance INTEGER DEFAULT 0,
    metadata JSONB,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contract, token_class)
);

-- 6. PMA Agreements
CREATE TABLE pma_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public_users(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    hash TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tokens metadata
CREATE TABLE tokens (
    symbol TEXT PRIMARY KEY,
    denom TEXT UNIQUE NOT NULL,
    decimals INTEGER DEFAULT 6,
    logo_url TEXT,
    source TEXT DEFAULT 'coredex',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Portfolio Snapshots
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public_users(id) ON DELETE CASCADE,
    total_value_usd DECIMAL(20, 6) DEFAULT 0,
    snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Shield Settings (Admin configurable)
CREATE TABLE shield_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton table
    image_url TEXT DEFAULT 'https://raw.githubusercontent.com/ShieldNest/assets/main/shield-nft-placeholder.png',
    min_usd DECIMAL(10, 2) DEFAULT 5000.00,
    max_usd DECIMAL(10, 2) DEFAULT 6000.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default shield settings
INSERT INTO shield_settings (id, image_url, min_usd, max_usd) 
VALUES (1, 'https://raw.githubusercontent.com/ShieldNest/assets/main/shield-nft-placeholder.png', 5000.00, 6000.00)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_portfolio_addresses_user_id ON portfolio_addresses(user_id);
CREATE INDEX idx_nft_holdings_user_id ON nft_holdings_cache(user_id);
CREATE INDEX idx_nft_holdings_contract ON nft_holdings_cache(contract);
CREATE INDEX idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_holdings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pma_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE shield_settings ENABLE ROW LEVEL SECURITY;

-- Public Users policies
CREATE POLICY "Users can view own profile" ON public_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public_users FOR INSERT WITH CHECK (auth.uid() = id);

-- Private Users policies  
CREATE POLICY "Private users can view own data" ON private_users FOR SELECT USING (
    public_user_id = auth.uid()
);
CREATE POLICY "Private users can update own data" ON private_users FOR UPDATE USING (
    public_user_id = auth.uid()
);
CREATE POLICY "Private users can insert own data" ON private_users FOR INSERT WITH CHECK (
    public_user_id = auth.uid()
);

-- Wallets policies
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (user_id = auth.uid());

-- Portfolio Addresses policies
CREATE POLICY "Users can view own addresses" ON portfolio_addresses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own addresses" ON portfolio_addresses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own addresses" ON portfolio_addresses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own addresses" ON portfolio_addresses FOR DELETE USING (user_id = auth.uid());

-- NFT Holdings Cache policies
CREATE POLICY "Users can view own nft holdings" ON nft_holdings_cache FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service can manage nft cache" ON nft_holdings_cache FOR ALL USING (true); -- Service role only

-- PMA Agreements policies
CREATE POLICY "Users can view own agreements" ON pma_agreements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own agreements" ON pma_agreements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tokens policies (public read)
CREATE POLICY "Anyone can view tokens" ON tokens FOR SELECT USING (true);
CREATE POLICY "Service can manage tokens" ON tokens FOR ALL USING (true); -- Service role only

-- Portfolio Snapshots policies
CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service can manage snapshots" ON portfolio_snapshots FOR ALL USING (true); -- Service role only

-- Shield Settings policies (public read, admin write)
CREATE POLICY "Anyone can view shield settings" ON shield_settings FOR SELECT USING (true);
CREATE POLICY "Service can update shield settings" ON shield_settings FOR UPDATE USING (true); -- Service role only

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_public_users_updated_at BEFORE UPDATE ON public_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_private_users_updated_at BEFORE UPDATE ON private_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shield_settings_updated_at BEFORE UPDATE ON shield_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
