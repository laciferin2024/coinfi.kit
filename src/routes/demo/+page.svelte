<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import { fly, fade, scale } from "svelte/transition"
  import {
    Shield,
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Brain,
    Eye,
    Lock,
    Cpu,
    Fingerprint,
    ArrowRight,
  } from "lucide-svelte"

  import { walletStore, activeNetwork } from "$lib/stores/wallet"
  import type { AIGuardResponse, RiskLevel } from "$lib/ai-guard/types"
  import GuardConsole from "$lib/components/ui/GuardConsole.svelte"

  // Demo scenarios with realistic data
  const SCENARIOS = [
    {
      id: "safe",
      title: "Safe Transfer",
      subtitle: "Send ETH to known address",
      emoji: "✅",
      gradient: "from-emerald-600 to-cyan-500",
      description: "0.001 ETH to vitalik.eth",
      expectedRisk: "LOW" as const,
      transaction: {
        chainId: 84532,
        from: "",
        to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        value: "1000000000000000",
        data: "0x",
      },
    },
    {
      id: "risky",
      title: "Dangerous Approval",
      subtitle: "Unlimited token access",
      emoji: "🚨",
      gradient: "from-rose-600 to-orange-500",
      description: "Approve ∞ USDC to unverified contract",
      expectedRisk: "HIGH" as const,
      transaction: {
        chainId: 84532,
        from: "",
        to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        value: "0",
        data: "0x095ea7b3000000000000000000000000abcdef1234567890abcdef1234567890abcdef12ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      },
    },
    {
      id: "defi",
      title: "DeFi Swap",
      subtitle: "Uniswap interaction",
      emoji: "🦄",
      gradient: "from-purple-600 to-pink-500",
      description: "Swap 0.1 ETH on verified DEX",
      expectedRisk: "MEDIUM" as const,
      transaction: {
        chainId: 84532,
        from: "",
        to: "0x2626664c2603336E57B271c5C0b26F421741e481",
        value: "100000000000000000",
        data: "0x5ae401dc",
      },
    },
  ]

  let phase = $state<"intro" | "select" | "scanning" | "result">("intro")
  let selectedScenario = $state<(typeof SCENARIOS)[number] | null>(null)
  let guardResponse = $state<AIGuardResponse | null>(null)
  let introStep = $state(0)

  const introSteps = [
    { icon: Eye, text: "1D: Identity Verification", color: "text-cyan-400" },
    { icon: Cpu, text: "2D: Transaction Simulation", color: "text-purple-400" },
    { icon: Brain, text: "3D: AI Threat Analysis", color: "text-rose-400" },
  ]

  onMount(() => {
    if (browser && !$walletStore.address) {
      goto("/")
      return
    }

    // Animate intro steps
    const timer = setInterval(() => {
      introStep++
      if (introStep >= introSteps.length) {
        clearInterval(timer)
        setTimeout(() => (phase = "select"), 800)
      }
    }, 600)

    return () => clearInterval(timer)
  })

  function selectScenario(scenario: (typeof SCENARIOS)[number]) {
    selectedScenario = {
      ...scenario,
      transaction: {
        ...scenario.transaction,
        from: $walletStore.address || "",
      },
    }
    phase = "scanning"
    guardResponse = null
  }

  function handleGuardComplete(
    verdict: RiskLevel,
    response: AIGuardResponse | null,
  ) {
    guardResponse = response
    setTimeout(() => (phase = "result"), 300)
  }

  function reset() {
    phase = "select"
    selectedScenario = null
    guardResponse = null
  }

  function getRiskColor(risk: string) {
    switch (risk?.toLowerCase()) {
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

<div class="min-h-screen bg-black overflow-hidden relative">
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <div
      class="absolute top-1/4 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse"
    ></div>
    <div
      class="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"
      style="animation-delay: 1s"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/5 to-purple-500/5 rounded-full blur-[100px]"
    ></div>
  </div>

  <!-- Content -->
  <div
    class="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
  >
    <!-- INTRO PHASE -->
    {#if phase === "intro"}
      <div class="text-center space-y-8" in:fade={{ duration: 300 }}>
        <div class="relative inline-block">
          <div
            class="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 rounded-3xl blur-xl opacity-50 animate-pulse"
          ></div>
          <div
            class="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-2xl"
          >
            <Shield class="w-12 h-12 text-white" />
          </div>
        </div>

        <div class="space-y-2">
          <h1
            class="text-4xl font-black italic uppercase tracking-tighter text-white"
          >
            AI Guard
          </h1>
          <p class="text-zinc-500 text-sm font-medium">
            3-Dimensional Transaction Security
          </p>
        </div>

        <div class="space-y-3 pt-4">
          {#each introSteps as step, i}
            {#if i <= introStep}
              <div
                class="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-sm"
                in:fly={{ y: 20, duration: 400, delay: i * 100 }}
              >
                <div
                  class="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"
                >
                  <svelte:component
                    this={step.icon}
                    class="w-5 h-5 {step.color}"
                  />
                </div>
                <span class="text-sm font-bold text-white">{step.text}</span>
                {#if i < introStep}
                  <CheckCircle class="w-4 h-4 text-emerald-400 ml-auto" />
                {:else}
                  <div
                    class="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin ml-auto"
                  ></div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- SELECT PHASE -->
    {#if phase === "select"}
      <div class="w-full max-w-md space-y-8" in:fade={{ duration: 300 }}>
        <div class="text-center space-y-2">
          <h2
            class="text-2xl font-black italic uppercase tracking-tighter text-white"
          >
            Choose Scenario
          </h2>
          <p class="text-xs text-zinc-500">
            See AI Guard analyze different transaction types
          </p>
        </div>

        <div class="space-y-4">
          {#each SCENARIOS as scenario, i}
            <button
              onclick={() => selectScenario(scenario)}
              class="w-full group relative overflow-hidden"
              in:fly={{ y: 30, duration: 400, delay: i * 100 }}
            >
              <div
                class="absolute inset-0 bg-gradient-to-r {scenario.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"
              ></div>
              <div
                class="relative p-5 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/30 transition-all duration-300 flex items-center gap-4"
              >
                <div class="text-4xl">{scenario.emoji}</div>
                <div class="flex-1 text-left">
                  <h3 class="font-black text-white text-lg">
                    {scenario.title}
                  </h3>
                  <p class="text-xs text-zinc-500">{scenario.subtitle}</p>
                  <p class="text-[10px] text-zinc-600 mt-1 font-mono">
                    {scenario.description}
                  </p>
                </div>
                <div
                  class="px-3 py-1 rounded-lg bg-gradient-to-r {scenario.gradient} text-[10px] font-black text-white uppercase"
                >
                  {scenario.expectedRisk}
                </div>
                <ArrowRight
                  class="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                />
              </div>
            </button>
          {/each}
        </div>

        <div class="text-center pt-4">
          <a
            href="/wallet"
            class="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Back to Wallet
          </a>
        </div>
      </div>
    {/if}

    <!-- SCANNING PHASE -->
    {#if phase === "scanning" && selectedScenario}
      <div class="w-full max-w-md space-y-6" in:fade={{ duration: 300 }}>
        <div class="text-center space-y-2">
          <div class="text-4xl">{selectedScenario.emoji}</div>
          <h2 class="text-xl font-black uppercase text-white">
            {selectedScenario.title}
          </h2>
          <p class="text-xs text-zinc-500 font-mono">
            {selectedScenario.description}
          </p>
        </div>

        <GuardConsole
          transactionData={selectedScenario.transaction}
          onComplete={handleGuardComplete}
        />

        <button
          onclick={reset}
          class="w-full text-xs text-zinc-600 hover:text-white transition-colors py-2"
        >
          Cancel
        </button>
      </div>
    {/if}

    <!-- RESULT PHASE -->
    {#if phase === "result" && guardResponse}
      <div
        class="w-full max-w-md space-y-6"
        in:scale={{ start: 0.95, duration: 400 }}
      >
        <!-- Result Header -->
        <div class="text-center space-y-4">
          <div class="relative inline-block">
            {#if guardResponse.overall.riskLevel === "low"}
              <div
                class="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-50 animate-pulse"
              ></div>
              <div
                class="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center"
              >
                <CheckCircle class="w-10 h-10 text-white" />
              </div>
            {:else if guardResponse.overall.riskLevel === "high" || guardResponse.overall.riskLevel === "blocked"}
              <div
                class="absolute inset-0 bg-rose-500 rounded-full blur-xl opacity-50 animate-pulse"
              ></div>
              <div
                class="relative w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center"
              >
                <XCircle class="w-10 h-10 text-white" />
              </div>
            {:else}
              <div
                class="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-50 animate-pulse"
              ></div>
              <div
                class="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"
              >
                <AlertTriangle class="w-10 h-10 text-white" />
              </div>
            {/if}
          </div>

          <div>
            <h2 class="text-3xl font-black uppercase text-white tracking-tight">
              {guardResponse.overall.riskLevel} Risk
            </h2>
            <div class="flex items-center justify-center gap-2 mt-2">
              <span class="text-5xl font-black text-white"
                >{guardResponse.overall.score}</span
              >
              <span class="text-xl text-zinc-600">/100</span>
            </div>
          </div>
        </div>

        <!-- AI Explanation Card -->
        <div
          class="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4"
        >
          <div class="flex items-center gap-2">
            <Brain class="w-4 h-4 text-purple-400" />
            <span
              class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
              >AI Analysis</span
            >
          </div>

          <p class="text-sm text-zinc-300 leading-relaxed">
            {guardResponse.llmExplanation.detailed}
          </p>

          <div
            class="p-3 rounded-xl bg-{getRiskColor(
              guardResponse.overall.riskLevel,
            )}-500/10 border border-{getRiskColor(
              guardResponse.overall.riskLevel,
            )}-500/30"
          >
            <p
              class="text-xs text-{getRiskColor(
                guardResponse.overall.riskLevel,
              )}-400 font-medium"
            >
              💡 {guardResponse.llmExplanation.recommendation}
            </p>
          </div>
        </div>

        <!-- Threat Tags -->
        {#if guardResponse.dimensions.threeD.threatTags.length > 0}
          <div class="flex flex-wrap gap-2 justify-center">
            {#each guardResponse.dimensions.threeD.threatTags as tag}
              <span
                class="px-3 py-1.5 rounded-full bg-zinc-800 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase"
              >
                {tag.replace(/_/g, " ")}
              </span>
            {/each}
          </div>
        {/if}

        <!-- Dimension Scores -->
        <div class="grid grid-cols-3 gap-3">
          <div
            class="p-3 rounded-xl bg-zinc-900 border border-white/5 text-center"
          >
            <Eye class="w-4 h-4 text-cyan-400 mx-auto" />
            <p class="text-lg font-black text-white mt-1">
              {guardResponse.dimensions.oneD.score}
            </p>
            <p class="text-[9px] text-zinc-600 uppercase">Identity</p>
          </div>
          <div
            class="p-3 rounded-xl bg-zinc-900 border border-white/5 text-center"
          >
            <Cpu class="w-4 h-4 text-purple-400 mx-auto" />
            <p class="text-lg font-black text-white mt-1">
              {guardResponse.dimensions.twoD.score}
            </p>
            <p class="text-[9px] text-zinc-600 uppercase">Simulation</p>
          </div>
          <div
            class="p-3 rounded-xl bg-zinc-900 border border-white/5 text-center"
          >
            <Brain class="w-4 h-4 text-rose-400 mx-auto" />
            <p class="text-lg font-black text-white mt-1">
              {guardResponse.dimensions.threeD.score}
            </p>
            <p class="text-[9px] text-zinc-600 uppercase">Threats</p>
          </div>
        </div>

        <!-- Action Button -->
        <button
          onclick={reset}
          class="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black uppercase tracking-widest text-sm hover:from-orange-500 hover:to-rose-500 transition-all"
        >
          Try Another Scenario
        </button>

        <p class="text-center text-[10px] text-zinc-600">
          Processed in {guardResponse.processingTimeMs}ms
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
  }
</style>
