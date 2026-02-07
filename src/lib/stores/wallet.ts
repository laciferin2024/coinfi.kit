import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { Porto } from 'porto';
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

export const ACTIVE_NETWORK: Network & { rpcUrl: string } = {
  id: 'optimism-sepolia',
  name: 'Optimism Sepolia',
  icon: '🛡️',
  color: '#FF0420',
  chainId: 11155420,
  rpcUrl: 'https://sepolia.optimism.io'
};

export const NETWORKS: (Network & { rpcUrl?: string })[] = [
  ACTIVE_NETWORK,
  { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', icon: '⟠', color: '#627EEA', chainId: 11155111, rpcUrl: 'https://rpc.sepolia.org' },
  { id: 'base-sepolia', name: 'Base Sepolia', icon: '🔵', color: '#0052FF', chainId: 84532, rpcUrl: 'https://sepolia.base.org' },
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
  isLocked: boolean;
  isHyperMode: boolean;
  isOnboarded: boolean;
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
  recentDapps: Array<{ id: string; lastUsed: number }>;
  connectedDapps: DAppSession[];
  activeBrowserDAppId: string | null;
  activeCustomDApp: CustomDApp | null;
  externalRequest: ExternalRequest | null;
}

// Initial state
function createInitialState(): WalletState {
  return {
    version: '3.1.0',
    address: safeGetItem('wallet_address'),
    ensName: null,
    isLocked: true,
    isHyperMode: safeGetItem('wallet_hyper_mode') === 'true',
    isOnboarded: safeGetItem('wallet_onboarded_status') === 'true',
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
    recentDapps: safeGetJSON<Array<{ id: string; lastUsed: number }>>('wallet_recent_dapps', []),
    connectedDapps: safeGetJSON<DAppSession[]>('wallet_connected_dapps', []),
    activeBrowserDAppId: null,
    activeCustomDApp: null,
    externalRequest: null,
  };
}

// Create the store
function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>(createInitialState());

  return {
    subscribe,

    // Porto Connection
    connectPorto: async () => {
      try {
        console.log('[Store] Initializing Porto...');
        const porto = Porto.create();
        console.log('[Store] Requesting accounts...');
        const accounts = await porto.provider.request({ method: 'eth_requestAccounts' });
        console.log('[Store] Accounts received:', accounts);

        if (accounts && accounts.length > 0) {
          const address = accounts[0];

          if (browser) {
            localStorage.setItem('wallet_address', address);
            localStorage.setItem('wallet_onboarded_status', 'true');
          }

          update(s => ({
            ...s,
            address,
            isOnboarded: true,
            isLocked: false,
            lastActive: new Date()
          }));
          return { success: true, address };
        }
        console.warn('[Store] No accounts returned from Porto');
        return { success: false, error: 'No accounts returned' };
      } catch (e: any) {
        console.error('[Store] Porto connection failed:', e);
        // Safely extract error message
        const errorMessage = e?.message || e?.toString() || 'Unknown error';
        return { success: false, error: errorMessage };
      }
    },

    // Reset
    resetOnboarding: () => {
      if (browser) {
        localStorage.clear();
        window.location.href = '/';
      }
    },

    // Restore Connection
    restoreConnection: async () => {
      if (!browser || safeGetItem('wallet_onboarded_status') !== 'true') return;

      // Check if we already have an address in the store (loaded from localStorage)
      // If we do, we assume the session is valid or at least we don't need to re-request immediately
      // to avoid loops.
      const currentAddress = safeGetItem('wallet_address');
      if (currentAddress) {
        update(s => ({
          ...s,
          address: currentAddress,
          isOnboarded: true,
          isLocked: false, // Unlock on restore
          lastActive: new Date()
        }));
        return true;
      }

      try {
        const porto = Porto.create();
        // Check if we can get accounts without prompting (session exists)
        // eth_requestAccounts might prompt, but if authorized, it returns immediately.
        // For a true "check session" we might need a different method if Porto supports it, 
        // but typically requestAccounts handles re-connection if the session is alive.
        const accounts = await porto.provider.request({ method: 'eth_requestAccounts' });

        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          update(s => ({
            ...s,
            address,
            isOnboarded: true,
            isLocked: false, // Unlock on restore for convenience
            lastActive: new Date()
          }));
          console.log('[Store] Porto connection restored:', address);
          return true;
        }
      } catch (e) {
        console.log('[Store] Failed to restore Porto connection:', e);
      }
      return false;
    },

    // Lock/Unlock
    setLocked: (locked: boolean) => {
      if (locked) {
        update(s => ({
          ...s,
          isLocked: true,
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
      // Simple unlock for now, as Porto handles auth
      const storedAddress = safeGetItem('wallet_address');
      if (storedAddress) {
        update(s => ({ ...s, isLocked: false, lastActive: new Date() }));
        return true;
      }
      return false;
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

    // Custom networks
    addCustomNetwork: (network: Network) => {
      update(s => {
        const updated = [...s.customNetworks, { ...network, isCustom: true }];
        safeSetJSON('wallet_custom_networks', updated);
        return { ...s, customNetworks: updated };
      });
    },

    updateActivity: () => update(s => ({ ...s, lastActive: new Date() })),
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
