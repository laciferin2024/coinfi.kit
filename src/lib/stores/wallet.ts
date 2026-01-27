import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface WalletState {
  address: string | null;
  isOnboarded: boolean;
  isLocked: boolean;
  tempWallet?: {
    address: string;
    privateKey: string;
  };
  generateTempWallet: boolean;
  commitOnboarding: boolean;
  saveCloudBackup: boolean;
  unlockWallet: boolean;
  restoreFromCloud: boolean;
}

const initialState: WalletState = {
  address: null,
  isOnboarded: false,
  isLocked: true,
  generateTempWallet: false,
  commitOnboarding: false,
  saveCloudBackup: false,
  unlockWallet: false,
  restoreFromCloud: false,
};

function createWalletStore() {
  const { subscribe, set, update }: Writable<WalletState> = writable(initialState);

  return {
    subscribe,
    setAddress: (address: string | null) => update(state => ({ ...state, address })),
    setOnboarded: (isOnboarded: boolean) => update(state => ({ ...state, isOnboarded })),
    setLocked: (isLocked: boolean) => update(state => ({ ...state, isLocked })),
    setTempWallet: (tempWallet: { address: string; privateKey: string } | undefined) => 
      update(state => ({ ...state, tempWallet })),
    setGenerateTempWallet: (generateTempWallet: boolean) => 
      update(state => ({ ...state, generateTempWallet })),
    setCommitOnboarding: (commitOnboarding: boolean) => 
      update(state => ({ ...state, commitOnboarding })),
    setSaveCloudBackup: (saveCloudBackup: boolean) => 
      update(state => ({ ...state, saveCloudBackup })),
    setUnlockWallet: (unlockWallet: boolean) => 
      update(state => ({ ...state, unlockWallet })),
    setRestoreFromCloud: (restoreFromCloud: boolean) => 
      update(state => ({ ...state, restoreFromCloud })),
    reset: () => set(initialState),
  };
}

export const walletStore = createWalletStore();
