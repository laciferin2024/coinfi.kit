<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  
  const transactions = [
    { type: 'Received', amount: '+0.5 ETH', date: 'Jan 25, 2026', status: 'Completed' },
    { type: 'Sent', amount: '-0.2 ETH', date: 'Jan 24, 2026', status: 'Completed' },
    { type: 'Swap', amount: '1.0 ETH → 2000 USDC', date: 'Jan 23, 2026', status: 'Completed' },
  ];
</script>

<div class="min-h-screen bg-background p-4">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Activity</h1>
      <Button variant="outline" href="/home">Back to Wallet</Button>
    </div>

    <!-- Filters -->
    <div class="flex gap-2">
      <Button variant="outline" size="sm">All</Button>
      <Button variant="ghost" size="sm">Sent</Button>
      <Button variant="ghost" size="sm">Received</Button>
      <Button variant="ghost" size="sm">Swaps</Button>
    </div>

    <!-- Transaction List -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Transaction History</Card.Title>
        <Card.Description>Your recent cryptocurrency transactions</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="space-y-4">
          {#each transactions as tx}
            <div class="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <p class="font-semibold">{tx.type}</p>
                <p class="text-sm text-muted-foreground">{tx.date}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold {tx.amount.startsWith('+') ? 'text-green-600' : tx.amount.startsWith('-') ? 'text-red-600' : ''}">
                  {tx.amount}
                </p>
                <p class="text-sm text-muted-foreground">{tx.status}</p>
              </div>
            </div>
          {:else}
            <div class="text-center py-8 text-muted-foreground">
              <p>No transactions yet</p>
              <p class="text-sm mt-2">Your transaction history will appear here</p>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <p class="text-2xl font-bold">3</p>
          <p class="text-sm text-muted-foreground">Total Transactions</p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="pt-6">
          <p class="text-2xl font-bold text-green-600">+0.5</p>
          <p class="text-sm text-muted-foreground">ETH Received</p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="pt-6">
          <p class="text-2xl font-bold text-red-600">-0.2</p>
          <p class="text-sm text-muted-foreground">ETH Sent</p>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
