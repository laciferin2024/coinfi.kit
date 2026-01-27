<script lang="ts">
  import { walletStore } from '$lib/stores/wallet';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let balance = '0.00';
  let address = '';
  
  onMount(() => {
    if (browser) {
      const storedAddress = localStorage.getItem('wallet_address');
      if (storedAddress) {
        address = storedAddress;
        walletStore.setAddress(storedAddress);
      }
    }
  });
</script>

<div class="min-h-screen bg-background p-4">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Wallet</h1>
      <Button variant="outline" href="/settings">Settings</Button>
    </div>

    <!-- Balance Card -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Total Balance</Card.Title>
        <Card.Description>Your cryptocurrency holdings</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="text-4xl font-bold">${balance}</div>
        <p class="text-sm text-muted-foreground mt-2">
          {#if $walletStore.address}
            Address: {$walletStore.address.slice(0, 6)}...{$walletStore.address.slice(-4)}
          {:else}
            No wallet connected
          {/if}
        </p>
      </Card.Content>
      <Card.Footer class="flex gap-2">
        <Button class="flex-1">Send</Button>
        <Button variant="outline" class="flex-1">Receive</Button>
      </Card.Footer>
    </Card.Root>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 gap-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-lg">Activity</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-sm text-muted-foreground">View transaction history</p>
        </Card.Content>
        <Card.Footer>
          <Button variant="ghost" href="/activity" class="w-full">View Activity</Button>
        </Card.Footer>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title class="text-lg">Explore</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-sm text-muted-foreground">Discover DeFi & dApps</p>
        </Card.Content>
        <Card.Footer>
          <Button variant="ghost" href="/explore" class="w-full">Explore</Button>
        </Card.Footer>
      </Card.Root>
    </div>

    <!-- Assets List -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Assets</Card.Title>
        <Card.Description>Your cryptocurrency portfolio</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <p class="font-semibold">Ethereum</p>
              <p class="text-sm text-muted-foreground">ETH</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">0.00 ETH</p>
              <p class="text-sm text-muted-foreground">$0.00</p>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
