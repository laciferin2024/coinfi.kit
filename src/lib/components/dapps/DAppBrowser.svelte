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
    ExternalLink,
  } from "lucide-svelte"
  import {
    walletStore,
    NETWORKS,
    ACTIVE_NETWORK,
    activeNetwork,
  } from "$lib/stores/wallet"
  import Button from "$lib/components/ui/Button.svelte"
  import DAppIcon from "$lib/components/ui/DAppIcon.svelte"
  import AIGuardModal from "$lib/components/ui/AIGuardModal.svelte"

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
  let proxyUrl = $state("")
  let pendingRequests = $state<Map<string | number, (response: any) => void>>(
    new Map(),
  )

  // Build proxy URL
  $effect(() => {
    proxyUrl = `/api/dapp-proxy?url=${encodeURIComponent(dapp.url)}`
  })

  // Web3 Provider Bridge - handles messages from injected provider
  onMount(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data

      // Handle wallet state request from iframe
      if (data?.type === "WALLET_STATE_REQUEST") {
        sendWalletState()
        return
      }

      // Handle Web3 requests from iframe
      if (data?.type === "WEB3_REQUEST") {
        handleWeb3Request(data.payload, event.source as Window)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  })

  // Send wallet state to iframe
  function sendWalletState() {
    if (!iframeRef?.contentWindow) return

    const chainIdHex = `0x${$activeNetwork.chainId.toString(16)}`

    iframeRef.contentWindow.postMessage(
      {
        type: "WALLET_STATE",
        accounts: $walletStore.address ? [$walletStore.address] : [],
        chainId: chainIdHex,
      },
      "*",
    )
  }

  // Handle Web3 RPC requests
  async function handleWeb3Request(
    payload: { id: string | number; method: string; params: any[] },
    source: Window,
  ) {
    const { id, method, params } = payload

    console.log(`[DApp Bridge] ${method}`, params)

    try {
      let result: any

      switch (method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          result = $walletStore.address ? [$walletStore.address] : []
          break

        case "eth_chainId":
          result = `0x${$activeNetwork.chainId.toString(16)}`
          break

        case "net_version":
          result = $activeNetwork.chainId.toString()
          break

        case "eth_sendTransaction":
          // Trigger AI Guard modal
          console.info(
            "[DApp Bridge] Transaction request - triggering AI Guard",
          )
          walletStore.setExternalRequest({
            id: id.toString(),
            type: "eth_sendTransaction",
            payload: params[0],
            origin: dapp.domain,
          })
          // The response will be sent when user approves/rejects in AIGuardModal
          return // Don't send response yet

        case "personal_sign":
        case "eth_signTypedData":
        case "eth_signTypedData_v4":
          // Signing requests - also go through AI Guard
          walletStore.setExternalRequest({
            id: id.toString(),
            type: method as
              | "personal_sign"
              | "eth_signTypedData"
              | "eth_signTypedData_v4",
            payload: params,
            origin: dapp.domain,
          })
          return

        case "wallet_switchEthereumChain":
          const chainId = parseInt(params[0]?.chainId, 16)
          const network = NETWORKS.find((n) => n.chainId === chainId)
          if (network) {
            walletStore.setActiveNetworkId(network.id)
            result = null
          } else {
            throw new Error("Unrecognized chain ID")
          }
          break

        case "wallet_addEthereumChain":
          // For now, just return null (success) if it matches our networks
          result = null
          break

        case "eth_call":
        case "eth_estimateGas":
        case "eth_getBalance":
        case "eth_getTransactionCount":
        case "eth_blockNumber":
        case "eth_getBlockByNumber":
        case "eth_getTransactionByHash":
        case "eth_getTransactionReceipt":
        case "eth_gasPrice":
        case "eth_getCode":
          // Forward to RPC
          const rpcResult = await forwardToRpc(method, params)
          result = rpcResult
          break

        default:
          console.warn(`[DApp Bridge] Unsupported: ${method}`)
          throw new Error(`Method not supported: ${method}`)
      }

      // Send response back to iframe
      source.postMessage(
        {
          type: "WEB3_RESPONSE",
          id,
          result,
        },
        "*",
      )
    } catch (error: any) {
      source.postMessage(
        {
          type: "WEB3_RESPONSE",
          id,
          error: error.message,
        },
        "*",
      )
    }
  }

  // Forward RPC calls to blockchain
  async function forwardToRpc(method: string, params: any[]): Promise<any> {
    // Get RPC URL from current network
    const currentNet =
      NETWORKS.find((n) => n.id === $walletStore.activeNetworkId) ||
      ACTIVE_NETWORK
    const rpcUrl = currentNet.rpcUrl || ACTIVE_NETWORK.rpcUrl

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    })

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message)
    }
    return data.result
  }

  function handleRefresh() {
    isRefreshing = true
    hasError = false
    setTimeout(() => (isRefreshing = false), 800)
    if (iframeRef) {
      iframeRef.src = proxyUrl
    }
  }

  function handleIframeLoad() {
    // Send wallet state once iframe loads
    setTimeout(sendWalletState, 500)
  }

  function handleIframeError() {
    hasError = true
  }

  function handleExternalOpen() {
    window.open(dapp.url, "_blank", "noopener,noreferrer")
  }

  function closeBrowser() {
    walletStore.closeDAppBrowser()
  }
</script>

<!-- AI Guard Modal for transaction approval -->
{#if $walletStore.externalRequest}
  <AIGuardModal onClose={() => walletStore.setExternalRequest(null)} />
{/if}

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
            <ShieldCheck class="w-2.5 h-2.5" /> AI GUARD
          </div>
        </h3>
        <p class="text-[9px] text-zinc-500 font-mono italic">{dapp.domain}</p>
      </div>
      <Button
        variant="ghost"
        size="md"
        onclick={handleExternalOpen}
        class="h-8 w-8 text-zinc-400 hover:text-white p-0"
      >
        <ExternalLink class="w-4 h-4" />
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
        >AI Guard Active</span
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
            Failed to Load DApp
          </h3>
          <p
            class="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed"
          >
            The DApp could not be loaded through our secure proxy.
          </p>
        </div>
        <div class="space-y-3 w-full max-w-sm">
          <Button
            onclick={handleRefresh}
            class="h-14 rounded-2xl bg-zinc-900 border border-white/10 font-black uppercase tracking-widest text-[10px] w-full"
          >
            Retry
          </Button>
          <Button
            variant="outline"
            class="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full"
            onclick={handleExternalOpen}
          >
            Open in Browser
          </Button>
        </div>
      </div>
    {/if}

    {#if !isRefreshing && !hasError}
      <iframe
        bind:this={iframeRef}
        src={proxyUrl}
        class="w-full h-full border-none"
        title={dapp.name}
        onload={handleIframeLoad}
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
          Loading DApp...
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
      <DAppIcon src={dapp.icon} name={dapp.name} size="sm" />
      <div>
        <p
          class="text-[10px] font-black text-white uppercase tracking-tight italic"
        >
          Connected
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
        {$activeNetwork.name}
      </span>
    </div>
  </div>
</div>
