<script lang="ts">
  import { X, Loader2, Search, Coins, CheckCircle } from "lucide-svelte"
  import { walletStore, NETWORKS, activeNetwork } from "$lib/stores/wallet"

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

  // Popular tokens to quick-add
  const POPULAR_TOKENS = [
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: "💵",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    {
      symbol: "USDT",
      name: "Tether",
      icon: "💲",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      icon: "⟠",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      icon: "🔶",
      address: "0x6B175474E89094C44Da98b954EescdeCB5BAA3d7",
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      icon: "🔗",
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    },
  ]

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
        network: $activeNetwork.name,
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
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
    onclick={handleClose}
  >
    <!-- Modal -->
    <div
      class="w-full max-w-[400px] bg-zinc-900 rounded-t-[2.5rem] border-t border-white/10 p-6 pb-10 space-y-6"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black uppercase italic text-white">
          Import Token
        </h2>
        <button
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
        <!-- Network Info -->
        <div
          class="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800/50 border border-white/5"
        >
          <span class="text-lg">{$activeNetwork.icon}</span>
          <span class="text-sm text-zinc-400"
            >Adding to {$activeNetwork.name}</span
          >
        </div>

        <!-- Contract Address Input -->
        <div class="space-y-2">
          <label
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
          >
            Contract Address
          </label>
          <div class="relative">
            <input
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

        <!-- Popular Tokens -->
        <div class="space-y-3">
          <h3
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
          >
            Popular Tokens
          </h3>
          <div class="grid grid-cols-2 gap-2">
            {#each POPULAR_TOKENS.slice(0, 4) as token}
              <button
                onclick={() => importToken(token)}
                class="p-3 rounded-xl bg-zinc-800 border border-white/5 hover:border-orange-500/30 hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <span class="text-xl">{token.icon}</span>
                <div class="text-left">
                  <p class="text-sm font-bold text-white">{token.symbol}</p>
                  <p class="text-[9px] text-zinc-500">{token.name}</p>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
