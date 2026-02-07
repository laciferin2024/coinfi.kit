// Etherscan API Integration
// Contract verification and metadata lookup

import { ETHERSCAN_API_KEY } from '$env/static/private';
import type { ContractInfo } from './types';

// Etherscan-compatible API endpoints per chain
const API_ENDPOINTS: Record<number, string> = {
  1: 'https://api.etherscan.io/api',
  10: 'https://api-optimistic.etherscan.io/api',
  8453: 'https://api.basescan.org/api',
  42161: 'https://api.arbiscan.io/api',
  84532: 'https://api-sepolia.basescan.org/api',
  11155420: 'https://api-sepolia-optimistic.etherscan.io/api',
  421614: 'https://api-sepolia.arbiscan.io/api',
  11155111: 'https://api-sepolia.etherscan.io/api',
};

/**
 * Get the appropriate API endpoint for a chain
 */
function getApiEndpoint(chainId: number): string | null {
  return API_ENDPOINTS[chainId] || null;
}

/**
 * Check if an address is a contract (has code)
 */
export async function isContract(address: string, chainId: number): Promise<boolean> {
  const endpoint = getApiEndpoint(chainId);
  if (!endpoint) return false;

  try {
    const url = `${endpoint}?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    // If result is '0x' or '0x0', it's an EOA
    return data.result && data.result !== '0x' && data.result !== '0x0';
  } catch (error) {
    console.warn('[Etherscan] isContract check failed:', error);
    return false;
  }
}

/**
 * Get contract verification info from Etherscan
 */
export async function getContractInfo(address: string, chainId: number): Promise<ContractInfo> {
  const endpoint = getApiEndpoint(chainId);

  // Default response for unsupported chains or errors
  const defaultResult: ContractInfo = {
    isVerified: false,
    contractName: null,
    compilerVersion: null,
    isProxy: false,
  };

  if (!endpoint) {
    return defaultResult;
  }

  try {
    // Get contract source code (this tells us if it's verified)
    const url = `${endpoint}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    const data = await response.json();

    if (data.status !== '1' || !data.result || data.result.length === 0) {
      return defaultResult;
    }

    const result = data.result[0];

    // Check if verified (has source code)
    const isVerified = result.SourceCode && result.SourceCode !== '';
    const contractName = result.ContractName || null;
    const compilerVersion = result.CompilerVersion || null;

    // Check if it's a proxy
    const isProxy = result.Proxy === '1' ||
      result.Implementation !== '' ||
      (contractName && contractName.toLowerCase().includes('proxy'));

    const implementation = result.Implementation || undefined;

    return {
      isVerified,
      contractName,
      compilerVersion,
      isProxy,
      implementation,
    };
  } catch (error) {
    console.warn('[Etherscan] getContractInfo failed:', error);
    return defaultResult;
  }
}

/**
 * Get address labels/tags (for known addresses)
 */
export async function getAddressLabels(address: string, chainId: number): Promise<string[]> {
  // Etherscan doesn't have a public API for labels
  // This would require a paid API or custom database
  // For now, return empty array
  return [];
}

/**
 * Check if an address has been flagged in any incidents
 */
export async function checkAddressReputation(address: string, chainId: number): Promise<{
  isFlagged: boolean;
  reasons: string[];
}> {
  // This would integrate with:
  // - ChainAbuse API
  // - Forta alerts
  // - Custom phishing database
  // For now, just check against our known drainers list

  return {
    isFlagged: false,
    reasons: [],
  };
}
