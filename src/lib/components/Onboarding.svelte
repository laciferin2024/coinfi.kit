<script lang="ts">
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import { walletStore } from "$lib/stores/wallet"
  import {
    registerPasskey,
    isPasskeyAvailable,
    bufferToBase64,
  } from "$lib/utils/crypto-utils"
  import { onMount } from "svelte"

  let step = $state(0)
  let isReturningUser = $state(false)
  let publicAddress = $state("")
  let mnemonic = $state("")
  let privateKey = $state("")
  let copied = $state(false)
  let isLoading = $state(false)
  let passkeyAvailable = $state(false)
  let errorMessage = $state("")
  let isMPC = $state(false)
  let googleAuthLoading = $state(false)

  onMount(async () => {
    if (browser) {
      isReturningUser =
        localStorage.getItem("wallet_onboarded_status") === "true"
      passkeyAvailable = await isPasskeyAvailable()
    }
  })

  async function generateIdentity() {
    isLoading = true
    errorMessage = ""
    await walletStore.generateTempWallet()

    const unsubscribe = walletStore.subscribe((state) => {
      if (state.tempWallet) {
        publicAddress = state.tempWallet.address
        mnemonic = state.tempWallet.mnemonic
        privateKey = state.tempWallet.privateKey
      }
    })
    unsubscribe()
    isLoading = false
  }

  function regenerateIdentity() {
    generateIdentity()
  }

  function copyAddress() {
    if (browser && publicAddress) {
      navigator.clipboard.writeText(publicAddress)
      copied = true
      setTimeout(() => (copied = false), 2000)
    }
  }

  async function nextStep() {
    errorMessage = ""

    if (isReturningUser) {
      isLoading = true
      const success = await walletStore.unlockWallet()
      if (success) {
        goto("/home")
      } else {
        isReturningUser = false
        isLoading = false
      }
      return
    }

    if (step === 0) {
      step = 1
      await generateIdentity()
    } else if (step === 1) {
      step = 2
    } else {
      isLoading = true
      await walletStore.commitOnboarding(null)
      goto("/home")
    }
  }

  async function createPasskey() {
    if (!publicAddress || !privateKey) return

    isLoading = true
    errorMessage = ""

    try {
      const deviceKey = bufferToBase64(
        crypto.getRandomValues(new Uint8Array(32)).buffer,
      )
      localStorage.setItem("wallet_device_key", deviceKey)

      const credentialId = await registerPasskey(
        deviceKey,
        privateKey,
        publicAddress,
      )

      await walletStore.commitOnboarding(credentialId)
      goto("/home")
    } catch (e) {
      const error = e as Error
      errorMessage = error.message || "Passkey registration failed"
    }
  }

  async function createMPCWallet() {
    isLoading = true
    errorMessage = ""
    isMPC = true

    try {
      const result = await walletStore.generateMPCWallet("demo-user")
      if (result.success) {
        goto("/home")
      } else {
        errorMessage = result.error || "MPC Wallet creation failed"
        isLoading = false
      }
    } catch (e: unknown) {
      const error = e as Error
      errorMessage = error.message || "MPC registration failed"
      isLoading = false
    }
  }
</script>

