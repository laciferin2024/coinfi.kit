<script lang="ts">
  import {
    X,
    Loader2,
    Search,
    Coins,
    CheckCircle,
    ChevronDown,
  } from "lucide-svelte"
  import {
    walletStore,
    NETWORKS,
    activeNetwork,
    GLOBAL_NETWORK,
  } from "$lib/stores/wallet"

  interface Props {
    isOpen: boolean
    onClose: () => void
  }

  let { isOpen, onClose }: Props = $props()

  let contractAddress = $state("")
  let isLoading = $state(false)
  let error = $state("")
  let tokenInfo = $state<{
    symbol: string
    name: string
    decimals: number
  } | null>(null)
  let success = $state(false)

  let selectedNetworkId = $state(
    $activeNetwork.id === GLOBAL_NETWORK.id
      ? NETWORKS[0].id
      : $activeNetwork.id,
  )
  let isNetworkSelectorOpen = $state(false)

  const eligibleNetworks = NETWORKS
  let selectedNetwork = $derived(
    eligibleNetworks.find((n) => n.id === selectedNetworkId) ||
      eligibleNetworks[0],
  )

  async function lookupToken() {
    if (!contractAddress || contractAddress.length < 42) {
      error = "Please enter a valid contract address"
      return
    }

    isLoading = true
    error = ""
    tokenInfo = null

    try {
      // Simulate token lookup (in production would call blockchain)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock token info based on address
      tokenInfo = {
        symbol: "TOKEN",
        name: "Custom Token",
        decimals: 18,
      }
    } catch (e) {
      error = "Could not find token at this address"
    } finally {
      isLoading = false
    }
  }

  async function importToken(token: {
    symbol: string
    name: string
    icon?: string
    address: string
  }) {
    isLoading = true

    try {
      // Add token to wallet store
      walletStore.addCustomToken({
        symbol: token.symbol,
        name: token.name,
        icon: token.icon || "🪙",
        address: token.address,
        network: selectedNetwork.name,
        balance: "0",
        totalValueUsd: 0,
      })

      success = true
      setTimeout(() => {
        success = false
        onClose()
        resetForm()
      }, 1500)
    } catch (e) {
      error = "Failed to import token"
    } finally {
      isLoading = false
    }
  }

  function resetForm() {
    contractAddress = ""
    error = ""
    tokenInfo = null
    success = false
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleClose()
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    role="button"
    tabindex="0"
    aria-label="Close import token modal"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
    onclick={(e) => {
      if (e.target === e.currentTarget) handleClose()
    }}
    onkeydown={handleBackdropKeydown}
  >
    <!-- Modal -->
    <div
      class="w-full max-w-[400px] bg-zinc-900 rounded-t-[2.5rem] border-t border-white/10 p-6 pb-10 space-y-6"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black uppercase italic text-white">
          Import Token
        </h2>
        <button
          type="button"
          onclick={handleClose}
          class="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <X class="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {#if success}
        <!-- Success State -->
        <div class="py-12 text-center space-y-4">
          <CheckCircle class="w-16 h-16 text-emerald-400 mx-auto" />
          <p class="text-lg font-bold text-white">Token Added!</p>
        </div>
      {:else}
        <!-- Network Selector -->
        <div class="space-y-2">
          <label
            for="import-network-selector"
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
          >
            Destination Network
          </label>
          <div class="relative">
            <button
              type="button"
              id="import-network-selector"
              onclick={() => (isNetworkSelectorOpen = !isNetworkSelectorOpen)}
              class="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl hover:bg-zinc-700/50 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">{selectedNetwork.icon}</span>
                <span class="text-sm text-white font-bold"
                  >{selectedNetwork.name}</span
                >
              </div>
              <ChevronDown
                class="w-4 h-4 text-zinc-500 transition-transform {isNetworkSelectorOpen
                  ? 'rotate-180'
                  : ''}"
              />
            </button>

            {#if isNetworkSelectorOpen}
              <div
                class="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl"
              >
                {#each eligibleNetworks as net}
                  <button
                    type="button"
                    onclick={() => {
                      selectedNetworkId = net.id
                      isNetworkSelectorOpen = false
                    }}
                    class="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors {selectedNetworkId ===
                    net.id
                      ? 'bg-orange-500/10'
                      : ''}"
                  >
                    <span class="text-lg">{net.icon}</span>
                    <span
                      class="text-sm font-bold {selectedNetworkId === net.id
                        ? 'text-orange-500'
                        : 'text-zinc-300'}"
                    >
                      {net.name}
                    </span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Contract Address Input -->
        <div class="space-y-2">
          <label
            for="import-contract-address"
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
          >
            Contract Address
          </label>
          <div class="relative">
            <input
              id="import-contract-address"
              type="text"
              placeholder="0x..."
              bind:value={contractAddress}
              oninput={() => {
                error = ""
                tokenInfo = null
              }}
              class="w-full px-4 py-4 pr-12 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
            <button
              type="button"
              onclick={lookupToken}
              disabled={isLoading || !contractAddress}
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 transition-colors"
            >
              {#if isLoading}
                <Loader2 class="w-4 h-4 text-orange-500 animate-spin" />
              {:else}
                <Search class="w-4 h-4 text-zinc-400" />
              {/if}
            </button>
          </div>
          {#if error}
            <p class="text-xs text-rose-400">{error}</p>
          {/if}
        </div>

        <!-- Token Info Preview -->
        {#if tokenInfo}
          <div
            class="p-4 rounded-xl bg-zinc-800 border border-orange-500/30 space-y-3"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center"
              >
                <Coins class="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p class="font-bold text-white">{tokenInfo.symbol}</p>
                <p class="text-xs text-zinc-400">{tokenInfo.name}</p>
              </div>
            </div>
            <button
              type="button"
              onclick={() =>
                importToken({
                  symbol: tokenInfo!.symbol,
                  name: tokenInfo!.name,
                  address: contractAddress,
                })}
              disabled={isLoading}
              class="w-full py-3 rounded-xl bg-orange-600 text-white font-bold uppercase text-sm hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Adding..." : "Add Token"}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
