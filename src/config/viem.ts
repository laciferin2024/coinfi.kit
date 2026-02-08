import { createPublicClient, defineChain, erc20Abi, http } from "viem"
import type { Chain, PublicClient } from "viem"

// add configurations to : config/unreal.ts
//

/**
 * Multichain wallet configuration and public client factory.
 *
 * - Default chain: Torus Mainnet
 * - Use getPublicClient(chainId?) to retrieve a cached PublicClient per chain.
 * - Use getDefaultPublicClient() for the default Torus client.
 * - Legacy export `publicClient` is deprecated; migrate to the functions above.
 */

export const sepolia = defineChain({
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
    faucet: [
      "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
    ],
  },
  rpcUrls: {
    default: {
      http: [
        "https://eth-sepolia.g.alchemy.com/v2/F0r3Q4iUYPUqluEG4clZu"
      ],
    },
    public: {
      http: [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://eth-sepolia.public.blastapi.io",
        "https://0xrpc.io/sep",

        // "https://eth-sepolia-testnet.rpc.grove.city/v1/01fdb492",
        // "https://rpc.sepolia.org",
        // "https://sepolia.gateway.tenderly.co",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Sepolia Explorer",
      url: "https://eth-sepolia.blockscout.com",
    },
  },
  testnet: true,
});
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
    faucet: [
      "https://docs.arc.network/arc/tutorials/access-usdc-crosschain#arc",
    ],
  },
  rpcUrls: {
    default: {
      http: [
        "https://arc-testnet.drpc.org"
      ],
      webSocket: [
        "wss://arc-testnet.drpc.org"
      ]
    },
    public: {
      http: [
        "https://arc-testnet.drpc.org"
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,

  custom: {
    tokens: {
      usdc: {
        address: "0x3600000000000000000000000000000000000000",
      }
    }
  });

export const titanAITestnet = defineChain({
  id: 1020352220,
  name: "Titan AI [Skale]",
  nativeCurrency: {
    decimals: 18,
    name: "Skale Fuel",
    symbol: "FUEL",
  },
  rpcUrls: {
    default: { http: ["https://testnet.skalenodes.com/v1/aware-fake-trim-testnet"] },
  },
  blockExplorers: {
    default: {
      name: "Titan AI Explorer",
      url: "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com/",
    },
  },
  testnet: true,
  custom: {
    tokens: {
      UnrealToken: {
        address: "0x8bcEac95cb3AAF12358Dde73c16bB293f4b028C1",
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
  contracts: {
    UnrealToken: {
      address: "0x8bcEac95cb3AAF12358Dde73c16bB293f4b028C1",
      symbol: "UNREAL",
      name: "Unreal Token",
      decimals: 18,
      abi: erc20Abi,
    },
  },
})

export const amoyTestnet = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    decimals: 18,
    name: "POL",
    symbol: "POL",
  },
  rpcUrls: {
    default: {
      http: [
        "https://polygon-amoy.api.onfinality.io/rpc?apikey=1bd40958-ada5-4b09-8cbc-542bc44f0360",

        // "https://polygon-amoy.api.onfinality.io/public",
        // 'https://polygon-amoy.public.blastapi.io/',

        "https://polygon-amoy.g.alchemy.com/v2/3GiG3I2-Yr9IAplzdUPuI",
        "https://rpc-amoy.polygon.technology",
        // "https://polygon-amoy.gateway.tatum.io",
        "https://polygon-amoy.drpc.org",
        // "https://api.zan.top/polygon-amoy", //ran into RPS limits
        "https://polygon-amoy-bor-rpc.publicnode.com",
        // "https://polygon-amoy.api.onfinality.io/public",
        // "https://polygon-amoy.gateway.tenderly.co",
      ],
    },
    public: {
      http: ["https://rpc-amoy.polygon.technology"],
      // http: ["https://rpc-amoy.polygon.technology", "https://polygon-amoy-bor-rpc.publicnode.com"],
    },
    indexer: {
      http: ["https://polygon-amoy.rpc.hypersync.xyz", "https://rpc-amoy.polygon.technology"],
    },
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
  custom: {
    tokens: {
      UnrealToken: {
        address: "0x535D9D557f15ff50E46D51a6726C1Eb5FAf9D326",
        symbol: "UNREAL",
        name: "Unreal Token",
        decimals: 18,
      },
    },
  },
  contracts: {
    UnrealToken: {
      address: "0x535D9D557f15ff50E46D51a6726C1Eb5FAf9D326",
      symbol: "UNREAL",
      name: "Unreal Token",
      decimals: 18,
      abi: erc20Abi,
    },
  },
})

// Chain configuration map
const CHAIN_MAP = new Map<number, Chain>([
  [titanAITestnet.id, titanAITestnet],
  [amoyTestnet.id, amoyTestnet],
  [sepolia.id, sepolia],
  [arcTestnet.id, arcTestnet]
])

/**
 * Get a Chain definition by chainId.
 * @param chainId EVM chain id (e.g., 8192 Torus, 80002 Amoy)
 * @returns Chain or undefined if not supported
 */
export function getChain(chainId: number): Chain {
  const chain = CHAIN_MAP.get(chainId)
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return chain
}

/**
 * Get the default Chain used by the router (Torus Mainnet).
 */
export function getDefaultChain(): Chain {
  return amoyTestnet
}

export const CHAINS = Array.from(CHAIN_MAP.values())

// -------- Public Client Management --------
// Cache for public clients per chain
const publicClientCache = new Map<number, PublicClient>()

export function pickRpc(rpcs: readonly string[]) {
  return rpcs[Math.floor(Math.random() * rpcs.length)]
}
/**
 * Get or create a public client for the specified chain
 */
export function getPublicClient(
  chainId?: number,
  readOnly?: boolean,
  indexerOnly?: boolean
): PublicClient {
  const targetChainId = chainId || getDefaultChain().id

  let dontCache = targetChainId === amoyTestnet.id

  // Return cached client if exists
  if (!dontCache && publicClientCache.has(targetChainId)) {
    return publicClientCache.get(targetChainId)!
  }

  // Get chain configuration
  const chain = getChain(targetChainId)
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${targetChainId}`)
  }

  let rpcs = chain.rpcUrls.default.http

  if (readOnly) {
    rpcs = chain.rpcUrls.public.http ?? rpcs
  }
  if (indexerOnly) {
    rpcs = chain.rpcUrls?.indexer?.http ?? rpcs
  }

  // Create new public client
  const client = createPublicClient({
    chain,
    transport: http(pickRpc(rpcs)),
  })

  // Cache the client
  publicClientCache.set(targetChainId, client)

  return client
}

/**
 * Get the default public client (Torus Mainnet)
 */
export function getDefaultPublicClient(): PublicClient {
  return getPublicClient(getDefaultChain().id)
}

// Legacy export for backward compatibility (DEPRECATED)
// TODO: Remove this once all usage is migrated to getPublicClient()
