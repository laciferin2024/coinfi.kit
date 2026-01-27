<script lang="ts">
  import { ShieldCheck, ShieldAlert, ArrowUpRight } from "lucide-svelte"
  import { walletStore, NETWORKS } from "$lib/stores/wallet"
  import type { Protocol } from "$lib/types"
  import Button from "$lib/components/ui/Button.svelte"

  interface Props {
    protocol: Protocol
    onClose: () => void
  }

  let { protocol, onClose }: Props = $props()

  function handleOpenApp() {
    walletStore.connectDapp({
      id: protocol.id,
      name: protocol.name,
      icon: protocol.icon,
      domain: protocol.domain,
    })
    walletStore.openDAppBrowser(protocol.id)
    onClose()
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
>
  <div
    class="bg-zinc-950 border border-white/10 w-full max-w-[400px] rounded-[2.5rem] overflow-hidden outline-none shadow-2xl"
  >
    <!-- Header -->
    <div class="p-8 pb-0 text-center">
      <div class="flex flex-col items-center gap-4">
        <div
          class="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-4xl shadow-[0_0_30px_-5px_var(--color-orange-500)]"
          style="--color-orange-500: #f97316"
        >
          {protocol.icon}
        </div>
        <div class="space-y-1">
          <h2
            class="text-2xl font-black italic uppercase tracking-tighter text-white"
          >
            {protocol.name}
          </h2>
          <p
            class="text-orange-500 font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            {protocol.category} • AI Verified Node
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-8 py-6 space-y-6">
      <!-- Intelligence -->
      <div
        class="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-2"
      >
        <h4
          class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
        >
          Protocol Intelligence
        </h4>
        <p class="text-xs text-zinc-300 leading-relaxed">{protocol.desc}</p>
      </div>

      <!-- Safety Audit -->
      <div class="space-y-3">
        <h4
          class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
        >
          Safety Audit
        </h4>
        <div
          class="flex items-center gap-3 p-4 rounded-2xl border {protocol.auditStatus ===
          'safe'
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/5 border-amber-500/20 text-amber-400'}"
        >
          {#if protocol.auditStatus === "safe"}
            <ShieldCheck class="w-5 h-5" />
          {:else}
            <ShieldAlert class="w-5 h-5" />
          {/if}
          <div class="flex-1">
            <p class="text-xs font-bold uppercase tracking-tight">
              {protocol.auditStatus === "safe"
                ? "Verified Safe"
                : "Heuristic Warning"}
            </p>
            <p class="text-[9px] opacity-70 leading-tight">
              {protocol.auditStatus === "safe"
                ? "AI audit confirms zero reported exploits for this smart contract."
                : "Behavioral anomalies detected. Unlimited mode caution advised."}
            </p>
          </div>
        </div>
      </div>

      <!-- Active Node Support -->
      <div class="space-y-3">
        <h4
          class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
        >
          Active Node Support
        </h4>
        <div class="flex flex-wrap gap-2">
          {#each protocol.networks as nid}
            {@const net = NETWORKS.find((n) => n.id === nid) || NETWORKS[0]}
            <span
              class="bg-zinc-900 border border-white/5 text-[9px] uppercase font-bold text-zinc-400 px-3 py-1 rounded-full flex items-center gap-1"
            >
              <span>{net.icon}</span>
              {net.name}
            </span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-8 pt-0 flex flex-col gap-3">
      <Button
        onclick={handleOpenApp}
        class="w-full h-14 rounded-2xl font-black italic uppercase tracking-[0.1em] transition-all {$walletStore.isHyperMode
          ? 'bg-orange-600 hover:bg-orange-700 shadow-lg text-white'
          : 'bg-white text-black hover:bg-zinc-200'}"
      >
        <span class="flex items-center gap-2">
          Launch App <ArrowUpRight class="w-4 h-4" />
        </span>
      </Button>
      <button
        onclick={onClose}
        class="w-full text-zinc-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors py-2"
      >
        Back to Explore
      </button>
    </div>
  </div>
</div>
