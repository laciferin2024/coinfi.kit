<script lang="ts">
  import { cn } from '$lib/utils';
  
  export let variant: 'default' | 'outline' | 'ghost' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
  };
</script>

<button
  {type}
  {disabled}
  class={cn(baseStyles, variants[variant], sizes[size], $$props.class)}
  on:click
  {...$$restProps}
>
  <slot />
</button>
