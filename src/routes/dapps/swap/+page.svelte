<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import {
    ArrowLeftRight,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ChevronDown,
    Shield,
    Zap,
  } from "lucide-svelte"

  import { walletStore, activeNetwork } from "$lib/stores/wallet"
  import type { AIGuardResponse, RiskLevel } from "$lib/ai-guard/types"
  import GuardConsole from "$lib/components/ui/GuardConsole.svelte"
  import Button from "$lib/components/ui/Button.svelte"

  // Token list
  const TOKENS = [
    {
      symbol: "ETH",
      name: "Ethereum",
      icon: "⟠",
      balance: "1.245",
      decimals: 18,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: "💵",
      balance: "500.00",
      decimals: 6,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    {
      symbol: "WETH",
      name: "Wrapped ETH",
      icon: "🔷",
      balance: "0.5",
      decimals: 18,
      address: "0x4200000000000000000000000000000000000006",
    },
  ]

  let fromToken = $state(TOKENS[0])
  let toToken = $state(TOKENS[1])
  let fromAmount = $state("")
  let toAmount = $derived(
    fromAmount ? (parseFloat(fromAmount) * 3200).toFixed(2) : "",
  ) // Mock rate

  let status = $state<"idle" | "analyzing" | "ready" | "swapping" | "success">(
    "idle",
  )
  let guardResponse = $state<AIGuardResponse | null>(null)
  let showFromDropdown = $state(false)
  let showToDropdown = $state(false)

  onMount(() => {
    if (browser && !$walletStore.address) {
      goto("/")
    }
  })

  // Build swap transaction for AI Guard
  function buildSwapTransaction() {
    const amountWei = BigInt(
      Math.floor(parseFloat(fromAmount || "0") * 1e18),
    ).toString()

    // Mock Uniswap V3 exactInputSingle call
    const swapData =
      "0x04e45aaf" + // exactInputSingle selector
        fromToken.address?.slice(2).padStart(64, "0") ||
      "0".padStart(64, "0") + toToken.address?.slice(2).padStart(64, "0") ||
      "0".padStart(64, "0") + amountWei.padStart(64, "0")

    return {
      chainId: $activeNetwork.chainId,
      from: $walletStore.address || "",
      to: "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap Router
      value: fromToken.symbol === "ETH" ? amountWei : "0",
      data: swapData,
    }
  }

  async function handleSwap() {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return

    status = "analyzing"
    guardResponse = null
  }

  function handleGuardComplete(
    verdict: RiskLevel,
    response: AIGuardResponse | null,
  ) {
    guardResponse = response
    status = "ready"
  }

  async function confirmSwap() {
    status = "swapping"
    // Simulate swap
    await new Promise((resolve) => setTimeout(resolve, 2000))
    status = "success"

    // Reset after success
    setTimeout(() => {
      status = "idle"
      fromAmount = ""
      guardResponse = null
    }, 3000)
  }

  function swapTokens() {
    const temp = fromToken
    fromToken = toToken
    toToken = temp
  }

  function selectFromToken(token: (typeof TOKENS)[number]) {
    fromToken = token
    showFromDropdown = false
  }

  function selectToToken(token: (typeof TOKENS)[number]) {
    toToken = token
    showToDropdown = false
  }
</script>

<svelte:head>
  <title>Coin OS Swap | AI-Guarded DEX</title>
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-b from-zinc-950 to-black px-4 pt-6 pb-32"
>
  <!-- Header -->
  <div class="text-center space-y-2 mb-8">
    <div class="flex items-center justify-center gap-2">
      <div
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center"
      >
        <ArrowLeftRight class="w-5 h-5 text-white" />
      </div>
    </div>
    <h1
      class="text-2xl font-black italic uppercase tracking-tighter text-white"
    >
      Coin OS Swap
    </h1>
    <p class="text-xs text-zinc-500 flex items-center justify-center gap-1">
      <Shield class="w-3 h-3" /> AI-Guarded Exchange
    </p>
  </div>

  <!-- Swap Card -->
  <div class="max-w-md mx-auto">
    <div
      class="bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
    >
      {#if status === "idle" || status === "ready"}
        <div class="p-6 space-y-4">
          <!-- From Token -->
          <div class="space-y-2">
            <label
              for="fromAmount"
              class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest"
              >You Pay</label
            >
            <div class="p-4 rounded-2xl bg-zinc-800 border border-white/5">
              <div class="flex items-center justify-between gap-4">
                <input
                  id="fromAmount"
                  type="number"
                  placeholder="0.0"
                  bind:value={fromAmount}
                  class="flex-1 bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  onclick={() => (showFromDropdown = !showFromDropdown)}
                  class="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-colors"
                >
                  <span class="text-xl">{fromToken.icon}</span>
                  <span class="font-bold text-white">{fromToken.symbol}</span>
                  <ChevronDown class="w-4 h-4 text-zinc-400" />
                </button>
              </div>
              <div class="mt-2 text-xs text-zinc-500">
                Balance: {fromToken.balance}
                {fromToken.symbol}
              </div>

              {#if showFromDropdown}
                <div class="mt-2 p-2 rounded-xl bg-zinc-700 space-y-1">
                  {#each TOKENS.filter((t) => t.symbol !== toToken.symbol) as token}
                    <button
                      onclick={() => selectFromToken(token)}
                      class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-600 transition-colors"
                    >
                      <span class="text-xl">{token.icon}</span>
                      <div class="text-left">
                        <p class="font-bold text-white text-sm">
                          {token.symbol}
                        </p>
                        <p class="text-[10px] text-zinc-400">{token.name}</p>
                      </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center -my-2 relative z-10">
            <button
              onclick={swapTokens}
              class="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeftRight class="w-4 h-4 text-orange-500 rotate-90" />
            </button>
          </div>

          <!-- To Token -->
          <div class="space-y-2">
            <label
              for="toAmount"
              class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest"
              >You Receive</label
            >
            <div class="p-4 rounded-2xl bg-zinc-800 border border-white/5">
              <div class="flex items-center justify-between gap-4">
                <input
                  id="toAmount"
                  type="text"
                  placeholder="0.0"
                  value={toAmount}
                  disabled
                  class="flex-1 bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600"
                />
                <button
                  onclick={() => (showToDropdown = !showToDropdown)}
                  class="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-colors"
                >
                  <span class="text-xl">{toToken.icon}</span>
                  <span class="font-bold text-white">{toToken.symbol}</span>
                  <ChevronDown class="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {#if showToDropdown}
                <div class="mt-2 p-2 rounded-xl bg-zinc-700 space-y-1">
                  {#each TOKENS.filter((t) => t.symbol !== fromToken.symbol) as token}
                    <button
                      onclick={() => selectToToken(token)}
                      class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-600 transition-colors"
                    >
                      <span class="text-xl">{token.icon}</span>
                      <div class="text-left">
                        <p class="font-bold text-white text-sm">
                          {token.symbol}
                        </p>
                        <p class="text-[10px] text-zinc-400">{token.name}</p>
                      </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Rate Info -->
          {#if fromAmount && parseFloat(fromAmount) > 0}
            <div
              class="p-3 rounded-xl bg-zinc-800/50 border border-white/5 text-xs text-zinc-400"
            >
              <div class="flex justify-between">
                <span>Rate</span>
                <span>1 {fromToken.symbol} = 3,200 {toToken.symbol}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Network Fee</span>
                <span class="text-emerald-400">$0 (Sponsored)</span>
              </div>
            </div>
          {/if}

          <!-- Swap Button -->
          {#if status === "ready" && guardResponse}
            <Button
              onclick={confirmSwap}
              class="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest"
            >
              <Zap class="w-5 h-5 mr-2" />
              Confirm Swap
            </Button>
          {:else}
            <Button
              onclick={handleSwap}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0}
              class="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-black uppercase tracking-widest disabled:opacity-50"
            >
              {#if status === "idle"}
                Swap with AI Guard
              {:else}
                Swap
              {/if}
            </Button>
          {/if}
        </div>
      {/if}

      {#if status === "analyzing"}
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3
              class="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"
            >
              <Shield class="w-3.5 h-3.5" /> AI Guard Analysis
            </h3>
            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[8px] font-black uppercase"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"
              ></span>
              Scanning
            </div>
          </div>
          <GuardConsole
            transactionData={buildSwapTransaction()}
            onComplete={handleGuardComplete}
          />
        </div>
      {/if}

      {#if status === "swapping"}
        <div class="p-12 text-center space-y-4">
          <Loader2 class="w-16 h-16 text-orange-500 mx-auto animate-spin" />
          <p class="text-sm font-bold text-white">Processing Swap...</p>
          <p class="text-xs text-zinc-500">Signing with passkey</p>
        </div>
      {/if}

      {#if status === "success"}
        <div class="p-12 text-center space-y-4">
          <CheckCircle class="w-16 h-16 text-emerald-400 mx-auto" />
          <div>
            <p class="text-lg font-bold text-white">Swap Complete!</p>
            <p class="text-sm text-zinc-400 mt-1">
              {fromAmount}
              {fromToken.symbol} → {toAmount}
              {toToken.symbol}
            </p>
          </div>
        </div>
      {/if}

      {#if status === "ready" && guardResponse}
        <div class="px-6 pb-6 pt-0">
          <div
            class="p-4 rounded-2xl bg-{guardResponse.overall.riskLevel === 'low'
              ? 'emerald'
              : guardResponse.overall.riskLevel === 'medium'
                ? 'yellow'
                : 'rose'}-500/10 border border-{guardResponse.overall
              .riskLevel === 'low'
              ? 'emerald'
              : guardResponse.overall.riskLevel === 'medium'
                ? 'yellow'
                : 'rose'}-500/30"
          >
            <div class="flex items-center gap-3">
              {#if guardResponse.overall.riskLevel === "low"}
                <CheckCircle class="w-5 h-5 text-emerald-400" />
              {:else}
                <AlertTriangle
                  class="w-5 h-5 text-{guardResponse.overall.riskLevel ===
                  'medium'
                    ? 'yellow'
                    : 'rose'}-400"
                />
              {/if}
              <div class="flex-1">
                <p class="font-bold text-white text-sm uppercase">
                  {guardResponse.overall.riskLevel} Risk
                </p>
                <p class="text-xs text-zinc-400">
                  {guardResponse.llmExplanation.short}
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-black text-white">
                  {guardResponse.overall.score}
                </p>
                <p class="text-[9px] text-zinc-500">/100</p>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Back Link -->
    <div class="mt-6 text-center">
      <a
        href="/explore"
        class="text-xs text-zinc-500 hover:text-white transition-colors"
      >
        ← Back to Explore
      </a>
    </div>
  </div>
</div>
