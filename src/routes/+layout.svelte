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
  import { wcStore, initWalletConnect } from "$lib/walletconnect"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()

  // Routes that should show the bottom nav
  const authenticatedRoutes = ["/home", "/activity", "/settings", "/explore"]

  let showNav = $derived(
    authenticatedRoutes.some((route) => $page.url.pathname.startsWith(route)),
  )
  let showPhoneFrame = true

  // Initialize WalletConnect when wallet is ready
  onMount(() => {
    if ($walletStore.address && !$wcStore.initialized) {
      initWalletConnect($walletStore.address)
    }
  })

  // Bridge WalletConnect pending requests to walletStore.externalRequest
  $effect(() => {
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
</script>

<svelte:head>
  <title>Coin OS</title>
  <meta name="description" content="Coin OS — AI powered OS for DApp Users" />
</svelte:head>

<div class="dark min-h-screen w-full bg-black">
  {#if showPhoneFrame}
    <!-- Phone Frame Mode for authenticated pages -->
    <div
      class="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden"
    >
      <!-- Reactive glow effect behind phone frame -->
      <div
        class="absolute inset-0 pointer-events-none transition-all duration-500"
      >
        {#if $walletStore.isHyperMode}
          <!-- Orange Hyper Mode glow -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[700px] bg-orange-600/30 rounded-full blur-[150px] animate-pulse"
          ></div>
          <div
            class="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-orange-500/40 rounded-full blur-[100px]"
          ></div>
        {:else}
          <!-- Blue Lite Mode glow -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]"
          ></div>
        {/if}
      </div>

      <!-- Phone Frame with reactive border (just outline, no notch) -->
      <div
        class="relative w-full max-w-[400px] aspect-[9/19.5] rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500 {$walletStore.isHyperMode
          ? 'bg-gradient-to-b from-orange-600/80 to-orange-700/80 border-[3px] border-orange-500/50'
          : 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-[6px] border-zinc-700'}"
      >
        <!-- Screen Content -->
        <div
          class="absolute inset-[3px] bg-black rounded-[2.7rem] overflow-hidden flex flex-col"
        >
          <!-- Scrollable page content -->
          <div class="flex-1 overflow-auto">
            {@render children()}
          </div>

          <!-- Fixed bottom nav inside the phone frame -->
          {#if showNav}
            <Nav />
          {/if}

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
        </div>
      </div>
    </div>
  {:else}
    <!-- Regular mode for onboarding -->
    {@render children()}
  {/if}
</div>

<style lang="sass">
  :global(body)
    background-color: black
    color: white
</style>
