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

  onMount(async () => {
    try {
      // Create scanner instance
      html5QrCode = new Html5Qrcode("qr-reader")

      // Start scanning
      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning area
        },
        (decodedText) => {
          // Success callback
          console.log("[QR Scanner] Scanned:", decodedText)
          onScan(decodedText)

          // Stop scanning after successful scan
          stopScanning()
        },
        (errorMessage) => {
          // Error callback (not critical - just means no QR found in frame)
          // We can ignore these
        },
      )

      isScanning = true
      isLoading = false
      hasPermission = true
    } catch (err: any) {
      console.error("[QR Scanner] Failed to start:", err)
      const errorMsg =
        err?.message || "Failed to access camera. Please check permissions."
      error = errorMsg
      isLoading = false
      onError?.(errorMsg)
    }
  })

  async function stopScanning() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop()
        isScanning = false
      } catch (err) {
        console.error("[QR Scanner] Failed to stop:", err)
      }
    }
  }

  onDestroy(async () => {
    await stopScanning()
    html5QrCode = null
  })
</script>

<div class="relative w-full">
  {#if isLoading}
    <!-- Loading State -->
    <div
      class="flex flex-col items-center justify-center py-16 space-y-4 bg-zinc-900 rounded-2xl border border-white/10"
    >
      <div
        class="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"
      ></div>
      <p class="text-sm text-zinc-400 font-medium">Initializing camera...</p>
    </div>
  {:else if error}
    <!-- Error State -->
    <div
      class="flex flex-col items-center justify-center py-16 space-y-4 bg-rose-500/5 rounded-2xl border border-rose-500/20"
    >
      <AlertCircle class="w-12 h-12 text-rose-400" />
      <div class="text-center space-y-1 px-6">
        <p class="text-sm font-bold text-rose-400">Camera Access Failed</p>
        <p class="text-xs text-zinc-500">{error}</p>
      </div>
    </div>
  {:else if isScanning}
    <!-- Scanner Active -->
    <div class="space-y-4">
      <!-- Scanner Container -->
      <div
        class="relative rounded-2xl overflow-hidden border-2 border-orange-500/30 bg-black"
      >
        <div id="qr-reader" bind:this={scannerElement}></div>

        <!-- Scan Overlay -->
        <div
          class="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div
            class="w-64 h-64 border-2 border-orange-500 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.5)]"
          >
            <!-- Corner indicators -->
            <div
              class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl"
            ></div>
            <div
              class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl"
            ></div>
            <div
              class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl"
            ></div>
            <div
              class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-2xl"
            ></div>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div
        class="flex items-center gap-2 px-4 py-3 bg-zinc-900/50 rounded-xl border border-white/5"
      >
        <Camera class="w-4 h-4 text-orange-500" />
        <p class="text-xs text-zinc-400">
          Point your camera at a WalletConnect QR code
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Override html5-qrcode default styles */
  :global(#qr-reader) {
    border: none !important;
  }

  :global(#qr-reader video) {
    border-radius: 1rem;
    object-fit: cover;
  }

  :global(#qr-reader__dashboard_section) {
    display: none !important;
  }

  :global(#qr-reader__dashboard_section_csr) {
    display: none !important;
  }
</style>
