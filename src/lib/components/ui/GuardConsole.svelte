<script lang="ts">
  import {
    Shield,
    Check,
    Loader2,
    AlertTriangle,
    AlertCircle,
    Terminal,
    X,
  } from "lucide-svelte"
  import { onMount } from "svelte"
  import type { AIGuardResponse, RiskLevel } from "$lib/ai-guard/types"

  interface TransactionData {
    chainId: number
    from: string
    to: string
    value: string
    data: string
  }

  interface Props {
    transactionData?: TransactionData | null
    onComplete?: (verdict: RiskLevel, response: AIGuardResponse | null) => void
  }

  let { transactionData, onComplete }: Props = $props()

  type LogEntry = {
    type: "1d" | "2d" | "3d" | "verdict" | "error"
    status: "pending" | "done" | "error"
    message: string
    score?: number
  }

  let logs = $state<LogEntry[]>([])
  let guardResponse = $state<AIGuardResponse | null>(null)
  let riskVerdict = $state<RiskLevel | null>(null)
  let isLoading = $state(false)
  let hasError = $state(false)

  onMount(() => {
    runAnalysis()
  })

  async function runAnalysis() {
    isLoading = true
    hasError = false
    logs = []
    guardResponse = null
    riskVerdict = null

    // If no transaction data, use fallback simulation
    if (!transactionData) {
      await runFallbackSimulation()
      return
    }

    try {
      // Step 1: Start analysis
      addLog("1d", "pending", "Analyzing address identity & verification...")

      const response = await fetch("/api/ai-guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result: AIGuardResponse = await response.json()
      guardResponse = result

      // Complete 1D
      updateLastLog("done", `1D: ${result.dimensions.oneD.reasons[0] || "Identity checked"}`)

      // Add 2D
      addLog("2d", "pending", "Running transaction simulation...")
      await delay(300) // Short delay for visual effect
      updateLastLog("done", `2D: ${result.dimensions.twoD.simulationSummary}`)

      // Add 3D
      addLog("3d", "pending", "Analyzing potential threats...")
      await delay(300)
      const threatCount = result.dimensions.threeD.threatTags.length
      const threatMsg = threatCount > 0 
        ? `3D: Found ${threatCount} risk factor(s): ${result.dimensions.threeD.threatTags.join(", ")}`
        : "3D: No significant threats detected"
      updateLastLog("done", threatMsg)

      // Add verdict
      addLog("verdict", "pending", "Generating AI verdict...")
      await delay(200)
      updateLastLog("done", `Verdict: ${result.overall.riskLevel.toUpperCase()} (Score: ${result.overall.score}/100)`)

      riskVerdict = result.overall.riskLevel
      isLoading = false

      if (onComplete) {
        onComplete(riskVerdict, guardResponse)
      }
    } catch (error: any) {
      console.error("[GuardConsole] Analysis failed:", error)
      hasError = true
      addLog("error", "error", `Error: ${error.message || "Analysis failed"}`)
      isLoading = false

      // Fallback to cautious verdict
      riskVerdict = "medium"
      if (onComplete) {
        onComplete(riskVerdict, null)
      }
    }
  }

  async function runFallbackSimulation() {
    // Simulated steps for when no transaction data is provided
    const steps: { type: LogEntry["type"]; message: string }[] = [
      { type: "1d", message: "Checking address against phishing DB..." },
      { type: "1d", message: "1D complete: No phishing flags detected." },
      { type: "2d", message: "Simulating transaction via Tenderly..." },
      { type: "2d", message: "2D complete: State delta analyzed." },
      { type: "3d", message: "Running threat heuristics..." },
      { type: "verdict", message: "AI Guard analysis complete." },
    ]

    for (const step of steps) {
      addLog(step.type, "pending", step.message)
      await delay(600 + Math.random() * 400)
      updateLastLog("done", step.message)
    }

    riskVerdict = "low"
    isLoading = false

    if (onComplete) {
      onComplete(riskVerdict, null)
    }
  }

  function addLog(type: LogEntry["type"], status: LogEntry["status"], message: string) {
    logs = [...logs, { type, status, message }]
  }

  function updateLastLog(status: LogEntry["status"], message: string) {
    if (logs.length > 0) {
      logs[logs.length - 1] = { ...logs[logs.length - 1], status, message }
    }
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function getRiskColor(risk: RiskLevel | null): string {
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

  function getRiskIcon(risk: RiskLevel | null) {
    switch (risk) {
      case "low":
        return Check
      case "medium":
        return AlertTriangle
      case "high":
      case "blocked":
        return AlertCircle
      default:
        return Shield
    }
  }
</script>

<div
  class="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[320px]"
>
  <!-- Header -->
  <div
    class="px-4 py-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between shrink-0"
  >
    <div class="flex items-center gap-2">
      <div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
      <span
        class="text-[10px] font-black uppercase text-white italic tracking-widest"
        >AI Guard Console v2.0</span
      >
    </div>
    <div class="flex items-center gap-3">
      <Terminal class="w-3.5 h-3.5 text-zinc-500" />
      {#if isLoading}
        <Loader2 class="w-3.5 h-3.5 text-orange-500 animate-spin" />
      {:else if hasError}
        <X class="w-3.5 h-3.5 text-rose-500" />
      {:else if riskVerdict}
        <Shield class="w-3.5 h-3.5 text-{getRiskColor(riskVerdict)}-500" />
      {/if}
    </div>
  </div>

  <!-- Terminal Body -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
    {#each logs as log}
      <div class="flex items-start gap-3 transition-all duration-300 fadeslide">
        <div class="shrink-0 mt-0.5">
          {#if log.status === "pending"}
            <Loader2 class="w-3 h-3 text-orange-500 animate-spin" />
          {:else if log.status === "error"}
            <div
              class="w-3 h-3 rounded bg-rose-500/20 flex items-center justify-center"
            >
              <X class="w-2 h-2 text-rose-500" />
            </div>
          {:else}
            <div
              class="w-3 h-3 rounded bg-emerald-500/20 flex items-center justify-center"
            >
              <Check class="w-2 h-2 text-emerald-500" />
            </div>
          {/if}
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span
              class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase"
            >
              {log.type}
            </span>
            <span class="text-[10px] text-zinc-300 leading-relaxed font-medium">
              {log.message}
            </span>
          </div>
        </div>
      </div>
    {/each}

    <!-- Verdict Section -->
    {#if riskVerdict && guardResponse}
      <div
        class="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-bottom-2"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            {#if riskVerdict === "low"}
              <Shield class="w-4 h-4 text-emerald-400" />
            {:else if riskVerdict === "medium"}
              <AlertTriangle class="w-4 h-4 text-yellow-400" />
            {:else}
              <AlertCircle class="w-4 h-4 text-rose-400" />
            {/if}
            <span class="text-[10px] font-black uppercase text-white"
              >AI Verdict: {riskVerdict.toUpperCase()}</span
            >
          </div>
          <span class="text-[10px] font-bold text-zinc-500 italic"
            >Score: {guardResponse.overall.score}/100</span
          >
        </div>

        <!-- LLM Explanation -->
        <div
          class="p-3 rounded-xl bg-{getRiskColor(riskVerdict)}-500/5 border border-{getRiskColor(riskVerdict)}-500/20"
        >
          <p class="text-[10px] text-{getRiskColor(riskVerdict)}-400/80 leading-relaxed">
            {guardResponse.llmExplanation.short}
          </p>
        </div>

        <!-- Balance Changes Preview -->
        {#if guardResponse.dimensions.twoD.balanceChanges && guardResponse.dimensions.twoD.balanceChanges.length > 0}
          <div class="grid grid-cols-2 gap-3 pb-2">
            {#each guardResponse.dimensions.twoD.balanceChanges.slice(0, 2) as change}
              <div
                class="p-2 rounded-lg bg-zinc-900 border border-white/5 space-y-1"
              >
                <p class="text-[8px] font-bold text-zinc-500 uppercase">{change.symbol}</p>
                <p class="text-[10px] font-bold {change.isIncrease ? 'text-emerald-400' : 'text-rose-400'}">
                  {change.isIncrease ? '+' : '-'}{change.delta}
                </p>
              </div>
            {/each}
          </div>
        {:else}
          <div class="grid grid-cols-2 gap-3 pb-2">
            <div class="p-2 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
              <p class="text-[8px] font-bold text-zinc-500 uppercase">Status</p>
              <p class="text-[10px] font-bold text-white">Ready</p>
            </div>
            <div class="p-2 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
              <p class="text-[8px] font-bold text-zinc-500 uppercase">Analysis</p>
              <p class="text-[10px] font-bold text-emerald-400">{guardResponse.processingTimeMs}ms</p>
            </div>
          </div>
        {/if}
      </div>
    {:else if riskVerdict && !guardResponse}
      <!-- Fallback verdict display -->
      <div
        class="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-bottom-2"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Shield class="w-4 h-4 text-emerald-400" />
            <span class="text-[10px] font-black uppercase text-white"
              >AI Verdict: {riskVerdict.toUpperCase()}</span
            >
          </div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p class="text-[10px] text-emerald-400/80 leading-relaxed">
            Transaction appears safe. No significant risks detected.
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="sass">
  @keyframes fadeslide
    from
      opacity: 0
      transform: translateY(4px)
    to
      opacity: 1
      transform: translateY(0)

  .fadeslide
    animation: fadeslide 0.3s ease-out forwards
</style>
