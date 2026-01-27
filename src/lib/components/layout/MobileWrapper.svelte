<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    class?: string
  }

  let { children, class: className = "" }: Props = $props()
</script>

<div class="min-h-screen w-full bg-black text-white {className}">
  <div class="max-w-[430px] mx-auto relative min-h-screen">
    {@render children()}
  </div>
</div>
