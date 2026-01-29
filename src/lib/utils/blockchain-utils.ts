// Blockchain utility functions for CoinFi Wallet
import type { TokenAsset, Activity } from '$lib/types';

// Fetch token balances for an address
export async function fetchBalances(address: string, chainId: number): Promise<{
  native: string;
  usdc: string;
  totalUsd: number;
  tokens: TokenAsset[];
} | null> {
  try {
    // For demo purposes, return mock data
    // In production, this would call an API like Alchemy, Moralis, or custom backend
    const mockTokens: TokenAsset[] = [
      {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        icon: '⟠',
        balance: '0.05',
        priceUsd: 2500,
        totalValueUsd: 125,
        network: getNetworkName(chainId)
      },
      {
        id: 'usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        icon: '💵',
        balance: '100.00',
        priceUsd: 1,
        totalValueUsd: 100,
        network: getNetworkName(chainId)
      }
    ];

    return {
      native: '0.05',
      usdc: '100.00',
      totalUsd: 225,
      tokens: mockTokens
    };
  } catch (error) {
    console.error('[Blockchain] Failed to fetch balances:', error);
    return null;
  }
}

// Lookup ENS name for an address
export async function lookupAddressEns(address: string): Promise<string | null> {
  try {
    // For testnets, ENS is not typically available
    // In production on mainnet, this would use ethers provider.lookupAddress()
    return null;
  } catch (error) {
    console.error('[Blockchain] ENS lookup failed:', error);
    return null;
  }
}

// Fetch transaction history
export async function fetchTransactionHistory(
  address: string,
  networkId: string
): Promise<Activity[]> {
  try {
    // For demo purposes, return mock data
    // In production, this would call an explorer API like Etherscan
    const now = Date.now();
    const mockActivities: Activity[] = [
      {
        id: `tx-${now}-1`,
        hash: '0x1234...abcd',
        type: 'receive',
        amount: '0.01',
        symbol: 'ETH',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        timestamp: now - 86400000, // 1 day ago
        status: 'completed',
        network: getNetworkNameFromId(networkId),
        chainId: getChainIdFromNetworkId(networkId),
        explorerUrl: `https://sepolia-optimism.etherscan.io/tx/0x1234`
      }
    ];
    return mockActivities;
  } catch (error) {
    console.error('[Blockchain] Failed to fetch history:', error);
    return [];
  }
}

// Helper functions
function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    11155420: 'Optimism Sepolia',
    11155111: 'Ethereum Sepolia',
    84532: 'Base Sepolia',
    1: 'Ethereum',
    10: 'Optimism',
    137: 'Polygon',
    8453: 'Base'
  };
  return networks[chainId] || 'Unknown';
}

function getNetworkNameFromId(networkId: string): string {
  const networks: Record<string, string> = {
    'optimism-sepolia': 'Optimism Sepolia',
    'ethereum-sepolia': 'Ethereum Sepolia',
    'base-sepolia': 'Base Sepolia',
    'all': 'All Networks'
  };
  return networks[networkId] || 'Unknown';
}

function getChainIdFromNetworkId(networkId: string): number {
  const chains: Record<string, number> = {
    'optimism-sepolia': 11155420,
    'ethereum-sepolia': 11155111,
    'base-sepolia': 84532
  };
  return chains[networkId] || 11155420;
}
