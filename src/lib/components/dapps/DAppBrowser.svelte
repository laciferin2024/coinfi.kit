<script lang="ts">
  import { onMount } from "svelte"
  import { fly } from "svelte/transition"
  import {
    RefreshCw,
    Lock,
    ShieldCheck,
    Globe,
    MoreVertical,
    Terminal,
    XCircle,
  } from "lucide-svelte"
  import { walletStore, NETWORKS } from "$lib/stores/wallet"
  import Button from "$lib/components/ui/Button.svelte"

  interface Props {
    dapp: {
      id?: string
      name: string
      icon: string
      url: string
      domain: string
    }
  }

  let { dapp }: Props = $props()

  let isRefreshing = $state(false)
  let hasError = $state(false)
  let iframeRef: HTMLIFrameElement | undefined = $state()

  // Web3 Provider Bridge
  onMount(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (data && data.type === "WEB3_REQUEST") {
        const { method, params, id } = data.payload
        switch (method) {
          case "eth_requestAccounts":
          case "eth_accounts": {
            event.source?.postMessage(
              {
                type: "WEB3_RESPONSE",
                id,
                result: $walletStore.address ? [$walletStore.address] : [],
              },
              { targetOrigin: "*" } as any,
            )
            break
          }
          case "eth_chainId": {
            const net =
              NETWORKS.find((n) => n.id === $walletStore.activeNetworkId) ||
              NETWORKS[0]
            event.source?.postMessage(
              {
                type: "WEB3_RESPONSE",
                id,
                result: `0x${net.chainId.toString(16)}`,
              },
              { targetOrigin: "*" } as any,
            )
            break
          }
          case "eth_sendTransaction": {
            console.info("DApp Request: AI Simulation Node Triggered")
            walletStore.setExternalRequest({
              id,
              type: "eth_sendTransaction",
              payload: params[0],
              origin: dapp.domain,
            })
            break
          }
          default:
            console.warn(`[Bridge] Unsupported method: ${method}`)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  })

  function handleRefresh() {
    isRefreshing = true
    hasError = false
    setTimeout(() => (isRefreshing = false), 800)
    if (iframeRef) {
      iframeRef.src = iframeRef.src
    }
  }

  function handleIframeError() {
    hasError = true
  }

  function handlePopup() {
    const popup = window.open(
      dapp.url,
      "dapp-popup",
      "width=1200,height=900,left=100,top=100,noopener,noreferrer",
    )
    if (popup) {
      console.log("Popup opened - AI Guard limited")
    } else {
      alert("Popup blocked. Enable popups or use _blank tab.")
    }
  }

  function closeBrowser() {
    walletStore.closeDAppBrowser()
  }
</script>

<div
  class="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden"
  transition:fly={{ y: 800, duration: 400 }}
>
  <!-- Header -->
  <div
    class="bg-zinc-900 border-b border-white/10 px-4 pt-12 pb-3 space-y-3 shrink-0"
  >
    <div class="flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        onclick={closeBrowser}
        class="text-orange-500 font-black italic uppercase hover:bg-orange-500/10 h-8 px-3 rounded-full"
      >
        Done
      </Button>
      <div class="flex flex-col items-center">
        <h3
          class="text-xs font-black uppercase tracking-tighter text-white flex items-center gap-1.5"
        >
          {dapp.name}
          <div
            class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black flex items-center gap-1"
          >
            <ShieldCheck class="w-2.5 h-2.5" /> AI NODE
          </div>
        </h3>
        <p class="text-[9px] text-zinc-500 font-mono italic">{dapp.domain}</p>
      </div>
      <Button
        variant="ghost"
        size="md"
        class="h-8 w-8 text-zinc-400 hover:text-white p-0"
      >
        <MoreVertical class="w-4 h-4" />
      </Button>
    </div>
    <div
      class="flex items-center gap-2 px-3 py-2 bg-black rounded-xl border border-white/5"
    >
      <Lock class="w-3 h-3 text-emerald-500" />
      <div class="flex-1 text-[10px] text-zinc-400 font-mono truncate">
        {dapp.url}
      </div>
      <button
        onclick={handleRefresh}
        class="text-zinc-500 hover:text-white transition-colors {isRefreshing
          ? 'animate-spin'
          : ''}"
      >
        <RefreshCw class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>

  <!-- Browser Content -->
  <div class="flex-1 bg-white relative w-full h-full overflow-hidden">
    <div
      class="absolute top-4 left-4 z-50 pointer-events-none flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg"
    >
      <Terminal class="w-3 h-3 text-orange-500" />
      <span
        class="text-[8px] font-black text-white uppercase tracking-widest italic"
        >Node Bridge Active</span
      >
    </div>

    {#if hasError}
      <div
        class="absolute inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center space-y-6"
      >
        <XCircle class="w-16 h-16 text-rose-500 opacity-10" />
        <div class="space-y-2">
          <h3
            class="text-xl font-black italic uppercase text-white tracking-tighter"
          >
            Iframe Blocked by Site Policy
          </h3>
          <p
            class="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed"
          >
            CSP or X-Frame-Options deny detected. Use popup fallback for blocked
            sites.
          </p>
        </div>
        <div class="space-y-3 w-full max-w-sm">
          <Button
            onclick={handleRefresh}
            class="h-14 rounded-2xl bg-zinc-900 border border-white/10 font-black uppercase tracking-widest text-[10px] w-full"
          >
            Retry Iframe
          </Button>
          <Button
            variant="outline"
            class="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full"
            onclick={handlePopup}
          >
            Open Popup Window
          </Button>
        </div>
      </div>
    {/if}

    {#if !isRefreshing && !hasError}
      <iframe
        bind:this={iframeRef}
        src={dapp.url}
        class="w-full h-full border-none"
        title={dapp.name}
        onerror={handleIframeError}
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
      ></iframe>
    {/if}

    {#if isRefreshing}
      <div
        class="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-4 z-50"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-zinc-900 animate-pulse flex items-center justify-center border border-white/5"
        >
          <Globe class="w-8 h-8 text-orange-500" />
        </div>
        <p
          class="text-xs text-zinc-500 font-black uppercase tracking-widest italic animate-pulse"
        >
          Synchronizing Node...
        </p>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div
    class="px-6 py-4 border-t backdrop-blur-xl flex items-center justify-between transition-all duration-700 shrink-0 {$walletStore.isHyperMode
      ? 'bg-orange-600/95 border-orange-400/40'
      : 'bg-zinc-900/95 border-white/10'}"
  >
    <div class="flex items-center gap-4">
      <div
        class="w-9 h-9 rounded-xl bg-black flex items-center justify-center border border-white/10 shadow-inner overflow-hidden"
      >
        <img
          src="/logo.png"
          class="w-full h-full object-contain p-1.5"
          alt="CoinFi Logo"
        />
      </div>
      <div>
        <p
          class="text-[10px] font-black text-white uppercase tracking-tight italic"
        >
          Identity Active
        </p>
        <p class="text-[9px] text-zinc-300 font-mono">
          {$walletStore.address?.slice(0, 10)}...{$walletStore.address?.slice(
            -6,
          )}
        </p>
      </div>
    </div>
    <div
      class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10"
    >
      <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
      <span class="text-[9px] font-black text-white uppercase tracking-widest">
        Guarded
      </span>
    </div>
  </div>
</div>
