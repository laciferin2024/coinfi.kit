<script lang="ts">
  import { onMount } from "svelte"
  import {
    Zap,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    Info,
  } from "lucide-svelte"

  let status = $state("idle")
  let amount = $state("0.5")
  let recipients = $state(
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  )
  let demoMode = $state<"safe" | "scam">("safe")

  function handleDisperse() {
    status = "sending"

    const channel = new BroadcastChannel("dapp-channel")

    if (demoMode === "safe") {
      // Real Disperse.app contract call (disperseEther)
      // Method: disperseEther(address[], uint256[])
      // For demo, we just send a simple transaction to the contract
      channel.postMessage({
        type: "eth_sendTransaction",
        origin: "disperse.app",
        payload: {
          to: "0xD152f549545093347A162Dce210e7293f1452150",
          value: (parseFloat(amount) * 1e18).toString(16),
          data: "0x", // In a real app, this would be the encoded disperseEther call
        },
      })
    } else {
      // Malicious scenario: Hidden drainer / suspect address
      channel.postMessage({
        type: "eth_sendTransaction",
        origin: "disperse.app",
        payload: {
          to: "0xdeadbeef00000000000000000000000000000000",
          value: (parseFloat(amount) * 1e18).toString(16),
          data: "0xa9059cbb000000000000000000000000deadbeef00000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // approve(deadbeef, max)
        },
      })
    }

    setTimeout(() => {
      status = "waiting"
    }, 500)
  }

  onMount(() => {
    const channel = new BroadcastChannel("dapp-channel")
    return () => channel.close()
  })
</script>

<div
  class="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-100 selection:bg-blue-500/30"
>
  <div
    class="w-full max-w-lg bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col"
  >
    <!-- Header -->
    <div class="p-8 border-b border-white/5 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"
        >
          <Zap class="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 class="font-black text-2xl tracking-tighter uppercase italic">
            Disperse.app
          </h1>
          <p
            class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest"
          >
            Sepolia Beta • Multi-send Tool
          </p>
        </div>
      </div>
    </div>

    <!-- Demo Selector -->
    <div class="px-8 pt-6">
      <div
        class="bg-black/40 p-1.5 rounded-2xl border border-white/5 flex gap-2"
      >
        <button
          onclick={() => (demoMode = "safe")}
          class="flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 {demoMode ===
          'safe'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            : 'text-zinc-500 hover:text-zinc-300'}"
        >
          <ShieldCheck class="w-4 h-4" />
          <span class="text-xs font-black uppercase tracking-widest"
            >Safe Demo</span
          >
        </button>
        <button
          onclick={() => (demoMode = "scam")}
          class="flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 {demoMode ===
          'scam'
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
            : 'text-zinc-500 hover:text-zinc-300'}"
        >
          <ShieldAlert class="w-4 h-4" />
          <span class="text-xs font-black uppercase tracking-widest"
            >Scam Demo</span
          >
        </button>
      </div>
    </div>

    <!-- Main Form -->
    <div class="p-8 space-y-6">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label
            class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
            >Recipients (One per line)</label
          >
          <span class="text-[10px] font-mono text-zinc-600 italic">0x...</span>
        </div>
        <textarea
          bind:value={recipients}
          rows="4"
          placeholder="0x123...&#10;0x456..."
          class="w-full p-4 rounded-2xl border border-white/5 bg-black/40 text-sm font-mono text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
        ></textarea>
      </div>

      <div class="space-y-3">
        <label
          class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
          >Total ETH Amount</label
        >
        <div class="relative">
          <input
            type="number"
            bind:value={amount}
            step="0.01"
            class="w-full px-5 py-4 rounded-2xl border border-white/5 bg-black/40 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <div
            class="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-500 uppercase tracking-widest"
          >
            ETH
          </div>
        </div>
      </div>

      <button
        onclick={handleDisperse}
        disabled={status !== "idle"}
        class="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg uppercase italic tracking-tighter transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/10 active:scale-[0.98]"
      >
        {#if status === "idle"}
          <Zap class="w-5 h-5 fill-current" />
          {demoMode === "safe" ? "Disperse Ether" : "Attack Wallet"}
        {:else if status === "sending"}
          <div
            class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
          Processing...
        {:else}
          <ShieldCheck class="w-5 h-5" /> Check Wallet
        {/if}
      </button>

      {#if status === "waiting"}
        <div
          class="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-4 animate-pulse"
        >
          <Info class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-xs font-bold text-orange-200">Transaction Pending</p>
            <p
              class="text-[10px] text-orange-200/60 leading-relaxed uppercase tracking-wide"
            >
              Please confirm the request in your Coin OS wallet tab.
            </p>
          </div>
        </div>
      {/if}

      <div class="pt-4 border-t border-white/5">
        <div class="flex items-center gap-2 text-zinc-600">
          <AlertTriangle class="w-3 h-3" />
          <p
            class="text-[9px] font-bold uppercase tracking-widest leading-none"
          >
            AI protection active for this interaction
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
