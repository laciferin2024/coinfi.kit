# MPC Wallet Architecture

## Overview
The CoinFi MPC Wallet uses a **2-of-2 Threshold Signature Scheme (TSS)** based on ECDSA. This ensures that the private key never exists in a single location, providing significantly higher security than traditional private key wallets.

## Core Components

### 1. Threshold Signature Scheme (TSS)
- **Protocol**: 2-of-2 ECDSA (Silence Laboratories / GG18/GG20-like variant).
- **Parties**:
    - **P1 (User Device)**: Holds the device share.
    - **P2 (Supabase Backend)**: Holds the server share.
- **Signing**: Requires both P1 and P2 to participate. Neither can sign alone.

### 2. Share Management
- **Device Share (P1)**:
    - Generated on the client-side.
    - Stored in `localStorage` (encrypted).
    - **Backup**: Automatically backed up to the user's hidden Google Drive `appDataFolder`.
- **Backend Share (P2)**:
    - Generated on the client-side during the setup ceremony.
    - Transmitted securely to Supabase.
    - Stored in the `mpc_shares` table, protected by Row Level Security (RLS).

### 3. Signing Flow
The signing process is interactive and consists of multiple rounds:
1.  **Initiation**: Client (P1) requests a signature and generates a commitment.
2.  **Server Participation (Round 2)**: The Supabase Edge Function (`mpc-sign`) retrieves the backend share and computes the P2 signature share/message using the client's commitment.
3.  **Finalization (Round 3)**: The client receives the P2 message and computes the final ECDSA signature.

## Security Model
- **Non-Custodial**: CoinFi does not have access to the user's Google Drive backup, meaning we cannot reconstruct the private key without the user's device share.
- **Key Isolation**: The full private key is never reconstructed during signing.
- **Backup**: The Google Drive backup protects against device loss.

## Implementation Details

### Files
- **Service**: [`src/lib/services/mpc-wallet.ts`](../src/lib/services/mpc-wallet.ts) - Core MPC logic.
- **Backup**: [`src/lib/services/google-drive.ts`](../src/lib/services/google-drive.ts) - Google Drive integration.
- **Backend**: 
    - Schema: [`supabase/migrations/20260128000000_mpc_setup.sql`](../supabase/migrations/20260128000000_mpc_setup.sql)
    - Edge Function: [`supabase/functions/mpc-sign/index.ts`](../supabase/functions/mpc-sign/index.ts)

### Environment Variables
Required in `.env`:
```env
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
PUBLIC_GOOGLE_CLIENT_ID=...
```
