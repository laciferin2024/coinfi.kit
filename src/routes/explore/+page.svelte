<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import { Search, ShieldCheck, TrendingUp, Globe, Clock } from "lucide-svelte"

  import { walletStore } from "$lib/stores/wallet"
  import type { Protocol } from "$lib/types"

  import { DAPPS } from "$lib/data/dapps"
  import DAppDetailModal from "$lib/components/dapps/DAppDetailModal.svelte"
  import DAppIcon from "$lib/components/ui/DAppIcon.svelte"

  let searchQuery = $state("")
  let activeTab = $state("All")
  let selectedDapp = $state<Protocol | null>(null)

  const categories = ["All", "DeFi", "NFTs", "Social", "Staking"]

  onMount(() => {
    if (browser) {
      const address = localStorage.getItem("wallet_address")
      const onboarded = localStorage.getItem("wallet_onboarded_status")

      if (!address || onboarded !== "true") {
        goto("/")
        return
      }

      if ($walletStore.isLocked) {
        walletStore.unlockWallet()
      }
    }
  })

  let filteredDapps = $derived(
    DAPPS.filter((dapp) => {
      const matchesSearch =
        dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dapp.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTab = activeTab === "All" || dapp.category === activeTab
      return matchesSearch && matchesTab
    }),
  )

  function openDapp(dapp: Protocol) {
    selectedDapp = dapp
  }

  function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
</script>

{#if selectedDapp}
  <DAppDetailModal
    protocol={selectedDapp}
    onClose={() => (selectedDapp = null)}
  />
{/if}

<div class="min-h-full">
  <div class="max-w-7xl mx-auto px-4">
    <header
      class="sticky top-0 z-30 py-6 bg-black/90 backdrop-blur-xl border-b border-white/5"
    >
      <h1
        class="text-2xl font-black italic uppercase tracking-tighter text-center text-white"
      >
        EXPLORE
      </h1>
      <p
        class="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 text-center"
      >
        AI-Guarded Ecosystem
      </p>
    </header>

    <main class="py-8 space-y-10 pb-24">
      <!-- Search -->
      <div class="space-y-6">
        <div class="relative">
          <Search
            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search protocols..."
            bind:value={searchQuery}
            class="w-full pl-12 pr-4 h-14 bg-zinc-900 border border-white/5 rounded-2xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <!-- Category Tabs -->
        <div class="flex gap-2 overflow-x-auto scrollbar-none">
          {#each categories as cat}
            <button
              onclick={() => (activeTab = cat)}
              class="px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors {activeTab ===
              cat
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-900 text-zinc-500 border border-white/5'}"
            >
              {cat}
            </button>
          {/each}
        </div>
      </div>

      <!-- Recent DApps -->
      {#if $walletStore.recentDapps && $walletStore.recentDapps.length > 0}
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-zinc-400">
            <Clock class="w-4 h-4" />
            <h3 class="text-[10px] font-black uppercase tracking-widest">
              Recently Used
            </h3>
          </div>
          <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-none px-1">
            {#each $walletStore.recentDapps as item}
              {@const fullDapp = DAPPS.find((d) => d.id === item.id)}
              {#if fullDapp}
                <button
                  onclick={() => openDapp(fullDapp)}
                  class="flex flex-col items-center gap-2 shrink-0 group"
                >
                  <div
                    class="group-hover:scale-105 transition-transform duration-300 shadow-glow"
                  >
                    <DAppIcon
                      src={fullDapp.icon}
                      name={fullDapp.name}
                      size="lg"
                    />
                  </div>
                  <span
                    class="text-[10px] font-bold text-zinc-300 truncate w-16 text-center"
                    >{fullDapp.name}</span
                  >
                  <span class="text-[8px] text-zinc-600 uppercase font-mono"
                    >{formatTimeAgo(item.lastUsed)}</span
                  >
                </button>
              {/if}
            {/each}
          </div>
        </section>
      {/if}

      <!-- Discovery Feed -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3
            class="text-sm font-black uppercase tracking-widest text-zinc-400 italic"
          >
            Discovery Feed
          </h3>
          <span
            class="px-2 py-1 rounded text-[10px] uppercase font-bold text-orange-400 border border-orange-500/30 bg-orange-500/5"
            >AI Audited</span
          >
        </div>

        <div class="grid grid-cols-1 gap-4">
          {#each filteredDapps as dapp, idx}
            <button
              onclick={() => openDapp(dapp)}
              class="p-5 rounded-[2rem] border transition-all duration-300 flex items-center gap-5 group cursor-pointer text-left {$walletStore.isHyperMode
                ? 'bg-orange-950/10 border-orange-500/20 hover:border-orange-400'
                : 'bg-zinc-900 border-white/5 hover:bg-zinc-800'}"
            >
              <div
                class="group-hover:scale-110 transition-transform shadow-glow"
              >
                <DAppIcon src={dapp.icon} name={dapp.name} size="lg" />
              </div>
              <div class="flex-1 space-y-1 overflow-hidden">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-zinc-100 italic">{dapp.name}</h4>
                  {#if dapp.verified}
                    <ShieldCheck class="w-4 h-4 text-orange-400 shrink-0" />
                  {/if}
                </div>
                <p class="text-xs text-zinc-500 leading-snug line-clamp-1">
                  {dapp.desc}
                </p>
                <div class="flex items-center gap-3 pt-1">
                  <span class="text-[10px] font-mono text-zinc-400 uppercase"
                    >{dapp.category}</span
                  >
                  <span
                    class="text-[10px] font-mono text-orange-400 flex items-center gap-1"
                  >
                    <TrendingUp class="w-3 h-3" />
                    {dapp.users}
                  </span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </section>
    </main>
  </div>
</div>
