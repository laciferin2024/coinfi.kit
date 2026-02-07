<script lang="ts">
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import { walletStore } from "$lib/stores/wallet"
  import { onMount } from "svelte"

  let isLoading = $state(false)
  let errorMessage = $state("")

  async function connectPorto() {
    isLoading = true
    errorMessage = ""
    try {
      const result = await walletStore.connectPorto()
      if (result.success) {
        goto("/home")
      } else {
        errorMessage = result.error || "Connection failed"
      }
    } catch (e: any) {
      errorMessage = e.message || "Connection failed"
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    if (browser && localStorage.getItem("wallet_onboarded_status") === "true") {
      // Optional: Auto-connect or just show unlock button if needed
      // For now, simpler to just let them click connect
    }
  })
</script>

<div
  class="w-full h-full bg-black px-6 py-12 flex flex-col items-center justify-center overflow-hidden"
>
  <!-- WELCOME / START -->
  <div class="flex flex-col items-center gap-8 w-full max-w-sm">
    <div
      class="relative group cursor-pointer hover:scale-105 transition-transform duration-500"
    >
      <img
        src="/logo.png"
        alt="Coin OS"
        class="w-32 h-32 rounded-3xl shadow-2xl shadow-orange-500/20"
      />
      <div
        class="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center border-4 border-black shadow-lg"
      >
        <span class="text-white text-lg font-bold">₵</span>
      </div>
    </div>

    <div class="text-center space-y-3">
      <h1 class="text-5xl font-black text-white italic tracking-tight">
        COIN OS
      </h1>
      <p class="text-[10px] text-zinc-500 tracking-[0.4em] uppercase font-bold">
        AI POWERED OS FOR ETHEREUM USERS
      </p>
    </div>

    <div class="w-full pt-8 space-y-4">
      <button
        onclick={connectPorto}
        disabled={isLoading}
        class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-black py-5 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 italic uppercase tracking-wide text-lg flex items-center justify-center gap-3 group"
      >
        {#if isLoading}
          <span class="animate-pulse">CONNECTING...</span>
        {:else}
          <span>ENTER UNIVERSE</span>
          <span class="group-hover:translate-x-1 transition-transform">→</span>
        {/if}
      </button>

      {#if errorMessage}
        <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <p
            class="text-[10px] text-rose-500 font-bold uppercase text-center tracking-wider"
          >
            {errorMessage}
          </p>
        </div>
      {/if}
    </div>

    <div class="pt-8 flex flex-col items-center gap-2 opacity-60">
      <p class="text-[8px] text-zinc-600 uppercase tracking-widest">
        POWERED BY PORTO
      </p>
      <div class="w-1 h-1 rounded-full bg-zinc-800"></div>
      <p class="text-[8px] text-zinc-700 uppercase tracking-widest">v3.0.0</p>
    </div>
  </div>
</div>
