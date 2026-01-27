<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import {
    Copy,
    Check,
    RefreshCw,
    Zap,
    Coins,
    LayoutGrid,
    Plus,
  } from "lucide-svelte"
  import NetworkSelector from "$lib/components/ui/NetworkSelector.svelte"
  import HyperToggle from "$lib/components/ui/HyperToggle.svelte"
  import ImportAssetModal from "$lib/components/ui/ImportAssetModal.svelte"
  import TokenDetailModal from "$lib/components/ui/TokenDetailModal.svelte"
  import SendModal from "$lib/components/ui/SendModal.svelte"
  import ReceiveModal from "$lib/components/ui/ReceiveModal.svelte"
  import type { TokenAsset } from "$lib/types"
  import {
    walletStore,
    activeNetwork,
    filteredTokens,
    filteredNfts,
    displayedTotalUsd,
  } from "$lib/stores/wallet"
  import { fetchBalances, lookupAddressEns } from "$lib/utils/blockchain-utils"

  let isFetching = $state(false)
  let copied = $state(false)
  let activeTab = $state<"tokens" | "nfts">("tokens")
  let isImportModalOpen = $state(false)
  let selectedToken = $state<TokenAsset | null>(null)
  let isTokenDetailOpen = $state(false)
  let isSendModalOpen = $state(false)
  let isReceiveModalOpen = $state(false)

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

  onMount(() => {
    if (browser) {
      const address = localStorage.getItem("wallet_address")
      const onboarded = localStorage.getItem("wallet_onboarded_status")

      if (!address || onboarded !== "true") {
        goto("/")
        return
      }

      // Unlock wallet if needed
      if ($walletStore.isLocked) {
        walletStore.unlockWallet()
      }

      // Fetch initial balances
      update()
    }
  })

  async function update() {
    if (!$walletStore.address) return
    isFetching = true
    try {
      const chainId = $activeNetwork.chainId || 11155420
      const [res, name] = await Promise.all([
        fetchBalances($walletStore.address, chainId),
        lookupAddressEns($walletStore.address),
      ])
      if (res) walletStore.updatePortfolio(res)
      if (name) walletStore.setEnsName(name)
    } catch (e) {
      console.warn("[HomePage] Sync Error:", e)
    } finally {
      isFetching = false
    }
  }

  function handleCopy() {
    if ($walletStore.address && browser) {
      navigator.clipboard.writeText($walletStore.address)
      copied = true
      setTimeout(() => (copied = false), 1500)
    }
  }

  function truncateAddress(addr: string): string {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
</script>

<div class="h-full flex flex-col relative min-h-screen pb-20">
  <!-- Header -->
  <header
    class="sticky top-0 z-30 py-4 px-4 flex items-center justify-between bg-black/90 backdrop-blur-xl border-b border-white/5"
  >
    <div class="flex items-center gap-3">
      <div
        class="relative w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-white/10"
      >
        <img
          src="/logo.png"
          class="w-full h-full object-contain p-1"
          alt="CoinFi Logo"
        />
      </div>
      <NetworkSelector />
    </div>
    <div class="flex items-center gap-2">
      <HyperToggle />
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 py-8 space-y-8 pb-24 px-4 overflow-auto">
    <!-- Balance Section -->
    <div class="text-center space-y-2 relative">
      <p
        class="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500"
      >
        {$walletStore.activeNetworkId === "all"
          ? "Unified Portfolio Balance"
          : `${$activeNetwork.name} Assets`}
      </p>
      <h2 class="text-5xl font-black italic tracking-tighter text-white">
        ${$displayedTotalUsd.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </h2>
      <div class="flex justify-center items-center gap-2">
        <button
          onclick={handleCopy}
          class="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full border border-white/5 transition-all {copied
            ? 'text-emerald-400'
            : 'text-zinc-400'}"
        >
          {$walletStore.ensName || truncateAddress($walletStore.address || "")}
          {#if copied}
            <Check class="w-3 h-3" />
          {:else}
            <Copy class="w-3 h-3" />
          {/if}
        </button>
        <button
          onclick={update}
          disabled={isFetching}
          class="p-1.5 rounded-full bg-zinc-900 border border-white/5 hover:border-orange-500/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            class="w-3 h-3 text-orange-500 {isFetching ? 'animate-spin' : ''}"
          />
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="w-full relative">
      <div class="flex items-center justify-between mb-4">
        <div class="flex bg-zinc-900/50 border border-white/5 p-1 rounded-xl">
          <button
            onclick={() => (activeTab = "tokens")}
            class="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors {activeTab ===
            'tokens'
              ? 'bg-orange-600 text-white'
              : 'text-zinc-500'}"
          >
            <Coins class="w-3.5 h-3.5" /> Tokens
          </button>
          <button
            onclick={() => (activeTab = "nfts")}
            class="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors {activeTab ===
            'nfts'
              ? 'bg-orange-600 text-white'
              : 'text-zinc-500'}"
          >
            <LayoutGrid class="w-3.5 h-3.5" /> NFTs
          </button>
        </div>
        <button
          onclick={() => (isImportModalOpen = true)}
          class="p-2.5 rounded-xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 transition-colors"
        >
          <Plus class="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <!-- Token List -->
      {#if activeTab === "tokens"}
        <div class="space-y-3">
          {#if !$filteredTokens || $filteredTokens.length === 0}
            <div class="py-20 text-center space-y-4 opacity-30">
              <Coins class="w-12 h-12 mx-auto" />
              <p class="text-xs font-black uppercase tracking-widest">
                No assets discovered
              </p>
            </div>
          {:else}
            {#each $filteredTokens as token}
              <div
                onclick={() => openTokenDetail(token)}
                class="p-4 rounded-[2rem] bg-zinc-900/50 border border-white/5 flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-2xl shadow-inner border border-white/5"
                  >
                    {token.icon}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-white">
                      {token.symbol}
                    </h4>
                    <p class="text-[10px] text-zinc-500 font-mono italic">
                      {token.network}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-sm text-zinc-100">
                    {Number(token.balance).toFixed(2)}
                  </p>
                  <p class="text-[10px] text-orange-500 font-black uppercase">
                    ${(token.totalValueUsd || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {:else}
        <!-- NFT Grid -->
        <div class="grid grid-cols-2 gap-4">
          {#if !$filteredNfts || $filteredNfts.length === 0}
            <div class="col-span-2 py-20 text-center space-y-4 opacity-30">
              <LayoutGrid class="w-12 h-12 mx-auto" />
              <p class="text-xs font-black uppercase tracking-widest">
                No collectibles found
              </p>
            </div>
          {:else}
            {#each $filteredNfts as nft}
              <div
                class="group relative rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 shadow-lg"
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  class="w-full aspect-square object-cover transition-transform group-hover:scale-110"
                />
                <div
                  class="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent"
                >
                  <p
                    class="text-[10px] font-black uppercase text-white truncate"
                  >
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
    </div>
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
