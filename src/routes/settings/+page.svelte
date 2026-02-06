<script lang="ts">
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { browser } from "$app/environment"
  import {
    Copy,
    LogOut,
    Zap,
    Info,
    Cloud,
    Fingerprint,
    ShieldAlert,
    Users,
    Trash2,
    UserPlus,
  } from "lucide-svelte"
  import NetworkSelector from "$lib/components/ui/NetworkSelector.svelte"
  import { walletStore } from "$lib/stores/wallet"

  let isAddContactOpen = $state(false)
  let newContactName = $state("")
  let newContactAddress = $state("")

  onMount(() => {
    if (browser) {
      const address = localStorage.getItem("wallet_address")
      const onboarded = localStorage.getItem("wallet_onboarded_status")

      if (!address || onboarded !== "true") {
        goto("/")
        return
      }

      if ($walletStore.isLocked) {
        walletStore.unlockWallet()
      }
    }
  })

  function handleLock() {
    walletStore.setLocked(true)
    goto("/")
  }

  function toggleHyper(enabled: boolean) {
    walletStore.setHyperMode(enabled)
  }

  function copyAddress() {
    if (browser && $walletStore.address) {
      navigator.clipboard.writeText($walletStore.address)
    }
  }

  function handleAddContact() {
    if (!newContactName || !newContactAddress) return

    walletStore.addContact({
      name: newContactName,
      address: newContactAddress,
      initials: newContactName.slice(0, 2).toUpperCase(),
    })
    newContactName = ""
    newContactAddress = ""
    isAddContactOpen = false
  }
</script>

