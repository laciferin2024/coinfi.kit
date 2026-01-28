-- Remove foreign key constraint on user_id to allow anonymous MPC wallet creation
ALTER TABLE mpc_wallets DROP CONSTRAINT IF EXISTS mpc_wallets_user_id_fkey;
