<script lang="ts">
  import "../app.css"
  import { onMount } from "svelte"
  import { page } from "$app/stores"
  import Nav from "$lib/components/layout/nav.svelte"
  import { walletStore } from "$lib/stores/wallet"
  import type { Snippet } from "svelte"
  import DAppBrowser from "$lib/components/dapps/DAppBrowser.svelte"
  import { DAPPS } from "$lib/data/dapps"
  import AIGuardModal from "$lib/components/ui/AIGuardModal.svelte"
  import WalletConnectModal from "$lib/components/ui/WalletConnectModal.svelte"
  import { wcStore, initWalletConnect } from "$lib/walletconnect"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()

  // Routes that should show the bottom nav
  const authenticatedRoutes = ["/home", "/assets", "/activity", "/explore"]

  let showNav = $derived(
    authenticatedRoutes.some((route) => $page.url.pathname.startsWith(route)),
  )

  // Initialize WalletConnect when wallet is ready
  $effect(() => {
    if ($walletStore.address && !$wcStore.initialized) {
      initWalletConnect($walletStore.address)
    }
  })

  // Restore Porto Session on Mount
  onMount(() => {
    walletStore.restoreConnection()
  })

  // Bridge WalletConnect pending requests to walletStore.externalRequest
  // Note: Session proposals (connection requests) are NOT routed here - they use WalletConnectModal
  $effect(() => {
    // Only handle actual transaction/signing requests, NOT session proposals
    if ($wcStore.pendingRequest && !$walletStore.externalRequest) {
      const req = $wcStore.pendingRequest
      walletStore.setExternalRequest({
        id: req.id.toString(),
        type: req.method as any,
        payload: req.params,
        origin: req.peer.url || req.peer.name,
      })
    }
  })

  // Listen for DApp BroadcastChannel messages (Demo)
  onMount(() => {
    const channel = new BroadcastChannel("dapp-channel")
    channel.onmessage = (event) => {
      console.log("[Layout] Received DApp Message:", event.data)
      const data = event.data
      if (data.type === "eth_sendTransaction") {
        walletStore.setExternalRequest({
          id: Date.now().toString(),
          type: "eth_sendTransaction",
          payload: data.payload,
          origin: data.origin,
        })
      }
    }
    return () => channel.close()
  })
</script>

<svelte:head>
  <title>Coin OS</title>
  <meta name="description" content="Coin OS — AI powered OS for DApp Users" />
</svelte:head>

<div
  class="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden"
>
  <!-- Interactive Background with subtle animation -->
  <div class="absolute inset-0 pointer-events-none z-0">
    {#if $walletStore.isHyperMode}
      <!-- Hyper Mode Background -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[700px] bg-orange-600/20 rounded-full blur-[120px] animate-pulse"
      ></div>
      <div
        class="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-rose-500/20 rounded-full blur-[100px]"
      ></div>
    {:else}
      <!-- Default Background -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[800px] bg-indigo-900/20 rounded-full blur-[150px]"
      ></div>
      <div
        class="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"
      ></div>
    {/if}
    <!-- Grid Pattern -->
    <div
      class="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"
    ></div>
  </div>

  <!-- Phone Frame -->
  <div
    class="relative w-full max-w-[400px] aspect-[9/19.5] rounded-[3.5rem] shadow-2xl overflow-hidden transition-all duration-500 border-[8px] border-zinc-900 bg-zinc-950 flex flex-col ring-1 ring-white/10"
  >
    <!-- Screen Content -->
    <div
      class="absolute inset-0 bg-zinc-950 rounded-[3rem] overflow-hidden flex flex-col"
    >
      <div class="flex-1 overflow-y-auto relative scrollbar-none">
        {@render children()}
      </div>

      <!-- Navigation -->
      {#if showNav}
        <div
          class="shrink-0 w-full pb-8 pt-4 px-6 z-50 bg-gradient-to-t from-black/90 to-transparent"
        >
          <Nav />
        </div>
      {/if}

      <!-- Global Modals & Overlays inside Phone Frame -->
      {#if $walletStore.activeBrowserDAppId}
        {@const activeDapp =
          $walletStore.activeBrowserDAppId === "custom"
            ? $walletStore.activeCustomDApp
            : DAPPS.find((d) => d.id === $walletStore.activeBrowserDAppId)}
        {#if activeDapp}
          <DAppBrowser dapp={activeDapp} />
        {/if}
      {/if}

      {#if $walletStore.externalRequest}
        <AIGuardModal onClose={() => {}} />
      {/if}

      {#if $wcStore.pendingProposal}
        <WalletConnectModal onClose={() => {}} />
      {/if}
    </div>
  </div>
</div>

<style lang="sass">
  :global(body)
    background-color: black
    color: white
</style>
