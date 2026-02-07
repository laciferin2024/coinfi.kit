<script lang="ts">
  import {
    Shield,
    Lock,
    X,
    Globe,
    ArrowUpRight,
    Check,
    AlertCircle,
    AlertTriangle,
    MessageCircle, // New icon
  } from "lucide-svelte"
  import { walletStore } from "$lib/stores/wallet"
  import {
    wcStore,
    respondToRequest,
    approveSession,
    rejectSession,
  } from "$lib/walletconnect"
  import GuardConsole from "./GuardConsole.svelte"
  import ChatOverlay from "./ChatOverlay.svelte" // New import
  import Button from "./Button.svelte"
  import DAppIcon from "./DAppIcon.svelte"
  import { fly } from "svelte/transition"
  import { DAPPS } from "$lib/data/dapps"
  import type { AIGuardResponse, RiskLevel } from "$lib/ai-guard/types"
  import { Porto } from "porto"

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
  let verdict = $state<RiskLevel | null>(null)
  let guardResponse = $state<AIGuardResponse | null>(null)
  let showChat = $state(false) // New state

  // Extract transaction data from request
  let transactionData = $derived(() => {
    if (!request || request.type !== "eth_sendTransaction") return null
    const payload = request.payload as any
    return {
      chainId:
        $walletStore.activeNetworkId === "base-sepolia"
          ? 84532
          : $walletStore.activeNetworkId === "optimism-sepolia"
            ? 11155420
            : $walletStore.activeNetworkId === "odyssey"
              ? 911867
              : 84532,
      from: $walletStore.address || "",
      to: payload?.to || "",
      value: payload?.value || "0",
      data: payload?.data || "0x",
    }
  })

  function handleGuardComplete(v: RiskLevel, response: AIGuardResponse | null) {
    verdict = v
    guardResponse = response
    status = "ready"
  }

  async function handleApprove() {
    status = "approving"

    try {
      // Initialize Porto
      const porto = Porto.create()

      // Re-connect to ensure we have the session (usually instant if already allowed)
      // We use the store address to hint which account we expect, but Porto handles the auth flow.
      const accounts = await porto.provider.request({
        method: "eth_requestAccounts",
      })
      const address = accounts[0]

      if (
        !address ||
        address.toLowerCase() !== $walletStore.address?.toLowerCase()
      ) {
        throw new Error("Porto session mismatch. Please reconnect wallet.")
      }

      let result: any

      if (request?.type === "session_proposal") {
        // Handle WalletConnect Session Pairing
        result = await approveSession()
        if (!result) throw new Error("Failed to approve session")
      } else if (
        request?.type === "personal_sign" ||
        request?.type === "eth_sign"
      ) {
        const payload = request.payload as string[]
        const message = payload[0]
        result = await porto.provider.request({
          method: "personal_sign",
          params: [message, address],
        })
      } else if (request?.type === "eth_sendTransaction") {
        const payload = request.payload as any
        result = await porto.provider.request({
          method: "eth_sendTransaction",
          params: [payload],
        })
      } else if (
        request?.type === "eth_signTypedData" ||
        request?.type === "eth_signTypedData_v4"
      ) {
        const params = request.payload as any
        result = await porto.provider.request({
          method: "eth_signTypedData_v4", // Defaulting to v4 for safety
          params: params,
        })
      } else {
        throw new Error(`Unsupported method: ${request?.type}`)
      }

      status = "success"

      // Respond to WalletConnect if this was a WC request (Transaction/Sign)
      if ($wcStore.pendingRequest) {
        await respondToRequest(true, result)
      }
      // Note: approveSession() already handles the response for proposals internally

      console.log("[AI Guard] Action Approved > Result:", result)

      setTimeout(() => {
        walletStore.setExternalRequest(null)
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error("[AI Guard] Approval Failed:", error)
      // Determine if we should show error state or just close
      // For now, let's reset to ready but maybe show an alert (future improvement)
      // or just close if it's a user rejection.
      if (error.message.includes("User rejected")) {
        await handleReject()
      } else {
        // Show error momentarily?
        status = "ready" // Go back to ready state so they can try again
        // In a real app we'd show an error message toast here.
      }
    }
  }

  async function handleReject() {
    // Respond to WalletConnect if this was a WC request
    if ($wcStore.pendingRequest) {
      await respondToRequest(false)
    }
    // Handle Session Rejection
    if ($wcStore.pendingProposal) {
      await rejectSession()
    }

    walletStore.setExternalRequest(null)
    onClose()
  }

  function getVerdictColor() {
    if (!verdict) return "orange"
    switch (verdict) {
      case "low":
        return "emerald"
      case "medium":
        return "yellow"
      case "high":
        return "rose"
      case "blocked":
        return "red"
      default:
        return "orange"
    }
  }
</script>

{#if request}
  <div class="fixed inset-0 z-[200] flex items-end justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-md"
      role="button"
      tabindex="0"
      onclick={handleReject}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleReject()
      }}
    ></div>

    <!-- Modal Content -->
    <div
      class="relative w-full max-w-[400px] bg-zinc-950 rounded-t-[3rem] border-t border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      transition:fly={{ y: 800, duration: 400 }}
      role="button"
      tabindex="0"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") e.stopPropagation()
      }}
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
            onclick={() => (showChat = !showChat)}
            class="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors mr-2"
          >
            <MessageCircle class="w-5 h-5" />
          </button>
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
                {guardResponse?.overall.summary || "Transaction Request"}
              </p>
              <p class="text-sm font-bold text-white italic">
                {#if request.type === "session_proposal"}
                  Connect Wallet
                {:else if request.type === "eth_sendTransaction"}
                  Send Transaction
                {:else}
                  {request.type}
                {/if}
              </p>
            </div>
          </div>
          <div class="text-right">
            {#if transactionData()?.value && transactionData()?.value !== "0"}
              <p class="text-lg font-black text-white">
                {(parseInt(transactionData()?.value || "0") / 1e18).toFixed(4)} ETH
              </p>
              <p class="text-[9px] font-mono text-zinc-500 uppercase">Value</p>
            {:else}
              <p class="text-sm font-medium text-zinc-400">Contract Call</p>
            {/if}
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
            <GuardConsole
              transactionData={transactionData()}
              onComplete={handleGuardComplete}
            />
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

    <!-- Chat Overlay -->
    <ChatOverlay
      visible={showChat}
      onClose={() => (showChat = false)}
      context={{
        chainId: transactionData()?.chainId || 0,
        from: transactionData()?.from || "",
        to: transactionData()?.to || "",
        value: transactionData()?.value || "0",
        data: transactionData()?.data || "0x",
      }}
    />
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
