# React Router 7 to SvelteKit 5 Migration Guide

## Overview
This guide documents the migration of the CoinFi Wallet from React Router 7 to SvelteKit 5.

## Completed Steps

### 1. Dependencies Installed
- ✅ `clsx` - Class name utilities
- ✅ `immer` - Immutable state updates
- ✅ `@tanstack/svelte-query` - Data fetching (equivalent to TanStack Query)
- ✅ `lucide-svelte` - Icon library (equivalent to Lucide React)
- ✅ `@modelcontextprotocol/sdk` - MCP SDK

### 2. Folder Structure Created
```
src/
├── lib/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── wallet/
│   ├── stores/
│   │   └── wallet.ts (✅ Created)
│   ├── hooks/
│   └── utils/
└── routes/
    ├── +page.svelte (✅ Created - Welcome/Index page)
    ├── home/
    │   └── +page.svelte (✅ Created)
    ├── activity/
    ├── settings/
    └── explore/
```

### 3. State Management Migration

#### Zustand (React) → Svelte Stores

**React (Zustand):**
```typescript
import { create } from 'zustand';

const useWalletStore = create((set) => ({
  address: null,
  isLocked: true,
  setAddress: (address) => set({ address }),
  setLocked: (isLocked) => set({ isLocked }),
}));
```

**Svelte (Stores):**
```typescript
import { writable } from 'svelte/store';

function createWalletStore() {
  const { subscribe, set, update } = writable({
    address: null,
    isLocked: true,
  });

  return {
    subscribe,
    setAddress: (address) => update(state => ({ ...state, address })),
    setLocked: (isLocked) => update(state => ({ ...state, isLocked })),
  };
}

export const walletStore = createWalletStore();
```

**Usage Comparison:**

React:
```tsx
const address = useWalletStore(s => s.address);
const setAddress = useWalletStore(s => s.setAddress);
```

Svelte:
```svelte
<script>
  import { walletStore } from '$lib/stores/wallet';
  
  // Auto-subscribe with $ prefix
  // $walletStore gives you the current state
  const address = $walletStore.address;
  
  // Or manually subscribe
  let address;
  walletStore.subscribe(state => {
    address = state.address;
  });
</script>
```

### 4. Routing Migration

#### React Router 7 → SvelteKit Routing

**React Router 7:**
```typescript
// routes.ts
import { index, route } from '@react-router/dev/routes';

export default [
  index('pages/WelcomePage.tsx'),
  route('home', 'pages/HomePage.tsx'),
  route('activity', 'pages/ActivityPage.tsx'),
];
```

**SvelteKit:**
```
src/routes/
  +page.svelte          → / (WelcomePage)
  home/+page.svelte     → /home (HomePage)
  activity/+page.svelte → /activity (ActivityPage)
```

**Navigation:**

React:
```tsx
import { useNavigate } from 'react-router';

const navigate = useNavigate();
navigate('/home');
```

Svelte:
```svelte
<script>
  import { goto } from '$app/navigation';
  
  goto('/home');
</script>
```

### 5. Component Migration Patterns

#### useState → Svelte Reactivity

**React:**
```tsx
const [count, setCount] = useState(0);

return <button onClick={() => setCount(count + 1)}>{count}</button>;
```

**Svelte:**
```svelte
<script>
  let count = 0;
</script>

<button on:click={() => count++}>{count}</button>
```

#### useEffect → Svelte Lifecycle

**React:**
```tsx
useEffect(() => {
  // Run on mount
  return () => {
    // Cleanup on unmount
  };
}, []);
```

**Svelte:**
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  
  onMount(() => {
    // Run on mount
    
    return () => {
      // Cleanup on unmount
    };
  });
</script>
```

## Remaining Migration Tasks

### 1. Component Conversion
- [ ] Convert UI components (buttons, inputs, etc.)
- [ ] Convert layout components (MobileWrapper, Sidebar)
- [ ] Convert wallet-specific components
- [ ] Convert ThemeToggle component
- [ ] Convert ErrorBoundary to Svelte error handling

### 2. Page Conversion
- [ ] Complete WelcomePage conversion
- [ ] Convert HomePage
- [ ] Convert ActivityPage
- [ ] Convert SettingsPage
- [ ] Convert ExplorePage

### 3. Library-Specific Migrations

#### TanStack Query
**React:**
```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['wallet'],
  queryFn: fetchWallet,
});
```

**Svelte:**
```svelte
<script>
  import { createQuery } from '@tanstack/svelte-query';
  
  const query = createQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });
  
  // Access with $query.data, $query.isLoading
</script>
```

#### Framer Motion → Svelte Transitions
**React:**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Content
</motion.div>
```

**Svelte:**
```svelte
<script>
  import { fade } from 'svelte/transition';
</script>

<div transition:fade>
  Content
</div>
```

### 4. Utilities Migration
- [ ] Copy crypto-utils
- [ ] Convert any React-specific hooks to Svelte actions/stores
- [ ] Update cn() utility (already have clsx installed)

### 5. Styling
- [ ] Copy Tailwind config
- [ ] Copy global styles
- [ ] Ensure shadcn-svelte is set up (if using UI components)

## Key Differences

### 1. File Extensions
- React: `.tsx` / `.jsx`
- Svelte: `.svelte`

### 2. Component Structure
- React: Single file with JSX
- Svelte: `<script>`, `<style>`, and template in one file

### 3. Reactivity
- React: Explicit state updates with `useState`, `setState`
- Svelte: Automatic reactivity with assignments (`count = count + 1`)

### 4. Props
- React: Destructure from function params
- Svelte: Use `export let propName`

**React:**
```tsx
function MyComponent({ title, onClick }) {
  return <button onClick={onClick}>{title}</button>;
}
```

**Svelte:**
```svelte
<script>
  export let title;
  export let onClick;
</script>

<button on:click={onClick}>{title}</button>
```

## Testing the Migration

1. Start the dev server:
```bash
bun run dev
```

2. Check each route:
- `/` - Welcome page
- `/home` - Home page
- `/activity` - Activity page
- `/settings` - Settings page
- `/explore` - Explore page

3. Test state management:
- Verify wallet store works
- Test navigation between pages
- Check localStorage persistence

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Svelte Stores](https://svelte.dev/docs/svelte-store)
- [TanStack Query Svelte](https://tanstack.com/query/latest/docs/framework/svelte/overview)
- [Lucide Svelte](https://lucide.dev/guide/packages/lucide-svelte)

## Notes

- Svelte is more concise than React - expect significantly less boilerplate
- Svelte's reactivity is automatic - no need for `useState` or `useEffect` in most cases
- SvelteKit handles routing file-based, similar to Next.js but simpler
- Stores in Svelte are simpler and more powerful than Zustand
- The `$` prefix for stores provides auto-subscription
