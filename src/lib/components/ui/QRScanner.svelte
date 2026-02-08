<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Html5Qrcode } from "html5-qrcode"
  import { Camera, AlertCircle } from "lucide-svelte"

  interface Props {
    onScan: (result: string) => void
    onError?: (error: string) => void
  }

  let { onScan, onError }: Props = $props()

  let scannerElement: HTMLDivElement
  let html5QrCode: Html5Qrcode | null = null
  let isScanning = $state(false)
  let isLoading = $state(true)
  let error = $state<string | null>(null)
  let hasPermission = $state(false)

  async function startScanner() {
    isLoading = true
    error = null

    try {
      // Ensure previous instance is stopped
      if (html5QrCode && isScanning) {
        await stopScanning()
      }

      // Create new instance if needed
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader")
      }

      // Check for cameras first (triggers permission)
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found on this device.")
      }

      // Show the element first
      isScanning = true
      isLoading = true // Still loading camera

      // Start scanning
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("[QR Scanner] Scanned:", decodedText)
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Ignore parse errors, scanning is working
        },
      )

      isScanning = true
      isLoading = false
      hasPermission = true
    } catch (err: any) {
      console.error("[QR Scanner] Failed to start:", err)

      // Handle specifically known errors
      let errorMsg = "Failed to access camera."

      if (
        err?.name === "NotAllowedError" ||
        err?.message?.includes("permission")
      ) {
        errorMsg = "Camera permission denied. Please allow access."
      } else if (
        err?.name === "NotFoundError" ||
        err?.message?.includes("No cameras")
      ) {
        errorMsg = "No camera found on this device."
      } else if (err?.message) {
        errorMsg = err.message
      }

      error = errorMsg
      isLoading = false
      onError?.(errorMsg)
    }
  }

  onMount(() => {
    startScanner()
  })

  async function stopScanning() {
    if (html5QrCode && (isScanning || html5QrCode.isScanning)) {
      try {
        await html5QrCode.stop()
        isScanning = false
      } catch (err) {
        console.error("[QR Scanner] Failed to stop:", err)
      }
    }
  }

  onDestroy(async () => {
    if (html5QrCode) {
      if (isScanning) {
        await stopScanning()
      }
      html5QrCode.clear()
      html5QrCode = null
    }
  })
</script>

<div
  class="relative w-full aspect-[9/16] max-h-[70vh] bg-black rounded-[3.5rem] overflow-hidden border-[12px] border-zinc-900 shadow-2xl relative shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
>
  <!-- iPhone Notch/Island Mockup -->
  <div
    class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-900 rounded-b-2xl z-30"
  ></div>

  <!-- The actual scanner element - always in DOM and sized -->
  <div id="qr-reader" bind:this={scannerElement} class="w-full h-full"></div>

  {#if isLoading}
    <!-- Loading State Overlay -->
    <div
      class="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-4 bg-zinc-950/80 backdrop-blur-md"
    >
      <div
        class="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"
      ></div>
      <p class="text-sm text-zinc-400 font-medium">Starting camera...</p>
    </div>
  {:else if error}
    <!-- Error State Overlay -->
    <div
      class="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 bg-rose-500/10 backdrop-blur-md p-6 text-center"
    >
      <AlertCircle class="w-12 h-12 text-rose-400" />
      <div class="space-y-1">
        <p class="text-sm font-bold text-rose-400">Camera Error</p>
        <p class="text-xs text-zinc-500">{error}</p>
      </div>
      <button
        onclick={startScanner}
        class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wide transition-colors"
      >
        Retry Access
      </button>
    </div>
  {:else if isScanning}
    <!-- Scan Overlay (UI guides) -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <!-- Target Frame -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div
          class="w-48 h-48 border-2 border-orange-500/30 rounded-3xl relative"
        >
          <!-- Corner Accents -->
          <div
            class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-xl"
          ></div>
          <div
            class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-xl"
          ></div>
          <div
            class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-xl"
          ></div>
          <div
            class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-xl"
          ></div>

          <!-- Scanning Line Animation -->
          <div
            class="absolute left-2 right-2 h-0.5 bg-orange-500 animate-[scan_3s_ease-in-out_infinite] opacity-60 shadow-[0_0_20px_rgba(249,115,22,1)]"
          ></div>
        </div>
      </div>

      <!-- Bottom UI Hint -->
      <div class="absolute bottom-10 left-0 right-0 flex justify-center px-6">
        <div class="flex flex-col items-center gap-3">
          <div
            class="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10"
          >
            <Camera class="w-3.5 h-3.5 text-orange-500" />
            <p
              class="text-[10px] text-zinc-300 font-bold uppercase tracking-wider"
            >
              Align QR code
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes scan {
    0%,
    100% {
      top: 10%;
    }
    50% {
      top: 90%;
    }
  }

  /* Override html5-qrcode default styles */
  :global(#qr-reader) {
    border: none !important;
  }

  :global(#qr-reader video) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  :global(#qr-reader__dashboard_section) {
    display: none !important;
  }

  :global(#qr-reader__dashboard_section_csr) {
    display: none !important;
  }
</style>
