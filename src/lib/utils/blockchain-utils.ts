// Blockchain utility functions for Coin OS Wallet
import type { TokenAsset, Activity } from '$lib/types';
import { createPublicClient, http, formatEther } from 'viem';
import { optimismSepolia, baseSepolia, sepolia } from 'viem/chains';

// Define supported chains with their network names matching wallet.ts
const SUPPORTED_CHAINS = [
  { chain: optimismSepolia, name: 'Optimism Sepolia', id: 'optimism-sepolia' },
  { chain: baseSepolia, name: 'Base Sepolia', id: 'base-sepolia' },
  { chain: sepolia, name: 'Ethereum Sepolia', id: 'ethereum-sepolia' }
];

// Fetch token balances for an address
export async function fetchBalances(address: string): Promise<{
  native: string;
  usdc: string;
  totalUsd: number;
  tokens: TokenAsset[];
} | null> {
  try {
    // 1. Fetch Native Balances in parallel
    const balancePromises = SUPPORTED_CHAINS.map(async (chainConfig) => {
      try {
        const client = createPublicClient({
          chain: chainConfig.chain,
          transport: http()
        });

        const balance = await client.getBalance({ address: address as `0x${string}` });
        const formattedBalance = formatEther(balance);

        // Mock ETH Price for demo (approximate)
        const ethPrice = 2500;
        const totalValue = parseFloat(formattedBalance) * ethPrice;

        return {
          id: `eth-${chainConfig.id}`,
          symbol: chainConfig.chain.nativeCurrency.symbol,
          name: chainConfig.chain.nativeCurrency.name,
          icon: '⟠', // specific icons can be mapped if needed
          balance: formattedBalance,
          priceUsd: ethPrice,
          totalValueUsd: totalValue,
          network: chainConfig.name
        } as TokenAsset;
      } catch (err) {
        console.error(`[Blockchain] Failed to fetch balance for ${chainConfig.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(balancePromises);
    const nativeTokens = results.filter((t): t is TokenAsset => t !== null);

    // Calculate totals
    // Note: 'native' and 'usdc' fields in the return object are simplified/legacy summaries.
    // We'll use the total value of all native tokens for 'native' (as a string? simplistic), 
    // or just the primary network's balance? 
    // Let's sum up total USD value of native tokens.
    const totalNativeUsd = nativeTokens.reduce((sum, t) => sum + t.totalValueUsd, 0);

    // Mock USDC (keep existing mock for now as requested)
    const mockUsdc: TokenAsset = {
      id: 'usdc-optimism-sepolia',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '💵',
      balance: '100.00',
      priceUsd: 1,
      totalValueUsd: 100,
      network: 'Optimism Sepolia'
    };

    return {
      native: nativeTokens.find(t => t.network === 'Optimism Sepolia')?.balance || '0.00', // Default to OpSepolia for summary
      usdc: '100.00',
      totalUsd: totalNativeUsd + 100, // Native + Mock USDC
      tokens: [...nativeTokens, mockUsdc]
    };
  } catch (error) {
    console.error('[Blockchain] Failed to fetch balances:', error);
    return null;
  }
}

// Lookup ENS name for an address
export async function lookupAddressEns(address: string): Promise<string | null> {
  try {
    const client = createPublicClient({
      chain: sepolia, // ENS is on Mainnet usually, but we can try Sepolia
      transport: http()
    });
    // For specific ENS on mainnet we'd need mainnet client.
    // Leaving as null/todo for now unless strictly required.
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
