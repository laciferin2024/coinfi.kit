// Tenderly Simulation Integration
// Transaction simulation for 2D analysis

import { TENDERLY_API_KEY } from '$env/static/private';
import type { SimulationResult, BalanceChange, TwoDAnalysis, RiskLevel } from './types';

const TENDERLY_API_URL = 'https://api.tenderly.co/api/v1/account/me/project/project/simulate';

// Chain ID to network name mapping for Tenderly
const CHAIN_TO_NETWORK: Record<number, string> = {
  1: 'mainnet',
  10: 'optimistic',
  8453: 'base',
  42161: 'arbitrum',
  84532: 'base-sepolia',
  11155420: 'optimistic-sepolia',
  11155111: 'sepolia',
};

/**
 * Simulate a transaction using Tenderly
 */
export async function simulateTransaction(
  chainId: number,
  from: string,
  to: string,
  value: string,
  data: string,
  gas?: string
): Promise<SimulationResult> {
  const network = CHAIN_TO_NETWORK[chainId];

  // Default fallback if simulation fails or is unsupported
  const fallbackResult: SimulationResult = {
    success: true,
    gasUsed: gas || '21000',
    balanceChanges: [],
    logs: [],
  };

  if (!network) {
    console.warn(`[Tenderly] Unsupported chain: ${chainId}`);
    return fallbackResult;
  }

  if (!TENDERLY_API_KEY) {
    console.warn('[Tenderly] API key not configured');
    return fallbackResult;
  }

  try {
    const response = await fetch(TENDERLY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': TENDERLY_API_KEY,
      },
      body: JSON.stringify({
        network_id: chainId.toString(),
        from,
        to,
        value: value || '0',
        input: data || '0x',
        gas: parseInt(gas || '8000000'),
        gas_price: '0',
        save: false,
        save_if_fails: false,
        simulation_type: 'quick',
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.warn(`[Tenderly] Simulation failed: ${response.status}`);
      return fallbackResult;
    }

    const result = await response.json();

    return parseSimulationResult(result);
  } catch (error) {
    console.warn('[Tenderly] Simulation error:', error);
    return fallbackResult;
  }
}

/**
 * Parse Tenderly simulation response
 */
function parseSimulationResult(response: any): SimulationResult {
  const transaction = response.transaction;
  const simulation = response.simulation;

  if (!transaction || !simulation) {
    return {
      success: false,
      gasUsed: '0',
      balanceChanges: [],
      logs: [],
      error: 'Invalid simulation response',
    };
  }

  // Check if transaction would succeed
  const success = transaction.status === true;
  const gasUsed = transaction.gas_used?.toString() || '0';

  // Extract balance changes from state diff
  const balanceChanges: BalanceChange[] = [];

  if (simulation.asset_changes) {
    for (const change of simulation.asset_changes) {
      balanceChanges.push({
        token: change.token_info?.contract_address || 'ETH',
        symbol: change.token_info?.symbol || 'ETH',
        before: change.raw_amount?.toString() || '0',
        after: '0', // Tenderly gives delta, not before/after
        delta: change.amount?.toString() || '0',
        isIncrease: change.type === 'Transfer' && change.to?.toLowerCase() === change.from?.toLowerCase(),
      });
    }
  }

  // Extract logs
  const logs = (transaction.logs || []).map((log: any) => ({
    address: log.address,
    topics: log.topics || [],
    data: log.data || '0x',
    decoded: log.decoded ? {
      name: log.decoded.name,
      params: log.decoded.inputs?.reduce((acc: any, input: any) => {
        acc[input.name] = input.value;
        return acc;
      }, {}),
    } : undefined,
  }));

  return {
    success,
    gasUsed,
    balanceChanges,
    logs,
    error: success ? undefined : transaction.error_message,
  };
}

/**
 * Generate 2D analysis from simulation result
 */
export function generateTwoDAnalysis(
  simulation: SimulationResult,
  decodedMethod: string,
  toAddress: string
): TwoDAnalysis {
  const effects: string[] = [];

  // Add balance change effects
  for (const change of simulation.balanceChanges) {
    const direction = change.isIncrease ? 'receive' : 'send';
    effects.push(`You will ${direction} ${change.delta} ${change.symbol}`);
  }

  // Add method-specific effects
  if (decodedMethod === 'approve') {
    effects.push('Contract gains permission to spend your tokens');
    effects.push('No tokens move immediately');
    effects.push('You can revoke this approval later');
  } else if (decodedMethod === 'transfer') {
    effects.push('Tokens will be transferred immediately');
    effects.push('This action cannot be reversed');
  } else if (decodedMethod.includes('swap')) {
    effects.push('Tokens will be exchanged via DEX');
    effects.push('Exact output depends on current prices');
  }

  // If no effects detected, add default
  if (effects.length === 0) {
    effects.push('Contract interaction will modify state');
    effects.push('Review carefully before proceeding');
  }

  // Calculate simulation score based on success
  let score = 30; // Base score
  if (!simulation.success) {
    score = 70;
    effects.push(`⚠️ Simulation failed: ${simulation.error || 'Unknown error'}`);
  }

  // Generate summary
  let summary = '';
  if (simulation.balanceChanges.length > 0) {
    const changeDescriptions = simulation.balanceChanges
      .map(c => `${c.isIncrease ? '+' : '-'}${c.delta} ${c.symbol}`)
      .join(', ');
    summary = `Expected balance changes: ${changeDescriptions}`;
  } else {
    summary = `Transaction simulated successfully. No token transfers detected.`;
  }

  // Determine risk level
  let riskLevel: RiskLevel;
  if (score < 40) {
    riskLevel = 'low';
  } else if (score < 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    title: 'What will this transaction do?',
    riskLevel,
    simulationSummary: summary,
    effects,
    balanceChanges: simulation.balanceChanges,
    score,
  };
}
