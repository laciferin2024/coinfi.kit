<script lang="ts">
  import { RefreshCw, Zap } from "lucide-svelte"
  import NetworkSelector from "$lib/components/ui/NetworkSelector.svelte"
  import HyperToggle from "$lib/components/ui/HyperToggle.svelte"
  import {
    wcStore,
    disconnectSession,
    pairWithUri,
    disconnectAllSessions,
  } from "$lib/walletconnect"

  let wcUri = $state("")
  let isConnecting = $state(false)
  let connectionError = $state("")

  async function handleConnect() {
    if (!wcUri) return
    isConnecting = true
    connectionError = ""
    try {
      if (!wcUri.startsWith("wc:")) {
        throw new Error("Invalid WalletConnect URI")
      }
      const success = await pairWithUri(wcUri)
      if (success) {
        wcUri = ""
      } else {
        throw new Error("Failed to pair")
      }
    } catch (e: any) {
      console.error(e)
      connectionError = e.message || "Connection failed"
    } finally {
      isConnecting = false
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) wcUri = text
    } catch (e) {
      console.error("Failed to paste:", e)
    }
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
          alt="Coin OS Logo"
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
    <!-- WalletConnect Section -->
    <div class="space-y-4">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-black italic tracking-tighter text-white">
          Connect DApp
        </h2>
        <p class="text-xs text-zinc-500 font-bold uppercase tracking-widest">
          Paste WalletConnect URI below
        </p>
      </div>

      <div class="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-4">
        <div class="relative">
          <input
            type="text"
            bind:value={wcUri}
            placeholder="wc:..."
            class="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors font-mono"
            onkeydown={(e) => {
              if (e.key === "Enter") {
                handleConnect()
              }
            }}
          />
          {#if isConnecting}
            <div class="absolute right-3 top-3">
              <RefreshCw class="w-5 h-5 text-orange-500 animate-spin" />
            </div>
          {:else}
            <button
              onclick={handleConnect}
              class="absolute right-2 top-2 p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <Zap class="w-4 h-4" />
            </button>
          {/if}
        </div>

        {#if connectionError}
          <p
            class="text-xs text-rose-500 font-bold text-center bg-rose-500/10 py-1 rounded"
          >
            {connectionError}
          </p>
        {/if}

        <div class="grid grid-cols-2 gap-3">
          <button
            onclick={handlePaste}
            class="p-4 rounded-xl bg-zinc-950 border border-white/5 hover:border-orange-500/30 transition-colors flex flex-col items-center gap-2 group"
          >
            <div
              class="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-orange-600 transition-colors"
            >
              <RefreshCw class="w-5 h-5 text-white" />
            </div>
            <span class="text-[10px] font-bold uppercase text-zinc-500"
              >Paste</span
            >
          </button>
          <button
            onclick={handleConnect}
            disabled={!wcUri || isConnecting}
            class="p-4 rounded-xl bg-orange-600 hover:bg-orange-700 transition-colors flex flex-col items-center gap-2 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:grayscale"
          >
            <div
              class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Zap class="w-5 h-5 text-white" />
            </div>
            <span class="text-[10px] font-bold uppercase">Connect</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Connections -->
    <div class="space-y-4">
      <div class="flex items-center justify-between px-2">
        <h3 class="text-xs font-black uppercase text-zinc-500 tracking-widest">
          Active Connections
        </h3>
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-bold text-zinc-600"
            >{$wcStore.sessions.length} Active</span
          >
          {#if $wcStore.sessions.length > 0}
            <button
              onclick={disconnectAllSessions}
              class="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase"
            >
              Disconnect All
            </button>
          {/if}
        </div>
      </div>

      {#if $wcStore.sessions.length === 0}
        <div
          class="py-12 text-center space-y-4 border border-white/5 rounded-3xl bg-zinc-900/30"
        >
          <div
            class="w-12 h-12 rounded-full bg-zinc-900 mx-auto flex items-center justify-center"
          >
            <Zap class="w-5 h-5 text-zinc-600" />
          </div>
          <p class="text-[10px] font-bold uppercase text-zinc-600">
            No active sessions
          </p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each $wcStore.sessions as session}
            <div
              class="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <img
                  src={session.peer.icons[0] || "/logo.png"}
                  alt={session.peer.name}
                  class="w-10 h-10 rounded-xl bg-black"
                />
                <div>
                  <h4 class="font-bold text-sm text-white">
                    {session.peer.name}
                  </h4>
                  <p class="text-[10px] text-zinc-500 font-mono">
                    {session.peer.url}
                  </p>
                </div>
              </div>
              <button
                onclick={() => disconnectSession(session.topic)}
                class="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-colors"
              >
                Disconnect
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>
