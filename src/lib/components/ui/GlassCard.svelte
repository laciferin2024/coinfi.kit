<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "dark" | "frosted"
    intensity?: "low" | "medium" | "high"
  }

  let {
    children,
    class: className,
    variant = "default",
    intensity = "medium",
    ...rest
  }: Props = $props()

  const variants = {
    default: "bg-white/5 border-white/10",
    dark: "bg-black/40 border-white/5",
    frosted: "bg-white/10 border-white/20",
  }

  const intensities = {
    low: "backdrop-blur-sm",
    medium: "backdrop-blur-md",
    high: "backdrop-blur-xl",
  }
</script>

<div
  class="rounded-3xl border shadow-lg {variants[variant]} {intensities[
    intensity
  ]} {className}"
  {...rest}
>
  {@render children?.()}
</div>
