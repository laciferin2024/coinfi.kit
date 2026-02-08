<script lang="ts">
  import { onMount } from "svelte"
  import { fly, fade } from "svelte/transition"
  import {
    Link2,
    X,
    Check,
    Smartphone,
    Globe,
    ShieldCheck,
    Trash2,
    QrCode,
    Keyboard,
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
  import QRScanner from "$lib/components/ui/QRScanner.svelte"

  interface Props {
    onClose: () => void
  }

  let { onClose }: Props = $props()

  let wcUri = $state("")
  let isPairing = $state(false)
  let error = $state("")
  let mode = $state<"paste" | "scan">("paste")

  onMount(async () => {
    if ($walletStore.address && !$wcStore.initialized) {
      await initWalletConnect($walletStore.address)
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

  async function handleQRScan(uri: string) {
    console.log("[WalletConnect] QR Scanned:", uri)
    wcUri = uri
    await handlePair()
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  transition:fade={{ duration: 200 }}
>
  <div
    class="bg-zinc-950 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
    transition:fly={{ y: 100, duration: 300 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-white/5">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <Link2 class="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 class="font-black text-white uppercase tracking-tight">
            WalletConnect
          </h2>
          <p class="text-[10px] text-zinc-500">Connect DApps to Coin OS</p>
        </div>
      </div>
      <button
        onclick={onClose}
        class="text-zinc-500 hover:text-white transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <div class="p-6 space-y-6">
      <!-- Session Proposal -->
      {#if $wcStore.pendingProposal}
        <div
          class="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-4"
        >
          <div class="flex items-center gap-3">
            <img
              src={$wcStore.pendingProposal.params.proposer.metadata.icons[0] ||
                ""}
              alt=""
              class="w-12 h-12 rounded-xl bg-zinc-800"
            />
            <div class="flex-1">
              <p class="font-bold text-white">
                {$wcStore.pendingProposal.params.proposer.metadata.name}
              </p>
              <p class="text-xs text-zinc-400">
                {$wcStore.pendingProposal.params.proposer.metadata.url}
              </p>
            </div>
          </div>

          <p class="text-sm text-zinc-300">
            This DApp wants to connect to your wallet.
          </p>

          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
          >
            <ShieldCheck class="w-4 h-4 text-emerald-400" />
            <span class="text-xs text-emerald-400 font-medium">
              Coin OS AI Guard protects all transactions
            </span>
          </div>

          <div class="flex gap-3">
            <Button
              onclick={handleReject}
              class="flex-1 h-12 rounded-xl bg-zinc-800 text-white font-bold uppercase text-xs"
            >
              Reject
            </Button>
            <Button
              onclick={handleApprove}
              class="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold uppercase text-xs"
            >
              <Check class="w-4 h-4 mr-1" /> Connect
            </Button>
          </div>
        </div>
      {:else}
        <!-- Mode Toggle -->
        <div
          class="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-white/10"
        >
          <button
            onclick={() => (mode = "paste")}
            class="flex-1 py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 {mode ===
            'paste'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white'}"
          >
            <Keyboard class="w-4 h-4" />
            <span class="text-xs font-bold uppercase">Paste</span>
          </button>
          <button
            onclick={() => (mode = "scan")}
            class="flex-1 py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 {mode ===
            'scan'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white'}"
          >
            <QrCode class="w-4 h-4" />
            <span class="text-xs font-bold uppercase">Scan</span>
          </button>
        </div>

        {#if mode === "paste"}
          <!-- Paste Mode -->
          <div class="space-y-3">
            <label
              class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2"
            >
              <Keyboard class="w-3 h-3" /> Paste WalletConnect URI
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                placeholder="wc:..."
                bind:value={wcUri}
                class="flex-1 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
              />
              <Button
                onclick={handlePair}
                disabled={isPairing}
                class="px-4 rounded-xl bg-orange-600 text-white font-bold"
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
            <p class="text-[10px] text-zinc-600">
              Open any DApp → Connect Wallet → WalletConnect → Copy the URI
            </p>
          </div>
        {:else}
          <!-- Scan Mode -->
          <div class="space-y-3">
            <label
              class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2"
            >
              <QrCode class="w-3 h-3" /> Scan QR Code
            </label>
            <QRScanner onScan={handleQRScan} onError={(err) => (error = err)} />
          </div>
        {/if}

        <!-- Active Sessions -->
        {#if $wcStore.sessions.length > 0}
          <div class="space-y-3">
            <h3
              class="text-[10px] font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2"
            >
              <Globe class="w-3 h-3" /> Connected DApps
            </h3>
            <div class="space-y-2">
              {#each $wcStore.sessions as session}
                <div
                  class="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/5"
                >
                  <img
                    src={session.peer.icons[0] || ""}
                    alt=""
                    class="w-10 h-10 rounded-lg bg-zinc-800"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-white text-sm truncate">
                      {session.peer.name}
                    </p>
                    <p class="text-[10px] text-zinc-500 truncate">
                      {session.peer.url}
                    </p>
                  </div>
                  <button
                    onclick={() => handleDisconnect(session.topic)}
                    class="text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="text-center py-8 space-y-3">
            <Smartphone class="w-12 h-12 text-zinc-700 mx-auto" />
            <p class="text-sm text-zinc-500">No connected DApps</p>
            <p class="text-[10px] text-zinc-600">
              Pair with a DApp to get started
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
