<script lang="ts">
  import { page } from '$app/stores';

  interface NavItem {
    href: string;
    label: string;
    icon: string;
  }

  const navItems: NavItem[] = [
    { href: '/home', label: 'Wallet', icon: '💼' },
    { href: '/activity', label: 'Activity', icon: '📊' },
    { href: '/explore', label: 'Explore', icon: '🧭' },
    { href: '/settings', label: 'Settings', icon: '⚙️' }
  ];
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-background border-t">
  <div class="flex justify-around items-center h-16 max-w-4xl mx-auto">
    {#each navItems as item}
      <a 
        href={item.href}
        class="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors"
        class:text-primary={$page.url.pathname === item.href}
        class:text-muted-foreground={$page.url.pathname !== item.href}
      >
        <span class="text-xl">{item.icon}</span>
        <span class="text-xs font-medium">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>