<div class="min-h-full bg-zinc-950">
  <header
    class="px-6 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-30"
  >
    <h1
      class="text-2xl font-black uppercase italic tracking-tighter text-white"
    >
      Settings
    </h1>
    <div class="flex items-center gap-2">
      <NetworkSelector />
      <button
        onclick={handleLock}
        class="p-2 rounded-lg hover:bg-zinc-900 transition-colors text-rose-500"
      >
        <LogOut class="w-5 h-5" />
      </button>
    </div>
  </header>

  <main class="px-6 py-12 space-y-10 pb-24">
    <!-- Profile Section -->
    <section class="flex flex-col items-center gap-4">
      <div
        class="w-24 h-24 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center border border-white/10 overflow-hidden"
      >
        <img
          src="/logo.png"
          class="w-full h-full object-contain p-4"
          alt="CoinFi Logo"
        />
      </div>
      <div class="text-center space-y-1">
        <h3 class="font-bold text-xl uppercase italic text-white">
          {$walletStore.ensName || "Unlimited Identity"}
        </h3>
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-[10px] font-mono text-zinc-500"
        >
          {$walletStore.address?.slice(0, 12)}...{$walletStore.address?.slice(
            -6,
          )}
          <button
            onclick={copyAddress}
            class="hover:text-white transition-colors"
          >
            <Copy class="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>

    <div class="space-y-8">
      <!-- Address Book -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3
            class="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"
          >
            <Users class="w-3 h-3" /> Address Book
          </h3>
          <button
            onclick={() => (isAddContactOpen = !isAddContactOpen)}
            class="flex items-center gap-1 h-7 px-2 text-[9px] font-black uppercase tracking-tighter text-orange-500 hover:text-orange-400"
          >
            <UserPlus class="w-3 h-3" /> Add New
          </button>
        </div>

        {#if isAddContactOpen}
          <div
            class="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-4"
          >
            <input
              type="text"
              placeholder="Name / ENS"
              bind:value={newContactName}
              class="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-sm text-white placeholder:text-zinc-500"
            />
            <input
              type="text"
              placeholder="0x..."
              bind:value={newContactAddress}
              class="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-sm text-white font-mono placeholder:text-zinc-500"
            />
            <button
              onclick={handleAddContact}
              class="w-full py-3 rounded-xl bg-orange-600 font-bold text-white uppercase text-xs"
            >
              Save Contact
            </button>
          </div>
        {/if}

        <div
          class="p-4 rounded-[2rem] bg-zinc-900/50 border border-white/5 divide-y divide-white/5"
        >
          {#if $walletStore.contacts.length === 0}
            <p
              class="text-[10px] text-zinc-600 font-bold uppercase py-6 text-center italic"
            >
              Address book empty
            </p>
          {:else}
            {#each $walletStore.contacts as contact}
              <div
                class="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black border border-white/5 text-orange-500"
                  >
                    {contact.initials}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-white">{contact.name}</p>
                    <p class="text-[9px] text-zinc-500 font-mono">
                      {contact.address.slice(0, 10)}...{contact.address.slice(
                        -6,
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Remove contact"
                  onclick={() => walletStore.removeContact(contact.address)}
                  class="p-2 text-rose-500/40 hover:text-rose-500 transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </section>

      <!-- Node Configuration -->
      <section class="space-y-4">
        <h3
          class="text-[10px] font-black uppercase tracking-widest text-zinc-500"
        >
          Node Configuration
        </h3>
        <div
          class="p-6 rounded-[2rem] bg-zinc-900 border border-white/5 space-y-6"
        >
          <div class="flex justify-between items-center">
            <div class="space-y-1 pr-4">
              <div class="flex items-center gap-2">
                <Zap
                  class="w-4 h-4 {$walletStore.isHyperMode
                    ? 'text-orange-500'
                    : 'text-zinc-600'}"
                />
                <p class="text-sm font-black italic text-white uppercase">
                  Unlimited Mode
                </p>
              </div>
              <p class="text-[9px] text-zinc-500">
                Enable passkey hardware-bound signing for a gasless experience.
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle unlimited mode"
              onclick={() => toggleHyper(!$walletStore.isHyperMode)}
              class="w-12 h-6 rounded-full transition-colors {$walletStore.isHyperMode
                ? 'bg-orange-600'
                : 'bg-zinc-700'}"
            >
              <div
                class="w-5 h-5 rounded-full bg-white shadow transition-transform {$walletStore.isHyperMode
                  ? 'translate-x-6'
                  : 'translate-x-0.5'}"
              ></div>
            </button>
          </div>
        </div>
      </section>

      <!-- Security -->
      <section class="space-y-4">
        <h3
          class="text-[10px] font-black uppercase tracking-widest text-zinc-500"
        >
          Security Architecture
        </h3>
        <div
          class="p-6 rounded-[2rem] border space-y-3 bg-zinc-900/40 border-white/5"
        >
          <div class="flex items-center gap-3">
            {#if $walletStore.isHyperMode}
              <Fingerprint class="w-5 h-5 text-orange-500" />
            {:else}
              <ShieldAlert class="w-5 h-5 text-zinc-500" />
            {/if}
            <h4 class="text-sm font-bold text-zinc-100">
              {$walletStore.isHyperMode
                ? "Secure Hardware Enclave"
                : "Local Key Storage"}
            </h4>
          </div>
          <p class="text-[11px] text-zinc-400 leading-relaxed">
            {#if $walletStore.isHyperMode}
              Unlimited biometric verification active. EIP-7702 delegation and
              WebAuthn are securing your self-custodial node interactions.
            {:else}
              Using standard on-device root key storage. Please ensure your
              cloud backup is synchronized.
            {/if}
          </p>
        </div>
      </section>
    </div>

    <footer class="pt-8 pb-4 text-center">
      <div
        class="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 text-left"
      >
        <span class="shrink-0 mt-0.5"
          ><Info class="w-4 h-4 text-zinc-500" /></span
        >
        <p class="text-[9px] text-zinc-500 leading-relaxed font-medium">
          Unlimited Self Custody: All networks are available by default. AI
          Guard protects your interactions across every chain.
        </p>
      </div>
      <p
        class="text-[8px] text-zinc-600 font-black uppercase tracking-[0.3em] mt-6"
      >
        Coin Fi Protocol v2.9.0-MVP
      </p>
    </footer>
  </main>
</div>
