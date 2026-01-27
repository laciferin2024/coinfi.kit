<script lang="ts">
  import { X, ArrowDownLeft, Copy, Check, QrCode } from "lucide-svelte"
  import { walletStore, activeNetwork } from "$lib/stores/wallet"
  import type { TokenAsset } from "$lib/types"

  interface Props {
    isOpen: boolean
    token: TokenAsset | null
    onClose: () => void
  }

  let { isOpen, token, onClose }: Props = $props()

  let copied = $state(false)

  function copyAddress() {
    if ($walletStore.address) {
      navigator.clipboard.writeText($walletStore.address)
      copied = true
      setTimeout(() => (copied = false), 2000)
    }
  }
</script>

{#if isOpen && token}
  <div
    class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center"
    onclick={onClose}
  >
    <div
      class="w-full max-w-[400px] bg-zinc-900 rounded-t-[2.5rem] border-t border-white/10 p-6 pb-10 space-y-6"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-emerald-600">
            <ArrowDownLeft class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-xl font-black uppercase italic text-white">
              Receive
            </h2>
            <p class="text-[10px] text-zinc-500 uppercase">
              {token.symbol} on {$activeNetwork.name}
            </p>
          </div>
        </div>
        <button
          onclick={onClose}
          class="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <X class="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <!-- QR Code Placeholder -->
      <div class="flex flex-col items-center py-8 space-y-6">
        <div class="w-48 h-48 rounded-3xl bg-white p-4 shadow-xl">
          <div
            class="w-full h-full bg-zinc-100 rounded-2xl flex items-center justify-center relative overflow-hidden"
          >
            <!-- Simplified QR pattern -->
            <svg viewBox="0 0 100 100" class="w-full h-full">
              <rect x="10" y="10" width="20" height="20" fill="#000" />
              <rect x="35" y="10" width="10" height="10" fill="#000" />
              <rect x="50" y="10" width="10" height="10" fill="#000" />
              <rect x="70" y="10" width="20" height="20" fill="#000" />
              <rect x="10" y="35" width="10" height="10" fill="#000" />
              <rect x="30" y="35" width="10" height="10" fill="#000" />
              <rect x="50" y="35" width="10" height="10" fill="#000" />
              <rect x="70" y="35" width="10" height="10" fill="#000" />
              <rect x="10" y="50" width="10" height="10" fill="#000" />
              <rect x="40" y="50" width="20" height="10" fill="#000" />
              <rect x="80" y="50" width="10" height="10" fill="#000" />
              <rect x="10" y="70" width="20" height="20" fill="#000" />
              <rect x="35" y="80" width="10" height="10" fill="#000" />
              <rect x="55" y="70" width="10" height="10" fill="#000" />
              <rect x="70" y="70" width="20" height="20" fill="#000" />
              <rect x="15" y="15" width="10" height="10" fill="#fff" />
              <rect x="75" y="15" width="10" height="10" fill="#fff" />
              <rect x="15" y="75" width="10" height="10" fill="#fff" />
              <rect x="75" y="75" width="10" height="10" fill="#fff" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xl shadow-lg"
              >
                {token.icon}
              </div>
            </div>
          </div>
        </div>

        <div class="text-center space-y-2">
          <p class="text-xs text-zinc-400 uppercase font-bold tracking-wide">
            Your {token.symbol} Address
          </p>
          <p class="text-sm text-zinc-500">
            Only send {token.symbol} on
            <span class="text-orange-500 font-bold">{$activeNetwork.name}</span> to
            this address
          </p>
        </div>
      </div>

      <!-- Address Display -->
      <div class="space-y-3">
        <div class="p-4 rounded-xl bg-zinc-800 border border-white/10">
          <p class="text-xs font-mono text-white break-all leading-relaxed">
            {$walletStore.address}
          </p>
        </div>

        <button
          onclick={copyAddress}
          class="w-full py-4 rounded-xl bg-zinc-800 border border-white/10 text-white font-bold uppercase text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          {#if copied}
            <Check class="w-5 h-5 text-emerald-400" />
            <span class="text-emerald-400">Copied!</span>
          {:else}
            <Copy class="w-5 h-5" />
            Copy Address
          {/if}
        </button>
      </div>

      <!-- Warning -->
      <div class="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <p class="text-[11px] text-orange-400 leading-relaxed">
          <span class="font-bold">Important:</span> Make sure you're sending on the
          correct network. Sending assets on the wrong chain may result in permanent
          loss.
        </p>
      </div>
    </div>
  </div>
{/if}
