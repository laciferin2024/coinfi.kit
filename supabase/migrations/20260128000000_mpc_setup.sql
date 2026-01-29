-- Create tables for MPC wallets and shares
CREATE TABLE IF NOT EXISTS mpc_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID -- Removed FK to auth.users to allow anonymous MPC generation
);

CREATE TABLE IF NOT EXISTS mpc_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES mpc_wallets(id) ON DELETE CASCADE,
    share_data JSONB NOT NULL, -- The P2 (backend) share
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id)
);

-- Enable RLS
ALTER TABLE mpc_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpc_shares ENABLE ROW LEVEL SECURITY;

-- Policies for mpc_wallets
CREATE POLICY "Public read access for mpc_wallets"
ON mpc_wallets FOR SELECT
USING (true);

CREATE POLICY "Public insert access for mpc_wallets"
ON mpc_wallets FOR INSERT
WITH CHECK (true);

-- Policies for mpc_shares
-- CRITICAL: Only the service role or a specific function should be able to read share_data
-- We allow insertion during the setup ceremony, but NO direct select access.
CREATE POLICY "Public insert access for mpc_shares"
ON mpc_shares FOR INSERT
WITH CHECK (true);

-- Function to sign using the backend share
-- This is what the Edge Function will call or it could be a Postgres function if logic is ported.
