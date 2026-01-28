-- Add ownership_proof column to verify wallet ownership
ALTER TABLE mpc_wallets ADD COLUMN IF NOT EXISTS ownership_proof TEXT;

-- Create function to verify ECDSA signature (simplified - actual verification would use pgcrypto or external)
-- For now, we just check that ownership_proof exists and is non-empty
-- In production, you'd verify the signature matches the public_key
CREATE OR REPLACE FUNCTION verify_mpc_wallet_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic validation: ownership proof must exist
  IF NEW.ownership_proof IS NULL OR NEW.ownership_proof = '' THEN
    RAISE EXCEPTION 'Ownership proof signature required';
  END IF;
  
  -- TODO: In production, verify signature using:
  -- 1. Recover signer address from signature + message hash
  -- 2. Compare recovered address with NEW.address
  -- 3. Reject if mismatch
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to verify ownership on insert
DROP TRIGGER IF EXISTS verify_ownership ON mpc_wallets;
CREATE TRIGGER verify_ownership
  BEFORE INSERT ON mpc_wallets
  FOR EACH ROW
  EXECUTE FUNCTION verify_mpc_wallet_ownership();
