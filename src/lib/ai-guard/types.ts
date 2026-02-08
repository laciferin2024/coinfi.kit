// AI Guard Types
// TypeScript interfaces for the 3D AI Wallet Guard system

export interface AIGuardRequest {
  chainId: number;
  from: string;
  to: string;
  value: string;
  valueUnit?: 'wei' | 'ether';
  data: string;
  gas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;

  // Optional: pre-decoded transaction
  decoded?: {
    method: string;
    functionSignature: string;
    params: Record<string, unknown>;
  };

  // User context for personalized risk assessment
  userContext?: {
    avgTxValueUSD?: number;
    lifetimeTxCount?: number;
    knownContacts?: string[];
    preferredLanguage?: string;
  };
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked';
export type GuardAction = 'allow' | 'warn' | 'block';

export interface DimensionAnalysis {
  title: string;
  riskLevel: RiskLevel;
  score: number; // 0-100
}

export interface OneDAnalysis extends DimensionAnalysis {
  reasons: string[];
  labels: string[];
  isVerified: boolean;
  contractName?: string;
}

export interface TwoDAnalysis extends DimensionAnalysis {
  simulationSummary: string;
  effects: string[];
  balanceChanges?: BalanceChange[];
}

export interface BalanceChange {
  token: string;
  symbol: string;
  before: string;
  after: string;
  delta: string;
  isIncrease: boolean;
}

export interface ThreeDAnalysis extends DimensionAnalysis {
  threatSummary: string;
  threatTags: ThreatTag[];
}

export type ThreatTag =
  | 'infinite_approval'
  | 'unverified_contract'
  | 'first_interaction'
  | 'large_value_anomaly'
  | 'known_drainer'
  | 'drain_risk'
  | 'phishing_suspected'
  | 'honeypot_suspected'
  | 'reentrancy_risk'
  | 'mev_vulnerable'
  | 'honey_pot'
  | 'drainer_signature';

export interface LLMExplanation {
  short: string;
  detailed: string;
  recommendation: string;
}

export interface UIHints {
  showRedBanner: boolean;
  showConfirmButton: boolean;
  showRejectButton: boolean;
  requireHoldToConfirm: boolean;
  bannerColor: 'green' | 'yellow' | 'red';
}

export interface AIGuardResponse {
  overall: {
    riskLevel: RiskLevel;
    score: number;
    summary: string;
    action: GuardAction;
  };

  dimensions: {
    oneD: OneDAnalysis;
    twoD: TwoDAnalysis;
    threeD: ThreeDAnalysis;
  };

  llmExplanation: LLMExplanation;
  uiHints: UIHints;

  // Metadata
  processingTimeMs: number;
  timestamp: number;
}

// Decoded transaction info
export interface DecodedTransaction {
  method: string;
  methodId: string;
  abi: string | null;
  params: Record<string, unknown>;
  isNativeTransfer: boolean;
  isContractCall: boolean;
  tokenInfo?: {
    symbol: string;
    decimals: number;
    address: string;
  };
}

// Etherscan contract info
export interface ContractInfo {
  isVerified: boolean;
  contractName: string | null;
  compilerVersion: string | null;
  isProxy: boolean;
  implementation?: string;
}

// Tenderly simulation result
export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  balanceChanges: BalanceChange[];
  logs: SimulationLog[];
  error?: string;
}

export interface SimulationLog {
  address: string;
  topics: string[];
  data: string;
  decoded?: {
    name: string;
    params: Record<string, unknown>;
  };
}
