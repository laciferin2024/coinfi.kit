<script lang="ts">
  import { Send, X, Bot, User, Sparkles } from "lucide-svelte"
  import { scale, fly } from "svelte/transition"

  import type { AIGuardRequest } from "$lib/ai-guard/types"

  interface Props {
    context?: AIGuardRequest | null
    visible: boolean
    onClose: () => void
  }

  let { context, visible, onClose }: Props = $props()

  let query = $state("")
  let messages = $state<Array<{ role: "user" | "assistant"; content: string }>>(
    [
      {
        role: "assistant",
        content:
          "I'm analyzing this transaction. Ask me anything about safety, gas fees, or the contract details.",
      },
    ],
  )
  let isLoading = $state(false)
  let chatContainer: HTMLDivElement

  async function handleSubmit() {
    if (!query.trim() || isLoading) return

    const userMsg = query
    messages = [...messages, { role: "user", content: userMsg }]
    query = ""
    isLoading = true

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg,
          context: context,
          history: messages.slice(0, -1), // Send history excluding standard greeting if needed, or just send all
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      messages = [...messages, { role: "assistant", content: data.reply }]
    } catch (error) {
      messages = [
        ...messages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    // Auto-scroll when messages change
    if (messages.length && chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
</script>

{#if visible}
  <div
    class="absolute inset-x-4 bottom-24 top-20 z-50 flex flex-col pointer-events-none"
    transition:scale={{ duration: 300, start: 0.95, opacity: 0 }}
  >
    <div
      class="w-full h-full bg-zinc-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
    >
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center"
          >
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">AI Assistant</h3>
            <p class="text-[10px] text-zinc-400">Powered by Gemini 2.0</p>
          </div>
        </div>
        <button
          onclick={onClose}
          class="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Chat Area -->
      <div
        class="flex-1 overflow-y-auto p-4 space-y-4"
        bind:this={chatContainer}
      >
        {#each messages as msg}
          <div
            class="flex gap-3 {msg.role === 'user'
              ? 'justify-end'
              : 'justify-start'}"
            in:fly={{ y: 10, duration: 300 }}
          >
            {#if msg.role === "assistant"}
              <div
                class="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1"
              >
                <Bot class="w-3.5 h-3.5 text-indigo-400" />
              </div>
            {/if}

            <div
              class="max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed {msg.role ===
              'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-zinc-800 text-zinc-300 rounded-tl-sm border border-white/5'}"
            >
              {msg.content}
            </div>

            {#if msg.role === "user"}
              <div
                class="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1"
              >
                <User class="w-3.5 h-3.5 text-zinc-400" />
              </div>
            {/if}
          </div>
        {/each}

        {#if isLoading}
          <div
            class="flex gap-3 justify-start"
            in:fly={{ y: 10, duration: 300 }}
          >
            <div
              class="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1"
            >
              <Bot class="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div
              class="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm border border-white/5"
            >
              <div class="flex gap-1">
                <div
                  class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style="animation-delay: 0ms"
                ></div>
                <div
                  class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style="animation-delay: 150ms"
                ></div>
                <div
                  class="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style="animation-delay: 300ms"
                ></div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Input Area -->
      <div class="p-3 border-t border-white/5 bg-zinc-900/50 shrink-0">
        <form
          class="relative flex items-center"
          onsubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <input
            type="text"
            bind:value={query}
            placeholder="Ask about risk, fees, or function..."
            class="w-full bg-zinc-800 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            class="absolute right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send class="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}
