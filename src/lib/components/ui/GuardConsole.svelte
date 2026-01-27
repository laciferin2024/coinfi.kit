<script lang="ts">
  import {
    Shield,
    Check,
    Loader2,
    AlertTriangle,
    Info,
    Terminal,
  } from "lucide-svelte"
  import { onMount } from "svelte"

  interface Props {
    onComplete?: (verdict: "safe" | "caution" | "high") => void
  }

  let { onComplete }: Props = $props()

  let logs = $state<
    Array<{
      type: "1d" | "2d" | "3d" | "verdict"
      status: "pending" | "done" | "error"
      message: string
    }>
  >([])
  let currentStep = $state(0)
  let riskVerdict = $state<"safe" | "caution" | "high" | null>(null)

  const steps = [
    {
      type: "1d",
      message: "Checking address against phishing and reputation DB...",
    },
    {
      type: "1d",
      message: "1D complete: Contract verified, no phishing flags.",
    },
    { type: "2d", message: "Simulating transaction via Tenderly Node..." },
    {
      type: "2d",
      message: "2D complete: State delta analyzed. No unauthorized transfers.",
    },
    { type: "3d", message: "Running generic exploit & MEV checks (beta)..." },
    { type: "verdict", message: "Rendering AI Guard verdict..." },
  ]

  onMount(() => {
    runSimulation()
  })

  async function runSimulation() {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      logs = [
        ...logs,
        { type: step.type as any, status: "pending", message: step.message },
      ]

      // Simulate processing time
      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 1000),
      )

      logs[logs.length - 1].status = "done"
      currentStep = i + 1
    }

    // Set final verdict
    riskVerdict = "safe"
    if (onComplete) onComplete(riskVerdict)
  }
</script>

<div
  class="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[300px]"
>
  <!-- Header -->
  <div
    class="px-4 py-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between shrink-0"
  >
    <div class="flex items-center gap-2">
      <div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
      <span
        class="text-[10px] font-black uppercase text-white italic tracking-widest"
        >AI Guard Console v1.0</span
      >
    </div>
    <div class="flex items-center gap-3">
      <Terminal class="w-3.5 h-3.5 text-zinc-500" />
      <div
        class="w-3.5 h-3.5 rounded-full bg-zinc-800 flex items-center justify-center"
      >
        <span class="text-[8px] font-bold text-zinc-500">?</span>
      </div>
    </div>
  </div>

  <!-- Terminal Body -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
    {#each logs as log}
      <div class="flex items-start gap-3 transition-all duration-300 fadeslide">
        <div class="shrink-0 mt-0.5">
          {#if log.status === "pending"}
            <Loader2 class="w-3 h-3 text-orange-500 animate-spin" />
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

    {#if riskVerdict}
      <div
        class="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-bottom-2"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Shield class="w-4 h-4 text-emerald-400" />
            <span class="text-[10px] font-black uppercase text-white"
              >AI Verdict: SAFE</span
            >
          </div>
          <span class="text-[10px] font-bold text-zinc-500 italic"
            >99.8% Confidence</span
          >
        </div>

        <div
          class="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
        >
          <p class="text-[10px] text-emerald-400/80 leading-relaxed">
            Simulation confirms expected state changes. All destination
            addresses have established reputation. Interaction considered
            secure.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 pb-2">
          <div
            class="p-2 rounded-lg bg-zinc-900 border border-white/5 space-y-1"
          >
            <p class="text-[8px] font-bold text-zinc-500 uppercase">Inbound</p>
            <p class="text-[10px] font-bold text-white">0.00 USDC</p>
          </div>
          <div
            class="p-2 rounded-lg bg-zinc-900 border border-white/5 space-y-1"
          >
            <p class="text-[8px] font-bold text-zinc-500 uppercase">Outbound</p>
            <p class="text-[10px] font-bold text-rose-400">- 50.00 USDC</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes fadeslide {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fadeslide {
    animation: fadeslide 0.3s ease-out forwards;
  }
</style>
