<script lang="ts">
  import type { Snippet } from "svelte"
  import { walletStore } from "$lib/stores/wallet"

  interface Props {
    children: Snippet
    class?: string
    showPhoneFrame?: boolean
  }

  let {
    children,
    class: className = "",
    showPhoneFrame = false,
  }: Props = $props()
</script>

{#if showPhoneFrame}
  <!-- Phone Frame Mode (for onboarding) -->
  <div
    class="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden"
  >
    <!-- Blue glow effect -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]"
      ></div>
    </div>

    <div
      class="relative w-full max-w-[400px] aspect-[9/19.5] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[3rem] border-[6px] border-zinc-700 shadow-2xl overflow-hidden"
    >
      <!-- Notch -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-10 flex items-center justify-center"
      >
        <div class="w-16 h-4 bg-zinc-900 rounded-full"></div>
      </div>

      <!-- Screen Content -->
      <div class="w-full h-full bg-black overflow-hidden">
        {@render children()}
      </div>
    </div>
  </div>
{:else}
  <!-- Full Screen Mode (for main app) -->
  <div
    class="min-h-screen w-full bg-black text-white relative overflow-hidden {className}"
  >
    <!-- Reactive glow effect - Blue when lite mode, Orange when hyper mode -->
    <div
      class="absolute inset-0 pointer-events-none overflow-hidden transition-all duration-700"
    >
      {#if $walletStore.isHyperMode}
        <!-- Orange Hyper Mode glow -->
        <div
          class="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-600/20 rounded-full blur-[120px] animate-pulse"
        ></div>
        <div
          class="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-600/20 rounded-full blur-[120px] animate-pulse"
        ></div>
        <div
          class="absolute -top-32 -left-32 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]"
        ></div>
        <div
          class="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]"
        ></div>
      {:else}
        <!-- Blue Lite Mode glow -->
        <div
          class="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"
        ></div>
        <div
          class="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"
        ></div>
      {/if}
    </div>

    <div class="max-w-[430px] mx-auto relative min-h-screen">
      {@render children()}
    </div>
  </div>
{/if}
