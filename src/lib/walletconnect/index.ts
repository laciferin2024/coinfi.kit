// WalletConnect Web3Wallet integration for CoinFi
// Handles DApp connections and routes transactions through AI Guard

import { Core } from '@walletconnect/core';
import { Web3Wallet, type Web3WalletTypes } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { writable, get } from 'svelte/store';
import { PUBLIC_WALLETCONNECT_PROJECT_ID } from '$env/static/public';
import { CHAINS } from '../../config/viem';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
const PROJECT_ID = PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Supported chains (Sepolia testnets)
const SUPPORTED_CHAINS = CHAINS.map(chain => `eip155:${chain.id}`);

const SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
];

const SUPPORTED_EVENTS = [
  'accountsChanged',
  'chainChanged',
];

// Store for WalletConnect state
export interface WCSession {
  topic: string;
  peer: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  expiry: number;
}

export interface WCPendingRequest {
  id: number;
  topic: string;
  method: string;
  params: any;
  peer: WCSession['peer'];
}

interface WCState {
  initialized: boolean;
  sessions: WCSession[];
  pendingProposal: Web3WalletTypes.SessionProposal | null;
  pendingRequest: WCPendingRequest | null;
}

export const wcStore = writable<WCState>({
  initialized: false,
  sessions: [],
  pendingProposal: null,
  pendingRequest: null,
});

let web3wallet: InstanceType<typeof Web3Wallet> | null = null;
let walletAddress: string | null = null;

// Initialize WalletConnect
export async function initWalletConnect(address: string): Promise<boolean> {
  if (web3wallet) {
    walletAddress = address;
    return true;
  }

  try {
    const core = new Core({
      projectId: PROJECT_ID,
    });

    web3wallet = await Web3Wallet.init({
      core: core as any, // Type assertion for SDK compatibility
      metadata: {
        name: 'CoinFi Wallet',
        description: 'AI-Guarded Self-Custody Wallet',
        url: 'https://coinfi.app',
        icons: ['https://coinfi.app/icon.png'],
      },
    });

    walletAddress = address;

    // Setup event listeners
    web3wallet.on('session_proposal', handleSessionProposal);
    web3wallet.on('session_request', handleSessionRequest);
    web3wallet.on('session_delete', handleSessionDelete);

    // Load existing sessions
    const sessions = web3wallet.getActiveSessions();
    const sessionList: WCSession[] = Object.values(sessions).map(s => ({
      topic: s.topic,
      peer: s.peer.metadata,
      expiry: s.expiry,
    }));

    wcStore.update(s => ({
      ...s,
      initialized: true,
      sessions: sessionList,
    }));

    console.log('[WalletConnect] Initialized with', sessionList.length, 'active sessions');
    return true;
  } catch (error) {
    console.error('[WalletConnect] Init failed:', error);
    return false;
  }
}

// Pair with a DApp using WC URI
export async function pairWithUri(uri: string): Promise<boolean> {
  if (!web3wallet) {
    console.error('[WalletConnect] Not initialized');
    return false;
  }

  try {
    await web3wallet.core.pairing.pair({ uri });
    console.log('[WalletConnect] Pairing initiated');
    return true;
  } catch (error) {
    console.error('[WalletConnect] Pairing failed:', error);
    return false;
  }
}

// Handle session proposal from DApp
async function handleSessionProposal(proposal: Web3WalletTypes.SessionProposal) {
  console.log('[WalletConnect] Session proposal from:', proposal.params.proposer.metadata.name);

  // Store proposal for user approval
  wcStore.update(s => ({
    ...s,
    pendingProposal: proposal,
  }));
}

// Approve session proposal
export async function approveSession(): Promise<boolean> {
  const state = get(wcStore);
  if (!web3wallet || !state.pendingProposal || !walletAddress) {
    return false;
  }

  try {
    const proposal = state.pendingProposal;

    // Build approved namespaces
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        eip155: {
          chains: SUPPORTED_CHAINS,
          methods: SUPPORTED_METHODS,
          events: SUPPORTED_EVENTS,
          accounts: SUPPORTED_CHAINS.map(chain => `${chain}:${walletAddress}`),
        },
      },
    });

    const session = await web3wallet.approveSession({
      id: proposal.id,
      namespaces: approvedNamespaces,
    });

    // Update sessions list
    wcStore.update(s => ({
      ...s,
      pendingProposal: null,
      sessions: [...s.sessions, {
        topic: session.topic,
        peer: session.peer.metadata,
        expiry: session.expiry,
      }],
    }));

    console.log('[WalletConnect] Session approved:', session.topic);
    return true;
  } catch (error) {
    console.error('[WalletConnect] Approve failed:', error);
    wcStore.update(s => ({ ...s, pendingProposal: null }));
    return false;
  }
}

// Reject session proposal
export async function rejectSession(): Promise<void> {
  const state = get(wcStore);
  if (!web3wallet || !state.pendingProposal) return;

  try {
    await web3wallet.rejectSession({
      id: state.pendingProposal.id,
      reason: getSdkError('USER_REJECTED'),
    });
  } catch (error) {
    console.error('[WalletConnect] Reject failed:', error);
  }

  wcStore.update(s => ({ ...s, pendingProposal: null }));
}

// Handle session request (transaction, signing)
async function handleSessionRequest(event: Web3WalletTypes.SessionRequest) {
  const { id, topic, params } = event;
  const { request } = params;

  console.log('[WalletConnect] Request:', request.method, 'from topic:', topic);

  // Get session info for UI
  const sessions = web3wallet?.getActiveSessions() || {};
  const session = sessions[topic];

  // Store request for AI Guard processing
  wcStore.update(s => ({
    ...s,
    pendingRequest: {
      id,
      topic,
      method: request.method,
      params: request.params,
      peer: session?.peer.metadata || { name: 'Unknown', description: '', url: '', icons: [] },
    },
  }));
}

// Respond to session request (after AI Guard approval)
export async function respondToRequest(approved: boolean, result?: any): Promise<void> {
  const state = get(wcStore);
  if (!web3wallet || !state.pendingRequest) return;

  const { id, topic } = state.pendingRequest;

  try {
    if (approved && result !== undefined) {
      await web3wallet.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          result,
        },
      });
      console.log('[WalletConnect] Request approved:', id);
    } else {
      await web3wallet.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: getSdkError('USER_REJECTED'),
        },
      });
      console.log('[WalletConnect] Request rejected:', id);
    }
  } catch (error) {
    console.error('[WalletConnect] Response failed:', error);
  }

  wcStore.update(s => ({ ...s, pendingRequest: null }));
}

// Handle session deletion
function handleSessionDelete(event: { topic: string }) {
  console.log('[WalletConnect] Session deleted:', event.topic);

  wcStore.update(s => ({
    ...s,
    sessions: s.sessions.filter(session => session.topic !== event.topic),
  }));
}

// Disconnect a session
export async function disconnectSession(topic: string): Promise<void> {
  if (!web3wallet) return;

  try {
    await web3wallet.disconnectSession({
      topic,
      reason: getSdkError('USER_DISCONNECTED'),
    });

    wcStore.update(s => ({
      ...s,
      sessions: s.sessions.filter(session => session.topic !== topic),
    }));
  } catch (error) {
    console.error('[WalletConnect] Disconnect failed:', error);
  }
}

// Get current address
export function getWalletAddress(): string | null {
  return walletAddress;
}
