<script lang="ts">
  import { walletStore } from "$lib/stores/wallet"
  import { Zap } from "lucide-svelte"
</script>

{#if $walletStore.isHyperMode}
  <div
    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
  >
    <Zap class="w-3.5 h-3.5 text-orange-500 fill-current" />
    <span class="text-[9px] font-black uppercase tracking-wider text-orange-500"
      >HYPER</span
    >
  </div>
{:else}
  <button
    onclick={() => walletStore.setHyperMode(true)}
    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/5 hover:border-orange-500/30 transition-colors"
  >
    <Zap class="w-3.5 h-3.5 text-zinc-500" />
    <span class="text-[9px] font-bold uppercase tracking-wider text-zinc-500"
      >LITE</span
    >
  </button>
{/if}
