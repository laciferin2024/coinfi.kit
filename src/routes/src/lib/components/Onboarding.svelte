<script lang="ts">
  import { onMount } from 'svelte';
  import { walletStore } from '$lib/stores/wallet';
  import { Button } from '$lib/components/ui/button';
  import { goto } from '$app/navigation';

  let step = $state(1);
  let publicAddress = $state('');
  let copied = $state(false);

  function generateIdentity() {
    // Generate a mock public address for demo
    const chars = '0123456789ABCDEF';
    let address = '0x';
    for (let i = 0; i < 62; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    publicAddress = address;
  }

  function regenerateIdentity() {
    generateIdentity();
  }

  function copyAddress() {
    navigator.clipboard.writeText(publicAddress);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function confirmIdentity() {
    walletStore.set({
      address: publicAddress,
      onboarded: 'true'
    });
    localStorage.setItem('wallet_address', publicAddress);
    localStorage.setItem('wallet_onboarded_status', 'true');
    goto('/home');
  }

  onMount(() => {
    generateIdentity();
  });
</script>

<div class="min-h-screen w-full bg-black flex items-center justify-center p-4">
  <!-- Mobile Frame -->
  <div class="relative w-full max-w-[400px] aspect-[9/19.5] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] border-8 border-gray-700 shadow-2xl overflow-hidden">
    <!-- Notch -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
    
    <!-- Screen Content -->
    <div class="w-full h-full bg-black px-6 py-12 flex flex-col">
      <!-- Progress Bar -->
      <div class="w-full h-1 bg-gray-800 rounded-full mb-8">
        <div class="h-full bg-orange-500 rounded-full transition-all duration-300" style="width: {step === 1 ? '33%' : step === 2 ? '100%' : '100%'}"></div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col items-center justify-start pt-8">
        {#if step === 1}
          <h1 class="text-3xl font-bold text-white mb-3 tracking-tight">YOUR IDENTITY</h1>
          <p class="text-xs text-gray-400 text-center mb-8 tracking-wide">
            SELF CUSTODIAL GENERATION. ON-DEVICE<br/>
            PRIVATE ROOT NODE CREATED.
          </p>

          <!-- Identity Card -->
          <div class="w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
            <!-- Lock Icon -->
            <div class="w-full flex justify-center mb-6">
              <div class="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-orange-500/30">
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <!-- Public Address Label -->
            <p class="text-xs text-gray-500 text-center mb-3 tracking-wider">PUBLIC ADDRESS</p>
            
            <!-- Address -->
            <p class="text-sm text-orange-500 text-center mb-6 font-mono break-all leading-relaxed">
              {publicAddress}
            </p>

            <!-- Action Buttons -->
            <div class="flex gap-3 justify-center">
              <button
                onclick={copyAddress}
                class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors border border-gray-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onclick={regenerateIdentity}
                class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors border border-gray-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>

          <!-- Confirm Button -->
          <button
            onclick={confirmIdentity}
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm tracking-wider"
          >
            CONFIRM IDENTITY
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>