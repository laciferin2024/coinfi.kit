<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import {
    ArrowUpRight,
    ArrowDownLeft,
    Inbox,
    RefreshCw,
    Loader2,
  } from "lucide-svelte"
  import MobileWrapper from "$lib/components/layout/MobileWrapper.svelte"
  import {
    walletStore,
    GLOBAL_NETWORK,
    NETWORKS,
    activeNetwork,
  } from "$lib/stores/wallet"
  import { fetchTransactionHistory } from "$lib/utils/blockchain-utils"
  import type { Activity } from "$lib/types"

  let loading = $state(false)

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

      sync()
    }
  })

  async function sync() {
    if (!$walletStore.address) return
    loading = true
    try {
      const networkId =
        $walletStore.activeNetworkId === "all"
          ? "optimism-sepolia"
          : $walletStore.activeNetworkId
      const history = await fetchTransactionHistory(
        $walletStore.address,
        networkId,
      )
      walletStore.syncActivities(history)
    } catch (e) {
      console.warn("[Activity] History Sync Failed:", e)
    } finally {
      setTimeout(() => (loading = false), 800)
    }
  }

  function handleFilterChange(id: string) {
    walletStore.setActiveNetworkId(id)
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // Group activities by date
  let grouped = $derived(
    (() => {
      let list = [...$walletStore.activities]
      if ($walletStore.activeNetworkId !== "all") {
        list = list.filter((a) => a.network === $activeNetwork.name)
      }
      list.sort((a, b) => b.timestamp - a.timestamp)

      const result: Record<string, Activity[]> = {}
      for (const act of list) {
        const key = formatDate(act.timestamp)
        if (!result[key]) result[key] = []
        result[key].push(act)
      }
      return result
    })(),
  )
</script>

<MobileWrapper class="bg-zinc-950">
  <header
    class="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 pt-6 pb-2 px-6"
  >
    <div class="flex justify-between items-end mb-4">
      <div>
        <h1
          class="text-2xl font-bold text-white italic uppercase tracking-tighter"
        >
          History
        </h1>
        <p class="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
          {$walletStore.activeNetworkId === "all"
            ? "Unified Activity Feed"
            : `${$activeNetwork.name} Node logs`}
        </p>
      </div>
      <button
        onclick={sync}
        disabled={loading}
        class="p-2.5 rounded-xl bg-zinc-900 border border-white/5 disabled:opacity-50"
      >
        <RefreshCw
          class="w-4 h-4 {loading
            ? 'animate-spin text-orange-500'
            : 'text-zinc-400'}"
        />
      </button>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
      <button
        onclick={() => handleFilterChange(GLOBAL_NETWORK.id)}
        class="px-4 py-2 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap {$walletStore.activeNetworkId ===
        'all'
          ? 'bg-orange-600 border-orange-500 text-white'
          : 'bg-zinc-900 border-white/5 text-zinc-500'}"
      >
        All Nodes
      </button>
      {#each NETWORKS as n}
        <button
          onclick={() => handleFilterChange(n.id)}
          class="px-4 py-2 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap {$walletStore.activeNetworkId ===
          n.id
            ? 'bg-orange-600 border-orange-500 text-white'
            : 'bg-zinc-900 border-white/5 text-zinc-500'}"
        >
          {n.name}
        </button>
      {/each}
    </div>
  </header>

  <main class="px-6 py-8 pb-24 relative">
    {#if loading}
      <div
        class="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px] z-10 rounded-3xl flex items-center justify-center"
      >
        <Loader2 class="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    {/if}

    {#if Object.keys(grouped).length === 0}
      <div
        class="text-center py-20 text-zinc-500 uppercase text-xs font-bold tracking-widest"
      >
        <Inbox class="w-12 h-12 mx-auto mb-4 opacity-20" />
        No history discovered
      </div>
    {:else}
      <div class="space-y-10">
        {#each Object.entries(grouped) as [date, items]}
          <div class="space-y-4">
            <h3
              class="text-[10px] font-black uppercase tracking-widest text-zinc-600 pl-4 border-l border-orange-500/30 ml-2"
            >
              {date}
            </h3>
            {#each items as activity}
              <div
                class="p-4 rounded-[2rem] bg-zinc-900/40 border border-white/5 flex items-center justify-between group hover:bg-zinc-900/80 transition-all cursor-pointer"
                onclick={() =>
                  activity.explorerUrl &&
                  window.open(activity.explorerUrl, "_blank")}
              >
                <div class="flex items-center gap-4 overflow-hidden">
                  <div
                    class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 {activity.type ===
                    'send'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-emerald-500/10 text-emerald-400'}"
                  >
                    {#if activity.type === "send"}
                      <ArrowUpRight class="w-5 h-5" />
                    {:else}
                      <ArrowDownLeft class="w-5 h-5" />
                    {/if}
                  </div>
                  <div class="space-y-0.5 overflow-hidden">
                    <h4 class="font-bold text-sm text-zinc-100 truncate">
                      {activity.type === "send" ? "Sent" : "Received"}
                      {activity.symbol}
                    </h4>
                    <p class="text-[10px] text-zinc-500 font-mono truncate">
                      {activity.address.slice(0, 10)}...{activity.address.slice(
                        -6,
                      )}
                    </p>
                  </div>
                </div>
                <div class="text-right space-y-1 shrink-0">
                  <p
                    class="font-bold font-mono text-sm {activity.type === 'send'
                      ? 'text-zinc-100'
                      : 'text-emerald-400'}"
                  >
                    {activity.type === "send" ? "-" : "+"}{activity.amount}
                  </p>
                  <span
                    class="px-1.5 py-0.5 rounded-md border bg-zinc-800 border-white/5 text-[8px] font-black uppercase text-zinc-500"
                  >
                    {activity.network.split(" ")[0]}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </main>
</MobileWrapper>
