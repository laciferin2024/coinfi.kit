<script lang="ts">
  import { walletStore } from "$lib/stores/wallet"
  import { Zap, LogOut, Wallet } from "lucide-svelte"
  import { fade } from "svelte/transition"

  let { class: className = "" } = $props()
  let isConnecting = $state(false)

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
</script>

<div class="flex flex-col gap-4 {className}">
  {#if $walletStore.isOnboarded && $walletStore.address}
    <!-- Connected State -->
    <div
      in:fade
      class="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex items-center justify-between"
    >
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
            <p class="text-xs text-zinc-500 font-bold uppercase tracking-wider">
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
