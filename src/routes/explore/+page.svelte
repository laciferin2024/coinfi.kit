<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import {
    Link2,
    ShieldCheck,
    Smartphone,
    Globe,
    Trash2,
    QrCode,
    Check,
    X,
    Zap,
  } from "lucide-svelte"

  import { walletStore } from "$lib/stores/wallet"
  import {
    wcStore,
    initWalletConnect,
    pairWithUri,
    approveSession,
    rejectSession,
    disconnectSession,
  } from "$lib/walletconnect"
  import Button from "$lib/components/ui/Button.svelte"
  import { DAPPS } from "$lib/data/dapps"

  let wcUri = $state("")
  let isPairing = $state(false)
  let error = $state("")

  onMount(() => {
    if (browser) {
      const address = localStorage.getItem("wallet_address")
      const onboarded = localStorage.getItem("wallet_onboarded_status")

      if (!address || onboarded !== "true") {
        goto("/")
        return
      }

      if ($walletStore.isLocked) {
        goto("/")
        return
      }

      // Initialize WalletConnect
      if ($walletStore.address && !$wcStore.initialized) {
        initWalletConnect($walletStore.address)
      }
    }
  })

  async function handlePair() {
    if (!wcUri.trim()) {
      error = "Please enter a WalletConnect URI"
      return
    }

    isPairing = true
    error = ""

    const success = await pairWithUri(wcUri.trim())

    if (!success) {
      error = "Failed to pair. Check the URI and try again."
    }

    isPairing = false
    wcUri = ""
  }

  async function handleApprove() {
    await approveSession()
  }

  async function handleReject() {
    await rejectSession()
  }

  async function handleDisconnect(topic: string) {
    await disconnectSession(topic)
  }
</script>

