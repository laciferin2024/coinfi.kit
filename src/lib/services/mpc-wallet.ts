import { P1KeyGen, P2KeyGen, P1Signature } from "@silencelaboratories/ecdsa-tss";
import { computeAddress } from "ethers";

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
    const m2 = await p2kg.processMessage(JSON.stringify(m1));

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
      deviceShare: JSON.stringify(m3.p1_key_share),
      backendShare: JSON.stringify(m4.p2_key_share),
      publicKey,
      address
    };
  }

  /**
   * Signs a message (hash) using the 3-round MPC protocol.
   */
  async sign(messageHash: string, deviceShare: string, walletId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const parsedShare = JSON.parse(deviceShare);

    // P1Signature expects the share object
    const p1sig = new P1Signature(sessionId, parsedShare, messageHash);

    // Round 1 (Client)
    const m1 = await p1sig.processMessage(null);

    // Round 2 (Server)
    const response = await fetch(`${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/mpc-sign`, {
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
}

export const mpcWallet = new MPCWalletService();
