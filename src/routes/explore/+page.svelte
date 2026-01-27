<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';

  interface Protocol {
    id: string;
    name: string;
    category: string;
    icon: string;
    users: string;
    verified: boolean;
    desc: string;
  }

  const dapps: Protocol[] = [
    { id: 'ideomind-console', name: 'Ideomind Console', category: 'DeFi', icon: '⚡', users: '5K', verified: true, desc: 'AI-powered DeFi platform' },
    { id: 'uniswap', name: 'Uniswap V3', category: 'DeFi', icon: '🦄', users: '1.2M', verified: true, desc: 'Decentralized exchange protocol' },
    { id: 'curve', name: 'Curve Finance', category: 'DeFi', icon: '📈', users: '800K', verified: true, desc: 'Stablecoin liquidity pool' },
    { id: 'lido', name: 'Lido Finance', category: 'Staking', icon: '🌊', users: '900K', verified: true, desc: 'Liquid staking protocol' },
    { id: 'aave', name: 'Aave V3', category: 'Lending', icon: '👻', users: '650K', verified: true, desc: 'Decentralized lending protocol' },
    { id: 'opensea', name: 'OpenSea', category: 'NFT', icon: '🌊', users: '2M', verified: true, desc: 'NFT marketplace' }
  ];
</script>

<div class="min-h-screen bg-background p-4">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Explore</h1>
        <p class="text-sm text-muted-foreground">Discover DeFi & dApps</p>
      </div>
    </div>

    <div class="grid gap-4">
      {#each dapps as dapp (dapp.id)}
        <Card.Card>
          <Card.CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="text-3xl">{dapp.icon}</div>
                <div>
                  <Card.CardTitle class="text-lg">{dapp.name}</Card.CardTitle>
                  <Card.CardDescription>{dapp.category} • {dapp.users} users</Card.CardDescription>
                </div>
              </div>
              {#if dapp.verified}
                <span class="text-blue-500">✓</span>
              {/if}
            </div>
          </Card.CardHeader>
          <Card.CardContent>
            <p class="text-sm text-muted-foreground mb-4">{dapp.desc}</p>
            <Button class="w-full">Open App</Button>
          </Card.CardContent>
        </Card.Card>
      {/each}
    </div>
  </div>
</div>
