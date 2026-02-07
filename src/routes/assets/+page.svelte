<script lang="ts">
  import { onMount } from "svelte"
  import { Coins, LayoutGrid, Plus, RefreshCw, Search } from "lucide-svelte"
  import {
    walletStore,
    activeNetwork,
    filteredTokens,
    filteredNfts,
  } from "$lib/stores/wallet"
  import ImportAssetModal from "$lib/components/ui/ImportAssetModal.svelte"
  import TokenDetailModal from "$lib/components/ui/TokenDetailModal.svelte"
  import SendModal from "$lib/components/ui/SendModal.svelte"
  import ReceiveModal from "$lib/components/ui/ReceiveModal.svelte"
  import type { TokenAsset } from "$lib/types"

  let activeTab = $state<"tokens" | "nfts">("tokens")
  let isImportModalOpen = $state(false)
  let selectedToken = $state<TokenAsset | null>(null)
  let isTokenDetailOpen = $state(false)
  let isSendModalOpen = $state(false)
  let isReceiveModalOpen = $state(false)
  let searchQuery = $state("")

  function openTokenDetail(token: TokenAsset) {
    selectedToken = token
    isTokenDetailOpen = true
  }

  function openSendModal() {
    isSendModalOpen = true
  }

  function openReceiveModal() {
    isReceiveModalOpen = true
  }

  let displayTokens = $derived(
    $filteredTokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  let displayNfts = $derived(
    $filteredNfts.filter(
      (n) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.collection.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )
</script>

<div class="h-full flex flex-col relative min-h-screen pb-24 bg-black">
  <!-- Header -->
  <header
    class="sticky top-0 z-30 py-6 px-4 bg-black/90 backdrop-blur-xl border-b border-white/5 space-y-4"
  >
    <div class="flex items-center justify-between">
      <h1
        class="text-2xl font-black italic uppercase text-white tracking-tighter"
      >
        Assets
      </h1>
      <button
        type="button"
        onclick={() => (isImportModalOpen = true)}
        class="p-2 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
      >
        <Plus class="w-5 h-5" />
      </button>
    </div>

    <!-- Search & Tabs -->
    <div class="space-y-3">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
        />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search assets..."
          class="w-full bg-zinc-900 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
        />
      </div>

      <div class="flex bg-zinc-900/50 border border-white/5 p-1 rounded-xl">
        <button
          onclick={() => (activeTab = "tokens")}
          class="flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors {activeTab ===
          'tokens'
            ? 'bg-orange-600 text-white'
            : 'text-zinc-500'}"
        >
          <Coins class="w-3.5 h-3.5" /> Tokens
        </button>
        <button
          onclick={() => (activeTab = "nfts")}
          class="flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors {activeTab ===
          'nfts'
            ? 'bg-orange-600 text-white'
            : 'text-zinc-500'}"
        >
          <LayoutGrid class="w-3.5 h-3.5" /> NFTs
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 p-4 overflow-auto">
    <!-- Token List -->
    {#if activeTab === "tokens"}
      <div class="space-y-3">
        {#if !displayTokens || displayTokens.length === 0}
          <div class="py-20 text-center space-y-4 opacity-30">
            <Coins class="w-12 h-12 mx-auto" />
            <p class="text-xs font-black uppercase tracking-widest">
              No tokens found
            </p>
          </div>
        {:else}
          {#each displayTokens as token}
            <button
              type="button"
              onclick={() => openTokenDetail(token)}
              class="w-full text-left p-4 rounded-[2rem] bg-zinc-900/30 border border-white/5 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-xl shadow-inner border border-white/5"
                >
                  {token.icon}
                </div>
                <div>
                  <h4 class="font-bold text-sm text-white">
                    {token.symbol}
                  </h4>
                  <p class="text-[10px] text-zinc-500 font-mono italic">
                    {token.name}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-sm text-zinc-100">
                  {Number(token.balance).toFixed(4)}
                </p>
                <p class="text-[10px] text-zinc-500 font-bold">
                  ${(token.totalValueUsd || 0).toLocaleString()}
                </p>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    {:else}
      <!-- NFT Grid -->
      <div class="grid grid-cols-2 gap-4">
        {#if !displayNfts || displayNfts.length === 0}
          <div class="col-span-2 py-20 text-center space-y-4 opacity-30">
            <LayoutGrid class="w-12 h-12 mx-auto" />
            <p class="text-xs font-black uppercase tracking-widest">
              No collectibles found
            </p>
          </div>
        {:else}
          {#each displayNfts as nft}
            <div
              class="group relative rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 shadow-lg aspect-square"
            >
              <img
                src={nft.image}
                alt={nft.name}
                class="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div
                class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
              >
                <p class="text-[10px] font-black uppercase text-white truncate">
                  {nft.name}
                </p>
                <p class="text-[8px] text-zinc-400 truncate">
                  {nft.collection}
                </p>
              </div>
              <div
                class="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase text-orange-500"
              >
                {nft.network.split(" ")[0]}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </main>
</div>

<ImportAssetModal
  isOpen={isImportModalOpen}
  onClose={() => (isImportModalOpen = false)}
/>

<TokenDetailModal
  token={selectedToken}
  isOpen={isTokenDetailOpen}
  onClose={() => (isTokenDetailOpen = false)}
  onSend={openSendModal}
  onReceive={openReceiveModal}
/>

<SendModal
  token={selectedToken}
  isOpen={isSendModalOpen}
  onClose={() => (isSendModalOpen = false)}
/>

<ReceiveModal
  token={selectedToken}
  isOpen={isReceiveModalOpen}
  onClose={() => (isReceiveModalOpen = false)}
/>
