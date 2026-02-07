<script lang="ts">
  import { ArrowRight, Loader2 } from "lucide-svelte"
  import { walletStore } from "$lib/stores/wallet"
  import ModernButton from "$lib/components/ui/ModernButton.svelte"

  let isLoading = $state(false)
  let error = $state("")

  async function handleConnect() {
    isLoading = true
    error = ""
    try {
      const result = await walletStore.connectPorto()
      if (!result.success) {
        throw new Error(result.error || "Failed to connect")
      }
      // Success is handled by store update -> navigation
    } catch (e: any) {
      console.error(e)
      error = e.message || "Connection failed. Please try again."
    } finally {
      isLoading = false
    }
  }
</script>

<div class="h-full flex flex-col items-center justify-between p-8 relative">
  <!-- Hero Content -->
  <div
    class="flex-1 flex flex-col items-center justify-center text-center space-y-8 z-10"
  >
    <div class="relative">
      <div
        class="absolute inset-0 bg-orange-500/20 blur-[50px] rounded-full animate-pulse"
      ></div>
      <img
        src="/logo.png"
        alt="Coin Fi"
        class="w-32 h-32 relative z-10 drop-shadow-2xl"
      />
    </div>

    <div class="space-y-4">
      <h1 class="text-4xl font-black italic tracking-tighter text-white">
        COIN <span
          class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500"
          >OS</span
        >
      </h1>
      <p
        class="text-zinc-400 text-sm font-bold tracking-wide uppercase max-w-[260px] mx-auto leading-relaxed"
      >
        Next Gen Crypto OS
      </p>
    </div>
  </div>

  <!-- Actions -->
  <div class="w-full space-y-4 z-10">
    {#if error}
      <p
        class="text-center text-rose-500 text-xs font-medium bg-rose-500/10 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2"
      >
        {error}
      </p>
    {/if}

    <ModernButton
      onclick={handleConnect}
      {isLoading}
      class="w-full h-14 text-base shadow-xl shadow-orange-500/20"
    >
      Connect Wallet
      <ArrowRight class="w-4 h-4 ml-2 inline-block opacity-60" />
    </ModernButton>

    <p class="text-[10px] text-center text-zinc-600 font-medium">
      Powered by <a
        href="https://porto.sh"
        target="_blank"
        class="text-zinc-400 hover:text-white underline">Porto SDK</a
      >
    </p>
  </div>
</div>
