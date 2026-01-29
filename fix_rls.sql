-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own MPC wallets" ON mpc_wallets;
DROP POLICY IF EXISTS "Users can create their own MPC wallets" ON mpc_wallets;
DROP POLICY IF EXISTS "Users can insert their backend share" ON mpc_shares;
DROP POLICY IF EXISTS "Public read access for mpc_wallets" ON mpc_wallets;
DROP POLICY IF EXISTS "Public insert access for mpc_wallets" ON mpc_wallets;
DROP POLICY IF EXISTS "Public insert access for mpc_shares" ON mpc_shares;

-- Recreate with public access
CREATE POLICY "Public read access for mpc_wallets"
ON mpc_wallets FOR SELECT
USING (true);

CREATE POLICY "Public insert access for mpc_wallets"
ON mpc_wallets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public insert access for mpc_shares"
ON mpc_shares FOR INSERT
WITH CHECK (true);
