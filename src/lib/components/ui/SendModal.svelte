<script lang="ts">
  import {
    X,
    ArrowUpRight,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Users,
  } from "lucide-svelte"
  import { walletStore, activeNetwork } from "$lib/stores/wallet"
  import type { TokenAsset } from "$lib/types"
  import type { AIGuardResponse, RiskLevel } from "$lib/ai-guard/types"
  import GuardConsole from "./GuardConsole.svelte"

  interface Props {
    isOpen: boolean
    token: TokenAsset | null
    onClose: () => void
  }

  let { isOpen, token, onClose }: Props = $props()

  let recipientAddress = $state("")
  let amount = $state("")
  let isLoading = $state(false)
  let isSimulating = $state(false)
  let error = $state("")
  let success = $state(false)
  let showContacts = $state(false)
  let guardResponse = $state<AIGuardResponse | null>(null)

  // Build transaction data for AI Guard
  let transactionData = $derived(() => {
    if (!token || !recipientAddress || !amount) return null

    const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString()

    // For native token (ETH), use value field
    // For ERC-20, use transfer data
    if (token.symbol === "ETH") {
      return {
        chainId: $activeNetwork.chainId,
        from: $walletStore.address || "",
        to: recipientAddress,
        value: amountWei,
        data: "0x",
      }
    } else {
      // ERC-20 transfer(address,uint256)
      const transferData = `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${BigInt(amountWei).toString(16).padStart(64, "0")}`
      return {
        chainId: $activeNetwork.chainId,
        from: $walletStore.address || "",
        to: token.address || "",
        value: "0",
        data: transferData,
      }
    }
  })

  async function handleSend() {
    if (!recipientAddress || !amount || !token) {
      error = "Please fill in all fields"
      return
    }

    if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
      error = "Invalid address format"
      return
    }

    const sendAmount = parseFloat(amount)
    if (isNaN(sendAmount) || sendAmount <= 0) {
      error = "Invalid amount"
      return
    }

    if (sendAmount > parseFloat(token.balance)) {
      error = "Insufficient balance"
      return
    }

    isLoading = true
    error = ""
    isSimulating = true
  }

  function handleSimulationComplete(
    verdict: RiskLevel,
    response: AIGuardResponse | null,
  ) {
    guardResponse = response
    isSimulating = false

    // Add activity
    walletStore.addActivity({
      id: `tx-${Date.now()}`,
      type: "send",
      amount: amount,
      symbol: token!.symbol,
      address: recipientAddress,
      timestamp: Date.now(),
      status: "completed",
      network: $activeNetwork.name,
      chainId: $activeNetwork.chainId,
    })

    success = true
    isLoading = false

    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  function selectContact(address: string) {
    recipientAddress = address
    showContacts = false
  }

  function handleClose() {
    recipientAddress = ""
    amount = ""
    error = ""
    success = false
    showContacts = false
    guardResponse = null
    onClose()
  }

  function setMaxAmount() {
    if (token) {
      amount = token.balance
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleClose()
    }
  }
</script>

{#if isOpen && token}
  <div
    role="button"
    tabindex="0"
    aria-label="Close send modal"
    class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center"
    onclick={(e) => {
      if (e.target === e.currentTarget) handleClose()
    }}
    onkeydown={handleBackdropKeydown}
  >
    <div
      class="w-full max-w-[400px] bg-zinc-900 rounded-t-[2.5rem] border-t border-white/10 p-6 pb-10 space-y-6"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-orange-600">
            <ArrowUpRight class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-xl font-black uppercase italic text-white">Send</h2>
            <p class="text-[10px] text-zinc-500 uppercase">
              {token.symbol} on {$activeNetwork.name}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onclick={handleClose}
          class="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <X class="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {#if success}
        <div class="py-12 text-center space-y-4">
          <CheckCircle class="w-16 h-16 text-emerald-400 mx-auto" />
          <p class="text-lg font-bold text-white">Transaction Sent!</p>
          <p class="text-sm text-zinc-400">Your {token.symbol} is on its way</p>
        </div>
      {:else if isSimulating}
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3
              class="text-[10px] font-black uppercase text-zinc-500 tracking-widest"
            >
              AI Guard Simulation
            </h3>
            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
              ></span>
              Active
            </div>
          </div>
          <GuardConsole
            transactionData={transactionData()}
            onComplete={handleSimulationComplete}
          />
        </div>
      {:else}
        <!-- Balance Display -->
        <div
          class="p-4 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-between"
        >
          <div>
            <p class="text-[9px] font-bold uppercase text-zinc-500">
              Available Balance
            </p>
            <p class="text-lg font-bold text-white">
              {token.balance}
              {token.symbol}
            </p>
          </div>
          <span class="text-2xl">{token.icon}</span>
        </div>

        <!-- Recipient Input -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label
              for="send-recipient"
              class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
              >Recipient</label
            >
            <button
              type="button"
              onclick={() => (showContacts = !showContacts)}
              class="flex items-center gap-1 text-[9px] font-bold text-orange-500 hover:text-orange-400"
            >
              <Users class="w-3 h-3" />
              Contacts
            </button>
          </div>
          <input
            id="send-recipient"
            type="text"
            placeholder="0x..."
            bind:value={recipientAddress}
            class="w-full px-4 py-4 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
          />

          {#if showContacts && $walletStore.contacts.length > 0}
            <div
              class="p-2 bg-zinc-800 rounded-xl border border-white/10 space-y-1 max-h-32 overflow-auto"
            >
              {#each $walletStore.contacts as contact}
                <button
                  type="button"
                  onclick={() => selectContact(contact.address)}
                  class="w-full p-2 rounded-lg hover:bg-zinc-700 flex items-center gap-2 text-left transition-colors"
                >
                  <span
                    class="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-[8px] font-bold flex items-center justify-center"
                  >
                    {contact.initials}
                  </span>
                  <span class="text-xs text-white">{contact.name}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Amount Input -->
        <div class="space-y-2">
          <label
            for="send-amount"
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
            >Amount</label
          >
          <div class="relative">
            <input
              id="send-amount"
              type="text"
              placeholder="0.00"
              bind:value={amount}
              class="w-full px-4 py-4 pr-20 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
            <button
              type="button"
              onclick={setMaxAmount}
              class="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-orange-600/20 text-orange-500 text-[10px] font-bold uppercase hover:bg-orange-600/30 transition-colors"
            >
              Max
            </button>
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div
            class="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
          >
            <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0" />
            <p class="text-xs text-rose-400">{error}</p>
          </div>
        {/if}

        <!-- Gas Info -->
        <div
          class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-white/5"
        >
          <span class="text-[10px] text-zinc-500 uppercase font-bold"
            >Network Fee</span
          >
          <span class="text-xs font-bold text-emerald-400">$0 (Sponsored)</span>
        </div>

        <!-- Send Button -->
        <button
          type="button"
          onclick={handleSend}
          disabled={isLoading || !recipientAddress || !amount}
          class="w-full py-4 rounded-xl bg-orange-600 text-white font-bold uppercase text-sm hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {#if isLoading}
            <Loader2 class="w-5 h-5 animate-spin" />
            Sending...
          {:else}
            <ArrowUpRight class="w-5 h-5" />
            Send {token.symbol}
          {/if}
        </button>
      {/if}
    </div>
  </div>
{/if}
