// Known Safe Contracts
// Curated list of verified safe contracts per chain

export const KNOWN_SAFE_CONTRACTS: Record<number, Set<string>> = {
  // Base Mainnet (8453)
  8453: new Set([
    '0x4200000000000000000000000000000000000006', // WETH
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
    '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43', // APE Coin
    '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // DEGEN
    // Uniswap V3
    '0x2626664c2603336E57B271c5C0b26F421741e481', // SwapRouter
    '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1', // UniversalRouter
    // Aave V3
    '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', // Pool
  ]),

  // Optimism Mainnet (10)
  10: new Set([
    '0x4200000000000000000000000000000000000006', // WETH
    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
    '0x4200000000000000000000000000000000000042', // OP Token
    // Uniswap
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // UniversalRouter
    // Velodrome
    '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858', // Router
    // Synthetix
    '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', // SNX
  ]),

  // Optimism Sepolia (11155420)
  11155420: new Set([
    '0x4200000000000000000000000000000000000006', // WETH
    '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Test USDC
    '0xD152f549545093347A162Dce210e7293f1452150', // Disperse.app
  ]),

  // Base Sepolia (84532)
  84532: new Set([
    '0x4200000000000000000000000000000000000006', // WETH
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Test USDC
    '0xD152f549545093347A162Dce210e7293f1452150', // Disperse.app
  ]),

  // Ethereum Sepolia (11155111)
  11155111: new Set([
    '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH
    '0xD152f549545093347A162Dce210e7293f1452150', // Disperse.app
  ]),

  // Arbitrum One (42161)
  42161: new Set([
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
    '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB Token
    // Uniswap
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
    // GMX
    '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064', // GMX
  ]),

  // Ethereum Mainnet (1)
  1: new Set([
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0x6B175474E89094C44Da98b954EescdeCB5BE3F6562', // DAI
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    // Uniswap
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // UniversalRouter
    // Lido
    '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // stETH
    '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // wstETH
    // Aave
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', // Pool V3
  ]),
};

// Known drainer contract patterns/addresses
export const KNOWN_DRAINERS: Set<string> = new Set([
  // Add known malicious addresses here
  // These are example patterns - in production, this would be maintained via API
]);

// Contract name patterns that are typically safe
export const SAFE_CONTRACT_NAMES: RegExp[] = [
  /^(Uniswap|UniswapV[23])/i,
  /^(Aave|AaveV[23])/i,
  /^(Compound|CompoundV[23])/i,
  /^(Curve|CurvePool)/i,
  /^(Lido|LidoStaking)/i,
  /^(1inch|OneInch)/i,
  /^(Chainlink|ChainlinkOracle)/i,
  /^(OpenSea|Seaport)/i,
  /^(ENS|ENSRegistry)/i,
  /^(WETH|WrappedEther)/i,
  /^(USDC|USDCoin|FiatToken)/i,
  /^(DAI|DaiStablecoin)/i,
  /^(USDT|TetherToken)/i,
  /^(Disperse)/i,
];

/**
 * Check if an address is in the known safe list
 */
export function isKnownSafe(address: string, chainId: number): boolean {
  const normalizedAddress = address.toLowerCase();
  const chainContracts = KNOWN_SAFE_CONTRACTS[chainId];

  if (!chainContracts) return false;

  // Check if address is in the safe set (case-insensitive)
  for (const safeAddr of chainContracts) {
    if (safeAddr.toLowerCase() === normalizedAddress) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an address is a known drainer
 */
export function isKnownDrainer(address: string): boolean {
  return KNOWN_DRAINERS.has(address.toLowerCase());
}

/**
 * Check if a contract name matches safe patterns
 */
export function matchesSafeContractName(contractName: string | null): boolean {
  if (!contractName) return false;
  return SAFE_CONTRACT_NAMES.some(pattern => pattern.test(contractName));
}
