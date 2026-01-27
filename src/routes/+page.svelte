<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { walletStore } from '$lib/stores/wallet';
  import { browser } from '$app/environment';

  let address: string | null = null;
  let onboarded: string | null = null;

  onMount(() => {
    if (browser) {
      address = localStorage.getItem('wallet_address');
      onboarded = localStorage.getItem('wallet_onboarded_status');

      if (address && onboarded === 'true') {
        // Redirect to home if already onboarded
        goto('/home');
      }
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
  <div class="text-center space-y-6 p-8">
    <h1 class="text-4xl font-bold">CoinFi Wallet</h1>
    <p class="text-muted-foreground">Welcome to your non-custodial wallet</p>
    <div class="space-x-4">
      <a href="/home" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Get Started
      </a>
    </div>
  </div>
</div>
