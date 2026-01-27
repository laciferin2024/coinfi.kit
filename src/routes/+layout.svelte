<script lang="ts">
  import "../app.css"
  import { page } from "$app/stores"
  import Nav from "$lib/components/layout/nav.svelte"
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()

  // Routes that should show the bottom nav
  const authenticatedRoutes = ["/home", "/activity", "/settings", "/explore"]

  let showNav = $derived(
    authenticatedRoutes.some((route) => $page.url.pathname.startsWith(route)),
  )
</script>

<svelte:head>
  <title>CoinFi Wallet</title>
  <meta
    name="description"
    content="Unlimited self-custodial wallet secured by passkeys"
  />
</svelte:head>

<div class="dark">
  {@render children()}
  {#if showNav}
    <Nav />
  {/if}
</div>

<style>
  :global(body) {
    background-color: black;
    color: white;
  }
</style>
