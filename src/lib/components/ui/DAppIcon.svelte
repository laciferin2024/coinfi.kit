<script lang="ts">
  import { cn } from "$lib/utils"

  interface Props {
    src?: string
    name: string
    size?: "sm" | "md" | "lg" | "xl"
    class?: string
    style?: string
  }

  let { src, name, size = "md", class: className, style }: Props = $props()

  let hasError = $state(false)

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-xl",
    lg: "w-16 h-16 text-3xl",
    xl: "w-24 h-24 text-4xl",
  }

  const roundedClasses = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-[2rem]",
  }

  const initials = $derived(
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  )
</script>

<div
  class={cn(
    "flex items-center justify-center bg-zinc-900 border border-white/10 shrink-0 overflow-hidden",
    sizeClasses[size],
    roundedClasses[size],
    className,
  )}
  {style}
>
  {#if src && !hasError}
    <img
      {src}
      alt={name}
      class="w-full h-full object-contain p-1.5"
      onerror={() => (hasError = true)}
    />
  {:else}
    <div class="font-black italic text-zinc-600 tracking-tighter">
      {initials}
    </div>
  {/if}
</div>
