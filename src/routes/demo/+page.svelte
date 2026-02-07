<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import {
    Shield,
    Zap,
    AlertTriangle,
    ArrowUpRight,
    Coins,
    Lock,
    CheckCircle,
    XCircle,
  } from "lucide-svelte"

  import { walletStore, activeNetwork } from "$lib/stores/wallet"
  import type { AIGuardResponse, RiskLevel } from "$lib/ai-guard/types"
  import GuardConsole from "$lib/components/ui/GuardConsole.svelte"
  import Button from "$lib/components/ui/Button.svelte"

  // Demo transaction scenarios
  const DEMO_SCENARIOS = [
    {
      id: "safe-transfer",
      name: "Safe ETH Transfer",
      description: "Send 0.001 ETH to Vitalik.eth - Low risk",
      icon: "✅",
      risk: "low" as RiskLevel,
      transaction: {
        chainId: 84532, // Base Sepolia
        from: "0x0000000000000000000000000000000000000000",
        to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Vitalik
        value: "1000000000000000", // 0.001 ETH
        data: "0x",
      },
    },
    {
      id: "risky-approval",
      name: "Risky Unlimited Approval",
      description: "Approve unlimited USDC to unknown contract - HIGH RISK",
      icon: "🚨",
      risk: "high" as RiskLevel,
      transaction: {
        chainId: 84532,
        from: "0x0000000000000000000000000000000000000000",
        to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
        value: "0",
        // approve(0xABCDEF..., unlimited)
        data: "0x095ea7b3000000000000000000000000abcdef1234567890abcdef1234567890abcdef12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      },
    },
    {
      id: "uniswap-swap",
      name: "Uniswap Swap",
      description: "Swap on verified Uniswap - Medium risk",
      icon: "🦄",
      risk: "medium" as RiskLevel,
      transaction: {
        chainId: 84532,
        from: "0x0000000000000000000000000000000000000000",
        to: "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap Router
        value: "100000000000000000", // 0.1 ETH
        data: "0x5ae401dc", // multicall signature
      },
    },
  ]

  let selectedScenario = $state<(typeof DEMO_SCENARIOS)[number] | null>(null)
  let isAnalyzing = $state(false)
  let analysisResult = $state<AIGuardResponse | null>(null)

  onMount(() => {
    if (browser && !$walletStore.address) {
      goto("/")
    }
  })

  function selectScenario(scenario: (typeof DEMO_SCENARIOS)[number]) {
    selectedScenario = scenario
    isAnalyzing = true
    analysisResult = null
  }

  function handleAnalysisComplete(
    verdict: RiskLevel,
    response: AIGuardResponse | null,
  ) {
    analysisResult = response
    isAnalyzing = false
  }

  function resetDemo() {
    selectedScenario = null
    isAnalyzing = false
    analysisResult = null
  }

  function getRiskColor(risk: RiskLevel | null) {
    switch (risk) {
      case "low":
        return "emerald"
      case "medium":
        return "yellow"
      case "high":
        return "rose"
      case "blocked":
        return "red"
      default:
        return "zinc"
    }
  }
</script>

<svelte:head>
  <title>AI Guard Demo | Coin Fi</title>
</svelte:head>

<div class="min-h-screen bg-black px-6 pt-6 pb-32">
  <!-- Header -->
  <div class="space-y-2 mb-8">
    <div class="flex items-center gap-2">
      <Shield class="w-6 h-6 text-orange-500" />
      <h1
        class="text-2xl font-black italic uppercase tracking-tighter text-white"
      >
        AI Guard Demo
      </h1>
    </div>
    <p class="text-sm text-zinc-500">
      Test the 3D AI Wallet Guard with example transactions
    </p>
  </div>

  {#if !selectedScenario}
    <!-- Scenario Selection -->
    <div class="space-y-4">
      <h2
        class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
      >
        Select a Demo Scenario
      </h2>

      {#each DEMO_SCENARIOS as scenario}
        <button
          onclick={() => selectScenario(scenario)}
          class="w-full p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:border-orange-500/50 transition-all text-left group"
        >
          <div class="flex items-start gap-4">
            <div class="text-3xl">{scenario.icon}</div>
            <div class="flex-1 space-y-1">
              <h3
                class="font-bold text-white group-hover:text-orange-500 transition-colors"
              >
                {scenario.name}
              </h3>
              <p class="text-xs text-zinc-500">{scenario.description}</p>
            </div>
            <div
              class="px-2 py-1 rounded bg-{getRiskColor(
                scenario.risk,
              )}-500/10 text-{getRiskColor(
                scenario.risk,
              )}-400 text-[9px] font-black uppercase"
            >
              {scenario.risk}
            </div>
          </div>
        </button>
      {/each}
    </div>

    <!-- Info Box -->
    <div
      class="mt-8 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20"
    >
      <div class="flex items-start gap-3">
        <Zap class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <p class="text-sm font-bold text-white">How it works</p>
          <p class="text-xs text-zinc-400 leading-relaxed">
            Each scenario sends a test transaction to the AI Guard API, which
            performs:
          </p>
          <ul class="text-xs text-zinc-500 space-y-1 mt-2">
            <li>
              • <strong class="text-cyan-400">1D Analysis:</strong> Contract verification
              via Etherscan
            </li>
            <li>
              • <strong class="text-purple-400">2D Analysis:</strong> Transaction
              simulation via Tenderly
            </li>
            <li>
              • <strong class="text-rose-400">3D Analysis:</strong> Threat heuristics
              & LLM explanation
            </li>
          </ul>
        </div>
      </div>
    </div>
  {:else}
    <!-- Analysis View -->
    <div class="space-y-6">
      <!-- Scenario Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{selectedScenario.icon}</span>
          <div>
            <h2 class="font-bold text-white">{selectedScenario.name}</h2>
            <p class="text-xs text-zinc-500">{selectedScenario.description}</p>
          </div>
        </div>
        <button
          onclick={resetDemo}
          class="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <!-- Transaction Details -->
      <div class="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
        <h3
          class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
        >
          Transaction Details
        </h3>
        <div class="font-mono text-xs space-y-2">
          <div class="flex justify-between">
            <span class="text-zinc-500">To:</span>
            <span class="text-zinc-300"
              >{selectedScenario.transaction.to.slice(
                0,
                10,
              )}...{selectedScenario.transaction.to.slice(-8)}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Value:</span>
            <span class="text-zinc-300">
              {selectedScenario.transaction.value === "0"
                ? "0"
                : (parseInt(selectedScenario.transaction.value) / 1e18).toFixed(
                    4,
                  )} ETH
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Data:</span>
            <span class="text-zinc-300">
              {selectedScenario.transaction.data === "0x"
                ? "(empty)"
                : selectedScenario.transaction.data.slice(0, 10) + "..."}
            </span>
          </div>
        </div>
      </div>

      <!-- Guard Console -->
      {#if isAnalyzing}
        <div class="space-y-3">
          <h3
            class="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"
          >
            <Shield class="w-3.5 h-3.5" /> AI Guard Analysis
          </h3>
          <GuardConsole
            transactionData={{
              ...selectedScenario.transaction,
              from:
                $walletStore.address ||
                "0x0000000000000000000000000000000000000000",
            }}
            onComplete={handleAnalysisComplete}
          />
        </div>
      {/if}

      <!-- Result Summary -->
      {#if analysisResult}
        <div class="space-y-4">
          <!-- Verdict Banner -->
          <div
            class="p-4 rounded-2xl bg-{getRiskColor(
              analysisResult.overall.riskLevel,
            )}-500/10 border border-{getRiskColor(
              analysisResult.overall.riskLevel,
            )}-500/30"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                {#if analysisResult.overall.riskLevel === "low"}
                  <CheckCircle class="w-6 h-6 text-emerald-400" />
                {:else if analysisResult.overall.riskLevel === "high" || analysisResult.overall.riskLevel === "blocked"}
                  <XCircle class="w-6 h-6 text-rose-400" />
                {:else}
                  <AlertTriangle class="w-6 h-6 text-yellow-400" />
                {/if}
                <div>
                  <p class="font-bold text-white uppercase">
                    {analysisResult.overall.riskLevel} Risk
                  </p>
                  <p class="text-xs text-zinc-400">
                    {analysisResult.llmExplanation.short}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-black text-white">
                  {analysisResult.overall.score}
                </p>
                <p class="text-[9px] text-zinc-500 uppercase">/100</p>
              </div>
            </div>
          </div>

          <!-- LLM Explanation -->
          <div
            class="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3"
          >
            <h3
              class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
            >
              AI Explanation
            </h3>
            <p class="text-sm text-zinc-300 leading-relaxed">
              {analysisResult.llmExplanation.detailed}
            </p>
            <p class="text-xs text-orange-400 font-medium">
              💡 {analysisResult.llmExplanation.recommendation}
            </p>
          </div>

          <!-- Threat Tags -->
          {#if analysisResult.dimensions.threeD.threatTags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each analysisResult.dimensions.threeD.threatTags as tag}
                <span
                  class="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-[9px] font-bold uppercase"
                >
                  {tag.replace(/_/g, " ")}
                </span>
              {/each}
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-3 pt-4">
            <Button
              onclick={resetDemo}
              variant="ghost"
              class="h-12 rounded-xl border border-white/10 text-zinc-400"
            >
              Try Another
            </Button>
            <Button
              onclick={resetDemo}
              class="h-12 rounded-xl bg-orange-600 text-white"
            >
              Done
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
