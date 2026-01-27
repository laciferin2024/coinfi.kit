<script lang="ts">
  import { goto } from '$app/navigation';
  import { Wallet } from 'ethers';

  let step = $state(0);
    let isReturningUser = $state(false);

    // Check if user has already onboarded (client-side only)
  $effect(() => {
    isReturningUser = localStorage.getItem('wallet_onboarded_status') === 'true';
  });let publicAddress = $state('');
  let mnemonic = $state('');
  let copied = $state(false);

  function generateIdentity() {
    const wallet = Wallet.createRandom();
    publicAddress = wallet.address;
    mnemonic = wallet.mnemonic?.phrase || '';
  }

  function regenerateIdentity() {
    generateIdentity();
  }

  function copyAddress() {
    navigator.clipboard.writeText(publicAddress);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function nextStep() {
        // If returning user, just unlock and go to home
    if (isReturningUser) {
      goto('/home');
      return;
    }

    if (step === 0) {
      step = 1;
      generateIdentity();
    } else if (step === 1) {
      step = 2;
    } else {
      // Store all the correct localStorage keys
      localStorage.setItem('wallet_address', publicAddress);
      localStorage.setItem('wallet_temp_mnemonic', mnemonic);
      localStorage.setItem('wallet_onboarded_status', 'true');
      localStorage.setItem('wallet_hyper_mode', 'false');
      goto('/home');
    }
  }
</script>

<div class="min-h-screen w-full bg-black flex items-center justify-center p-4">
  <div class="relative w-full max-w-[400px] aspect-[9/19.5] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] border-8 border-gray-700 shadow-2xl overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
    
    <div class="w-full h-full bg-black px-6 py-12 flex flex-col">
      <div class="w-full h-1 bg-gray-800 rounded-full mb-8">
        <div class="h-full bg-orange-500 rounded-full transition-all" style="width: {step === 0 ? '0%' : step === 1 ? '50%' : '100%'}"></div>
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
              <p class="text-xs text-gray-400 tracking-widest">UNLIMITED SELF CUSTODIAL WALLET</p>
            </div>
            <button onclick={nextStep} class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-full transition-colors italic">
              {isReturningUser ? 'UNLOCK ACCESS' : 'CREATE WALLET'}            </button>
            <p class="text-xs text-gray-500 text-center">UNLIMITED SELF CUSTODY. SECURED BY PASSKEYS.</p>
          </div>

        {:else if step === 1}
          <h1 class="text-3xl font-bold text-white mb-3">YOUR IDENTITY</h1>
          <p class="text-xs text-gray-400 text-center mb-8">
            SELF CUSTODIAL GENERATION. ON-DEVICE<br/>
            PRIVATE ROOT NODE CREATED.
          </p>
          <div class="w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
            <div class="w-full flex justify-center mb-6">
              <div class="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-orange-500/30">
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500 text-center mb-3">PUBLIC ADDRESS</p>
            <p class="text-sm text-orange-500 text-center mb-6 font-mono break-all">{publicAddress}</p>
            <div class="flex gap-3 justify-center">
              <button onclick={copyAddress} class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg border border-gray-600">
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onclick={regenerateIdentity} class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg border border-gray-600">
                Regenerate
              </button>
            </div>
          </div>
          <button onclick={nextStep} class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl">
            CONFIRM IDENTITY →
          </button>

        {:else}
          <h1 class="text-3xl font-bold text-white mb-3">BIOMETRIC SHIELD</h1>
          <p class="text-xs text-gray-400 text-center mb-8">
            UNLIMITED SECURITY: HARDWARE-BOUND<br/>
            PASSKEY FOR GASLESS SELF-CUSTODIAL<br/>
            SIGNING.
          </p>
          <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border-2 border-orange-500/30 mb-12">
            <svg class="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0-7c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-6 6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-6 6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
            </svg>
          </div>
          <button class="w-full bg-white hover:bg-gray-100 text-black font-bold py-4 rounded-2xl mb-4">
            CREATE PASSKEY
          </button>
          <button onclick={nextStep} class="w-full text-gray-400 hover:text-white text-sm underline">
            USE LITE MODE (NO BIOMETRICS)
          </button>
          <p class="text-xs text-gray-500 text-center mt-8">
            YOUR BIOMETRICS REMAIN LOCKED IN THE SECURE<br/>
            HARDWARE ENCLAVE.
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
