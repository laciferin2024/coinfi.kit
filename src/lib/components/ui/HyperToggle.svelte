<script lang="ts">
  import { walletStore } from "$lib/stores/wallet"
  import { Zap } from "lucide-svelte"
</script>

<!-- Pill-shaped toggle switch with zap icon knob -->
<button
  onclick={() => walletStore.setHyperMode(!$walletStore.isHyperMode)}
  class="relative w-14 h-7 rounded-full transition-all duration-300 {$walletStore.isHyperMode
    ? 'bg-orange-600 shadow-lg shadow-orange-500/40'
    : 'bg-zinc-800 border border-white/10'}"
  aria-label="Toggle Hyper Mode"
>
  <!-- Sliding knob with zap icon -->
  <div
    class="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 {$walletStore.isHyperMode
      ? 'left-[calc(100%-1.625rem)] bg-white'
      : 'left-0.5 bg-zinc-700'}"
  >
    <Zap
      class="w-3.5 h-3.5 {$walletStore.isHyperMode
        ? 'text-orange-600 fill-orange-600'
        : 'text-zinc-500'}"
    />
  </div>
</button>
