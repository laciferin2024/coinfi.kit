import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type {
  Network,
  TokenAsset,
  NFTAsset,
  Activity,
  Contact,
  DAppSession,
  CustomDApp,
  TransactionStatus,
  ExternalRequest
} from '$lib/types';

// Network Constants
export const GLOBAL_NETWORK: Network = {
  id: 'all',
  name: 'All Networks',
  icon: '🌐',
  color: '#F97316',
  chainId: 0
};

export const ACTIVE_NETWORK: Network = {
  id: 'optimism-sepolia',
  name: 'Optimism Sepolia',
  icon: '🛡️',
  color: '#FF0420',
  chainId: 11155420
};

export const NETWORKS: Network[] = [
  ACTIVE_NETWORK,
  { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', icon: '⟠', color: '#627EEA', chainId: 11155111 },
  { id: 'base-sepolia', name: 'Base Sepolia', icon: '🔵', color: '#0052FF', chainId: 84532 },
];

const DEFAULT_CONTACTS: Contact[] = [
  { name: 'Vitalik.eth', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', initials: 'VB' },
];

// LocalStorage helpers
function safeGetItem(key: string): string | null {
  if (!browser) return null;
  return localStorage.getItem(key);
}

function safeGetJSON<T>(key: string, defaultValue: T): T {
  if (!browser) return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function safeSetItem(key: string, value: string): void {
  if (browser) localStorage.setItem(key, value);
}

function safeSetJSON(key: string, value: unknown): void {
  if (browser) localStorage.setItem(key, JSON.stringify(value));
}

// Wallet State Interface
export interface WalletState {
  version: string;
  address: string | null;
  ensName: string | null;
  privateKey: string | null;
  mnemonic: string | null;
  credentialId: string | null;
  isLocked: boolean;
  isHyperMode: boolean;
  isOnboarded: boolean;
  tempWallet: { address: string; privateKey: string; mnemonic: string } | null;
  activeNetworkId: string;
  customNetworks: Network[];
  nativeBalance: string;
  totalUsdValue: number;
  usdcBalance: string;
  tokens: TokenAsset[];
  nfts: NFTAsset[];
  txStatus: TransactionStatus;
  simulationLogs: Array<{ role: 'ai' | 'system'; content: string }>;
  activities: Activity[];
  contacts: Contact[];
  lastActive: Date;
  hasCloudBackup: boolean;
  backupData: string | null;
  lastBackupTimestamp: number | null;
  recentDapps: Array<{ id: string; lastUsed: number }>;
  connectedDapps: DAppSession[];
  activeBrowserDAppId: string | null;
  activeCustomDApp: CustomDApp | null;
  externalRequest: ExternalRequest | null;
  isMPC: boolean;
  deviceShare: string | null;
  mpcWalletId: string | null;
}

// Initial state
function createInitialState(): WalletState {
  return {
    version: '2.9.5',
    address: safeGetItem('wallet_address'),
    ensName: null,
    privateKey: null,
    mnemonic: null,
    credentialId: safeGetItem('wallet_credential_id'),
    isLocked: true,
    isHyperMode: safeGetItem('wallet_hyper_mode') === 'true',
    isOnboarded: safeGetItem('wallet_onboarded_status') === 'true',
    tempWallet: null,
    activeNetworkId: safeGetItem('wallet_active_network_id') || GLOBAL_NETWORK.id,
    customNetworks: safeGetJSON<Network[]>('wallet_custom_networks', []),
    nativeBalance: '0.00',
    usdcBalance: '0.00',
    totalUsdValue: 0,
    tokens: [],
    nfts: [],
    txStatus: 'idle',
    simulationLogs: [],
    activities: safeGetJSON<Activity[]>('wallet_activities', []),
    contacts: safeGetJSON<Contact[]>('wallet_contacts', DEFAULT_CONTACTS),
    lastActive: new Date(),
    hasCloudBackup: safeGetItem('wallet_cloud_backup_active') === 'true',
    backupData: safeGetItem('wallet_backup_payload'),
    lastBackupTimestamp: safeGetItem('wallet_last_backup_time') ? parseInt(safeGetItem('wallet_last_backup_time')!) : null,
    recentDapps: safeGetJSON<Array<{ id: string; lastUsed: number }>>('wallet_recent_dapps', []),
    connectedDapps: safeGetJSON<DAppSession[]>('wallet_connected_dapps', []),
    activeBrowserDAppId: null,
    activeCustomDApp: null,
    externalRequest: null,
    isMPC: safeGetItem('wallet_is_mpc') === 'true',
    deviceShare: safeGetItem('wallet_device_share'),
    mpcWalletId: safeGetItem('wallet_mpc_id'),
  };
}

// Create the store
function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>(createInitialState());

  return {
    subscribe,

    // Wallet generation
    generateTempWallet: async () => {
      const { generateMnemonic, mnemonicToAccount, english } = await import('viem/accounts');
      const { toHex } = await import('viem');
      const mnemonic = generateMnemonic(english);
      const account = mnemonicToAccount(mnemonic);
      const hdKey = account.getHdKey();
      const privateKey = toHex(hdKey.privateKey!);
      update(s => ({
        ...s,
        tempWallet: {
          address: account.address,
          privateKey,
          mnemonic
        }
      }));
    },

    // Step 1: Prepare MPC (Identity Generation)
    // Returns shares but does NOT persist to localStorage/store yet
    // Step 1: Prepare MPC (Identity Generation)
    // Returns shares but does NOT persist to localStorage/store yet
    prepareMPCWallet: async (userId: string) => {
      try {
        const { mpcWallet } = await import('$lib/services/mpc-wallet');

        // 1. Generate local shares (performs multi-round internally)
        const shares = await mpcWallet.generateWallet();

        // Return raw shares to UI for confirmation step
        return { success: true, shares };
      } catch (e: any) {
        console.error('[Store] MPC Preparation failed:', e);
        return { success: false, error: e.message };
      }
    },

    // Step 2: Mandatory Backup
    completeMPCBackup: async (address: string, deviceShare: string) => {
      try {
        const { googleDriveService } = await import('$lib/services/google-drive');
        await googleDriveService.backupShare(address, deviceShare);
        return { success: true };
      } catch (e: any) {
        console.error('[Store] MPC Backup failed:', e);
        return { success: false, error: e.message };
      }
    },

    // Step 2.5: Sync to Backend (Supabase) with Ownership Proof
    syncMPCBackend: async (userId: string, address: string, publicKey: string, backendShare: string, deviceShare: string) => {
      try {
        const { supabase } = await import('$lib/services/supabase-client');
        const { mpcWallet } = await import('$lib/services/mpc-wallet');

        // 1. Generate ownership proof message
        const proofMessage = `CoinFi Wallet Ownership Proof\nAddress: ${address}\nTimestamp: ${Date.now()}`;

        // 2. Sign using MPC (both shares participate)
        console.log('[Store] Generating ownership proof signature...');
        const signature = await mpcWallet.signMessage(proofMessage, deviceShare, backendShare);

        if (!signature) {
          throw new Error('Failed to generate ownership proof signature');
        }

        // 3. Call Edge Function for cryptographically verified wallet creation
        const { data, error } = await supabase.functions.invoke('verify-wallet-ownership', {
          body: {
            userId,
            address,
            publicKey,
            backendShare,
            signature,
            message: proofMessage
          }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Verification failed');

        console.log('✓ Wallet ownership verified by backend:', data.message);
        return { success: true, walletId: data.walletId };
      } catch (e: any) {
        console.error('[Store] MPC Sync failed:', e);
        return { success: false, error: e.message };
      }
    },

    // Step 3: Commit and Persist (Finalize)
    commitMPCWallet: (shares: any, walletId: string, hasCloudBackup: boolean = true) => {
      if (browser) {
        localStorage.setItem('wallet_address', shares.address);
        localStorage.setItem('wallet_device_share', shares.deviceShare);
        localStorage.setItem('wallet_is_mpc', 'true');
        localStorage.setItem('wallet_mpc_id', walletId);
        localStorage.setItem('wallet_onboarded_status', 'true');
        localStorage.setItem('wallet_cloud_backup_active', String(hasCloudBackup));
      }

      update(s => ({
        ...s,
        address: shares.address,
        deviceShare: shares.deviceShare,
        mpcWalletId: walletId,
        isMPC: true,
        hasCloudBackup,
        isOnboarded: true,
        isLocked: false,
        lastActive: new Date()
      }));
    },

    // Legacy or backup-optional flow (kept for safety/testing)
    generateMPCWallet: async (userId: string) => {
      // Deprecated in favor of split flow, but kept logic for reference
      // ... existing implementation if needed ...
      return { success: false, error: "Use split flow" };
    },

    // Commit onboarding (Legacy/Temp wallet)
    commitOnboarding: async (passkeyId: string | null = null) => {
      const state = get({ subscribe });
      if (!state.tempWallet) return;

      safeSetItem('wallet_address', state.tempWallet.address);
      safeSetItem('wallet_onboarded_status', 'true');
      // Plaintext mnemonic is no longer persisted for security

      if (passkeyId) {
        safeSetItem('wallet_credential_id', passkeyId);
        safeSetItem('wallet_hyper_mode', 'true');
      } else {
        safeSetItem('wallet_hyper_mode', 'false');
      }

      update(s => ({
        ...s,
        address: s.tempWallet!.address,
        mnemonic: s.tempWallet!.mnemonic,
        credentialId: passkeyId,
        isOnboarded: true,
        isHyperMode: !!passkeyId,
        isLocked: false,
        tempWallet: null,
        lastActive: new Date()
      }));
    },

    // Reset
    resetOnboarding: () => {
      if (browser) {
        localStorage.clear();
        window.location.href = '/';
      }
    },

    // Lock/Unlock
    setLocked: (locked: boolean) => {
      if (locked) {
        update(s => ({
          ...s,
          isLocked: true,
          privateKey: null,
          mnemonic: null,
          ensName: null,
          txStatus: 'idle',
          simulationLogs: [],
          externalRequest: null
        }));
      } else {
        update(s => ({ ...s, isLocked: false, lastActive: new Date() }));
      }
    },

    unlockWallet: async (): Promise<boolean> => {
      const storedAddress = safeGetItem('wallet_address');
      // Legacy temp mnemonic is no longer supported/persisted
      const credId = safeGetItem('wallet_credential_id');
      const deviceKey = safeGetItem('wallet_device_key');

      if (!storedAddress) return false;

      try {
        // Try passkey authentication first if available
        if (credId && deviceKey) {
          const { authenticatePasskey, decryptPrivPayload } = await import('$lib/utils/crypto-utils');
          const result = await authenticatePasskey(credId);
          if (result.success && result.payloadB64) {
            const privateKeyHex = await decryptPrivPayload(deviceKey, result.payloadB64);
            update(s => ({
              ...s,
              privateKey: '0x' + privateKeyHex,
              isLocked: false,
              lastActive: new Date(),
              mnemonic: null
            }));
            return true;
          }
        }

        // Fall back to mnemonic is disabled as we don't persist it anymore
        // Only existing sessions with state.mnemonic or Passkey auth will work
        return false;
      } catch (e) {
        console.error('[Store] Unlock failed:', e);
        update(s => ({ ...s, privateKey: null, mnemonic: null, isLocked: true }));
        return false;
      }
    },

    // Setters
    setAddress: (address: string | null) => update(s => ({ ...s, address })),
    setEnsName: (ensName: string | null) => update(s => ({ ...s, ensName })),

    setHyperMode: (enabled: boolean) => {
      safeSetItem('wallet_hyper_mode', String(enabled));
      update(s => ({ ...s, isHyperMode: enabled }));
    },

    setActiveNetworkId: (networkId: string): boolean => {
      const state = get({ subscribe });
      const allAvailable = [GLOBAL_NETWORK, ...NETWORKS, ...state.customNetworks];
      const network = allAvailable.find(n => n.id === networkId);
      if (!network) return false;
      safeSetItem('wallet_active_network_id', networkId);
      update(s => ({ ...s, activeNetworkId: networkId }));
      return true;
    },

    // Portfolio
    updatePortfolio: (data: { native: string; usdc: string; totalUsd: number; tokens?: TokenAsset[]; nfts?: NFTAsset[] }) => {
      update(s => {
        const mergedTokens = [...s.tokens];
        if (data.tokens) {
          data.tokens.forEach(newToken => {
            const idx = mergedTokens.findIndex(t => t.id === newToken.id && t.network === newToken.network);
            if (idx >= 0) mergedTokens[idx] = newToken;
            else mergedTokens.push(newToken);
          });
        }
        const totalTokensValue = mergedTokens.reduce((sum, t) => sum + (Number.isFinite(t.totalValueUsd) ? t.totalValueUsd : 0), 0);
        return {
          ...s,
          nativeBalance: data.native,
          usdcBalance: data.usdc,
          totalUsdValue: totalTokensValue + (s.nfts.length * 500),
          tokens: mergedTokens,
          nfts: data.nfts || s.nfts
        };
      });
    },

    importToken: (token: TokenAsset) => update(s => ({ ...s, tokens: [...s.tokens, token] })),
    importNft: (nft: NFTAsset) => update(s => ({ ...s, nfts: [...s.nfts, nft] })),

    addCustomToken: (data: { symbol: string; name: string; icon: string; address: string; network: string; balance: string; totalValueUsd: number }) => {
      update(s => {
        // Check if token already exists
        const exists = s.tokens.some(t => t.address?.toLowerCase() === data.address.toLowerCase() && t.network === data.network);
        if (exists) return s;

        const newToken: TokenAsset = {
          id: `${data.symbol.toLowerCase()}-${data.network.toLowerCase().replace(' ', '-')}`,
          symbol: data.symbol,
          name: data.name,
          icon: data.icon,
          address: data.address,
          network: data.network,
          balance: data.balance,
          totalValueUsd: data.totalValueUsd,
          isCustom: true
        };
        return { ...s, tokens: [...s.tokens, newToken] };
      });
    },

    // Transaction status
    setTxStatus: (status: TransactionStatus) => update(s => ({ ...s, txStatus: status })),

    addSimulationLog: (log: { role: 'ai' | 'system'; content: string }) =>
      update(s => ({ ...s, simulationLogs: [...s.simulationLogs, log] })),

    clearSimulationLogs: () => update(s => ({ ...s, simulationLogs: [] })),

    // Activities
    addActivity: (activity: Activity) => {
      update(s => {
        const updated = [activity, ...s.activities.filter(a => a.id !== activity.id)];
        safeSetJSON('wallet_activities', updated);
        return { ...s, activities: updated };
      });
    },

    syncActivities: (newActivities: Activity[]) => {
      update(s => {
        if (!newActivities || newActivities.length === 0) return s;
        const existingIds = new Set(s.activities.map(a => a.id));
        const uniqueNew = newActivities.filter(a => !existingIds.has(a.id));
        if (uniqueNew.length === 0) return s;
        const updated = [...uniqueNew, ...s.activities].sort((a, b) => b.timestamp - a.timestamp);
        safeSetJSON('wallet_activities', updated);
        return { ...s, activities: updated };
      });
    },

    // Contacts
    addContact: (contact: Contact) => {
      update(s => {
        const updated = [...s.contacts.filter(c => c.address.toLowerCase() !== contact.address.toLowerCase()), contact];
        safeSetJSON('wallet_contacts', updated);
        return { ...s, contacts: updated };
      });
    },

    removeContact: (address: string) => {
      update(s => {
        const updated = s.contacts.filter(c => c.address.toLowerCase() !== address.toLowerCase());
        safeSetJSON('wallet_contacts', updated);
        return { ...s, contacts: updated };
      });
    },

    // DApps
    openDAppBrowser: (id: string) => {
      update(s => {
        const now = Date.now();
        const existing = s.recentDapps.filter(d => d.id !== id);
        const updatedRecents = [{ id, lastUsed: now }, ...existing].slice(0, 10);
        safeSetJSON('wallet_recent_dapps', updatedRecents);
        return { ...s, activeBrowserDAppId: id, recentDapps: updatedRecents, lastActive: new Date() };
      });
    },

    openCustomUrl: (url: string) => {
      let cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
      }
      let domain = 'custom-site';
      try {
        domain = new URL(cleanUrl).hostname;
      } catch { /* Fallback */ }

      const customDApp: CustomDApp = {
        name: domain.split('.')[0].toUpperCase(),
        icon: '🌐',
        url: cleanUrl,
        domain
      };
      update(s => ({ ...s, activeBrowserDAppId: 'custom', activeCustomDApp: customDApp, lastActive: new Date() }));
    },

    closeDAppBrowser: () => update(s => ({
      ...s,
      activeBrowserDAppId: null,
      activeCustomDApp: null,
      lastActive: new Date(),
      externalRequest: null
    })),

    connectDapp: (dappInfo: Omit<DAppSession, 'sessionId' | 'lastUsed'>) => {
      update(s => {
        const existing = s.connectedDapps.find(d => d.domain === dappInfo.domain);
        if (existing) return s;
        const newSession: DAppSession = {
          ...dappInfo,
          sessionId: crypto.randomUUID(),
          lastUsed: Date.now()
        };
        const updated = [newSession, ...s.connectedDapps];
        safeSetJSON('wallet_connected_dapps', updated);
        return { ...s, connectedDapps: updated, lastActive: new Date() };
      });
    },

    disconnectDapp: (sessionId: string) => {
      update(s => {
        const updated = s.connectedDapps.filter(d => d.sessionId !== sessionId);
        safeSetJSON('wallet_connected_dapps', updated);
        return { ...s, connectedDapps: updated, lastActive: new Date() };
      });
    },

    setExternalRequest: (req: ExternalRequest | null) => update(s => ({ ...s, externalRequest: req })),

    // Cloud backup (simplified)
    saveCloudBackup: async () => {
      const state = get({ subscribe });
      const mnemonicStr = state.mnemonic || '';
      if (!mnemonicStr || mnemonicStr.trim().split(' ').length < 12) return;

      // Simplified: just store locally (real implementation would use cloud API)
      const now = Date.now();
      safeSetItem('coinfi_simulated_cloud_vault', mnemonicStr);
      safeSetItem('wallet_backup_payload', mnemonicStr);
      safeSetItem('wallet_cloud_backup_active', 'true');
      safeSetItem('wallet_last_backup_time', now.toString());
      update(s => ({ ...s, backupData: mnemonicStr, hasCloudBackup: true, lastBackupTimestamp: now }));
    },

    restoreFromCloud: async (payload: string): Promise<boolean> => {
      try {
        const { mnemonicToAccount } = await import('viem/accounts');
        const { toHex } = await import('viem');
        const account = mnemonicToAccount(payload);
        const hdKey = account.getHdKey();
        const privateKey = toHex(hdKey.privateKey!);
        safeSetItem('wallet_address', account.address);
        // Do not persist mnemonic
        safeSetItem('wallet_onboarded_status', 'true');
        safeSetItem('wallet_hyper_mode', 'false');
        update(s => ({
          ...s,
          address: account.address,
          mnemonic: payload,
          privateKey,
          tempWallet: { address: account.address, privateKey, mnemonic: payload },
          isOnboarded: true,
          isLocked: false,
          isHyperMode: false,
          lastActive: new Date()
        }));
        return true;
      } catch {
        return false;
      }
    },

    // Custom networks
    addCustomNetwork: (network: Network) => {
      update(s => {
        const updated = [...s.customNetworks, { ...network, isCustom: true }];
        safeSetJSON('wallet_custom_networks', updated);
        return { ...s, customNetworks: updated };
      });
    },

    updateActivity: () => update(s => ({ ...s, lastActive: new Date() })),

    checkCloudStatus: async () => {
      const state = get({ subscribe });
      if (!state.address) return;

      try {
        const { googleDriveService } = await import('$lib/services/google-drive');
        const share = await googleDriveService.restoreShare(state.address);
        if (share) {
          safeSetItem('wallet_cloud_backup_active', 'true');
          update(s => ({ ...s, hasCloudBackup: true }));
        }
      } catch (e) {
        console.debug('[Store] Cloud status check skipped or failed', e);
      }
    }
  };
}

export const walletStore = createWalletStore();

// Derived stores for common selections
export const activeNetwork = derived(walletStore, $store => {
  const allNetworks = [GLOBAL_NETWORK, ...NETWORKS, ...$store.customNetworks];
  return allNetworks.find(n => n.id === $store.activeNetworkId) || GLOBAL_NETWORK;
});

export const activeChainId = derived(activeNetwork, $network => $network.chainId || 11155420);

export const filteredTokens = derived(
  [walletStore, activeNetwork],
  ([$store, $network]) => {
    if ($store.activeNetworkId === 'all') return $store.tokens;
    return $store.tokens.filter(t => !t.network || t.network === $network.name);
  }
);

export const filteredNfts = derived(
  [walletStore, activeNetwork],
  ([$store, $network]) => {
    if ($store.activeNetworkId === 'all') return $store.nfts;
    return $store.nfts.filter(n => !n.network || n.network === $network.name);
  }
);

export const displayedTotalUsd = derived(
  [filteredTokens, filteredNfts],
  ([$tokens, $nfts]) => {
    const tokenVal = $tokens.reduce((sum, t) => sum + (Number.isFinite(t?.totalValueUsd) ? t.totalValueUsd : 0), 0);
    const nftVal = ($nfts?.length || 0) * 500;
    const total = tokenVal + nftVal;
    return Number.isFinite(total) ? total : 0;
  }
);

// Initialize backup check on load if address exists
if (browser) {
  const address = localStorage.getItem('wallet_address');
  if (address) {
    walletStore.checkCloudStatus();
  }
}
