<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements"
  import { Loader2 } from "lucide-svelte"

  interface Props extends HTMLButtonAttributes {
    variant?: "primary" | "secondary" | "ghost" | "danger"
    size?: "sm" | "md" | "lg" | "icon"
    isLoading?: boolean
  }

  let {
    children,
    class: className,
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled,
    ...rest
  }: Props = $props()

  const variants = {
    primary:
      "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-95 border border-orange-400/20",
    secondary:
      "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 active:scale-95",
    ghost:
      "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white active:scale-95",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 active:scale-95",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-2xl",
    icon: "p-2 rounded-xl",
  }
</script>

<button
  class="relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none {variants[
    variant
  ]} {sizes[size]} {className}"
  disabled={isLoading || disabled}
  {...rest}
>
  {#if isLoading}
    <Loader2 class="w-4 h-4 animate-spin absolute" />
    <span class="opacity-0">
      {@render children?.()}
    </span>
  {:else}
    {@render children?.()}
  {/if}
</button>
