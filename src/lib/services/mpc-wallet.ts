import { P1KeyGen, P2KeyGen, P1Signature } from "@silencelaboratories/ecdsa-tss";
import { P1KeyShare } from "@silencelaboratories/ecdsa-tss/lib/esm/ecdsa/P1KeyShare";
import { P2KeyShare } from "@silencelaboratories/ecdsa-tss/lib/esm/ecdsa/P2KeyShare";


import { computeAddress, getBytes } from "ethers";

import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export interface MPCShares {
  deviceShare: string;
  backendShare: string;
  publicKey: string;
  address: string;
}

export class MPCWalletService {
  /**
   * Generates a 2-of-2 MPC wallet.
   * Performs 4 rounds of communication between P1 (client) and P2 (simulated/server).
   */
  async generateWallet(): Promise<MPCShares> {
    const sessionId = crypto.randomUUID();
    const p1kg = new P1KeyGen(sessionId);
    const p2kg = new P2KeyGen(sessionId);

    // Only P1 needs init for Paillier key generation
    await p1kg.init();

    // Round 1
    const m1 = await p1kg.getKeyGenMessage1();

    // Round 2
    // Use the library's built-in serialization
    const m2 = await p2kg.processMessage(m1.toStr());

    // Round 3
    const m3 = await p1kg.processMessage(m2.msg_to_send!);

    // Round 4
    const m4 = await p2kg.processMessage(m3.msg_to_send!);

    if (!m3.p1_key_share || !m4.p2_key_share) {
      throw new Error("Key generation failed to produce shares");
    }

    const publicKey = m3.p1_key_share.public_key;
    const address = computeAddress("0x" + publicKey);

    return {
      deviceShare: P1KeyShare.fromObj(m3.p1_key_share).toStr(),
      backendShare: P2KeyShare.fromObj(m4.p2_key_share).toStr(),
      publicKey,
      address
    };
  }

  /**
   * Signs a message (hash) using the 3-round MPC protocol.
   */
  async sign(messageHash: string, deviceShare: string, walletId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    // Use the library's fromStr to reconstruct the share object
    const share = P1KeyShare.fromStr(deviceShare);

    // Convert messageHash string to Uint8Array
    const messageHashBytes = getBytes(messageHash);
    // P1Signature constructor expects (sessionId, messageHash: Uint8Array, p1KeyShareObj: IP1KeyShare)
    const p1sig = new P1Signature(sessionId, messageHashBytes, share.toObj());


    // Round 1 (Client)
    const m1 = await p1sig.processMessage(null);

    // Round 2 (Server)
    const response = await fetch(`${PUBLIC_SUPABASE_URL}/functions/v1/mpc-sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("sb-access-token")}`
      },
      body: JSON.stringify({
        walletId,
        messageHash,
        p1Message: m1.msg_to_send
      })
    });

    if (!response.ok) throw new Error("Backend MPC signing failed");
    const { p2Message } = await response.json();

    // Round 3 (Client)
    const m3 = await p1sig.processMessage(p2Message);

    if (!m3.signature) throw new Error("MPC Signing failed");
    return m3.signature;
  }

  /**
   * Signs a text message using MPC (for ownership proofs, etc.)
   * This version doesn't call the backend, it uses both shares locally
   */
  async signMessage(message: string, deviceShareStr: string, backendShareStr: string): Promise<string> {
    const sessionId = crypto.randomUUID();

    // Hash the message (EIP-191 personal sign format)
    const { hashMessage } = await import('ethers');
    const messageHash = hashMessage(message);
    const messageHashBytes = getBytes(messageHash);

    // Reconstruct shares
    const p1Share = P1KeyShare.fromStr(deviceShareStr);
    const p2Share = P2KeyShare.fromStr(backendShareStr);

    // P1 side
    const p1sig = new P1Signature(sessionId, messageHashBytes, p1Share.toObj());

    // Round 1
    const m1 = await p1sig.processMessage(null);

    // P2 side (simulated locally since we have both shares temporarily)
    const { P2Signature } = await import('@silencelaboratories/ecdsa-tss');
    const p2sig = new P2Signature(sessionId, messageHashBytes, p2Share.toObj());
    const m2 = await p2sig.processMessage(m1.msg_to_send!);

    // Round 3
    const m3 = await p1sig.processMessage(m2.msg_to_send!);

    if (!m3.signature) throw new Error("Message signing failed");
    return m3.signature;
  }
}

export const mpcWallet = new MPCWalletService();
