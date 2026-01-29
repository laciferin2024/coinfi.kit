<script lang="ts">
  import { walletStore, GLOBAL_NETWORK, NETWORKS } from "$lib/stores/wallet"
  import { ChevronDown } from "lucide-svelte"

  let isOpen = $state(false)

  function selectNetwork(id: string) {
    walletStore.setActiveNetworkId(id)
    isOpen = false
  }

  const allNetworks = [GLOBAL_NETWORK, ...NETWORKS]
</script>

<div class="relative">
  <button
    onclick={() => (isOpen = !isOpen)}
    class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 hover:border-orange-500/30 transition-colors"
  >
    <span class="text-lg">
      {allNetworks.find((n) => n.id === $walletStore.activeNetworkId)?.icon ||
        "🌐"}
    </span>
    <span class="text-xs font-medium text-zinc-300 hidden sm:inline">
      {allNetworks.find((n) => n.id === $walletStore.activeNetworkId)?.name ||
        "All Networks"}
    </span>
    <ChevronDown class="w-3 h-3 text-zinc-500" />
  </button>

  {#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-40" onclick={() => (isOpen = false)}></div>
    <div
      class="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-white/10 shadow-xl z-50 overflow-hidden"
    >
      {#each allNetworks as network}
        <button
          onclick={() => selectNetwork(network.id)}
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left {$walletStore.activeNetworkId ===
          network.id
            ? 'bg-orange-500/10'
            : ''}"
        >
          <span class="text-xl">{network.icon}</span>
          <span class="text-sm font-medium text-zinc-200">{network.name}</span>
          {#if $walletStore.activeNetworkId === network.id}
            <span class="ml-auto w-2 h-2 rounded-full bg-orange-500"></span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
