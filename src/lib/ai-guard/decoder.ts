// Transaction Decoder
// Uses viem to decode ERC-20, Uniswap, and common transaction types

import { decodeFunctionData, formatEther, formatUnits, parseAbi } from 'viem';
import type { DecodedTransaction } from './types';

// Common ABIs
const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
]);

const UNISWAP_V2_ROUTER_ABI = parseAbi([
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
]);

const UNISWAP_V3_ROUTER_ABI = parseAbi([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountIn)',
  'function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) payable returns (uint256 amountIn)',
]);

const ERC721_ABI = parseAbi([
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
]);

// ABI registry for decoding
const ABI_REGISTRY = [
  { name: 'ERC20', abi: ERC20_ABI },
  { name: 'UniswapV2Router', abi: UNISWAP_V2_ROUTER_ABI },
  { name: 'UniswapV3Router', abi: UNISWAP_V3_ROUTER_ABI },
  { name: 'ERC721', abi: ERC721_ABI },
];

/**
 * Maximum uint256 value (used for infinite approvals)
 */
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

/**
 * Check if an approval amount is effectively unlimited
 */
export function isUnlimitedApproval(amount: bigint): boolean {
  // Consider anything > 10^30 as "unlimited"
  return amount > BigInt('1000000000000000000000000000000');
}

/**
 * Decode a transaction using known ABIs
 */
export function decodeTransaction(
  data: string,
  value: string,
  to: string
): DecodedTransaction {
  // Handle native ETH transfer (no data)
  if (!data || data === '0x' || data === '0x0') {
    const ethValue = value ? formatEther(BigInt(value)) : '0';
    return {
      method: 'native_transfer',
      methodId: '0x',
      abi: null,
      params: {
        to,
        value: ethValue,
        valueWei: value || '0',
      },
      isNativeTransfer: true,
      isContractCall: false,
    };
  }

  // Extract method ID (first 4 bytes)
  const methodId = data.slice(0, 10);

  // Try to decode with each ABI
  for (const { name, abi } of ABI_REGISTRY) {
    try {
      const decoded = decodeFunctionData({
        abi,
        data: data as `0x${string}`,
      });

      return {
        method: decoded.functionName,
        methodId,
        abi: name,
        params: argsToParams(decoded.functionName, decoded.args),
        isNativeTransfer: false,
        isContractCall: true,
      };
    } catch {
      // Continue to next ABI
    }
  }

  // Unknown method - return raw data
  return {
    method: 'unknown',
    methodId,
    abi: null,
    params: {
      rawData: data,
    },
    isNativeTransfer: false,
    isContractCall: true,
  };
}

/**
 * Convert decoded args to a named params object
 */
function argsToParams(method: string, args: readonly unknown[] | undefined): Record<string, unknown> {
  if (!args) return {};

  switch (method) {
    case 'transfer':
      return {
        to: args[0],
        amount: args[1]?.toString(),
        amountFormatted: formatTokenAmount(args[1] as bigint),
      };
    case 'approve':
      return {
        spender: args[0],
        amount: args[1]?.toString(),
        amountFormatted: formatTokenAmount(args[1] as bigint),
        isUnlimited: isUnlimitedApproval(args[1] as bigint),
      };
    case 'transferFrom':
      return {
        from: args[0],
        to: args[1],
        amount: args[2]?.toString(),
        amountFormatted: formatTokenAmount(args[2] as bigint),
      };
    case 'swapExactTokensForTokens':
    case 'swapTokensForExactTokens':
      return {
        amountIn: args[0]?.toString(),
        amountOutMin: args[1]?.toString(),
        path: args[2],
        to: args[3],
        deadline: args[4]?.toString(),
      };
    case 'swapExactETHForTokens':
      return {
        amountOutMin: args[0]?.toString(),
        path: args[1],
        to: args[2],
        deadline: args[3]?.toString(),
      };
    case 'setApprovalForAll':
      return {
        operator: args[0],
        approved: args[1],
      };
    default:
      // Return args as array
      return {
        args: args.map(arg => arg?.toString()),
      };
  }
}

/**
 * Format a token amount (assuming 18 decimals by default)
 */
function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  if (isUnlimitedApproval(amount)) {
    return 'unlimited';
  }
  return formatUnits(amount, decimals);
}

/**
 * Generate a human-readable summary of the decoded transaction
 */
export function getTransactionSummary(decoded: DecodedTransaction, toAddress: string): string {
  if (decoded.isNativeTransfer) {
    return `Transfer ${decoded.params.value} ETH to ${shortenAddress(toAddress)}`;
  }

  const params = decoded.params;

  switch (decoded.method) {
    case 'transfer':
      return `Transfer ${params.amountFormatted} tokens to ${shortenAddress(params.to as string)}`;

    case 'approve':
      if (params.isUnlimited) {
        return `Approve UNLIMITED tokens to ${shortenAddress(params.spender as string)}`;
      }
      return `Approve ${params.amountFormatted} tokens to ${shortenAddress(params.spender as string)}`;

    case 'transferFrom':
      return `Transfer ${params.amountFormatted} tokens from ${shortenAddress(params.from as string)} to ${shortenAddress(params.to as string)}`;

    case 'swapExactTokensForTokens':
    case 'swapTokensForExactTokens':
    case 'swapExactETHForTokens':
      return `Swap tokens via ${decoded.abi}`;

    case 'setApprovalForAll':
      return `${params.approved ? 'Grant' : 'Revoke'} NFT operator access to ${shortenAddress(params.operator as string)}`;

    case 'unknown':
      return `Contract interaction with method ${decoded.methodId}`;

    default:
      return `Call ${decoded.method} on contract`;
  }
}

/**
 * Shorten an Ethereum address for display
 */
function shortenAddress(address: string): string {
  if (!address) return 'unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
