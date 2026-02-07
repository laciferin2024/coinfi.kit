// Heuristic Scoring
// Threat detection rules for transaction risk assessment

import type { DecodedTransaction, ThreeDAnalysis, ThreatTag } from './types';
import { isKnownSafe, isKnownDrainer, matchesSafeContractName } from './known-safe';
import { isUnlimitedApproval } from './decoder';

interface HeuristicContext {
  chainId: number;
  from: string;
  to: string;
  value: string;
  decoded: DecodedTransaction;
  isVerified: boolean;
  contractName: string | null;
  isFirstInteraction: boolean;
  userAvgTxValueUSD?: number;
  txValueUSD?: number;
}

interface HeuristicResult {
  score: number;
  tags: ThreatTag[];
  reasons: string[];
}

/**
 * Run all heuristic checks and calculate threat score
 */
export function runHeuristics(context: HeuristicContext): ThreeDAnalysis {
  let score = 20; // Base score
  const tags: ThreatTag[] = [];
  const reasons: string[] = [];

  // Check for known drainer (instant block)
  if (isKnownDrainer(context.to)) {
    return {
      title: 'What could go wrong?',
      riskLevel: 'blocked',
      score: 100,
      threatSummary: 'BLOCKED: This address is a known malicious drainer contract.',
      threatTags: ['known_drainer'],
    };
  }

  // Check infinite approval
  if (context.decoded.method === 'approve') {
    const amount = context.decoded.params.amount;
    if (amount && typeof amount === 'string' && isUnlimitedApproval(BigInt(amount))) {
      score += 30;
      tags.push('infinite_approval');
      reasons.push('Transaction requests unlimited token spending permission');
    }
  }

  // Check NFT approval for all
  if (context.decoded.method === 'setApprovalForAll' && context.decoded.params.approved) {
    score += 25;
    tags.push('infinite_approval');
    reasons.push('Transaction grants operator access to all your NFTs in this collection');
  }

  // Check unverified contract
  if (!context.decoded.isNativeTransfer && !context.isVerified) {
    score += 25;
    tags.push('unverified_contract');
    reasons.push('Interacting with an unverified contract - source code not publicly available');
  }

  // Check first-time interaction
  if (context.isFirstInteraction) {
    score += 15;
    tags.push('first_interaction');
    reasons.push('You have never interacted with this address before');
  }

  // Check large value anomaly
  if (context.txValueUSD && context.userAvgTxValueUSD) {
    if (context.txValueUSD > context.userAvgTxValueUSD * 10) {
      score += 25;
      tags.push('large_value_anomaly');
      reasons.push(`Transaction value ($${context.txValueUSD.toFixed(2)}) is significantly higher than your average`);
    }
  }

  // Check for unknown contract interactions
  if (context.decoded.method === 'unknown') {
    score += 15;
    reasons.push('Unable to decode transaction method - proceed with caution');
  }

  // Reduce score for known safe contracts
  if (isKnownSafe(context.to, context.chainId)) {
    score -= 25;
    reasons.push('Interacting with a known safe contract');
  }

  // Reduce score for verified safe-named contracts
  if (context.isVerified && matchesSafeContractName(context.contractName)) {
    score -= 15;
    reasons.push(`Contract "${context.contractName}" is verified and recognized`);
  }

  // Reduce score for native transfers to EOAs
  if (context.decoded.isNativeTransfer) {
    score -= 10;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (score < 30) {
    riskLevel = 'low';
  } else if (score < 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Add drain risk tag for high-risk approvals to unverified contracts
  if (score >= 60 && tags.includes('infinite_approval') && tags.includes('unverified_contract')) {
    tags.push('drain_risk');
  }

  // Generate threat summary
  const threatSummary = generateThreatSummary(tags, riskLevel, context);

  return {
    title: 'What could go wrong?',
    riskLevel,
    score,
    threatSummary,
    threatTags: tags,
  };
}

/**
 * Generate a human-readable threat summary
 */
function generateThreatSummary(
  tags: ThreatTag[],
  riskLevel: 'low' | 'medium' | 'high',
  context: HeuristicContext
): string {
  if (tags.length === 0) {
    return 'No significant threats detected for this transaction.';
  }

  const issues: string[] = [];

  if (tags.includes('infinite_approval')) {
    issues.push('unlimited spending approval');
  }
  if (tags.includes('unverified_contract')) {
    issues.push('unverified contract');
  }
  if (tags.includes('first_interaction')) {
    issues.push('first-time interaction');
  }
  if (tags.includes('large_value_anomaly')) {
    issues.push('unusually high value');
  }
  if (tags.includes('drain_risk')) {
    issues.push('potential drain risk');
  }

  const issueList = issues.join(', ');

  if (riskLevel === 'high') {
    return `High risk: ${issueList}. If malicious, this could drain your assets.`;
  } else if (riskLevel === 'medium') {
    return `Moderate risk: ${issueList}. Verify you trust this destination.`;
  } else {
    return `Low risk: ${issueList}. Transaction appears safe.`;
  }
}

/**
 * Calculate UI hints based on risk level
 */
export function calculateUIHints(riskLevel: 'low' | 'medium' | 'high' | 'blocked') {
  return {
    showRedBanner: riskLevel === 'high' || riskLevel === 'blocked',
    showConfirmButton: riskLevel !== 'blocked',
    showRejectButton: true,
    requireHoldToConfirm: riskLevel === 'high',
    bannerColor: riskLevel === 'low' ? 'green' as const :
      riskLevel === 'medium' ? 'yellow' as const : 'red' as const,
  };
}
