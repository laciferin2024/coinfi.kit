<script lang="ts">
  import { page } from "$app/stores"
  import { Home, Activity, Compass, Wallet } from "lucide-svelte"

  interface NavItem {
    href: string
    label: string
    icon: typeof Home
  }

  const navItems: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/assets", label: "Assets", icon: Wallet },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/explore", label: "Explore", icon: Compass },
  ]
</script>

<!-- Bottom nav - no fixed positioning, relies on parent flexbox -->
<nav
  class="bg-zinc-950/95 backdrop-blur-xl border-t border-white/5 z-50 shrink-0 rounded-b-[2.5rem]"
>
  <div class="flex justify-around items-center h-16">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200"
        class:text-orange-500={$page.url.pathname === item.href}
        class:text-zinc-500={$page.url.pathname !== item.href}
      >
        <svelte:component
          this={item.icon}
          class="w-5 h-5 {$page.url.pathname === item.href
            ? 'text-orange-500'
            : 'text-zinc-500'}"
        />
        <span class="text-[10px] font-bold uppercase tracking-wider"
          >{item.label}</span
        >
      </a>
    {/each}
  </div>
</nav>