<div class="w-full h-full bg-black px-6 py-12 flex flex-col overflow-hidden">
  <!-- Progress Bar -->
  <div class="w-full h-1 bg-zinc-800 rounded-full mb-8 overflow-hidden">
    <div
      class="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full transition-all duration-500 ease-out"
      style="width: {step === 0 ? '0%' : step === 1 ? '50%' : '100%'}"
    ></div>
  </div>

  <div
    class="flex-1 flex flex-col items-center justify-start pt-4 overflow-y-auto"
  >
    {#if step === 0}
      <!-- Welcome Screen -->
      <div class="flex flex-col items-center gap-6 w-full">
        <div class="relative">
          <img
            src="/logo.png"
            alt="CoinFi"
            class="w-28 h-28 rounded-3xl shadow-lg shadow-orange-500/20"
          />
          <div
            class="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center border-4 border-black shadow-lg"
          >
            <span class="text-white text-lg font-bold">₵</span>
          </div>
        </div>
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-black text-white italic tracking-tight">
            COIN FI
          </h1>
          <p class="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">
            UNLIMITED SELF CUSTODIAL WALLET
          </p>
        </div>
        <button
          onclick={nextStep}
          disabled={isLoading}
          class="w-full max-w-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-black py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 italic uppercase tracking-wide"
        >
          {#if isLoading}
            <span class="animate-pulse">LOADING...</span>
          {:else}
            {isReturningUser ? "UNLOCK ACCESS" : "CREATE WALLET"}
          {/if}
        </button>
        <button
          onclick={createMPCWallet}
          disabled={isLoading}
          class="w-full max-w-xs bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-black py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-white/20 italic uppercase tracking-wide flex items-center justify-center gap-2"
        >
          {#if isLoading && isMPC}
            <span class="animate-pulse">CREATING MPC...</span>
          {:else}
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
              />
            </svg>
            MPC WALLET (CLOUD BACKUP)
          {/if}
        </button>
        <p
          class="text-[9px] text-zinc-600 text-center tracking-widest uppercase"
        >
          MPC SECURITY. MANDATED GOOGLE DRIVE BACKUP.
        </p>
      </div>
    {:else if step === 1}
      <!-- Identity Generation -->
      <div class="flex flex-col items-center w-full">
        <h1 class="text-2xl font-black text-white italic mb-2 tracking-tight">
          YOUR IDENTITY
        </h1>
        <p
          class="text-[10px] text-zinc-500 text-center mb-6 tracking-wide uppercase leading-relaxed"
        >
          SELF CUSTODIAL GENERATION. ON-DEVICE<br />
          PRIVATE ROOT NODE CREATED.
        </p>

        <div
          class="w-full bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-3xl p-5 mb-5 border border-white/5 backdrop-blur-sm"
        >
          <div class="w-full flex justify-center mb-4">
            <div
              class="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-orange-500/30 shadow-lg shadow-orange-500/10"
            >
              <svg
                class="w-7 h-7 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <p
            class="text-[9px] text-zinc-600 text-center mb-2 tracking-widest uppercase"
          >
            PUBLIC ADDRESS
          </p>
          <p
            class="text-xs text-orange-500 text-center mb-5 font-mono break-all leading-relaxed px-2"
          >
            {publicAddress || "Generating..."}
          </p>
          <div class="flex gap-2 justify-center">
            <button
              onclick={copyAddress}
              class="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase rounded-xl border border-white/10 transition-all"
            >
              {copied ? "✓ COPIED" : "COPY"}
            </button>
            <button
              onclick={regenerateIdentity}
              disabled={isLoading}
              class="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-50 text-white text-[10px] font-bold uppercase rounded-xl border border-white/10 transition-all"
            >
              ↻ REGENERATE
            </button>
          </div>
        </div>

        <button
          onclick={nextStep}
          disabled={!publicAddress || isLoading}
          class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 italic uppercase tracking-wide"
        >
          CONFIRM IDENTITY →
        </button>
      </div>
    {:else}
      <!-- Biometric Shield -->
      <div class="flex flex-col items-center w-full">
        <h1 class="text-2xl font-black text-white italic mb-2 tracking-tight">
          BIOMETRIC SHIELD
        </h1>
        <p
          class="text-[10px] text-zinc-500 text-center mb-6 tracking-wide uppercase leading-relaxed"
        >
          UNLIMITED SECURITY: HARDWARE-BOUND<br />
          PASSKEY FOR GASLESS SELF-CUSTODIAL<br />
          SIGNING.
        </p>

        <div
          class="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border-2 border-orange-500/30 mb-8 shadow-lg shadow-orange-500/10"
        >
          <svg
            class="w-10 h-10 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M7 11.5V7a5 5 0 0110 0v4.5m-9 0h8m-8 0a2 2 0 00-2 2v5a2 2 0 002 2h8a2 2 0 002-2v-5a2 2 0 00-2-2m-4 3v2"
            />
          </svg>
        </div>

        {#if errorMessage}
          <div
            class="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] text-center"
          >
            {errorMessage}
          </div>
        {/if}

        {#if passkeyAvailable}
          <button
            onclick={createPasskey}
            disabled={isLoading}
            class="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-black py-4 rounded-2xl mb-3 transition-all shadow-lg italic uppercase tracking-wide"
          >
            {isLoading ? "REGISTERING..." : "CREATE PASSKEY"}
          </button>
        {:else}
          <div
            class="w-full mb-3 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center"
          >
            <p class="text-zinc-500 text-[10px] uppercase tracking-wide">
              Passkeys not available on this device
            </p>
          </div>
        {/if}

        <button
          onclick={nextStep}
          disabled={isLoading}
          class="w-full text-zinc-500 hover:text-zinc-300 text-xs underline underline-offset-4 disabled:opacity-50 transition-colors py-2"
        >
          USE LITE MODE (NO BIOMETRICS)
        </button>

        <p
          class="text-[9px] text-zinc-600 text-center mt-6 tracking-wide uppercase leading-relaxed"
        >
          YOUR BIOMETRICS REMAIN LOCKED IN THE<br />
          SECURE HARDWARE ENCLAVE.
        </p>
      </div>
    {/if}
  </div>
</div>
