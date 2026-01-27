<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { walletStore } from '$lib/stores/wallet';
  import { onMount } from 'svelte';

  let step = $state(0);
  let isReturningUser = $state(false);
  let publicAddress = $state('');
  let mnemonic = $state('');
  let copied = $state(false);
  let isLoading = $state(false);

  onMount(() => {
    if (browser) {
      isReturningUser = localStorage.getItem('wallet_onboarded_status') === 'true';
    }
  });

  async function generateIdentity() {
    isLoading = true;
    await walletStore.generateTempWallet();
    
    // Subscribe briefly to get the generated wallet
    const unsubscribe = walletStore.subscribe(state => {
      if (state.tempWallet) {
        publicAddress = state.tempWallet.address;
        mnemonic = state.tempWallet.mnemonic;
      }
    });
    unsubscribe();
    isLoading = false;
  }

  function regenerateIdentity() {
    generateIdentity();
  }

  function copyAddress() {
    if (browser && publicAddress) {
      navigator.clipboard.writeText(publicAddress);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  async function nextStep() {
    // If returning user, unlock and go to home
    if (isReturningUser) {
      isLoading = true;
      const success = await walletStore.unlockWallet();
      if (success) {
        goto('/home');
      } else {
        // If unlock fails, treat as new user
        isReturningUser = false;
        isLoading = false;
      }
      return;
    }

    if (step === 0) {
      step = 1;
      await generateIdentity();
    } else if (step === 1) {
      step = 2;
    } else {
      // Complete onboarding (lite mode - no passkey)
      isLoading = true;
      await walletStore.commitOnboarding(null);
      goto('/home');
    }
  }

  async function createPasskey() {
    // For now, just complete with lite mode
    // Full passkey implementation would go here
    isLoading = true;
    await walletStore.commitOnboarding(null);
    goto('/home');
  }
</script>

<div class="min-h-screen w-full bg-black flex items-center justify-center p-4">
  <div class="relative w-full max-w-[400px] aspect-[9/19.5] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[3rem] border-8 border-zinc-700 shadow-2xl overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
    
    <div class="w-full h-full bg-black px-6 py-12 flex flex-col">
      <div class="w-full h-1 bg-zinc-800 rounded-full mb-8">
        <div 
          class="h-full bg-orange-500 rounded-full transition-all duration-300" 
          style="width: {step === 0 ? '0%' : step === 1 ? '50%' : '100%'}"
        ></div>
      </div>

      <div class="flex-1 flex flex-col items-center justify-start pt-8">
        {#if step === 0}
          <div class="flex flex-col items-center gap-8">
            <div class="relative">
              <img src="/logo.png" alt="CoinFi" class="w-32 h-32 rounded-3xl" />
              <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center border-4 border-black">
                <span class="text-white text-2xl">₵</span>
              </div>
            </div>
            <div class="text-center">
              <h1 class="text-4xl font-bold text-white mb-2 italic">COIN FI</h1>
              <p class="text-xs text-zinc-400 tracking-widest">UNLIMITED SELF CUSTODIAL WALLET</p>
            </div>
            <button 
              onclick={nextStep} 
              disabled={isLoading}
              class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-full transition-colors italic"
            >
              {#if isLoading}
                <span class="animate-pulse">LOADING...</span>
              {:else}
                {isReturningUser ? 'UNLOCK ACCESS' : 'CREATE WALLET'}
              {/if}
            </button>
            <p class="text-xs text-zinc-500 text-center">UNLIMITED SELF CUSTODY. SECURED BY PASSKEYS.</p>
          </div>

        {:else if step === 1}
          <h1 class="text-3xl font-bold text-white mb-3">YOUR IDENTITY</h1>
          <p class="text-xs text-zinc-400 text-center mb-8">
            SELF CUSTODIAL GENERATION. ON-DEVICE<br/>
            PRIVATE ROOT NODE CREATED.
          </p>
          <div class="w-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 mb-6 border border-zinc-700">
            <div class="w-full flex justify-center mb-6">
              <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-orange-500/30">
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <p class="text-xs text-zinc-500 text-center mb-3">PUBLIC ADDRESS</p>
            <p class="text-sm text-orange-500 text-center mb-6 font-mono break-all">{publicAddress || 'Generating...'}</p>
            <div class="flex gap-3 justify-center">
              <button 
                onclick={copyAddress} 
                class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg border border-zinc-600"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button 
                onclick={regenerateIdentity} 
                disabled={isLoading}
                class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs rounded-lg border border-zinc-600"
              >
                Regenerate
              </button>
            </div>
          </div>
          <button 
            onclick={nextStep} 
            disabled={!publicAddress || isLoading}
            class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl"
          >
            CONFIRM IDENTITY →
          </button>

        {:else}
          <h1 class="text-3xl font-bold text-white mb-3">BIOMETRIC SHIELD</h1>
          <p class="text-xs text-zinc-400 text-center mb-8">
            UNLIMITED SECURITY: HARDWARE-BOUND<br/>
            PASSKEY FOR GASLESS SELF-CUSTODIAL<br/>
            SIGNING.
          </p>
          <div class="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-orange-500/30 mb-12">
            <svg class="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0-7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-6 6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-6 6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
            </svg>
          </div>
          <button 
            onclick={createPasskey}
            disabled={isLoading}
            class="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-bold py-4 rounded-2xl mb-4"
          >
            {isLoading ? 'SETTING UP...' : 'CREATE PASSKEY'}
          </button>
          <button 
            onclick={nextStep} 
            disabled={isLoading}
            class="w-full text-zinc-400 hover:text-white text-sm underline disabled:opacity-50"
          >
            USE LITE MODE (NO BIOMETRICS)
          </button>
          <p class="text-xs text-zinc-500 text-center mt-8">
            YOUR BIOMETRICS REMAIN LOCKED IN THE SECURE<br/>
            HARDWARE ENCLAVE.
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
