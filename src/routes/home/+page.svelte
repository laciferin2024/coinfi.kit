<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Copy, Plus, Settings } from 'lucide-svelte';

  let balance = '$1,264.86';
  let address = '';
  let selectedTab = 'tokens';
  let selectedNetwork = 'all';

  interface Token {
    name: string;
    symbol: string;
    network: string;
    balance: string;
    usdValue: string;
    icon: string;
  }

  const tokens: Token[] = [
    {
      name: 'USDC',
      symbol: 'USDC',
      network: 'Optimism Sepolia',
      balance: '0.00',
      usdValue: '$0',
      icon: '💵'
    },
    {
      name: 'WBTC',
      symbol: 'WBTC',
      network: 'Optimism Sepolia',
      balance: '0.00',
      usdValue: '$273',
      icon: '₿'
    }
  ];

  onMount(() => {
    if (browser) {
      const storedAddress = localStorage.getItem('wallet_address');
      if (storedAddress) {
        address = storedAddress;
      }
    }
  });

  function truncateAddress(addr: string): string {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function copyAddress() {
    if (browser && address) {
      navigator.clipboard.writeText(address);
    }
  }
</script>

<div class="min-h-screen bg-black text-white pb-20">
  <!-- Header -->
  <header class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-lg">
        💰
      </div>
      <select
        class="bg-gray-900 text-gray-300 border border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
        bind:value={selectedNetwork}
      >
        <option value="all">🌐 All Networks</option>
        <option value="ethereum">Ethereum</option>
        <option value="optimism">Optimism</option>
        <option value="arbitrum">Arbitrum</option>
        <option value="polygon">Polygon</option>
      </select>
    </div>
    <button
      class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition"
      on:click={() => goto('/settings')}
    >
      <Settings class="w-4 h-4 text-gray-400" />
    </button>
  </header>

  <!-- Balance Section -->
  <div class="px-4 py-8 text-center">
    <p class="text-gray-500 text-xs uppercase tracking-wider mb-2">Unified Portfolio Balance</p>
    <h1 class="text-5xl font-bold mb-3">{balance}</h1>
    <div class="flex items-center justify-center gap-2">
      <span class="text-gray-400 text-sm">{truncateAddress(address)}</span>
      <button
        class="text-gray-400 hover:text-white transition"
        on:click={copyAddress}
      >
        <Copy class="w-4 h-4" />
      </button>
      <button class="text-orange-500 hover:text-orange-400 transition text-lg">
        🔄
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="px-4 mb-4">
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <button
          class="px-6 py-2 rounded-full transition font-medium text-sm"
          class:bg-orange-500={selectedTab === 'tokens'}
          class:text-white={selectedTab === 'tokens'}
          class:bg-gray-900={selectedTab !== 'tokens'}
          class:text-gray-400={selectedTab !== 'tokens'}
          on:click={() => selectedTab = 'tokens'}
        >
          🪙 TOKENS
        </button>
        <button
          class="px-6 py-2 rounded-full transition font-medium text-sm"
          class:bg-orange-500={selectedTab === 'nfts'}
          class:text-white={selectedTab === 'nfts'}
          class:bg-gray-900={selectedTab !== 'nfts'}
          class:text-gray-400={selectedTab !== 'nfts'}
          on:click={() => selectedTab = 'nfts'}
        >
          🖼️ NFTS
        </button>
      </div>
      <button class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-gray-800 transition">
        <Plus class="w-5 h-5 text-gray-400" />
      </button>
    </div>
  </div>

  <!-- Token List -->
  <div class="px-4">
    {#if selectedTab === 'tokens'}
      <div class="space-y-2">
        {#each tokens as token}
          <button class="w-full bg-gray-900/50 hover:bg-gray-900 rounded-2xl p-4 flex items-center justify-between transition border border-transparent hover:border-gray-800">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                {token.icon}
              </div>
              <div class="text-left">
                <p class="font-semibold">{token.name}</p>
                <p class="text-sm text-gray-500">{token.network}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold">{token.balance}</p>
              <p class="text-sm text-orange-500">{token.usdValue}</p>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="text-center py-16 text-gray-500">
        <p class="text-4xl mb-2">🖼️</p>
        <p>No NFTs found</p>
      </div>
    {/if}
  </div>
</div>
