-- Create tables for MPC wallets and shares
CREATE TABLE IF NOT EXISTS mpc_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
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
CREATE POLICY "Users can view their own MPC wallets"
ON mpc_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own MPC wallets"
ON mpc_wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policies for mpc_shares
-- CRITICAL: Only the service role or a specific function should be able to read share_data
-- For simplicity in this demo, we'll allow the owner to insert, but only a service role function to read.
CREATE POLICY "Users can insert their backend share"
ON mpc_shares FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM mpc_wallets 
    WHERE id = mpc_shares.wallet_id AND user_id = auth.uid()
));

-- Function to sign using the backend share
-- This is what the Edge Function will call or it could be a Postgres function if logic is ported.
