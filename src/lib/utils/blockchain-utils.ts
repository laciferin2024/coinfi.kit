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
    const totalNativeUsd = nativeTokens.reduce((sum, t) => sum + t.totalValueUsd, 0);

    return {
      native: nativeTokens.find(t => t.network === 'Optimism Sepolia')?.balance || '0.00', // Default to OpSepolia
      usdc: '0.00', // No longer using mock USDC
      totalUsd: totalNativeUsd,
      tokens: nativeTokens
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

// Explorer API mapping
const EXPLORER_APIS: Record<string, string> = {
  'optimism-sepolia': 'https://api-sepolia-optimism.etherscan.io/api',
  'base-sepolia': 'https://api-sepolia.basescan.org/api',
  'ethereum-sepolia': 'https://api-sepolia.etherscan.io/api'
};

// Fetch transaction history
export async function fetchTransactionHistory(
  address: string,
  networkId: string
): Promise<Activity[]> {
  const apiUrl = EXPLORER_APIS[networkId];

  // If network not supported or 'all', we might return empty or try to aggregate (simplification: return empty for 'all')
  if (!apiUrl) {
    return [];
  }

  try {
    // Etherscan-compatible API call
    const response = await fetch(`${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc`);
    const data = await response.json();

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((tx: any) => ({
        id: tx.hash,
        hash: tx.hash,
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
        amount: formatEther(BigInt(tx.value)),
        symbol: 'ETH', // Simplified, assumes native token
        address: tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from,
        timestamp: parseInt(tx.timeStamp) * 1000,
        status: tx.isError === '0' ? 'completed' : 'failed',
        network: getNetworkNameFromId(networkId),
        chainId: getChainIdFromNetworkId(networkId),
        explorerUrl: getExplorerUrl(networkId, tx.hash)
      }));
    }

    return [];
  } catch (error) {
    console.error(`[Blockchain] Failed to fetch history for ${networkId}:`, error);
    return [];
  }
}

function getExplorerUrl(networkId: string, hash: string): string {
  const baseUrls: Record<string, string> = {
    'optimism-sepolia': 'https://sepolia-optimism.etherscan.io',
    'base-sepolia': 'https://sepolia.basescan.org',
    'ethereum-sepolia': 'https://sepolia.etherscan.io'
  };
  const baseUrl = baseUrls[networkId];
  return baseUrl ? `${baseUrl}/tx/${hash}` : '#';
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
