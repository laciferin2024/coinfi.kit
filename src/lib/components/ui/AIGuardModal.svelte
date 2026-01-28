<script lang="ts">
  import {
    Shield,
    Lock,
    X,
    Globe,
    ArrowUpRight,
    Check,
    AlertCircle,
  } from "lucide-svelte"
  import { walletStore } from "$lib/stores/wallet"
  import GuardConsole from "./GuardConsole.svelte"
  import Button from "./Button.svelte"
  import DAppIcon from "./DAppIcon.svelte"
  import { fly } from "svelte/transition"
  import { DAPPS } from "$lib/data/dapps"

  interface Props {
    onClose: () => void
  }

  let { onClose }: Props = $props()

  let request = $derived($walletStore.externalRequest)
  let activeDapp = $derived(
    DAPPS.find((d) => d.domain === request?.origin) ||
      $walletStore.connectedDapps.find((d) => d.domain === request?.origin),
  )
  let status = $state<"simulating" | "ready" | "approving" | "success">(
    "simulating",
  )
  let verdict = $state<"safe" | "caution" | "high" | null>(null)

  function handleGuardComplete(v: "safe" | "caution" | "high") {
    verdict = v
    status = "ready"
  }

  async function handleApprove() {
    status = "approving"
    // Simulate signing
    await new Promise((resolve) => setTimeout(resolve, 1500))
    status = "success"

    // Simulate response to DApp (postMessage would happen here)
    console.log("DApp Request Approved")

    setTimeout(() => {
      walletStore.setExternalRequest(null)
      onClose()
    }, 1500)
  }

  function handleReject() {
    walletStore.setExternalRequest(null)
    onClose()
  }
</script>

{#if request}
  <div class="fixed inset-0 z-[200] flex items-end justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-md"
      onclick={handleReject}
    ></div>

    <!-- Modal Content -->
    <div
      class="relative w-full max-w-[400px] bg-zinc-950 rounded-t-[3rem] border-t border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      transition:fly={{ y: 800, duration: 400 }}
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="p-8 pb-4 border-b border-white/5 space-y-4 shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <DAppIcon
              src={activeDapp?.icon ||
                `https://www.google.com/s2/favicons?domain=${request?.origin}&sz=128`}
              name={activeDapp?.name || request?.origin || "DApp"}
              size="md"
            />
            <div>
              <h2
                class="text-xl font-black italic uppercase tracking-tighter text-white"
              >
                Approve Action
              </h2>
              <p class="text-[10px] text-zinc-500 font-mono italic">
                {request.origin}
              </p>
            </div>
          </div>
          <button
            onclick={handleReject}
            class="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div
          class="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"
            >
              <ArrowUpRight class="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p
                class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
              >
                Action Requested
              </p>
              <p class="text-sm font-bold text-white italic">
                Send Transaction
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-black text-white">$42.80</p>
            <p class="text-[9px] font-mono text-zinc-500 uppercase">
              Est. Value
            </p>
          </div>
        </div>
      </div>

      <!-- Main Section -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        {#if status === "simulating" || status === "ready"}
          <div class="space-y-4">
            <div class="flex items-center justify-between px-2">
              <h4
                class="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"
              >
                <Shield class="w-3.5 h-3.5" /> AI Guard Engine
              </h4>
              <div
                class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                ></span>
                Active
              </div>
            </div>
            <GuardConsole onComplete={handleGuardComplete} />
          </div>
        {/if}

        {#if status === "success"}
          <div
            class="py-12 flex flex-col items-center justify-center space-y-4"
            in:fly={{ y: 20, duration: 400 }}
          >
            <div
              class="w-20 h-20 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_-10px_#10B981]"
            >
              <Check class="w-10 h-10 text-black stroke-[3px]" />
            </div>
            <div class="text-center space-y-1">
              <h3
                class="text-2xl font-black italic uppercase text-white tracking-tighter"
              >
                Broadcast Success
              </h3>
              <p
                class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest"
              >
                Node bridge interaction complete
              </p>
            </div>
          </div>
        {/if}

        {#if status === "approving"}
          <div
            class="py-12 flex flex-col items-center justify-center space-y-6"
          >
            <div class="relative">
              <div
                class="w-20 h-20 rounded-full border-2 border-orange-500/20 flex items-center justify-center"
              >
                <Lock class="w-8 h-8 text-orange-500 animate-pulse" />
              </div>
              <svg class="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="38"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="239"
                  stroke-dashoffset="0"
                  class="text-orange-500 animate-[dash_2s_ease-in-out_infinite]"
                />
              </svg>
            </div>
            <p
              class="text-xs text-orange-500 font-bold uppercase tracking-[0.2em] italic animate-pulse"
            >
              Requesting Passkey Signature...
            </p>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      {#if status === "ready"}
        <div class="p-8 pt-4 grid grid-cols-5 gap-3 shrink-0">
          <Button
            onclick={handleReject}
            variant="ghost"
            class="col-span-2 h-14 rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-500 font-black italic uppercase tracking-widest text-[10px] hover:text-white"
          >
            Reject
          </Button>
          <Button
            onclick={handleApprove}
            class="col-span-3 h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20"
          >
            Approve Interaction →
          </Button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="sass">
  @keyframes dash
    0%
      stroke-dashoffset: 239
    50%
      stroke-dashoffset: 0
    100%
      stroke-dashoffset: -239
</style>
