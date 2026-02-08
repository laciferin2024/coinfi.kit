<script lang="ts">
  import { onDestroy } from "svelte"
  import { walletStore } from "$lib/stores/wallet"
  import { Zap, LogOut, Wallet, Copy, Check } from "lucide-svelte"
  import { fade } from "svelte/transition"

  let { class: className = "" } = $props()
  let isConnecting = $state(false)
  let copied = $state(false)
  let copyTimeout: ReturnType<typeof setTimeout> | null = null

  function formatAddress(addr: string) {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  async function handleConnect() {
    isConnecting = true
    try {
      await walletStore.connectPorto()
    } finally {
      isConnecting = false
    }
  }

  async function handleCopyAddress() {
    if (!$walletStore.address) return
    try {
      await navigator.clipboard.writeText($walletStore.address)
      copied = true
      if (copyTimeout) clearTimeout(copyTimeout)
      copyTimeout = setTimeout(() => {
        copied = false
        copyTimeout = null
      }, 1400)
    } catch (e) {
      console.error("Failed to copy address:", e)
    }
  }

  onDestroy(() => {
    if (copyTimeout) clearTimeout(copyTimeout)
  })
</script>

<div class="flex flex-col gap-4 {className}">
  {#if $walletStore.isOnboarded && $walletStore.address}
    <!-- Connected State -->
    <div
      in:fade
      class="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20"
          >
            <Wallet class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white tracking-tight">
              {$walletStore.ensName || formatAddress($walletStore.address)}
            </h3>
            {#if $walletStore.ensName}
              <p class="text-xs text-zinc-500 font-mono">
                {formatAddress($walletStore.address)}
              </p>
            {:else}
              <p
                class="text-xs text-zinc-500 font-bold uppercase tracking-wider"
              >
                Connected
              </p>
            {/if}
          </div>
        </div>

        <button
          onclick={() => walletStore.resetOnboarding()}
          class="p-2.5 rounded-xl bg-zinc-950 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          aria-label="Disconnect"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-3">
        {#if $walletStore.address}
          <div
            class="flex items-center justify-between gap-3 rounded-2xl bg-black/60 border border-white/5 px-4 py-3"
          >
            <div class="scroll-container flex-1" style="width: 20ch">
              <div class="scroll-track">
                <sub class="scroll-text font-mono text-sm text-zinc-300"
                  >{$walletStore.address}</sub
                >
              </div>
            </div>
            <button
              onclick={handleCopyAddress}
              class="shrink-0 inline-flex items-center justify-center rounded-xl bg-zinc-900 p-2 text-zinc-400 hover:text-white hover:border-orange-500/40 border border-white/5 transition-colors"
              aria-label="Copy wallet address"
            >
              {#if copied}
                <Check class="w-4 h-4 text-emerald-400" />
              {:else}
                <Copy class="w-4 h-4" />
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Disconnected State -->
    <div in:fade class="bg-zinc-900 border border-white/5 rounded-3xl p-6">
      <div class="text-center space-y-4">
        <div
          class="w-16 h-16 rounded-full bg-zinc-950 border border-white/5 mx-auto flex items-center justify-center"
        >
          <Wallet class="w-8 h-8 text-zinc-600" />
        </div>
        <div class="space-y-1">
          <h3 class="text-xl font-black italic tracking-tighter text-white">
            Connect Wallet
          </h3>
          <p class="text-xs text-zinc-500 font-bold uppercase tracking-widest">
            Access your assets & DApps
          </p>
        </div>
        <button
          onclick={handleConnect}
          disabled={isConnecting}
          class="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isConnecting}
            <div
              class="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"
            ></div>
            Connecting...
          {:else}
            <Zap class="w-4 h-4" />
            Connect with Porto
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .scroll-container {
    overflow: hidden;
    mask-image: linear-gradient(
      90deg,
      transparent,
      #000 12%,
      #000 88%,
      transparent
    );
  }

  .scroll-track {
    display: inline-flex;
    align-items: baseline;
    gap: 1ch;
    white-space: nowrap;
    width: max-content;
    animation: version-scroll 10s linear infinite;
  }

  .scroll-text {
    line-height: 1;
  }

  @keyframes version-scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
</style>
