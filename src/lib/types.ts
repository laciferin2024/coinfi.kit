// Shared TypeScript types for Coin OS Wallet

export interface Network {
  id: string;
  name: string;
  icon: string;
  color: string;
  chainId: number;
  rpcUrl?: string;
  isCustom?: boolean;
}

export interface TokenAsset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  priceUsd?: number;
  totalValueUsd: number;
  network?: string;
  address?: string;
  isCustom?: boolean;
}

export interface NFTAsset {
  id: string;
  name: string;
  collection: string;
  image: string;
  network: string;
  contractAddress: string;
  tokenId: string;
}

export interface Activity {
  id: string;
  hash?: string;
  type: 'send' | 'receive' | 'swap';
  amount: string;
  symbol: string;
  address: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  network: string;
  chainId: number;
  explorerUrl?: string;
}

export interface Contact {
  name: string;
  address: string;
  initials: string;
}

export interface DAppSession {
  sessionId: string;
  id: string;
  name: string;
  icon: string;
  domain: string;
  lastUsed: number;
}

export interface CustomDApp {
  name: string;
  icon: string;
  url: string;
  domain: string;
}

export type TransactionStatus = 'idle' | 'input' | 'simulating' | 'ready' | 'signing' | 'success';

export interface ExternalRequest {
  id: string;
  type: 'eth_sendTransaction' | 'eth_sign' | 'personal_sign' | 'eth_signTypedData' | 'eth_signTypedData_v4' | 'session_proposal';
  payload: unknown;
  origin: string;
}

export interface Protocol {
  id: string;
  name: string;
  category: string;
  icon: string;
  users: string;
  verified: boolean;
  desc: string;
  networks: string[];
  auditStatus: 'safe' | 'caution' | 'danger' | 'unknown';
  url: string;
  domain: string;
}