<div class="min-h-full pb-24">
  <div class="max-w-7xl mx-auto px-4">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 py-6 bg-black/90 backdrop-blur-xl border-b border-white/5"
    >
      <div class="text-center">
        <h1
          class="text-2xl font-black italic uppercase tracking-tighter text-white"
        >
          CONNECT
        </h1>
        <p class="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
          Any DApp • Any Network • AI Protected
        </p>
      </div>
    </header>

    <main class="py-8 space-y-8">
      <!-- Session Proposal -->
      {#if $wcStore.pendingProposal}
        <div
          class="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/30 space-y-5"
        >
          <div class="flex items-center gap-4">
            <img
              src={$wcStore.pendingProposal.params.proposer.metadata.icons[0] ||
                ""}
              alt=""
              class="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-orange-500/30"
            />
            <div class="flex-1">
              <p class="font-black text-white text-lg uppercase tracking-tight">
                {$wcStore.pendingProposal.params.proposer.metadata.name}
              </p>
              <p class="text-xs text-zinc-400 font-mono">
                {$wcStore.pendingProposal.params.proposer.metadata.url}
              </p>
            </div>
          </div>

          <p class="text-sm text-zinc-300">
            This DApp wants to connect to your wallet.
          </p>

          <div
            class="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
          >
            <ShieldCheck class="w-5 h-5 text-emerald-400" />
            <span class="text-sm text-emerald-400 font-bold">
              All transactions will be AI-protected
            </span>
          </div>

          <div class="flex gap-3">
            <Button
              onclick={handleReject}
              class="flex-1 h-14 rounded-2xl bg-zinc-800 border border-white/10 text-white font-black uppercase text-xs tracking-widest"
            >
              Reject
            </Button>
            <Button
              onclick={handleApprove}
              class="flex-1 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black uppercase text-xs tracking-widest"
            >
              <Check class="w-4 h-4 mr-2" /> Connect
            </Button>
          </div>
        </div>
      {:else}
        <!-- Hero Section -->
        <div class="text-center py-8 space-y-6">
          <div
            class="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center"
          >
            <Link2 class="w-12 h-12 text-blue-400" />
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-black text-white uppercase tracking-tight">
              WalletConnect
            </h2>
            <p class="text-sm text-zinc-500 max-w-xs mx-auto">
              Connect to any DApp on any network. AI Guard protects every
              transaction.
            </p>
          </div>
        </div>

        <!-- Pair Input -->
        <div
          class="space-y-4 p-6 rounded-3xl bg-zinc-900/50 border border-white/5"
        >
          <label
            class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2"
          >
            <QrCode class="w-3 h-3" /> Paste WalletConnect URI
          </label>
          <div class="flex gap-3">
            <input
              type="text"
              placeholder="wc:..."
              bind:value={wcUri}
              class="flex-1 px-4 py-4 bg-black border border-white/10 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 font-mono"
            />
            <Button
              onclick={handlePair}
              disabled={isPairing}
              class="px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black uppercase text-xs"
            >
              {#if isPairing}
                <span class="animate-spin">⏳</span>
              {:else}
                Pair
              {/if}
            </Button>
          </div>
          {#if error}
            <p class="text-xs text-rose-400">{error}</p>
          {/if}
        </div>

        <!-- How It Works -->
        <div
          class="p-6 rounded-3xl bg-zinc-900/30 border border-white/5 space-y-4"
        >
          <h3
            class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest"
          >
            How It Works
          </h3>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div
                class="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0"
              >
                1
              </div>
              <p class="text-sm text-zinc-400">
                Open any DApp and click <span class="text-white font-medium"
                  >Connect Wallet</span
                >
              </p>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0"
              >
                2
              </div>
              <p class="text-sm text-zinc-400">
                Select <span class="text-white font-medium">WalletConnect</span> and
                copy the URI
              </p>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0"
              >
                3
              </div>
              <p class="text-sm text-zinc-400">
                Paste here and <span class="text-white font-medium">Pair</span> -
                AI Guard does the rest
              </p>
            </div>
          </div>
        </div>

        <!-- Connected DApps -->
        {#if $wcStore.sessions.length > 0}
          <div class="space-y-4">
            <h3
              class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2 px-2"
            >
              <Globe class="w-3 h-3" /> Connected DApps ({$wcStore.sessions
                .length})
            </h3>
            <div class="space-y-3">
              {#each $wcStore.sessions as session}
                <div
                  class="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <img
                    src={session.peer.icons[0] || ""}
                    alt=""
                    class="w-12 h-12 rounded-xl bg-zinc-800"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-white truncate">
                      {session.peer.name}
                    </p>
                    <p class="text-[10px] text-zinc-500 truncate font-mono">
                      {session.peer.url}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div
                        class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                      ></div>
                      <span
                        class="text-[9px] font-bold text-emerald-400 uppercase"
                        >Live</span
                      >
                    </div>
                    <button
                      onclick={() => handleDisconnect(session.topic)}
                      class="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Featured DApps -->
        <div class="pt-8 space-y-4">
          <div class="flex items-center justify-between px-2">
            <h3
              class="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"
            >
              <Globe class="w-3 h-3" /> Featured DApps
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-3">
            {#each DAPPS as dapp}
              <button
                class="text-left p-4 rounded-3xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 hover:border-white/10 transition-all group relative overflow-hidden"
                onclick={() => walletStore.openDAppBrowser(dapp.id)}
              >
                <div
                  class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                ></div>

                <div class="relative z-10 space-y-3">
                  <div class="flex items-start justify-between">
                    <img
                      src={dapp.icon}
                      alt={dapp.name}
                      class="w-10 h-10 rounded-xl bg-black border border-white/10"
                    />
                    {#if dapp.auditStatus === "unknown"}
                      <div
                        class="px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[8px] font-black uppercase text-orange-500"
                      >
                        New
                      </div>
                    {:else if dapp.verified}
                      <div
                        class="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-500"
                      >
                        Verified
                      </div>
                    {/if}
                  </div>

                  <div>
                    <h4
                      class="font-bold text-sm text-white leading-tight group-hover:text-orange-500 transition-colors"
                    >
                      {dapp.name}
                    </h4>
                    <p class="text-[10px] text-zinc-500 line-clamp-2 mt-1">
                      {dapp.desc}
                    </p>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Features -->
        <div class="grid grid-cols-3 gap-3 pt-4">
          <div
            class="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center space-y-2"
          >
            <Zap class="w-5 h-5 text-orange-500 mx-auto" />
            <p class="text-[10px] font-bold text-zinc-400 uppercase">
              Any Chain
            </p>
          </div>
          <div
            class="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center space-y-2"
          >
            <ShieldCheck class="w-5 h-5 text-emerald-500 mx-auto" />
            <p class="text-[10px] font-bold text-zinc-400 uppercase">
              AI Guard
            </p>
          </div>
          <div
            class="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center space-y-2"
          >
            <Globe class="w-5 h-5 text-blue-500 mx-auto" />
            <p class="text-[10px] font-bold text-zinc-400 uppercase">
              Any DApp
            </p>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>
