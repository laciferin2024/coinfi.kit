<script lang="ts">
  import { walletStore } from '$lib/stores/wallet';
</script>

<div class="container mx-auto p-8">
  <h1 class="text-3xl font-bold mb-4">Home</h1>
  <div class="space-y-4">
    <p>Wallet Address: {$walletStore.address || 'Not connected'}</p>
    <p>Status: {$walletStore.isLocked ? 'Locked' : 'Unlocked'}</p>
  </div>
</div>
