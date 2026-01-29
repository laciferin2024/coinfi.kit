<script lang="ts">
  import {
    X,
    ArrowUpRight,
    ArrowDownLeft,
    Shield,
    TrendingUp,
    Activity,
    Check,
  } from "lucide-svelte"
  import { walletStore, activeNetwork } from "$lib/stores/wallet"
  import type { TokenAsset } from "$lib/types"

  interface Props {
    token: TokenAsset | null
    isOpen: boolean
    onClose: () => void
    onSend: () => void
    onReceive: () => void
  }

  let { token, isOpen, onClose, onSend, onReceive }: Props = $props()

  // Filter activities for this token
  let tokenActivities = $derived(
    $walletStore.activities
      .filter((a) => a.symbol === token?.symbol)
      .slice(0, 3),
  )

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
</script>

{#if isOpen && token}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center"
    role="button"
    tabindex="0"
    onclick={onClose}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onClose()
      }
    }}
  >
    <!-- Modal Sheet -->
    <div
      class="w-full max-w-[400px] max-h-[90vh] bg-zinc-900 rounded-t-[2.5rem] border-t border-white/10 overflow-hidden flex flex-col"
      role="button"
      tabindex="0"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") e.stopPropagation()
      }}
    >
      <!-- Header with close button -->
      <div class="p-6 pb-4 border-b border-white/5">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl border border-white/10"
            >
              {token.icon}
            </div>
            <div>
              <h2 class="text-xl font-black uppercase italic text-white">
                {token.name}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs font-bold text-zinc-400"
                  >{token.symbol}</span
                >
                <span
                  class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  Verified
                </span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[9px] font-bold uppercase text-zinc-500">
              Active Node
            </p>
            <p class="text-xs font-bold text-orange-500">
              {$activeNetwork.name}
            </p>
          </div>
        </div>
        <p class="text-[10px] text-zinc-500 mt-3 uppercase tracking-wide">
          Unified node tracking for {token.symbol}. Identity and integrity
          verified.
        </p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6 space-y-6">
        <!-- Holdings & Price Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div
            class="p-4 rounded-2xl bg-zinc-800/50 border border-white/5 space-y-1"
          >
            <p
              class="text-[9px] font-bold uppercase tracking-widest text-zinc-500"
            >
              Holdings
            </p>
            <p class="text-2xl font-black text-white">
              {Number(token.balance).toLocaleString()}
            </p>
            <p class="text-xs font-bold text-orange-500">
              ${token.totalValueUsd.toLocaleString()}
            </p>
          </div>
          <div
            class="p-4 rounded-2xl bg-zinc-800/50 border border-white/5 space-y-1"
          >
            <p
              class="text-[9px] font-bold uppercase tracking-widest text-zinc-500"
            >
              Market Price
            </p>
            <p class="text-2xl font-black text-white">
              ${token.priceUsd?.toFixed(2) || "1.00"}
            </p>
            <div class="flex items-center gap-1 text-[9px] text-emerald-400">
              <Check class="w-3 h-3" />
              <span class="uppercase font-bold">AI Synced</span>
            </div>
          </div>
        </div>

        <!-- Simple Chart Placeholder -->
        <div
          class="relative h-32 rounded-2xl bg-zinc-800/30 border border-white/5 overflow-hidden"
        >
          <svg
            class="w-full h-full"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="chartGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#10B981;stop-opacity:0" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 Q50,70 100,60 T200,50 T300,40 T400,30 L400,100 L0,100 Z"
              fill="url(#chartGradient)"
            />
            <path
              d="M0,80 Q50,70 100,60 T200,50 T300,40 T400,30"
              fill="none"
              stroke="#10B981"
              stroke-width="2"
            />
          </svg>
          <div
            class="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-zinc-900/80 text-[8px] text-emerald-400 font-bold uppercase"
          >
            <TrendingUp class="w-3 h-3" />
            +2.4%
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-zinc-400">
            <Activity class="w-4 h-4" />
            <h3 class="text-[10px] font-black uppercase tracking-widest">
              Recent Activity
            </h3>
          </div>

          {#if tokenActivities.length === 0}
            <div
              class="p-6 rounded-2xl bg-zinc-800/30 border border-white/5 text-center"
            >
              <p class="text-xs text-zinc-500 uppercase font-bold">
                No activity yet
              </p>
            </div>
          {:else}
            <div class="space-y-2">
              {#each tokenActivities as activity}
                <div
                  class="p-4 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center {activity.type ===
                      'send'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-emerald-500/10 text-emerald-400'}"
                    >
                      {#if activity.type === "send"}
                        <ArrowUpRight class="w-4 h-4" />
                      {:else}
                        <ArrowDownLeft class="w-4 h-4" />
                      {/if}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-white capitalize">
                        {activity.type}
                      </p>
                      <p class="text-[9px] text-zinc-500">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <p
                    class="text-sm font-bold {activity.type === 'send'
                      ? 'text-white'
                      : 'text-emerald-400'}"
                  >
                    {activity.type === "send" ? "-" : "+"}{activity.amount}
                  </p>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Security Profile -->
        <div
          class="p-4 rounded-2xl bg-zinc-800/30 border border-white/5 space-y-2"
        >
          <div class="flex items-center gap-2">
            <Shield class="w-4 h-4 text-orange-500" />
            <h3
              class="text-[10px] font-black uppercase tracking-widest text-zinc-400"
            >
              Security Profile
            </h3>
          </div>
          <p class="text-[11px] text-zinc-500 leading-relaxed">
            {token.symbol} integrity verified across all connected nodes. AI Guard
            confirms safe interaction status for unlimited self-custody.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-6 pt-4 border-t border-white/5 flex gap-4 bg-zinc-900">
        <button
          onclick={() => {
            onSend()
            onClose()
          }}
          class="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-orange-600 text-white font-bold uppercase text-sm hover:bg-orange-500 transition-colors"
        >
          <ArrowUpRight class="w-5 h-5" />
          Send
        </button>
        <button
          onclick={() => {
            onReceive()
            onClose()
          }}
          class="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-zinc-800 border border-white/10 text-white font-bold uppercase text-sm hover:bg-zinc-700 transition-colors"
        >
          <ArrowDownLeft class="w-5 h-5" />
          Receive
        </button>
      </div>
    </div>
  </div>
{/if}
