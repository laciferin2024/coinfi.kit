// AI Guard API Endpoint
// POST /api/ai-guard
// Complete 3D AI Wallet Guard analysis

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AIGuardRequest, AIGuardResponse, OneDAnalysis } from '$lib/ai-guard/types';
import { decodeTransaction, getTransactionSummary } from '$lib/ai-guard/decoder';
import { getContractInfo, isContract } from '$lib/ai-guard/etherscan';
import { simulateTransaction, generateTwoDAnalysis } from '$lib/ai-guard/tenderly';
import { runHeuristics, calculateUIHints } from '$lib/ai-guard/heuristics';
import { explainTransaction } from '$lib/ai-guard/gemini';
import { isKnownSafe } from '$lib/ai-guard/known-safe';

export const POST: RequestHandler = async ({ request }) => {
  const startTime = Date.now();

  try {
    const body: AIGuardRequest = await request.json();

    // Validate required fields
    if (!body.chainId || !body.from || !body.to) {
      throw error(400, 'Missing required fields: chainId, from, to');
    }

    // Normalize addresses
    const from = body.from.toLowerCase();
    const to = body.to.toLowerCase();
    const value = body.value || '0';
    const data = body.data || '0x';

    // ============================================
    // STEP 1: Decode transaction
    // ============================================
    const decoded = decodeTransaction(data, value, to);
    // ============================================
    // DEMO: Malicious Transaction Interception
    // ============================================
    if (to === '0xdeadbeef00000000000000000000000000000000' ||
      data.includes('deadbeef')) {

      const response: AIGuardResponse = {
        overall: {
          riskLevel: 'blocked',
          score: 100,
          summary: 'CRITICAL: DRAINER DETECTED',
          action: 'block'
        },
        dimensions: {
          oneD: {
            title: 'CRITICAL SECURITY ALERT',
            riskLevel: 'high',
            score: 100,
            reasons: ['Address associated with known wallet drainer', 'Found in 12 security reports in last 24h', 'Contract source code unverified'],
            labels: ['phishing', 'drainer', 'high_risk'],
            isVerified: false,
            contractName: 'Unknown (Malicious)'
          },
          twoD: {
            title: 'ASSET LOSS PREVENTED',
            riskLevel: 'high',
            score: 100,
            simulationSummary: 'CRITICAL: This transaction will EMPTY your wallet.',
            effects: [
              'Requesting unlimited approval for ALL tokens',
              'Hidden transfer to suspect address detected',
              'Gas price manipulated to frontrun rejection'
            ],
            balanceChanges: []
          },
          threeD: {
            title: 'THREAT MODEL MATCH',
            riskLevel: 'blocked',
            score: 100,
            threatSummary: 'Signature matches known "Monkey Drainer" variant.',
            threatTags: ['honey_pot', 'drainer_signature', 'malicious_approve']
          }
        },
        llmExplanation: {
          short: 'STOP: This is a confirmed wallet drainer attempt.',
          detailed: 'Our AI Guard has intercepted a sophisticated drainer attack. The contract you are interacting with is disguised as a multi-send tool but actually contains hidden logic to gain unlimited access to your assets. If you sign this, you will lose all funds.',
          recommendation: 'DO NOT SIGN. Close this DApp immediately.'
        },
        uiHints: calculateUIHints('blocked'),
        processingTimeMs: Date.now() - startTime,
        timestamp: Date.now()
      };
      return json(response);
    }

    console.log('[AI Guard] Decoded:', decoded.method, decoded.abi);

    // ============================================
    // STEP 2: 1D Analysis - Identity Check
    // ============================================
    const [contractInfo, isContractAddress] = await Promise.all([
      getContractInfo(to, body.chainId),
      isContract(to, body.chainId),
    ]);

    const oneD: OneDAnalysis = {
      title: 'Who are you interacting with?',
      riskLevel: 'low',
      score: 20,
      reasons: [],
      labels: [],
      isVerified: contractInfo.isVerified,
      contractName: contractInfo.contractName || undefined,
    };

    // Build 1D analysis
    if (!isContractAddress) {
      oneD.reasons.push('Sending to a regular wallet address (EOA)');
      oneD.labels.push('eoa');
      oneD.score = 10;
    } else if (isKnownSafe(to, body.chainId)) {
      oneD.reasons.push('Interacting with a verified safe contract');
      oneD.labels.push('known_safe');
      oneD.score = 15;
    } else if (contractInfo.isVerified) {
      oneD.reasons.push(`Contract is verified: ${contractInfo.contractName || 'Unknown'}`);
      oneD.labels.push('verified_contract');
      oneD.score = 30;
    } else {
      oneD.reasons.push('Contract source code is NOT verified');
      oneD.labels.push('unverified_contract');
      oneD.riskLevel = 'high';
      oneD.score = 70;
    }

    // Check for first interaction
    const isFirstInteraction = true; // TODO: Check user history
    if (isFirstInteraction && isContractAddress) {
      oneD.reasons.push('First time interacting with this address');
      oneD.labels.push('first_interaction');
      oneD.score = Math.min(100, oneD.score + 10);
    }

    // Adjust 1D risk level
    if (oneD.score < 30) oneD.riskLevel = 'low';
    else if (oneD.score < 60) oneD.riskLevel = 'medium';
    else oneD.riskLevel = 'high';

    // ============================================
    // STEP 3: 2D Analysis - Simulation
    // ============================================
    const simulation = await simulateTransaction(
      body.chainId,
      from,
      to,
      value,
      data,
      body.gas
    );

    const twoD = generateTwoDAnalysis(simulation, decoded.method, to);

    // ============================================
    // STEP 4: 3D Analysis - Heuristics
    // ============================================
    const threeD = runHeuristics({
      chainId: body.chainId,
      from,
      to,
      value,
      decoded,
      isVerified: contractInfo.isVerified,
      contractName: contractInfo.contractName,
      isFirstInteraction,
      userAvgTxValueUSD: body.userContext?.avgTxValueUSD,
    });

    // ============================================
    // STEP 5: LLM Explanation
    // ============================================
    const llmExplanation = await explainTransaction(
      body,
      decoded,
      oneD,
      twoD,
      threeD,
      2000 // 2 second timeout
    );

    // ============================================
    // STEP 6: Build Response
    // ============================================

    // Calculate overall risk
    const avgScore = Math.round((oneD.score + twoD.score + threeD.score) / 3);
    const overallRiskLevel = threeD.riskLevel === 'blocked' ? 'blocked' :
      avgScore < 30 ? 'low' :
        avgScore < 60 ? 'medium' : 'high';

    const response: AIGuardResponse = {
      overall: {
        riskLevel: overallRiskLevel,
        score: avgScore,
        summary: getTransactionSummary(decoded, to),
        action: overallRiskLevel === 'blocked' ? 'block' :
          overallRiskLevel === 'high' ? 'warn' : 'allow',
      },
      dimensions: {
        oneD,
        twoD,
        threeD,
      },
      llmExplanation,
      uiHints: calculateUIHints(overallRiskLevel),
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now(),
    };

    console.log(`[AI Guard] Completed in ${response.processingTimeMs}ms - Risk: ${overallRiskLevel} (${avgScore})`);

    return json(response);

  } catch (err: any) {
    console.error('[AI Guard] Error:', err);

    // Return a safe fallback response
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }

    // For unexpected errors, return a cautious response
    const fallbackResponse: AIGuardResponse = {
      overall: {
        riskLevel: 'medium',
        score: 50,
        summary: 'Unable to fully analyze transaction',
        action: 'warn',
      },
      dimensions: {
        oneD: {
          title: 'Who are you interacting with?',
          riskLevel: 'medium',
          score: 50,
          reasons: ['Analysis incomplete - proceed with caution'],
          labels: ['analysis_error'],
          isVerified: false,
        },
        twoD: {
          title: 'What will this transaction do?',
          riskLevel: 'medium',
          score: 50,
          simulationSummary: 'Unable to simulate transaction',
          effects: ['Review transaction details carefully'],
          balanceChanges: [],
        },
        threeD: {
          title: 'What could go wrong?',
          riskLevel: 'medium',
          score: 50,
          threatSummary: 'Unable to complete threat analysis',
          threatTags: [],
        },
      },
      llmExplanation: {
        short: 'Analysis incomplete - please review manually.',
        detailed: `An error occurred during analysis: ${err.message || 'Unknown error'}. The transaction may still be safe, but we recommend extra caution.`,
        recommendation: 'Proceed only if you trust this destination.',
      },
      uiHints: {
        showRedBanner: false,
        showConfirmButton: true,
        showRejectButton: true,
        requireHoldToConfirm: true,
        bannerColor: 'yellow',
      },
      processingTimeMs: Date.now() - Date.now(),
      timestamp: Date.now(),
    };

    return json(fallbackResponse);
  }
};
