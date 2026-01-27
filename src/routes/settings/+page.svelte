<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { walletStore } from '$lib/stores/wallet';

  let isLocked = false;
  let isHyperMode = false;
  let selectedNetwork = 'Ethereum';

  const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'];

  function handleLock() {
    isLocked = !isLocked;
  }

  function toggleHyperMode() {
    isHyperMode = !isHyperMode;
  }
</script>

<div class="min-h-screen bg-background p-4">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Settings</h1>
      <p class="text-sm text-muted-foreground">Manage your wallet preferences</p>
    </div>

    <!-- Wallet Address -->
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Wallet Address</Card.CardTitle>
        <Card.CardDescription>Your current wallet address</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        <div class="font-mono text-sm bg-muted p-3 rounded">
          {$walletStore.address || 'No wallet connected'}
        </div>
      </Card.CardContent>
    </Card.Card>

    <!-- Security -->
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Security</Card.CardTitle>
        <Card.CardDescription>Lock and secure your wallet</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Wallet Lock</p>
            <p class="text-sm text-muted-foreground">Lock your wallet for security</p>
          </div>
          <Button on:click={handleLock} variant={isLocked ? 'default' : 'outline'}>
            {isLocked ? 'Locked' : 'Unlocked'}
          </Button>
        </div>
      </Card.CardContent>
    </Card.Card>

    <!-- Network -->
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Network</Card.CardTitle>
        <Card.CardDescription>Select your preferred network</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        <div class="grid grid-cols-2 gap-2">
          {#each networks as network}
            <Button
              variant={selectedNetwork === network ? 'default' : 'outline'}
              on:click={() => selectedNetwork = network}
              class="w-full"
            >
              {network}
            </Button>
          {/each}
        </div>
      </Card.CardContent>
    </Card.Card>

    <!-- Performance -->
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Performance</Card.CardTitle>
        <Card.CardDescription>Optimize wallet performance</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Hyper Mode</p>
            <p class="text-sm text-muted-foreground">Enable unlimited mode for faster transactions</p>
          </div>
          <Button on:click={toggleHyperMode} variant={isHyperMode ? 'default' : 'outline'}>
            {isHyperMode ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </Card.CardContent>
    </Card.Card>

    <!-- Backup -->
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Backup</Card.CardTitle>
        <Card.CardDescription>Secure your wallet data</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent class="space-y-2">
        <Button class="w-full" variant="outline">Export Seed Phrase</Button>
        <Button class="w-full" variant="outline">Cloud Backup</Button>
      </Card.CardContent>
    </Card.Card>
  </div>
</div>
