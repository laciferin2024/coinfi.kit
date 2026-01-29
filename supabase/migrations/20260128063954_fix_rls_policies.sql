-- Fix RLS policies for anonymous MPC wallet creation
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own MPC wallets" ON mpc_wallets;
DROP POLICY IF EXISTS "Users can create their own MPC wallets" ON mpc_wallets;
DROP POLICY IF EXISTS "Users can insert their backend share" ON mpc_shares;

-- Create public access policies for anonymous MPC
CREATE POLICY "Public read access for mpc_wallets"
ON mpc_wallets FOR SELECT
USING (true);

CREATE POLICY "Public insert access for mpc_wallets"
ON mpc_wallets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public insert access for mpc_shares"
ON mpc_shares FOR INSERT
WITH CHECK (true);
