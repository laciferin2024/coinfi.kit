// Gemini LLM Integration
// Natural language explanations for transactions

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import type {
  AIGuardRequest,
  DecodedTransaction,
  OneDAnalysis,
  TwoDAnalysis,
  ThreeDAnalysis,
  LLMExplanation
} from './types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Use Gemini 2.0 Flash for speed
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: {
    temperature: 0.3, // Lower temperature for more consistent outputs
    maxOutputTokens: 500,
  },
});

/**
 * Generate natural language explanation for a transaction
 */
export async function explainTransaction(
  request: AIGuardRequest,
  decoded: DecodedTransaction,
  oneD: OneDAnalysis,
  twoD: TwoDAnalysis,
  threeD: ThreeDAnalysis,
  timeoutMs: number = 2000
): Promise<LLMExplanation> {
  const prompt = buildPrompt(request, decoded, oneD, twoD, threeD);

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const result = await model.generateContent(prompt);
    clearTimeout(timeoutId);

    const text = result.response.text();
    return parseResponse(text, threeD.riskLevel);
  } catch (error: any) {
    console.warn('[Gemini] Generation failed:', error.message);
    // Return fallback explanation
    return generateFallbackExplanation(decoded, threeD);
  }
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(
  request: AIGuardRequest,
  decoded: DecodedTransaction,
  oneD: OneDAnalysis,
  twoD: TwoDAnalysis,
  threeD: ThreeDAnalysis
): string {
  return `You are an AI transaction security assistant for Coin Fi wallet.
Your job is to explain Ethereum transactions in simple, clear language and highlight potential risks.

TRANSACTION CONTEXT:
- Chain ID: ${request.chainId}
- From: ${request.from}
- To: ${request.to}
- Value: ${request.value || '0'} wei
- Method: ${decoded.method}
- Parameters: ${JSON.stringify(decoded.params, null, 2)}
- Contract verified: ${oneD.isVerified ? 'Yes' : 'No'}
${oneD.contractName ? `- Contract name: ${oneD.contractName}` : ''}

ANALYSIS RESULTS:
1D (Identity): ${oneD.reasons.join('; ')}
2D (Simulation): ${twoD.simulationSummary}
3D (Threats): ${threeD.threatTags.join(', ') || 'None detected'}
Risk Score: ${threeD.score}/100

TASK:
Generate a transaction explanation with THREE parts:

1. SHORT (1 sentence, <20 words): What is this transaction doing in plain English?
2. DETAILED (2-3 sentences): What happens when user signs? Why might this be risky? Any red flags?
3. RECOMMENDATION (1 sentence): Should user proceed, be cautious, or reject?

OUTPUT FORMAT (JSON only, no markdown):
{"short":"...","detailed":"...","recommendation":"..."}

EXAMPLES OF GOOD OUTPUTS:

For safe transfer:
{"short":"Sending 0.1 ETH to a regular wallet address.","detailed":"This is a simple ETH transfer to address 0xABC... Your balance will decrease by 0.1 ETH. The recipient is a regular wallet, not a contract, so this is low risk.","recommendation":"Safe to proceed."}

For risky approval:
{"short":"Granting unlimited USDC spending access to an unverified contract.","detailed":"This transaction does not move funds immediately, but gives this unverified contract permission to spend unlimited USDC from your wallet at any time. Because the contract is unverified and you've never used it, this could be a scam.","recommendation":"High risk - reject unless you absolutely trust this dApp."}

Now analyze this transaction and output JSON only:`;
}

/**
 * Parse Gemini response to LLMExplanation
 */
function parseResponse(text: string, riskLevel: string): LLMExplanation {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        short: parsed.short || 'Transaction analysis complete.',
        detailed: parsed.detailed || 'Review the security analysis above before proceeding.',
        recommendation: parsed.recommendation || getDefaultRecommendation(riskLevel),
      };
    }
  } catch (error) {
    console.warn('[Gemini] Failed to parse response:', error);
  }

  // Fallback: try to use the raw text
  return {
    short: text.slice(0, 100) || 'Transaction analysis complete.',
    detailed: text.slice(0, 300) || 'Review the security analysis above.',
    recommendation: getDefaultRecommendation(riskLevel),
  };
}

/**
 * Generate fallback explanation when Gemini fails
 */
function generateFallbackExplanation(
  decoded: DecodedTransaction,
  threeD: ThreeDAnalysis
): LLMExplanation {
  const riskLevel = threeD.riskLevel;
  const tags = threeD.threatTags;

  // Generate short based on method
  let short = '';
  switch (decoded.method) {
    case 'native_transfer':
      short = `Sending ${decoded.params.value} ETH to destination address.`;
      break;
    case 'transfer':
      short = `Transferring tokens to destination address.`;
      break;
    case 'approve':
      if (decoded.params.isUnlimited) {
        short = `Approving unlimited token spending to contract.`;
      } else {
        short = `Approving token spending allowance to contract.`;
      }
      break;
    case 'setApprovalForAll':
      short = `Granting NFT operator permissions.`;
      break;
    default:
      short = `Contract interaction: ${decoded.method}`;
  }

  // Generate detailed based on tags
  let detailed = '';
  if (tags.includes('infinite_approval') && tags.includes('unverified_contract')) {
    detailed = 'This grants unlimited spending permission to an unverified contract. If malicious, this contract could drain all tokens of this type from your wallet. The contract source code is not publicly verified.';
  } else if (tags.includes('infinite_approval')) {
    detailed = 'This grants unlimited spending permission. While the contract appears legitimate, you should only approve what you need. You can always revoke this permission later.';
  } else if (tags.includes('unverified_contract')) {
    detailed = 'This interacts with an unverified contract. The source code is not publicly available, so we cannot confirm what this contract does. Proceed with caution.';
  } else if (decoded.isNativeTransfer) {
    detailed = 'This is a simple ETH transfer. Your balance will decrease by the specified amount. This action cannot be reversed.';
  } else {
    detailed = 'Review the transaction details above before signing. Make sure you understand what this transaction does.';
  }

  return {
    short,
    detailed,
    recommendation: getDefaultRecommendation(riskLevel),
  };
}

/**
 * Get default recommendation based on risk level
 */
function getDefaultRecommendation(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Safe to proceed.';
    case 'medium':
      return 'Proceed with caution. Verify you trust the destination.';
    case 'high':
      return 'High risk - only proceed if you absolutely trust this dApp.';
    case 'blocked':
      return 'BLOCKED - this transaction appears malicious.';
    default:
      return 'Review carefully before proceeding.';
  }
}
